import { createClient } from '@supabase/supabase-js';

let publicServerClient: ReturnType<typeof createClient> | null = null;

export function getPublicServerClient() {
  if (!publicServerClient) {
    publicServerClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return publicServerClient;
}
