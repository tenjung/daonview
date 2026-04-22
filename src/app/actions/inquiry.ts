'use server';

import { randomUUID } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendAdminPartnerInquiryEmail } from '@/lib/email';

type LegacyPartnerInquiry = {
  companyName: string;
  managerName: string;
  phone: string;
  email?: string;
  message?: string;
};

type PartnerInquiryResult =
  | { success: true }
  | { success: false; error: string };

type PartnerInquiryFileUrlResult =
  | { success: true; signedUrl: string }
  | { success: false; error: string };

const PARTNER_INQUIRY_BUCKET = 'partner-inquiry-files';
const MAX_PRODUCT_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_CHANNELS = new Set([
  'OFFLINE',
  'CLOSED_MALL',
  'GROUP_BUY',
  'GLOBAL',
  'RECOMMEND_ALL',
]);
const ALLOWED_FILE_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
]);
const ALLOWED_FILE_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png']);

const getFormString = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
};

const normalizeChannels = (formData: FormData) => {
  const channels = formData
    .getAll('requestedChannels')
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim().toUpperCase())
    .filter((value) => ALLOWED_CHANNELS.has(value));

  return channels.length > 0 ? Array.from(new Set(channels)) : ['RECOMMEND_ALL'];
};

const getFileExtension = (fileName: string) => fileName.split('.').pop()?.toLowerCase() || '';

const sanitizeFileName = (fileName: string) =>
  fileName
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120) || 'product-file';

async function submitLegacyPartnerInquiry(data: LegacyPartnerInquiry): Promise<PartnerInquiryResult> {
  const supabase = await createClient();
  
  const { error } = await supabase.from('partner_inquiries').insert({
    company_name: data.companyName,
    manager_name: data.managerName,
    phone: data.phone,
    email: data.email || null,
    message: data.message || null,
    status: 'PENDING'
  });

  if (error) {
    console.error('Failed to submit partner inquiry:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

async function submitPartnerInquiryForm(formData: FormData): Promise<PartnerInquiryResult> {
  const companyName = getFormString(formData, 'companyName');
  const managerName = getFormString(formData, 'managerName');
  const phone = getFormString(formData, 'phone');
  const email = getFormString(formData, 'email');
  const message = getFormString(formData, 'message');
  const inquirySource = getFormString(formData, 'inquirySource').toUpperCase() || 'PARTNER_ROOT';
  const requestedChannels = normalizeChannels(formData);
  const productFile = formData.get('productFile');

  if (!companyName || !managerName || !phone || !message) {
    return { success: false, error: '회사명, 담당자명, 연락처, 제품 설명을 입력해주세요.' };
  }

  if (!(productFile instanceof File) || productFile.size === 0) {
    return { success: false, error: '제품소개서를 업로드해주세요.' };
  }

  if (productFile.size > MAX_PRODUCT_FILE_SIZE) {
    return { success: false, error: '제품소개서는 10MB 이하 파일만 업로드할 수 있습니다.' };
  }

  const extension = getFileExtension(productFile.name);
  const isAllowedMime = ALLOWED_FILE_MIME_TYPES.has(productFile.type);
  const isAllowedExtension = ALLOWED_FILE_EXTENSIONS.has(extension);

  if (!isAllowedMime && !isAllowedExtension) {
    return { success: false, error: 'PDF, DOC, DOCX, PPT, PPTX, JPG, PNG 파일만 업로드할 수 있습니다.' };
  }

  const adminSupabase = createAdminClient();
  const safeFileName = sanitizeFileName(productFile.name);
  const filePath = `partner-inquiries/${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${safeFileName}`;
  const fileBuffer = Buffer.from(await productFile.arrayBuffer());

  const { error: uploadError } = await adminSupabase.storage
    .from(PARTNER_INQUIRY_BUCKET)
    .upload(filePath, fileBuffer, {
      contentType: productFile.type || 'application/octet-stream',
      upsert: false,
    });

  if (uploadError) {
    console.error('Failed to upload partner inquiry file:', uploadError);
    return { success: false, error: '제품소개서 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.' };
  }

  const { error: insertError } = await adminSupabase.from('partner_inquiries').insert({
    company_name: companyName,
    manager_name: managerName,
    phone,
    email: email || null,
    message,
    status: 'PENDING',
    requested_channels: requestedChannels,
    product_file_path: filePath,
    product_file_name: productFile.name,
    product_file_mime: productFile.type || null,
    product_file_size: productFile.size,
    inquiry_source: inquirySource || 'PARTNER_ROOT',
  });

  if (insertError) {
    await adminSupabase.storage.from(PARTNER_INQUIRY_BUCKET).remove([filePath]);
    console.error('Failed to submit partner inquiry form:', insertError);
    return { success: false, error: insertError.message };
  }

  try {
    await sendAdminPartnerInquiryEmail({
      companyName,
      managerName,
      phone,
      email: email || null,
      message,
      requestedChannels,
      productFileName: productFile.name,
    });
  } catch (emailError) {
    console.error('Failed to send admin partner inquiry email:', emailError);
  }

  return { success: true };
}

export async function submitPartnerInquiry(data: LegacyPartnerInquiry | FormData): Promise<PartnerInquiryResult> {
  if (data instanceof FormData) {
    return submitPartnerInquiryForm(data);
  }

  return submitLegacyPartnerInquiry(data);
}

export async function getPartnerInquiryFileUrl(filePath: string): Promise<PartnerInquiryFileUrlResult> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'ADMIN') {
    return { success: false, error: '관리자만 제품소개서를 다운로드할 수 있습니다.' };
  }

  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase.storage
    .from(PARTNER_INQUIRY_BUCKET)
    .createSignedUrl(filePath, 60 * 5);

  if (error || !data?.signedUrl) {
    console.error('Failed to create partner inquiry signed URL:', error);
    return { success: false, error: '다운로드 링크 생성에 실패했습니다.' };
  }

  return { success: true, signedUrl: data.signedUrl };
}
