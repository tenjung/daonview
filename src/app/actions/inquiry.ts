'use server';

import { createClient } from '@/lib/supabase/server';

export async function submitPartnerInquiry(data: {
  companyName: string;
  managerName: string;
  phone: string;
  email?: string;
  message?: string;
}) {
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
