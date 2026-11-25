import { NextRequest, NextResponse } from 'next/server';
import { generateWithGemini } from '@/lib/services/googleAI';
import { generateBizVerificationPrompt } from '@/lib/ai/bizPrompts';
import { createClient } from '@supabase/supabase-js';
import { getRequestAuth } from '@/lib/auth/requestAuth';

export async function POST(request: NextRequest) {
    try {
        // 승인 대상은 요청 본문이 아니라 로그인 세션의 사용자로만 결정한다.
        const { user, role, profileError } = await getRequestAuth();
        if (!user) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }
        if (profileError) {
            return NextResponse.json({ error: profileError }, { status: 503 });
        }
        if (String(role || '').toUpperCase() !== 'ADVERTISER') {
            return NextResponse.json({ error: '광고주 계정만 사업자 인증을 요청할 수 있습니다.' }, { status: 403 });
        }
        const userId = user.id;

        const { companyName, bizNumber, fileBase64, certificateUrl } = await request.json();

        if (!companyName || !bizNumber || !fileBase64) {
            return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
        }

        // 등록증 URL은 본인이 방금 올린 사업자등록증 경로만 허용한다.
        const certificatePrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/files/biz-certificates/${userId}_`;
        const safeCertificateUrl =
            typeof certificateUrl === 'string' && certificateUrl.startsWith(certificatePrefix) ? certificateUrl : null;
        if (!safeCertificateUrl) {
            return NextResponse.json({ error: '사업자등록증 파일 정보가 올바르지 않습니다.' }, { status: 400 });
        }

        // 1. Gemini를 통한 서류 분석
        const prompt = generateBizVerificationPrompt(companyName, bizNumber);
        
        // generateWithGemini는 [header, data] 형태의 base64 배열을 기대함
        const aiResponse = await generateWithGemini(prompt, true, [fileBase64]);

        console.log('Biz AI Response:', aiResponse);

        // 2. 일치 여부에 따른 처리
        if (aiResponse.isMatch) {
            const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

            if (!url || !key) {
                throw new Error('Supabase configuration missing');
            }

            const supabaseAdmin = createClient(url, key, {
                auth: { autoRefreshToken: false, persistSession: false }
            });

            // 자동 승인: 승인 상태와 심사한 사업자 정보·등록증을 한 번에 저장한다.
            const { data: updatedRows, error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({
                    company_name: companyName,
                    biz_number: bizNumber,
                    biz_certificate_url: safeCertificateUrl,
                    biz_verification_status: 'APPROVED',
                    biz_verification_requested_at: new Date().toISOString(),
                    biz_rejection_reason: null,
                })
                .eq('id', userId)
                .select('id');

            if (updateError) throw updateError;
            if (!updatedRows || updatedRows.length === 0) {
                throw new Error('사업자 인증 정보를 저장하지 못했습니다.');
            }

            // 알림 추가
            await supabaseAdmin.from('notifications').insert({
                user_id: userId,
                type: 'SYSTEM',
                title: '✅ 사업자 인증 자동 승인 완료',
                content: 'AI 심사를 통해 사업자 정보가 확인되어 즉시 승인되었습니다. 이제 캠페인을 등록할 수 있습니다!',
                link: '/dashboard/advertiser/verification'
            });

            return NextResponse.json({ 
                success: true, 
                autoApproved: true,
                extracted: {
                    name: aiResponse.extractedCompanyName,
                    number: aiResponse.extractedBizNumber
                }
            });
        }

        // 일치하지 않는 경우
        return NextResponse.json({ 
            success: true, 
            autoApproved: false,
            reason: aiResponse.reason,
            extracted: {
                name: aiResponse.extractedCompanyName,
                number: aiResponse.extractedBizNumber
            }
        });

    } catch (error: any) {
        console.error('Biz Verification API Error:', error);
        return NextResponse.json({ 
            error: error.message || 'AI 인증 도중 오류가 발생했습니다.' 
        }, { status: 500 });
    }
}
