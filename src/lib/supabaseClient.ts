import { createClient as createBrowser } from './supabase/client'

// Browser client (singleton) - 클라이언트 컴포넌트 전용
export const supabase = createBrowser()

// NOTE: 서버 클라이언트는 여기서 가져오지 말고 @/lib/supabase/server를 직접 사용하세요.
