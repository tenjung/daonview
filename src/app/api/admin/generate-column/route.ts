import { NextResponse } from 'next/server';
import { generateColumn, generateColumnThumbnail } from '@/lib/ai/generateColumn';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * 관리자용 AI 칼럼 생성 API
 * POST /api/admin/generate-column
 * Body: { type: 'ACADEMY_INFLUENCER' | 'ACADEMY_ADVERTISER' }
 */
export async function POST(request: Request) {
    const startTime = Date.now();

    try {
        // 1. 인증 확인 (관리자만 가능)
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: '인증이 필요합니다.' },
                { status: 401 }
            );
        }

        // 관리자 권한 확인
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError || profile?.role !== 'ADMIN') {
            return NextResponse.json(
                { error: '관리자 권한이 필요합니다.' },
                { status: 403 }
            );
        }

        // 2. 요청 파라미터 확인
        const body = await request.json();
        const { type } = body as { type: 'ACADEMY_INFLUENCER' | 'ACADEMY_ADVERTISER' };

        if (!type || (type !== 'ACADEMY_INFLUENCER' && type !== 'ACADEMY_ADVERTISER')) {
            return NextResponse.json(
                { error: '유효하지 않은 칼럼 타입입니다.' },
                { status: 400 }
            );
        }

        console.log(`[AI Column] 📝 ${type} 칼럼 생성 시작...`);

        // 3. AI 칼럼 생성
        const { title, content, topic } = await generateColumn(type);
        console.log(`[AI Column] ✅ 칼럼 생성 완료: "${title}"`);

        // 4. 본문 내 이미지 플레이스홀더 처리
        console.log('[AI Column] 🎨 본문 이미지 생성 중...');
        let finalContent = content;

        const imageMatches = content.match(/\[IMAGE:([^\]]+)\]/g);

        if (imageMatches && imageMatches.length > 0) {
            console.log(`[AI Column] 📸 ${imageMatches.length}개의 이미지 플레이스홀더 발견`);

            for (const match of imageMatches) {
                const description = match.replace('[IMAGE:', '').replace(']', '');

                try {
                    const imageBase64 = await generateColumnThumbnail(description);

                    if (imageBase64) {
                        const imgTag = `<img src="${imageBase64}" alt="${description}" style="width: 100%; max-width: 700px; height: auto; border-radius: 12px; margin: 24px 0;" />`;
                        finalContent = finalContent.replace(match, imgTag);
                        console.log(`[AI Column] ✅ 이미지 생성 완료: ${description}`);
                    } else {
                        finalContent = finalContent.replace(match, '');
                        console.log(`[AI Column] ⚠️ 이미지 생성 실패: ${description}`);
                    }
                } catch (imgError: any) {
                    console.error(`[AI Column] 이미지 생성 오류 (${description}):`, imgError.message);
                    finalContent = finalContent.replace(match, '');
                }

                // API 속도 제한 방지 (1초 대기)
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } else {
            console.log('[AI Column] ℹ️ 이미지 플레이스홀더 없음');
        }

        // 5. Supabase에 저장 (Service Role Key 사용)
        console.log('[AI Column] 💾 Supabase에 칼럼 저장 중...');

        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        const { data: post, error: insertError } = await supabaseAdmin
            .from('posts')
            .insert({
                title,
                content: finalContent,
                type,
                user_id: user.id,
                view_count: 0,
                is_pinned: false,
            })
            .select()
            .single();

        if (insertError) {
            console.error('[AI Column] DB 저장 오류:', insertError);
            throw insertError;
        }

        console.log(`[AI Column] ✅ 칼럼 저장 완료 (ID: ${post.id})`);

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        return NextResponse.json({
            success: true,
            message: `${type === 'ACADEMY_INFLUENCER' ? '인플루언서' : '광고주'} 칼럼이 성공적으로 생성되었습니다.`,
            post: {
                id: post.id,
                title: post.title,
                type: post.type,
                created_at: post.created_at,
            },
            duration: `${duration}s`,
            images_generated: imageMatches?.length || 0,
        });

    } catch (error: any) {
        console.error('[AI Column Error]:', error);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        return NextResponse.json(
            {
                error: '칼럼 생성 중 오류가 발생했습니다.',
                details: error.message,
                duration: `${duration}s`,
            },
            { status: 500 }
        );
    }
}
