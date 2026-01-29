/**
 * 솔라피 카카오 알림톡 타입 정의
 */

export interface AlimtalkRequest {
    to: string;                           // 수신자 전화번호 (010-1234-5678 또는 01012345678)
    templateCode: string;                 // 템플릿 코드
    variables: Record<string, string>;    // 템플릿 변수
    buttons?: AlimtalkButton[];           // 버튼 (선택)
}

export interface AlimtalkButton {
    name: string;                         // 버튼명
    type: 'WL' | 'AL';                   // WL: 웹링크, AL: 앱링크
    url_mobile: string;                   // 모바일 URL
    url_pc?: string;                      // PC URL (선택)
}

export interface AlimtalkResponse {
    success: boolean;
    messageId?: string;                   // 솔라피 메시지 ID
    error?: string;                       // 에러 메시지
    statusCode?: number;                  // HTTP 상태 코드
}

/**
 * 솔라피 API 요청 형식
 */
export interface SolapiMessageRequest {
    message: {
        to: string;
        from: string;
        kakaoOptions: {
            pfId: string;                     // 카카오 채널 ID
            templateId: string;               // 템플릿 코드
            variables?: Record<string, string>;
            buttons?: Array<{
                buttonName: string;
                buttonType: 'WL' | 'AL';
                linkMo: string;
                linkPc?: string;
            }>;
        };
    };
}

/**
 * 솔라피 API 응답 형식
 */
export interface SolapiMessageResponse {
    statusCode: string;
    statusMessage: string;
    messageId?: string;
    groupId?: string;
    to?: string;
    from?: string;
    type?: string;
    accountId?: string;
}
