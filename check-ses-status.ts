
import * as dotenv from 'dotenv';
import path from 'path';
import { SESClient, GetAccountSendingEnabledCommand, ListVerifiedEmailAddressesCommand } from '@aws-sdk/client-ses';

// .env.local 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const AWS_REGION = process.env.AWS_SES_REGION || 'ap-northeast-2';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '';
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';

async function checkSESStatus() {
    console.log('🔍 [AWS SES] 계정 상태 확인 중...\n');
    
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
        console.error('❌ AWS 자격 증명이 설정되지 않았습니다.');
        return;
    }

    try {
        const sesClient = new SESClient({
            region: AWS_REGION,
            credentials: {
                accessKeyId: AWS_ACCESS_KEY_ID,
                secretAccessKey: AWS_SECRET_ACCESS_KEY,
            },
        });

        // 1. 발송 활성화 상태 확인
        console.log('📊 1. 발송 활성화 상태 확인');
        const sendingCommand = new GetAccountSendingEnabledCommand({});
        const sendingResponse = await sesClient.send(sendingCommand);
        console.log(`   발송 가능 여부: ${sendingResponse.Enabled ? '✅ 활성화됨' : '❌ 비활성화됨'}\n`);

        // 2. 검증된 이메일 주소 목록 확인
        console.log('📧 2. 검증된 이메일 주소 목록');
        const verifiedCommand = new ListVerifiedEmailAddressesCommand({});
        const verifiedResponse = await sesClient.send(verifiedCommand);
        
        if (verifiedResponse.VerifiedEmailAddresses && verifiedResponse.VerifiedEmailAddresses.length > 0) {
            console.log('   검증된 이메일:');
            verifiedResponse.VerifiedEmailAddresses.forEach(email => {
                console.log(`   ✅ ${email}`);
            });
        } else {
            console.log('   ⚠️  검증된 이메일이 없습니다.');
        }

        console.log('\n📌 중요 안내:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('AWS SES는 기본적으로 "샌드박스 모드"로 시작됩니다.');
        console.log('샌드박스 모드에서는 위에 표시된 검증된 이메일로만 발송 가능합니다.');
        console.log('');
        console.log('✅ 해결 방법:');
        console.log('1. AWS 콘솔에서 수신자 이메일(doriclan@naver.com)을 검증하거나');
        console.log('2. 프로덕션 액세스 요청을 제출하여 샌드박스 모드를 해제하세요.');
        console.log('');
        console.log('🔗 AWS SES 콘솔: https://console.aws.amazon.com/ses/');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (error: any) {
        console.error('❌ 상태 확인 중 오류 발생:');
        console.error('Error:', error.message);
        if (error.$metadata) {
            console.error('HTTP Status:', error.$metadata.httpStatusCode);
        }
    }
}

checkSESStatus();
