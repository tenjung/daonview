import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { createAdminClient } from './supabase/admin';

/**
 * AWS SES 클라이언트 싱글톤 인스턴스
 */
let sesClient: SESClient | null = null;

const getSESClient = (): SESClient => {
  if (sesClient) return sesClient;

  sesClient = new SESClient({
    region: process.env.AWS_SES_REGION || 'ap-northeast-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });

  return sesClient;
};

export type EmailType = 'WELCOME' | 'CAMPAIGN_SELECTED' | 'PRODUCT_SHIPPED' | 'DEADLINE_WARNING';

interface EmailParams {
  nickname?: string;
  campaignTitle?: string;
  providedItems?: string;
  assignedOptionLabel?: string;
  assignedPurchaseLink?: string;
  trackingCompany?: string;
  trackingNumber?: string;
  deadlineDate?: string;
  link?: string;
  email?: string; // 수신 거부 링크용
}

interface AdminPartnerInquiryEmailParams {
  companyName: string;
  managerName: string;
  phone: string;
  email?: string | null;
  message: string;
  requestedChannels: string[];
  productFileName: string;
}

const ADMIN_PARTNER_INQUIRY_EMAIL = process.env.ADMIN_INQUIRY_EMAIL || 'tenjung2@gmail.com';
const ADMIN_PARTNER_INQUIRY_URL = 'https://daonview.com/dashboard/admin/inquiries';

const PARTNER_CHANNEL_LABELS: Record<string, string> = {
  OFFLINE: '오프라인',
  CLOSED_MALL: '폐쇄몰',
  GROUP_BUY: '공동구매',
  GLOBAL: '해외',
  RECOMMEND_ALL: '전체 추천',
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

/**
 * DB에서 이메일 템플릿 로드 및 변수 치환
 */
export const getEmailTemplateFromDB = async (type: EmailType, params: EmailParams) => {
  try {
    const supabase = createAdminClient();
    
    const { data: template, error } = await supabase
      .from('email_templates')
      .select('subject, html_content')
      .eq('type', type)
      .eq('is_active', true)
      .single();

    if (error || !template) {
      console.error('Template not found in DB, using fallback:', error);
      return getEmailTemplate(type, params); // Fallback to hardcoded template
    }

    // 변수 치환 ({{variable}} 형식)
    let subject = template.subject;
    let htmlContent = template.html_content;

    Object.entries(params).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, value || '');
      htmlContent = htmlContent.replace(regex, value || '');
    });

    // 관리 화면에서 저장한 템플릿이 완전한 HTML 문서라면 그대로 사용
    if (/<html[\s>]/i.test(htmlContent) || /<!doctype/i.test(htmlContent)) {
      return { subject, html: htmlContent };
    }

    // 푸터 추가 (로고, 카카오톡 문의, 수신거부)
    const unsubscribeUrl = `https://daonview.com/unsubscribe?email=${encodeURIComponent(params.email || '')}`;
    const kakaoInquiryUrl = 'https://pf.kakao.com/_xbxhDgn/chat';

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body>
          <div style="font-family: 'Pretendard', sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 40px 20px; border: 1px solid #f1f5f9; border-radius: 20px;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 30px;">
              <img src="https://daonview.com/daonview_logo.png" alt="다온뷰" style="height: 40px;">
              <span style="font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">다온뷰</span>
            </div>
            ${htmlContent}
            <div style="margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 12px; color: #94a3b8; text-align: center;">
              <p style="margin-bottom: 12px;">
                <a href="${kakaoInquiryUrl}" style="display: inline-block; padding: 10px 20px; background-color: #FEE500; color: #000000; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 13px;">
                  💬 카카오톡 문의하기
                </a>
              </p>
              <p style="font-size: 11px; color: #cbd5e1; margin-top: 8px;">궁금한 점이 있으시면 언제든지 카카오톡으로 문의해 주세요!</p>
              <p style="margin-top: 20px;">© 2026 다온뷰(Daonview). All rights reserved.</p>
              <p>본 메일은 발신전용으로 회신이 되지 않습니다.</p>
              <p style="margin-top: 10px;">
                더 이상 소식을 받고 싶지 않으시다면 
                <a href="${unsubscribeUrl}" style="color: #94a3b8; text-decoration: underline;">수신거부</a>를 클릭해 주세요.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    return { subject, html: fullHtml };
  } catch (error) {
    console.error('Error loading template from DB:', error);
    return getEmailTemplate(type, params); // Fallback
  }
};

