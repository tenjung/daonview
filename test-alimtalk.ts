
import { SolapiMessageService } from 'solapi';
import * as dotenv from 'dotenv';
import path from 'path';

// .env.local 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY!;
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET!;
const SOLAPI_SENDER_PHONE = process.env.SOLAPI_SENDER_PHONE!;
const SOLAPI_KAKAO_CHANNEL_ID = process.env.SOLAPI_KAKAO_CHANNEL_ID!;
const TEMPLATE_CODE = process.env.SOLAPI_TEMPLATE_INFLUENCER_SELECTED || 'INFLUENCER_SELECTED';

const messageService = new SolapiMessageService(SOLAPI_API_KEY, SOLAPI_API_SECRET);

async function testSend() {
    console.log('🚀 [Direct] 알림톡 발송 테스트 시작...');
    console.log(`📡 발신번호: ${SOLAPI_SENDER_PHONE}`);
    console.log(`🔑 템플릿: ${TEMPLATE_CODE}`);

    try {
        const response = await messageService.sendOne({
            to: '01068390203',
            from: SOLAPI_SENDER_PHONE,
            kakaoOptions: {
                pfId: SOLAPI_KAKAO_CHANNEL_ID,
                templateId: TEMPLATE_CODE,
                variables: {
                    '인플루언서명': '신지호',
                    '캠페인명': '[대구/수성구] 신매영 프리미엄 미용실 펌/매직/염색/클리닉',
                    '체험유형': '방문형',
                    '마감일': '2026년 2월 28일',
                    '제공내역': '펌/매직/염색/클리닉 중 택 1',
                    '캠페인ID': '13'
                },
                buttons: [
                    {
                        buttonName: '캠페인 확인하기',
                        buttonType: 'WL',
                        linkMo: 'https://daonview.com/campaigns/13',
                        linkPc: 'https://daonview.com/campaigns/13'
                    }
                ]
            }
        });

        console.log('✅ 발송 요청 성공!');
        console.log('Message ID:', response.messageId);
    } catch (error: any) {
        console.error('❌ 발송 에러 발생:');
        console.error(error.message || error);
    }
}

testSend();
