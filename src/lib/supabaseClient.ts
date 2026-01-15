import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Client-side Supabase (Next.js App Router 최적화)
export const supabase = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
        auth: {
            flowType: 'pkce',
        }
    }
)

// Server-side 전용 (일반 관리용이 필요한 경우 사용)
export function createServerClient() {
    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        }
    })
}