/**
 * 이메일 타입별 동적 템플릿 생성 (Fallback용)
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

  const heroStyle = `
    background: linear-gradient(135deg, #fff1f5 0%, #ffe4ee 100%);
    border: 1px solid #fecdd3;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
    text-align: center;
  `;

  const headerStyle = `
    font-size: 30px;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 10px;
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

  const infoGridStyle = `
    margin: 20px 0;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    overflow: hidden;
  `;

  const infoRowStyle = `
    padding: 12px 14px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 14px;
  `;

  const infoLabelStyle = `
    color: #64748b;
    font-weight: 700;
    display: inline-block;
    min-width: 90px;
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
        <div style="${heroStyle}">
          <div style="${headerStyle}">다온뷰의 가족이 되신 것을 환영합니다!</div>
          <div style="font-size: 14px; color: #475569;">첫 캠페인 신청까지 1분이면 충분합니다.</div>
        </div>
        <p>안녕하세요, <b>${params.nickname}</b>님!</p>
        <p>성공적인 인플루언서 활동의 시작, 다온뷰와 함께하게 되어 진심으로 기쁩니다.</p>
        <p>지금 바로 다온뷰의 다양한 캠페인을 확인하고 신청해 보세요.</p>
        <div style="text-align: center;">
          <a href="https://daonview.com/campaigns" style="${buttonStyle}">캠페인 보러가기</a>
        </div>
      `;
      break;

    case 'CAMPAIGN_SELECTED': {
      subject = `🎉 [다온뷰] 축하합니다! '${params.campaignTitle}' 캠페인에 선정되셨습니다.`;
      const providedItems = params.providedItems || '캠페인 상세 페이지에서 제공내역을 확인해 주세요.';
      const deadlineDate = params.deadlineDate || '캠페인 상세 페이지에서 마감일을 확인해 주세요.';
      const assignedOptionLabel = params.assignedOptionLabel || '';
      const assignedPurchaseLink = params.assignedPurchaseLink || '';
      const optionRow = assignedOptionLabel
        ? `
          <div style="${infoRowStyle}">
            <span style="${infoLabelStyle}">확정 옵션</span>
            <span>${assignedOptionLabel}</span>
          </div>
        `
        : '';
      const purchaseLinkRow = assignedPurchaseLink
        ? `
          <div style="${infoRowStyle}">
            <span style="${infoLabelStyle}">개별 구매링크</span>
            <a href="${assignedPurchaseLink}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:underline;word-break:break-all;">
              ${assignedPurchaseLink}
            </a>
          </div>
        `
        : '';
      content = `
        <div style="${heroStyle}">
          <div style="${headerStyle}">캠페인 선정 축하드립니다!</div>
          <div style="font-size: 14px; color: #475569;">아래 핵심 정보 확인 후 리뷰를 준비해 주세요.</div>
        </div>
        <p>안녕하세요, ${params.nickname}님.</p>
        <p>신청하신 <b>[${params.campaignTitle}]</b> 캠페인에 최종 선정되셨습니다.</p>
        <div style="${infoGridStyle}">
          <div style="${infoRowStyle}">
            <span style="${infoLabelStyle}">체험 타이틀</span>
            <span>${params.campaignTitle}</span>
          </div>
          <div style="${infoRowStyle}">
            <span style="${infoLabelStyle}">제공내역</span>
            <span>${providedItems}</span>
          </div>
          ${optionRow}
          ${purchaseLinkRow}
          <div style="padding: 12px 14px; font-size: 14px; background: #fff7ed;">
            <span style="${infoLabelStyle}">체험 마감기한</span>
            <span style="font-weight: 700; color: #b45309;">${deadlineDate}</span>
          </div>
        </div>
        <p>협찬 가이드라인을 꼼꼼히 확인하신 후 멋진 리뷰 부탁드립니다.</p>
        <div style="text-align: center;">
          <a href="https://daonview.com/dashboard/influencer/campaigns" style="${buttonStyle}">가이드 확인 및 리뷰 등록</a>
        </div>
      `;
      break;
    }

    case 'PRODUCT_SHIPPED':
      subject = `📦 [다온뷰] 신청하신 캠페인의 제품 배송이 시작되었습니다.`;
      content = `
        <div style="${heroStyle}">
          <div style="${headerStyle}">기다리시던 제품이 발송되었습니다!</div>
          <div style="font-size: 14px; color: #475569;">배송 정보를 확인해 주세요.</div>
        </div>
        <p>안녕하세요, ${params.nickname}님.</p>
        <p><b>[${params.campaignTitle}]</b> 캠페인의 제품이 안전하게 발송되었습니다.</p>
        <div style="${infoGridStyle}">
          <div style="${infoRowStyle}">
            <span style="${infoLabelStyle}">캠페인</span>
            <span>${params.campaignTitle}</span>
          </div>
          <div style="${infoRowStyle}">
            <span style="${infoLabelStyle}">택배사</span>
            <span>${params.trackingCompany}</span>
          </div>
          <div style="padding: 12px 14px; font-size: 14px; background: #f8fafc;">
            <span style="${infoLabelStyle}">운송장번호</span>
            <span style="font-weight: 700;">${params.trackingNumber}</span>
          </div>
        </div>
        <p>제품 수령 후 3일 이내에 리뷰 작성을 부탁드립니다.</p>
      `;
      break;

    case 'DEADLINE_WARNING':
      subject = `⏰ [다온뷰] 마감 임박! 리뷰 제출 기한이 얼마 남지 않았습니다.`;
      content = `
        <div style="${heroStyle}">
          <div style="${headerStyle}">리뷰 마감 기한을 확인해 주세요!</div>
          <div style="font-size: 14px; color: #475569;">마감 임박 캠페인 안내입니다.</div>
        </div>
        <p>안녕하세요, ${params.nickname}님.</p>
        <p>진행 중인 <b>[${params.campaignTitle}]</b> 캠페인의 리뷰 마감일이 다가오고 있습니다.</p>
        <div style="${infoGridStyle}">
          <div style="${infoRowStyle}">
            <span style="${infoLabelStyle}">캠페인</span>
            <span>${params.campaignTitle}</span>
          </div>
          <div style="padding: 12px 14px; font-size: 14px; background: #fef2f2;">
            <span style="${infoLabelStyle}">리뷰 마감일</span>
            <span style="font-weight: 700; color: #dc2626;">${params.deadlineDate}</span>
          </div>
        </div>
        <p>기한 내 리뷰가 등록되지 않을 경우 패널티가 발생할 수 있으니 유의 부탁드립니다.</p>
        <div style="text-align: center;">
          <a href="https://daonview.com/dashboard/influencer/campaigns" style="${buttonStyle}">리뷰 등록하러 가기</a>
        </div>
      `;
      break;
  }

  const unsubscribeUrl = `https://daonview.com/unsubscribe?email=${encodeURIComponent(params.email || '')}`;
  const kakaoInquiryUrl = 'https://pf.kakao.com/_xbxhDgn/chat';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body>
        <div style="${baseStyle}">
          <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 30px;">
            <img src="https://daonview.com/daonview_logo.png" alt="다온뷰" style="height: 40px;">
            <span style="font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">다온뷰</span>
          </div>
          ${content}
          <div style="margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 12px; color: #94a3b8; text-align: center;">
            <p style="margin-bottom: 12px;">
              <a href="${kakaoInquiryUrl}" style="display: inline-block; padding: 10px 20px; background-color: #FEE500; color: #000000; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 13px;">
                💬 카카오톡 문의하기
              </a>
            </p>
            <p style="font-size: 11px; color: #cbd5e1; margin-top: 8px;">궁금한 점이 있으시면 언제든지 카카오톡으로 문의해 주세요!</p>
            <p style="margin-top: 20px;">© 2026 다온뷰(Daonview). All rights reserved.</p>
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

export const sendAdminPartnerInquiryEmail = async (params: AdminPartnerInquiryEmailParams) => {
  const subject = `[다온뷰] 신규 제휴 문의가 접수되었습니다 - ${params.companyName}`;
  const forceSend = ['TRUE', '1', 'YES', 'ON'].includes(
    String(process.env.EMAIL_FORCE_SEND || '').toUpperCase()
  );
  const requestedChannels = params.requestedChannels.length > 0
    ? params.requestedChannels.map((channel) => PARTNER_CHANNEL_LABELS[channel] || channel).join(', ')
    : '전체 추천';
  const infoRows = [
    ['회사명', params.companyName],
    ['담당자명', params.managerName],
    ['연락처', params.phone],
    ['이메일', params.email || '미입력'],
    ['희망 채널', requestedChannels],
    ['제품소개서', params.productFileName],
  ];
  const rowsHtml = infoRows
    .map(([label, value]) => `
      <tr>
        <th style="width: 120px; padding: 12px 14px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px; text-align: left;">${escapeHtml(label)}</th>
        <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 14px; font-weight: 700;">${escapeHtml(value)}</td>
      </tr>
    `)
    .join('');
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="margin:0; padding:0; background:#f8fafc;">
        <div style="font-family: Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 640px; margin: 0 auto; padding: 32px 20px; color: #334155;">
          <div style="border-radius: 24px; background: #ffffff; border: 1px solid #e2e8f0; overflow: hidden;">
            <div style="padding: 28px; background: linear-gradient(135deg, #fff1f5 0%, #eef2ff 100%);">
              <div style="font-size: 13px; font-weight: 900; color: #e11d48; letter-spacing: 0.18em;">PARTNER INQUIRY</div>
              <h1 style="margin: 10px 0 0; font-size: 24px; line-height: 1.35; color: #0f172a;">신규 제휴 문의가 접수되었습니다.</h1>
              <p style="margin: 10px 0 0; font-size: 14px; color: #475569;">관리자 페이지에서 제품소개서를 확인하고 후속 상담을 진행해주세요.</p>
            </div>
            <div style="padding: 28px;">
              <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
                <tbody>${rowsHtml}</tbody>
              </table>
              <div style="margin-top: 22px;">
                <div style="margin-bottom: 8px; color: #64748b; font-size: 13px; font-weight: 900;">제품 설명</div>
                <div style="white-space: pre-wrap; border: 1px solid #e2e8f0; border-radius: 16px; background: #f8fafc; padding: 16px; color: #0f172a; font-size: 14px; line-height: 1.7;">${escapeHtml(params.message)}</div>
              </div>
              <div style="text-align: center; margin-top: 28px;">
                <a href="${ADMIN_PARTNER_INQUIRY_URL}" style="display: inline-block; padding: 14px 24px; border-radius: 14px; background: #f43f5e; color: #ffffff; text-decoration: none; font-weight: 900; font-size: 14px;">관리자 페이지에서 확인하기</a>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  if ((process.env.NODE_ENV === 'development' && !forceSend) || !process.env.AWS_ACCESS_KEY_ID) {
    console.log('[ADMIN EMAIL MOCK] Sending partner inquiry email:', {
      to: ADMIN_PARTNER_INQUIRY_EMAIL,
      subject,
    });
    return { success: true, messageId: `mock-${Date.now()}` };
  }

  const client = getSESClient();
  const command = new SendEmailCommand({
    Source: `"다온뷰" <${process.env.EMAIL_FROM || 'master@daonview.com'}>`,
    Destination: {
      ToAddresses: [ADMIN_PARTNER_INQUIRY_EMAIL],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: html,
          Charset: 'UTF-8',
        },
      },
    },
  });

  const response = await client.send(command);
  console.log(`Admin partner inquiry email sent: ${response.MessageId}`);
  return { success: true, messageId: response.MessageId };
};

/**
 * AWS SES를 사용한 이메일 전송 함수
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
    }

    // 상태값 대문자 변환 후 비교 (데이터 무결성 규칙 준수)
    const status = profile?.email_subscription_status ? String(profile.email_subscription_status).toUpperCase() : '';

    if (status === 'UNSUBSCRIBED' || 
        status === 'BOUNCED' || 
        status === 'COMPLAINED') {
      console.log(`[EMAIL SKIPPED] User ${to} has status: ${status}.`);
      return { success: false, message: `User status is ${status}` };
    }

    // 2. DB에서 템플릿 로드 (params에 email 추가)
    const { subject, html } = await getEmailTemplateFromDB(type, { ...params, email: to });

    // 3. 개발 환경 체크
    // 개발 환경에서도 EMAIL_FORCE_SEND=true(또는 1/yes/on) 설정 시 실제 발송 허용
    const forceSend = ['TRUE', '1', 'YES', 'ON'].includes(
      String(process.env.EMAIL_FORCE_SEND || '').toUpperCase()
    );

    if ((process.env.NODE_ENV === 'development' && !forceSend) || !process.env.AWS_ACCESS_KEY_ID) {
      console.log('[EMAIL MOCK] Sending email:', { to, subject });
      return { success: true, messageId: `mock-${Date.now()}` };
    }

    // 4. AWS SES로 이메일 전송
    const client = getSESClient();
    const command = new SendEmailCommand({
      Source: `"다온뷰" <${process.env.EMAIL_FROM || 'master@daonview.com'}>`,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: html,
            Charset: 'UTF-8',
          },
        },
      },
    });

    const response = await client.send(command);

    console.log(`Email sent: ${response.MessageId}`);
    return { success: true, messageId: response.MessageId };
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};
