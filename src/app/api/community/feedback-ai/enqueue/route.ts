import { after, NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateWithGemini } from '@/lib/services/googleAI';
import { load } from 'cheerio';

export const runtime = 'nodejs';
export const maxDuration = 60;

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractFirstUrl(input: string): string | null {
  const match = input.match(/https?:\/\/[^\s"'<>]+/i);
  return match ? match[0] : null;
}

async function fetchLinkedText(url: string): Promise<{ title: string; text: string } | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DAONVIEW-AI-Feedback/1.0)',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;
    const html = await response.text();
    const $ = load(html);
    $('script, style, noscript').remove();

    const title =
      $('meta[property="og:title"]').attr('content')?.trim() ||
      $('title').text().trim() ||
      '';

    const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 4000);
    if (!text) return null;

    return { title, text };
  } catch {
    return null;
  }
}

function buildFallbackComment(title: string, content: string, sourceLabel: string): string {
  const plain = stripHtml(content);
  const hasLink = /(https?:\/\/|blog\.naver\.com|instagram\.com|youtube\.com|tiktok\.com)/i.test(content);
  const bodyLength = plain.length;

  const strengths = [
    title.length >= 14
      ? '제목에 핵심 키워드가 들어가 있어 검색 노출에 유리합니다.'
      : '제목이 짧아 핵심 전달이 빠릅니다.',
    bodyLength >= 220
      ? '본문 정보량이 충분해 체류시간 확보에 유리합니다.'
      : '본문이 간결해 읽기 부담이 적습니다.',
  ];

  const improvements = [
    hasLink
      ? '본문 상단 3문장 안에 CTA(저장/댓글 유도)를 추가해보세요.'
      : '본문 하단에 관련 링크를 추가해 전환 동선을 만드세요.',
    '첫 문단에 “누가/왜/무엇”을 2줄 이내로 명확히 써주세요.',
    '해시태그는 5~8개로 줄이고 핵심 키워드 중심으로 재정리하세요.',
  ];

  return [
    '[AI_ANALYSIS]',
    '🤖 AI 포스팅 분석',
    `기반 데이터: ${sourceLabel}`,
    '',
    '1) 강점',
    `- ${strengths[0]}`,
    `- ${strengths[1]}`,
    '',
    '2) 개선 제안',
    `- ${improvements[0]}`,
    `- ${improvements[1]}`,
    `- ${improvements[2]}`,
  ].join('\n');
}

async function generateFeedbackComment(title: string, content: string): Promise<string> {
  try {
    const plain = stripHtml(content).slice(0, 3000);
    const linkUrl = extractFirstUrl(content);
    const linked = linkUrl ? await fetchLinkedText(linkUrl) : null;

    const sourceLabel = linked
      ? `작성글 + 링크 본문(${linkUrl})`
      : (linkUrl ? `작성글 + 링크 접근 실패(${linkUrl})` : '작성글');

    const linkedSection = linked
      ? `
[링크 제목]
${linked.title || '(제목 없음)'}

[링크 본문 요약 원문]
${linked.text}
`
      : `
[링크 본문]
${linkUrl ? '접근 실패 또는 본문 추출 실패' : '링크 없음'}
`;

    const prompt = `
너는 인플루언서 포스팅 코치다.
아래 작성글과 링크 본문(가능한 경우)을 함께 분석해 반드시 JSON으로만 답해라.

[제목]
${title}

[본문]
${plain}

${linkedSection}

응답 스키마:
{
  "strengths": ["문장1", "문장2"],
  "improvements": ["문장1", "문장2", "문장3"]
}

규칙:
- 한국어, 각 문장 60자 이내
- 과장/추측 금지, 실행 가능한 개선안만
- 링크 본문을 읽었으면 그 사실을 반영한 문장으로 작성
`;

    const ai = await generateWithGemini(prompt, true);
    const strengths = Array.isArray(ai?.strengths) ? ai.strengths.slice(0, 2) : [];
    const improvements = Array.isArray(ai?.improvements) ? ai.improvements.slice(0, 3) : [];

    if (strengths.length < 1 || improvements.length < 1) {
      return buildFallbackComment(title, content, sourceLabel);
    }

    return [
      '[AI_ANALYSIS]',
      '🤖 AI 포스팅 분석',
      `기반 데이터: ${sourceLabel}`,
      '',
      '1) 강점',
      ...strengths.map((s: string) => `- ${String(s).trim()}`),
      '',
      '2) 개선 제안',
      ...improvements.map((s: string) => `- ${String(s).trim()}`),
    ].join('\n');
  } catch {
    return buildFallbackComment(title, content, '작성글');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const postId = String(body?.postId || '').trim();
    if (!postId) {
      return NextResponse.json({ error: 'postId는 필수입니다.' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: postMeta, error: postMetaError } = await admin
      .from('posts')
      .select('id, user_id, type')
      .eq('id', postId)
      .maybeSingle();

    if (postMetaError || !postMeta) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
    }

    const normalizedType = String(postMeta.type || '').toUpperCase();
    if (normalizedType !== 'FREE') {
      return NextResponse.json({ error: 'FREE 타입 게시글만 지원합니다.' }, { status: 400 });
    }

    if (postMeta.user_id !== user.id) {
      const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
      const role = String(profile?.role || '').toUpperCase();
      if (role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    after(async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const { data: post } = await admin
          .from('posts')
          .select('id, user_id, title, content, type')
          .eq('id', postId)
          .maybeSingle();

        if (!post || String(post.type || '').toUpperCase() !== 'FREE') return;

        const { data: existingAiComment } = await admin
          .from('comments')
          .select('id')
          .eq('post_id', postId)
          .ilike('content', '[AI_ANALYSIS]%')
          .limit(1)
          .maybeSingle();

        if (existingAiComment) return;

        const comment = await generateFeedbackComment(String(post.title || ''), String(post.content || ''));
        await admin.from('comments').insert({
          post_id: postId,
          user_id: post.user_id,
          content: comment,
        });
      } catch (error) {
        console.error('[feedback-ai/enqueue] Background job failed:', error);
      }
    });

    return NextResponse.json({ queued: true });
  } catch {
    return NextResponse.json({ error: '요청 처리 실패' }, { status: 500 });
  }
}
