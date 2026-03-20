import { NextRequest, NextResponse } from 'next/server';
import { generateWithGemini } from '@/lib/services/googleAI';
import { generateBizVerificationPrompt } from '@/lib/ai/bizPrompts';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
    try {
        const { companyName, bizNumber, fileBase64, userId } = await request.json();

        if (!companyName || !bizNumber || !fileBase64 || !userId) {
            return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
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

            // 자동 승인 처리
            const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({
                    biz_verification_status: 'APPROVED',
                    biz_verification_requested_at: new Date().toISOString(),
                    // memo: 'AI 자동 승인됨' // optional
                })
                .eq('id', userId);

            if (updateError) throw updateError;

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
