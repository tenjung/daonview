'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { usePathname } from 'next/navigation';
import OnboardingModal from '@/components/OnboardingModal';
import SnsInputModal from '@/components/influencer/SnsInputModal';

function hasRegisteredSns(profile: any) {
    return Boolean(
        profile?.blog_url ||
        profile?.sns_url ||
        profile?.instagram_url ||
        profile?.youtube_url ||
        profile?.tiktok_url
    );
}

/**
 * 인플루언서 사용자가 관심사를 설정하지 않았을 경우
 * 온보딩 모달을 자동으로 표시하는 컴포넌트
 */
export default function OnboardingChecker() {
    const { user, profile, isLoading } = useAuthStore();
    const pathname = usePathname();
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showSnsModal, setShowSnsModal] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);

    useEffect(() => {
        // 로딩 중이거나 이미 확인했으면 스킵
        if (isLoading || hasChecked) return;

        // 로그인하지 않았거나 인플루언서가 아니면 스킵
        if (!user || !profile || profile.role !== 'INFLUENCER') {
            setHasChecked(true);
            return;
        }

        // 특정 페이지에서는 모달 표시 안함
        const excludedPaths = ['/login', '/signup', '/auth/callback'];
        if (excludedPaths.some(path => pathname.startsWith(path))) {
            setHasChecked(true);
            return;
        }

        // 🟢 이번 세션에서 건너뛰었으면 표시 안함
        if (typeof window !== 'undefined' && sessionStorage.getItem('onboarding_skipped') === 'true') {
            setHasChecked(true);
            return;
        }

        if (!hasRegisteredSns(profile)) {
            setShowSnsModal(true);
            setHasChecked(true);
            return;
        }

        // 관심사 설정 여부 확인 (onboarding_completed 체크 제거)
        const hasInterests = profile.interests && profile.interests.length > 0;
        const hasPlatforms = profile.preferred_platforms && profile.preferred_platforms.length > 0;
        const hasRegions = profile.preferred_regions && profile.preferred_regions.length > 0;

        // 🟢 관심사 미설정 시에만 모달 표시 (onboarding_completed 무시)
        if (!hasInterests || !hasPlatforms || !hasRegions) {
            setShowOnboarding(true);
        }

        setHasChecked(true);
    }, [user, profile, isLoading, pathname, hasChecked]);

    // 모달이 닫히면 다시 표시하지 않음
    const handleComplete = () => {
        setShowOnboarding(false);
        setHasChecked(true);
        // 프로필 다시 로드
        if (user?.id) {
            useAuthStore.getState().fetchProfile(user.id);
        }
    };

    if (!user) return null;

    return (
        <>
            {showSnsModal && (
                <SnsInputModal
                    isOpen={showSnsModal}
                    onClose={() => {
                        setShowSnsModal(false);
                        setHasChecked(true);
                    }}
                    user={user}
                    profile={profile}
                    onSuccess={async () => {
                        setShowSnsModal(false);
                        setHasChecked(true);
                        await useAuthStore.getState().fetchProfile(user.id);
                        setHasChecked(false);
                    }}
                />
            )}
            {showOnboarding && (
                <OnboardingModal 
                    userId={user.id} 
                    onComplete={handleComplete} 
                    allowSkip={true}  // 로그인 후에는 건너뛰기 허용
                />
            )}
        </>
    );
}
