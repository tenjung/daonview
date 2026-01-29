/**
 * 솔라피 카카오 알림톡 발송 API (SDK 버전)
 * 
 * POST /api/send-alimtalk
 */

import { NextRequest, NextResponse } from 'next/server';
import { SolapiMessageService } from 'solapi';
import { AlimtalkRequest, AlimtalkResponse } from '@/types/alimtalk';

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY!;
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET!;
const SOLAPI_SENDER_PHONE = process.env.SOLAPI_SENDER_PHONE!;
const SOLAPI_KAKAO_CHANNEL_ID = process.env.SOLAPI_KAKAO_CHANNEL_ID!;

// Solapi 메시지 서비스 인스턴스 생성
const messageService = new SolapiMessageService(SOLAPI_API_KEY, SOLAPI_API_SECRET);

export async function POST(request: NextRequest) {
    try {
        const body: AlimtalkRequest = await request.json();
        const { to, templateCode, variables, buttons } = body;

        // 필수 필드 검증
        if (!to || !templateCode) {
            return NextResponse.json(
                { success: false, error: '수신자 전화번호와 템플릿 코드는 필수입니다.' },
                { status: 400 }
            );
        }

        // 환경 변수 검증
        if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET || !SOLAPI_SENDER_PHONE || !SOLAPI_KAKAO_CHANNEL_ID) {
            console.error('솔라피 환경 변수가 설정되지 않았습니다.');
            return NextResponse.json(
                { success: false, error: '알림톡 서비스가 설정되지 않았습니다.' },
                { status: 500 }
            );
        }

        // SDK를 사용한 알림톡 발송
        const response = await messageService.sendOne({
            to,
            from: SOLAPI_SENDER_PHONE,
            kakaoOptions: {
                pfId: SOLAPI_KAKAO_CHANNEL_ID,
                templateId: templateCode,
                variables,
                buttons: buttons?.map(btn => ({
                    buttonName: btn.name,
                    buttonType: 'WL' as const,
                    linkMo: btn.url_mobile,
                    linkPc: btn.url_pc || btn.url_mobile
                }))
            }
        });

        // 성공 응답
        const result: AlimtalkResponse = {
            success: true,
            messageId: response.messageId
        };

        console.log('알림톡 발송 성공:', {
            to,
            templateCode,
            messageId: response.messageId
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('알림톡 발송 중 오류:', error);

        // SDK 에러 처리
        const errorMessage = error.message || '알 수 없는 오류가 발생했습니다.';

        // 템플릿 미승인 에러 처리
        if (errorMessage.includes('TemplateNotApproved') || errorMessage.includes('template')) {
            return NextResponse.json(
                {
                    success: false,
                    error: '알림톡 템플릿이 아직 승인되지 않았습니다. 솔라피 콘솔에서 템플릿 승인 상태를 확인해주세요.'
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: errorMessage
            },
            { status: 500 }
        );
    }
}
