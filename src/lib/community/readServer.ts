import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

// Request-only sharing between metadata and page. View-count writes stay in the page.
export const getCommunityPost = cache(async (id: string) => {
  const supabase = await createClient();
  return supabase.from('posts').select('*, profiles:user_id(nickname,name)').eq('id', id).single();
});

export const getCommunityNotice = cache(async (id: string, eventOnly = false) => {
  const supabase = await createClient();
  let query = supabase.from('notices').select('*, profiles(nickname)').eq('id', id);
  if (eventOnly) query = query.eq('type', '이벤트');
  return query.single();
});
