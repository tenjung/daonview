import CompanyInfo from '@/components/CompanyInfo';

export default function TermsContent() {
    return (
        <div className="prose max-w-none text-sm md:text-base">
            {/* 제1장 총칙 */}
            <section className="mb-12">
                <h2 className="text-xl font-bold text-text-main mb-6 pb-3 border-b-2 border-primary">제1장 총칙</h2>
                
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-text-main mb-3">제1조 (목적)</h3>
                    <p className="text-text-secondary leading-relaxed mb-4">
                        본 약관은 다온컴퍼니(이하 "회사")가 운영하는 DAONVIEW(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
                    </p>
                </div>

                <div className="mb-8">
                    <h3 className="text-lg font-bold text-text-main mb-3">제2조 (정의)</h3>
                    <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
                        <li><strong>"서비스"</strong>란 회사가 제공하는 체험단 매칭 플랫폼 및 관련 제반 서비스를 의미합니다.</li>
                        <li><strong>"회원"</strong>이란 본 약관에 동의하고 회사와 서비스 이용계약을 체결한 자를 말합니다.</li>
                        <li><strong>"인플루언서"</strong>란 캠페인에 참여하여 리뷰 및 콘텐츠를 작성하는 회원을 말합니다.</li>
                        <li><strong>"광고주"</strong>란 캠페인을 등록하고 인플루언서를 모집하는 회원을 말합니다.</li>
                        <li><strong>"캠페인"</strong>이란 광고주가 등록한 체험단 모집 건을 의미합니다.</li>
                        <li><strong>"원고료"</strong>란 인플루언서가 콘텐츠 제작에 대한 대가로 받는 정산금(용역비)을 의미합니다.</li>
                    </ul>
                </div>

                <div className="mb-8">
                    <h3 className="text-lg font-bold text-text-main mb-3">제2조의2 (플랫폼의 역할)</h3>
                    <p className="text-text-secondary leading-relaxed mb-4">
                        ① 다온뷰는 광고주와 인플루언서를 연결하여 <strong>광고 콘텐츠의 품질을 확인하고 중개</strong>하는 전문 플랫폼입니다.
                    </p>
                    <p className="text-text-secondary leading-relaxed mb-4">
                        ② 광고주는 <strong>캠페인 대행 수수료 및 인플루언서 원고료</strong>를 예치하며, 예치금은 캠페인 완료 시까지 회사가 안전하게 보관합니다.
                    </p>
                    <p className="text-text-secondary leading-relaxed mb-4">
                        ③ 인플루언서는 <strong>콘텐츠 제작에 대한 정산금(용역비)</strong>를 받습니다. 정산금은 <strong>캠페인 완료 보고서 승인 후</strong> 지급됩니다.
                    </p>
                    <p className="text-text-secondary leading-relaxed mb-4">
                        ④ 회사는 콘텐츠 품질을 검증하여 광고주와 인플루언서 모두를 보호하며, 다음과 같은 정산 프로세스를 따릅니다:
                    </p>
                    <ul className="list-decimal list-inside space-y-2 text-text-secondary ml-4">
                        <li>인플루언서의 콘텐츠 제작 완료</li>
                        <li>회사의 품질 확인 및 광고주 승인</li>
                        <li>캠페인 완료 보고서 생성</li>
                        <li>인플루언서의 정산 신청</li>
                        <li>사업소득세(3.3%) 공제 후 지급</li>
                    </ul>
                </div>

                <div className="mb-8">
                    <h3 className="text-lg font-bold text-text-main mb-3">제3조 (약관의 효력 및 변경)</h3>
                    <p className="text-text-secondary leading-relaxed mb-4">
                        ① 본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.
                    </p>
                    <p className="text-text-secondary leading-relaxed mb-4">
                        ② 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있으며, 변경된 약관은 제1항과 같은 방법으로 공지 또는 통지함으로써 효력이 발생합니다.
                    </p>
                </div>
            </section>

            {/* 제2장 서비스 이용계약 */}
            <section className="mb-12">
                <h2 className="text-xl font-bold text-text-main mb-6 pb-3 border-b-2 border-primary">제2장 서비스 이용계약</h2>
                
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-text-main mb-3">제4조 (이용계약의 성립)</h3>
                    <p className="text-text-secondary leading-relaxed mb-4">
                        ① 이용계약은 회원이 되고자 하는 자(이하 "가입신청자")가 본 약관의 내용에 대하여 동의를 한 다음 회원가입신청을 하고 회사가 이러한 신청에 대하여 승낙함으로써 체결됩니다.
                    </p>
                    <p className="text-text-secondary leading-relaxed mb-4">
                        ② 회사는 가입신청자의 신청에 대하여 서비스 이용을 승낙함을 원칙으로 합니다. 다만, 다음 각 호에 해당하는 신청에 대하여는 승낙을 하지 않거나 사후에 이용계약을 해지할 수 있습니다.
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
                        <li>가입신청자가 본 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우</li>
                        <li>실명이 아니거나 타인의 명의를 이용한 경우</li>
                        <li>허위의 정보를 기재하거나, 회사가 제시하는 내용을 기재하지 않은 경우</li>
                        <li>기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</li>
                    </ul>
                </div>

                <div className="mb-8">
                    <h3 className="text-lg font-bold text-text-main mb-3">제5조 (회원정보의 변경)</h3>
                    <p className="text-text-secondary leading-relaxed mb-4">
                        회원은 개인정보관리화면을 통하여 언제든지 본인의 개인정보를 열람하고 수정할 수 있습니다. 회원은 회원가입신청 시 기재한 사항이 변경되었을 경우 온라인으로 수정을 하거나 전자우편 기타 방법으로 회사에 대하여 그 변경사항을 알려야 합니다.
                    </p>
                </div>
            </section>

            {/* 제3장 서비스 이용 */}
            <section className="mb-12">
                <h2 className="text-xl font-bold text-text-main mb-6 pb-3 border-b-2 border-primary">제3장 서비스 이용</h2>
                
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-text-main mb-3">제6조 (서비스의 제공)</h3>
                    <p className="text-text-secondary leading-relaxed mb-4">
                        회사는 다음과 같은 서비스를 제공합니다:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
                        <li>체험단 캠페인 매칭 서비스</li>
                        <li>리뷰 작성 및 관리 서비스</li>
                        <li>커뮤니티 서비스</li>
                        <li>AI 기반 콘텐츠 작성 지원 서비스</li>
                        <li>서비스 이용과 관련된 이메일 및 알림톡 발송 서비스</li>
                        <li>기타 회사가 추가 개발하거나 제휴계약 등을 통해 회원에게 제공하는 일체의 서비스</li>
                    </ul>
                </div>

                <div className="mb-8">
                    <h3 className="text-lg font-bold text-text-main mb-3">제7조 (서비스의 중단)</h3>
                    <p className="text-text-secondary leading-relaxed mb-4">
                        ① 회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.
                    </p>
                    <p className="text-text-secondary leading-relaxed mb-4">
                        ② 회사는 제1항의 사유로 서비스의 제공이 일시적으로 중단됨으로 인하여 회원 또는 제3자가 입은 손해에 대하여 배상합니다. 단, 회사에 고의 또는 과실이 없음을 입증하는 경우에는 그러하지 아니합니다.
                    </p>
                </div>

                <div className="mb-8">
                    <h3 className="text-lg font-bold text-text-main mb-3">제8조 (회원의 의무)</h3>
                    <p className="text-text-secondary leading-relaxed mb-4">
                        회원은 다음 행위를 하여서는 안 됩니다:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
                        <li>신청 또는 변경 시 허위 내용의 등록</li>
                        <li>타인의 정보 도용</li>
                        <li>회사가 게시한 정보의 변경</li>
                        <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
                        <li>회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                        <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                        <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
                    </ul>
                </div>
            </section>

            {/* 제4장 계약해지 및 이용제한 */}
            <section className="mb-12">
                <h2 className="text-xl font-bold text-text-main mb-6 pb-3 border-b-2 border-primary">제4장 계약해지 및 이용제한</h2>
                
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-text-main mb-3">제9조 (계약해지 및 이용제한)</h3>
                    <p className="text-text-secondary leading-relaxed mb-4">
                        ① 회원은 언제든지 서비스 이용을 원하지 않는 경우 회원 탈퇴를 통해 이용계약을 해지할 수 있습니다.
                    </p>
                    <p className="text-text-secondary leading-relaxed mb-4">
                        ② 회사는 회원이 본 약관의 의무를 위반하거나 서비스의 정상적인 운영을 방해한 경우, 경고, 일시정지, 영구이용정지 등으로 서비스 이용을 단계적으로 제한할 수 있습니다.
                    </p>
                </div>
            </section>

            {/* 부칙 */}
            <section className="mb-8">
                <h2 className="text-xl font-bold text-text-main mb-6 pb-3 border-b-2 border-primary">부칙</h2>
                <p className="text-text-secondary leading-relaxed">
                    본 약관은 2026년 1월 5일부터 시행됩니다.
                </p>
            </section>

            {/* 문의 안내 */}
            <div className="mt-8 p-5 bg-rose-50 rounded-2xl border border-rose-100">
                <h3 className="text-base font-bold text-text-main mb-1.5">문의사항</h3>
                <p className="text-sm text-text-secondary mb-3">
                    본 약관에 대한 문의사항이 있으시면 아래로 연락 주시기 바랍니다.
                </p>
                <div className="space-y-1 text-sm text-text-secondary">
                    <CompanyInfo variant="minimal" />
                </div>
            </div>
        </div>
    );
}
