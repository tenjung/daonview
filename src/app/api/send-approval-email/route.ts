import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            console.error('Missing RESEND_API_KEY environment variable');
            return NextResponse.json({ error: 'Mail service not configured' }, { status: 500 });
        }

        const resend = new Resend(apiKey);
        const { email, influencerName, campaignTitle, campaignId } = await request.json();

        if (!email || !influencerName || !campaignTitle) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // 이메일 발송
        const { data, error } = await resend.emails.send({
            from: 'DAONVIEW <noreply@daonview.com>', // 실제 도메인으로 변경 필요
            to: [email],
            subject: `🎉 축하합니다! "${campaignTitle}" 체험단에 선정되셨습니다`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .container {
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            border-radius: 16px;
                            padding: 40px;
                            text-align: center;
                            color: white;
                        }
                        .emoji {
                            font-size: 64px;
                            margin-bottom: 20px;
                        }
                        h1 {
                            font-size: 28px;
                            margin: 0 0 16px 0;
                            font-weight: bold;
                        }
                        .campaign-title {
                            background: rgba(255, 255, 255, 0.2);
                            padding: 16px 24px;
                            border-radius: 12px;
                            font-size: 20px;
                            font-weight: bold;
                            margin: 24px 0;
                        }
                        .content {
                            background: white;
                            color: #333;
                            padding: 32px;
                            border-radius: 12px;
                            margin-top: 24px;
                            text-align: left;
                        }
                        .content h2 {
                            color: #667eea;
                            font-size: 20px;
                            margin-top: 0;
                        }
                        .steps {
                            background: #f7fafc;
                            padding: 20px;
                            border-radius: 8px;
                            margin: 16px 0;
                        }
                        .step {
                            margin: 12px 0;
                            padding-left: 24px;
                            position: relative;
                        }
                        .step:before {
                            content: "✓";
                            position: absolute;
                            left: 0;
                            color: #667eea;
                            font-weight: bold;
                        }
                        .button {
                            display: inline-block;
                            background: #667eea;
                            color: white;
                            padding: 14px 32px;
                            border-radius: 8px;
                            text-decoration: none;
                            font-weight: bold;
                            margin: 24px 0;
                        }
                        .footer {
                            text-align: center;
                            color: #718096;
                            font-size: 14px;
                            margin-top: 32px;
                            padding-top: 24px;
                            border-top: 1px solid #e2e8f0;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="emoji">🎉</div>
                        <h1>축하합니다, ${influencerName}님!</h1>
                        <p style="font-size: 18px; margin: 0;">체험단에 선정되셨습니다</p>
                        
                        <div class="campaign-title">
                            ${campaignTitle}
                        </div>
                    </div>

                    <div class="content">
                        <h2>다음 단계를 진행해주세요</h2>
                        
                        <div class="steps">
                            <div class="step">대시보드에서 캠페인 상세 정보를 확인하세요</div>
                            <div class="step">미션 가이드를 꼼꼼히 읽어주세요</div>
                            <div class="step">체험 후 리뷰 마감일까지 리뷰를 등록해주세요</div>
                        </div>

                        <center>
                            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/influencer/campaigns" class="button">
                                내 캠페인 확인하기
                            </a>
                        </center>

                        <p style="color: #718096; font-size: 14px; margin-top: 24px;">
                            <strong>주의사항:</strong><br>
                            • 리뷰 마감일을 꼭 지켜주세요<br>
                            • 금지어 사용에 주의해주세요<br>
                            • 문의사항은 캠페인 상세 페이지에서 확인하실 수 있습니다
                        </p>
                    </div>

                    <div class="footer">
                        <p>
                            이 메일은 DAONVIEW 체험단 선정 알림입니다.<br>
                            © ${new Date().getFullYear()} DAONVIEW. All rights reserved.
                        </p>
                    </div>
                </body>
                </html>
            `,
        });

        if (error) {
            console.error('Resend error:', error);
            return NextResponse.json(
                { error: 'Failed to send email', details: error },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Email API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
