'use client';

import React from 'react';

interface FloatingActionWrapperProps {
    children: React.ReactNode;
}

/**
 * FloatingActionWrapper (Fixed Content-Aligned Edition)
 * 
 * [가장 견고한 정렬 방법]
 * 복잡한 JS 추적을 버리고, 본문과 동일한 'max-w-4xl mx-auto px-6' 컨테이너를 내부에서 사용하여
 * 어떤 환경에서도 본문의 우측 끝과 버튼의 우측 끝을 물리적으로 일치시킵니다.
 */
const FloatingActionWrapper: React.FC<FloatingActionWrapperProps> = ({ children }) => {
    return (
        /* 
           [최종 정착] Sticky 방식 채택
           부모 컨테이너(max-w-4xl) 내부에서 가장 우직하게 작동하는 방식입니다.
           하단에 고정되어 따라다니다가, 본문 끝에 도달하면 자연스럽게 멈춥니다.
        */
        <div className="sticky bottom-8 z-[100] mt-10 w-full flex justify-end pointer-events-none">
            <div className="pointer-events-auto">
                {children}
            </div>
        </div>
    );
};

export default FloatingActionWrapper;
