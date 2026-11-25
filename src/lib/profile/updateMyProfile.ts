import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import type { Profile } from '@/types/database';

// 본인 프로필 수정 공용 함수 (브라우저 전용)
// - 화면이 들고 있는 사용자 ID가 아니라, 지금 실제로 로그인한 세션 사용자에게만 저장한다.
// - RLS 등으로 0건이 수정되면 성공으로 보지 않고 실패로 처리한다.

export type MyProfileUpdate = Partial<Omit<Profile, 'id' | 'role' | 'email' | 'created_at' | 'point' | 'email_verified' | 'is_test_account'>>;

export class ProfileUpdateError extends Error {
    constructor(message: string, readonly code: 'NOT_AUTHENTICATED' | 'NOT_SAVED' | 'SESSION_MISMATCH' | 'DB_ERROR') {
        super(message);
        this.name = 'ProfileUpdateError';
    }
}

interface UpdateMyProfileOptions {
    /** 화면이 알고 있는 사용자 ID. 세션 사용자와 다르면 저장하지 않는다. */
    expectedUserId?: string | null;
}

export async function updateMyProfile(fields: MyProfileUpdate, options: UpdateMyProfileOptions = {}) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new ProfileUpdateError('로그인이 만료되었습니다. 다시 로그인해 주세요.', 'NOT_AUTHENTICATED');
    }

    if (options.expectedUserId && options.expectedUserId !== user.id) {
        throw new ProfileUpdateError('로그인 정보가 바뀌었습니다. 새로고침 후 다시 시도해 주세요.', 'SESSION_MISMATCH');
    }

    const { data, error } = await supabase
        .from('profiles')
        .update(fields)
        .eq('id', user.id)
        .select('id');

    if (error) {
        throw new ProfileUpdateError(error.message || '저장 중 오류가 발생했습니다.', 'DB_ERROR');
    }
    if (!data || data.length === 0) {
        throw new ProfileUpdateError('저장되지 않았습니다. 새로고침 후 다시 시도해 주세요.', 'NOT_SAVED');
    }

    // 화면의 프로필 정보도 DB 기준으로 다시 맞춘다
    void useAuthStore.getState().fetchProfile(user.id);

    return { userId: user.id };
}

export function getProfileUpdateErrorMessage(error: unknown, fallback = '저장 중 오류가 발생했습니다.') {
    if (error instanceof ProfileUpdateError) return error.message;
    return fallback;
}
