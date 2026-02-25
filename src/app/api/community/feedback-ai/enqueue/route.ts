import { after, NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateWithGemini } from '@/lib/services/googleAI';

export const runtime = 'nodejs';
export const maxDuration = 60;

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function buildFallbackComment(title: string, content: string): string {
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
    const prompt = `
너는 인플루언서 포스팅 코치다.
아래 제목/본문을 분석해 반드시 JSON으로만 답해라.

[제목]
${title}

[본문]
${plain}

응답 스키마:
{
  "strengths": ["문장1", "문장2"],
  "improvements": ["문장1", "문장2", "문장3"]
}

규칙:
- 한국어, 각 문장 60자 이내
- 과장/추측 금지, 실행 가능한 개선안만
`;

    const ai = await generateWithGemini(prompt, true);
    const strengths = Array.isArray(ai?.strengths) ? ai.strengths.slice(0, 2) : [];
    const improvements = Array.isArray(ai?.improvements) ? ai.improvements.slice(0, 3) : [];

    if (strengths.length < 1 || improvements.length < 1) {
      return buildFallbackComment(title, content);
    }

    return [
      '[AI_ANALYSIS]',
      '🤖 AI 포스팅 분석',
      '',
      '1) 강점',
      ...strengths.map((s: string) => `- ${String(s).trim()}`),
      '',
      '2) 개선 제안',
      ...improvements.map((s: string) => `- ${String(s).trim()}`),
    ].join('\n');
  } catch {
    return buildFallbackComment(title, content);
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
