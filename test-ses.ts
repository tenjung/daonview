
import * as dotenv from 'dotenv';
import path from 'path';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// .env.local 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const AWS_REGION = process.env.AWS_SES_REGION || 'ap-northeast-2';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '';
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'master@daonview.com';

async function testSES() {
    console.log('🚀 [AWS SES SDK] 이메일 발송 테스트 시작 (공식 SDK 직접 사용)');
    console.log(`📡 리전: ${AWS_REGION}`);
    console.log(`📧 발신자: ${EMAIL_FROM}`);
    
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
        console.error('❌ AWS 자격 증명이 설정되지 않았습니다. .env.local 파일을 확인해주세요.');
        return;
    }

    try {
        // AWS SES 클라이언트 생성
        const sesClient = new SESClient({
            region: AWS_REGION,
            credentials: {
                accessKeyId: AWS_ACCESS_KEY_ID,
                secretAccessKey: AWS_SECRET_ACCESS_KEY,
            },
        });

        const testRecipient = 'doriclan@naver.com';

        console.log(`📧 수신자: ${testRecipient} 에게 메일을 보냅니다...`);

        // HTML 이메일 템플릿
        const htmlBody = `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                </head>
                <body>
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #f43f5e;">다온뷰 AWS SES 공식 SDK 연동 성공!</h2>
                        <p>안녕하세요, 관리자님.</p>
                        <p>AWS SES 공식 SDK를 직접 사용한 이메일 발송이 성공적으로 확인되었습니다.</p>
                        <ul style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
                            <li>✅ Nodemailer 의존성 제거</li>
                            <li>✅ 서버리스 환경 최적화</li>
                            <li>✅ AWS 공식 SDK 직접 사용</li>
                        </ul>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                        <p style="font-size: 12px; color: #888;">본 메일은 시스템 자동 발송 테스트 메일입니다.</p>
                        <p style="font-size: 12px; color: #888;">발송 시각: ${new Date().toLocaleString('ko-KR')}</p>
                    </div>
                </body>
            </html>
        `;

        // SendEmailCommand 생성 및 전송
        const command = new SendEmailCommand({
            Source: `"다온뷰 테스트" <${EMAIL_FROM}>`,
            Destination: {
                ToAddresses: [testRecipient],
            },
            Message: {
                Subject: {
                    Data: '🚀 [다온뷰] AWS SES 공식 SDK 연동 성공 테스트',
                    Charset: 'UTF-8',
                },
                Body: {
                    Html: {
                        Data: htmlBody,
                        Charset: 'UTF-8',
                    },
                },
            },
        });

        const response = await sesClient.send(command);

        console.log('✅ 이메일 발송 성공!');
        console.log('Message ID:', response.MessageId);
        console.log('Request ID:', response.$metadata.requestId);
        console.log('HTTP Status:', response.$metadata.httpStatusCode);
    } catch (error: any) {
        console.error('❌ 이메일 발송 에러 발생:');
        console.error('Error Message:', error.message);
        if (error.name) console.error('Error Name:', error.name);
        if (error.$metadata) {
            console.error('AWS Metadata:', {
                httpStatusCode: error.$metadata.httpStatusCode,
                requestId: error.$metadata.requestId,
            });
        }
        if (error.stack) console.error('Stack:', error.stack);
    }
}

testSES();
