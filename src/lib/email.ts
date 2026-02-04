import nodemailer from 'nodemailer';
import * as SESv2 from '@aws-sdk/client-sesv2';
import { createAdminClient } from './supabase/admin';

// AWS SESv2 설정
const ses = new SESv2.SESv2({
  region: process.env.AWS_SES_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// Nodemailer Transporter 생성
const transporter = nodemailer.createTransport({
  SES: { ses, aws: SESv2 },
} as any);

export type EmailType = 'WELCOME' | 'CAMPAIGN_SELECTED' | 'PRODUCT_SHIPPED' | 'DEADLINE_WARNING';

interface EmailParams {
  nickname?: string;
  campaignTitle?: string;
  trackingCompany?: string;
  trackingNumber?: string;
  deadlineDate?: string;
  link?: string;
  email?: string; // 수신 거부 링크용
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

  const footerLinkStyle = `
    color: #94a3b8;
    text-decoration: underline;
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

  const unsubscribeUrl = `https://daonview.com/unsubscribe?email=${encodeURIComponent(params.email || '')}`;

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
            <p style="margin-top: 10px;">
              더 이상 소식을 받고 싶지 않으시다면 
              <a href="${unsubscribeUrl}" style="${footerLinkStyle}">수신거부</a>를 클릭해 주세요.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return { subject, html };
};

/**
 * 이메일 전송 함수
 * 수신 거부 상태를 확인하고 이메일을 발송합니다.
 */
export const sendEmail = async (to: string, type: EmailType, params: EmailParams) => {
  try {
    const supabase = createAdminClient();

    // 1. 수신 거부 상태 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email_subscription_status')
      .eq('email', to)
      .single();

    if (profileError) {
      console.error('Error fetching profile for email check:', profileError);
      // 프로필이 없거나 오류가 나도 마케팅성 메일이 아니면 보낼 수도 있지만, 
      // 안전하게 기본적으로는 진행 (또는 정책에 따라 차단)
    }

    // 상태값 대문자 변환 후 비교 (데이터 무결성 규칙 준수)
    const status = profile?.email_subscription_status ? String(profile.email_subscription_status).toUpperCase() : '';

    if (status === 'UNSUBSCRIBED' || 
        status === 'BOUNCED' || 
        status === 'COMPLAINED') {
      console.log(`[EMAIL SKIPPED] User ${to} has status: ${status}.`);
      return { success: false, message: `User status is ${status}` };
    }

    // 2. 템플릿 생성 (params에 email 추가)
    const { subject, html } = getEmailTemplate(type, { ...params, email: to });

    // 3. AWS SES 샌드박스 체크 및 발송
    if (process.env.NODE_ENV === 'development' || !process.env.AWS_ACCESS_KEY_ID) {
      console.log('[EMAIL MOCK] Sending email:', { to, subject });
      return { success: true, messageId: `mock-${Date.now()}` };
    }

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
