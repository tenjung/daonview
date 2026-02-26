import { NextResponse } from 'next/server';
import { generateColumnThumbnail, generateColumnWithOptions } from '@/lib/ai/generateColumn';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // Vercel Pro: 최대 60초

/**
 * Vercel Cron Job: 2일마다 인플루언서 칼럼 자동 생성
 * 
 * 스케줄: vercel.json에서 설정
 * - 매 2일마다 오전 10시 (KST)
 * - Cron 표현식: "0 1 *\/2 * *" (UTC 01:00 = KST 10:00)
 */
export async function GET(request: Request) {
    const startTime = Date.now();

    try {
        // 1. Vercel Cron Secret 검증 (보안)
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret) {
            console.error('[CRON] CRON_SECRET 환경 변수가 설정되지 않았습니다.');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        if (authHeader !== `Bearer ${cronSecret}`) {
            console.error('[CRON] Unauthorized access attempt');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('[CRON] ✅ 인플루언서 칼럼 자동 생성 시작...');

        // 2. 최근 20건 제목 조회 후 AI 칼럼 생성 (인플루언서 칼럼)
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
        const supabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        const { data: recentPosts, error: recentPostsError } = await supabase
            .from('posts')
            .select('title')
            .eq('type', 'ACADEMY_INFLUENCER')
            .order('created_at', { ascending: false })
            .limit(20);

        if (recentPostsError) {
            console.error('[CRON] 최근 칼럼 조회 오류:', recentPostsError);
        }

        const excludedTitles = (recentPosts || []).map((p: { title: string }) => p.title);

        console.log('[CRON] 📝 Google Gemini로 칼럼 생성 중...');
        const { title, content, topic } = await generateColumnWithOptions('ACADEMY_INFLUENCER', { excludedTitles });
        console.log(`[CRON] ✅ 칼럼 생성 완료: "${title}"`);

        // 3. 본문 내 이미지 플레이스홀더 처리
        console.log('[CRON] 🎨 본문 이미지 생성 중...');
        let finalContent = content;

        // [IMAGE:설명] 패턴 찾기
        const imageMatches = content.match(/\[IMAGE:([^\]]+)\]/g);

        if (imageMatches && imageMatches.length > 0) {
            console.log(`[CRON] 📸 ${imageMatches.length}개의 이미지 플레이스홀더 발견`);

            for (const match of imageMatches) {
                const description = match.replace('[IMAGE:', '').replace(']', '');

                try {
                    // Imagen으로 이미지 생성
                    const imageBase64 = await generateColumnThumbnail(description);

                    if (imageBase64) {
                        // 플레이스홀더를 실제 이미지로 교체
                        const imgTag = `<img src="${imageBase64}" alt="${description}" style="width: 100%; max-width: 700px; height: auto; border-radius: 12px; margin: 24px 0;" />`;
                        finalContent = finalContent.replace(match, imgTag);
                        console.log(`[CRON] ✅ 이미지 생성 완료: ${description}`);
                    } else {
                        // 이미지 생성 실패 시 플레이스홀더 제거
                        finalContent = finalContent.replace(match, '');
                        console.log(`[CRON] ⚠️ 이미지 생성 실패: ${description}`);
                    }
                } catch (imgError: any) {
                    console.error(`[CRON] 이미지 생성 오류 (${description}):`, imgError.message);
                    // 오류 발생 시 플레이스홀더 제거
                    finalContent = finalContent.replace(match, '');
                }

                // API 속도 제한 방지 (1초 대기)
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } else {
            console.log('[CRON] ℹ️ 이미지 플레이스홀더 없음');
        }

        // 5. Supabase에 저장 (Service Role Key 사용 - RLS 우회)
        console.log('[CRON] 💾 Supabase에 칼럼 저장 중...');

        // 관리자 계정 ID 가져오기
        const { data: adminProfile, error: adminError } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'ADMIN')
            .limit(1)
            .single();

        if (adminError || !adminProfile) {
            throw new Error('관리자 프로필을 찾을 수 없습니다.');
        }

        const { data: post, error: insertError } = await supabase
            .from('posts')
            .insert({
                title,
                content: finalContent,
                type: 'ACADEMY_INFLUENCER',
                user_id: adminProfile.id,
                view_count: 0,
                is_pinned: false,
            })
            .select()
            .single();

        if (insertError) {
            console.error('[CRON] DB 저장 오류:', insertError);
            throw insertError;
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[CRON] ✅ 칼럼 발행 완료! (${duration}초 소요)`);
        console.log(`[CRON] 📌 Post ID: ${post.id}`);
        console.log(`[CRON] 📌 Title: ${post.title}`);

        return NextResponse.json({
            success: true,
            message: '인플루언서 칼럼이 성공적으로 발행되었습니다.',
            post: {
                id: post.id,
                title: post.title,
                topic,
                created_at: post.created_at,
            },
            duration: `${duration}s`,
            images_generated: imageMatches?.length || 0,
        });

    } catch (error: any) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`[CRON] ❌ 오류 발생 (${duration}초 후):`, error);

        return NextResponse.json(
            {
                success: false,
                error: error.message || '알 수 없는 오류',
                duration: `${duration}s`,
            },
            { status: 500 }
        );
    }
}
