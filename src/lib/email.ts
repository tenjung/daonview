/**
 * ⚠️ AWS SES 샌드박스 모드로 인해 임시 비활성화
 * ✅ AWS SES 프로덕션 승인 후 아래 주석을 해제하세요
 */

// import nodemailer from 'nodemailer';
// import * as AWS from 'aws-sdk';

// // AWS SES 설정
// const ses = new AWS.SES({
//   apiVersion: '2010-12-01',
//   region: process.env.AWS_SES_REGION || 'ap-northeast-2',
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
// });

// // Nodemailer Transporter 생성
// const transporter = nodemailer.createTransport({
//   SES: { ses, aws: AWS },
// });

export type EmailType = 'WELCOME' | 'CAMPAIGN_SELECTED' | 'PRODUCT_SHIPPED' | 'DEADLINE_WARNING';

interface EmailParams {
  nickname?: string;
  campaignTitle?: string;
  trackingCompany?: string;
  trackingNumber?: string;
  deadlineDate?: string;
  link?: string;
}

/**
 * 이메일 타입별 동적 템플릿 생성
 */
export const getEmailTemplate = (type: EmailType, params: EmailParams) => {
  const baseStyle = `
    font-family: 'Pretendard', sans-serif;
    line-height: 1.6;
    color: #334155;
    max-width: 600px;
    margin: 0 auto;
    padding: 40px 20px;
    border: 1px solid #f1f5f9;
    border-radius: 20px;
  `;

  const headerStyle = `
    font-size: 24px;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 24px;
    text-align: center;
  `;

  const buttonStyle = `
    display: inline-block;
    padding: 14px 32px;
    background-color: #f43f5e;
    color: #ffffff;
    text-decoration: none;
    border-radius: 12px;
    font-weight: 700;
    margin-top: 24px;
  `;

  let subject = '';
  let content = '';

  switch (type) {
    case 'WELCOME':
      subject = `✨ [다온뷰] ${params.nickname}님, 환영합니다! 다온뷰의 회원이 되셨습니다.`;
      content = `
        <div style="${headerStyle}">다온뷰의 가족이 되신 것을 환영합니다!</div>
        <p>안녕하세요, <b>${params.nickname}</b>님!</p>
        <p>성공적인 인플루언서 활동의 시작, 다온뷰와 함께하게 되어 진심으로 기쁩니다.</p>
        <p>지금 바로 다온뷰의 다양한 캠페인을 확인하고 신청해 보세요.</p>
        <div style="text-align: center;">
          <a href="https://daonview.com/campaigns" style="${buttonStyle}">캠페인 보러가기</a>
        </div>
      `;
      break;

    case 'CAMPAIGN_SELECTED':
      subject = `🎉 [다온뷰] 축하합니다! '${params.campaignTitle}' 캠페인에 선정되셨습니다.`;
      content = `
        <div style="${headerStyle}">캠페인 선정 축하드립니다!</div>
        <p>안녕하세요, ${params.nickname}님.</p>
        <p>신청하신 <b>[${params.campaignTitle}]</b> 캠페인에 최종 선정되셨음을 알려드립니다.</p>
        <p>협찬 가이드라인을 꼼꼼히 확인하신 후 멋진 리뷰 부탁드립니다.</p>
        <div style="text-align: center;">
          <a href="https://daonview.com/dashboard/influencer/campaigns" style="${buttonStyle}">가이드 확인 및 리뷰 등록</a>
        </div>
      `;
      break;

    case 'PRODUCT_SHIPPED':
      subject = `📦 [다온뷰] 신청하신 캠페인의 제품 배송이 시작되었습니다.`;
      content = `
        <div style="${headerStyle}">기다리시던 제품이 발송되었습니다!</div>
        <p>안녕하세요, ${params.nickname}님.</p>
        <p><b>[${params.campaignTitle}]</b> 캠페인의 제품이 안전하게 발송되었습니다.</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #64748b;">배송 정보</p>
          <p style="margin: 8px 0 0 0; font-weight: 700;">${params.trackingCompany} : ${params.trackingNumber}</p>
        </div>
        <p>제품 수령 후 3일 이내에 리뷰 작성을 부탁드립니다.</p>
      `;
      break;

    case 'DEADLINE_WARNING':
      subject = `⏰ [다온뷰] 마감 임박! 리뷰 제출 기한이 얼마 남지 않았습니다.`;
      content = `
        <div style="${headerStyle}">리뷰 마감 기한을 확인해 주세요!</div>
        <p>안녕하세요, ${params.nickname}님.</p>
        <p>진행 중인 <b>[${params.campaignTitle}]</b> 캠페인의 리뷰 마감일이 벌써 다가오고 있습니다.</p>
        <p style="color: #ef4444; font-weight: 700;">마감 기한: ${params.deadlineDate}</p>
        <p>기한 내 리뷰가 등록되지 않을 경우 패널티가 발생할 수 있으니 유의 부탁드립니다.</p>
        <div style="text-align: center;">
          <a href="https://daonview.com/dashboard/influencer/campaigns" style="${buttonStyle}">리뷰 등록하러 가기</a>
        </div>
      `;
      break;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body>
        <div style="${baseStyle}">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://daonview.com/logo.png" alt="Daonview" style="height: 40px;">
          </div>
          ${content}
          <div style="margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 12px; color: #94a3b8; text-align: center;">
            <p>© 2026 다온뷰(Daonview). All rights reserved.</p>
            <p>본 메일은 발신전용으로 회신이 되지 않습니다.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return { subject, html };
};

/**
 * 이메일 전송 함수 (임시 비활성화)
 * ⚠️ AWS SES 샌드박스 모드로 인해 임시 비활성화
 * ✅ AWS SES 프로덕션 승인 후 아래 주석을 해제하세요
 */
export const sendEmail = async (to: string, type: EmailType, params: EmailParams) => {
  console.log('[EMAIL DISABLED] Would send email:', { to, type, params });
  return { success: true, messageId: `temp-${Date.now()}` };
};

/*
// ✅ AWS SES 프로덕션 승인 후 아래 주석 해제
export const sendEmail = async (to: string, type: EmailType, params: EmailParams) => {
  try {
    const { subject, html } = getEmailTemplate(type, params);

    const info = await transporter.sendMail({
      from: `"다온뷰" <${process.env.EMAIL_FROM || 'master@daonview.com'}>`,
      to,
      subject,
      html,
    });

    console.log(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};
*/
