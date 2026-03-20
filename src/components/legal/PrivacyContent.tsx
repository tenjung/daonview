import CompanyInfo from '@/components/CompanyInfo';

export default function PrivacyContent() {
    return (
        <div className="prose max-w-none text-sm md:text-base">
            {/* 개요 */}
            <section className="mb-12">
                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 mb-8">
                    <p className="text-text-secondary leading-relaxed">
                        다온컴퍼니(이하 "회사")는 개인정보 보호법 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
                    </p>
                </div>
            </section>

            {/* 제1조 */}
            <section className="mb-12">
                <h2 className="text-xl font-bold text-text-main mb-6 pb-3 border-b-2 border-primary">제1조 (개인정보의 처리 목적)</h2>
                
                <p className="text-text-secondary leading-relaxed mb-4">
                    회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
                </p>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-text-main mb-3">1. 회원 가입 및 관리</h3>
                        <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
                            <li>회원 가입의사 확인</li>
                            <li>회원제 서비스 제공에 따른 본인 식별·인증</li>
                            <li>회원자격 유지·관리</li>
                            <li>서비스 부정이용 방지</li>
                            <li>회원 가입 및 관리: 각종 고지·통지, 서비스 이용에 따른 필수 알림(캠페인 선정 결과, 배송 안내, 비밀번호 찾기 등)</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-text-main mb-3">2. 재화 또는 서비스 제공</h3>
                        <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
                            <li>캠페인 중개 서비스 제공</li>
                            <li>콘텐츠 제공</li>
                            <li>맞춤 서비스 제공</li>
                            <li>본인인증</li>
                            <li>요금결제·정산</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-text-main mb-3">3. 마케팅 및 광고에의 활용</h3>
                        <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
                            <li>신규 서비스 개발 및 맞춤 서비스 제공</li>
                            <li>이벤트 및 광고성 정보 제공 및 참여기회 제공</li>
                            <li>인구통계학적 특성에 따른 서비스 제공 및 광고 게재</li>
                            <li>서비스의 유효성 확인</li>
                            <li>접속빈도 파악 또는 회원의 서비스 이용에 대한 통계</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* 제2조 */}
            <section className="mb-12">
                <h2 className="text-xl font-bold text-text-main mb-6 pb-3 border-b-2 border-primary">제2조 (개인정보의 처리 및 보유기간)</h2>
                
                <p className="text-text-secondary leading-relaxed mb-4">
                    ① 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
                </p>

                <p className="text-text-secondary leading-relaxed mb-4">
                    ② 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:
                </p>

                <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 rounded-xl overflow-hidden">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-bold text-text-main border-b">처리 목적</th>
                                <th className="px-6 py-3 text-left text-sm font-bold text-text-main border-b">보유기간</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            <tr>
                                <td className="px-6 py-4 text-sm text-text-secondary">회원 가입 및 관리</td>
                                <td className="px-6 py-4 text-sm text-text-secondary">회원 탈퇴 시까지</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 text-sm text-text-secondary">재화 또는 서비스 제공</td>
                                <td className="px-6 py-4 text-sm text-text-secondary">재화·서비스 공급완료 및 요금결제·정산 완료시까지</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 text-sm text-text-secondary">전자상거래 관련 기록</td>
                                <td className="px-6 py-4 text-sm text-text-secondary">5년 (전자상거래법)</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 text-sm text-text-secondary">소비자 불만 또는 분쟁처리 기록</td>
                                <td className="px-6 py-4 text-sm text-text-secondary">3년 (전자상거래법)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 제3조 */}
            <section className="mb-12">
                <h2 className="text-xl font-bold text-text-main mb-6 pb-3 border-b-2 border-primary">제3조 (처리하는 개인정보의 항목)</h2>
                
                <p className="text-text-secondary leading-relaxed mb-4">
                    회사는 다음의 개인정보 항목을 처리하고 있습니다:
                </p>

                <div className="space-y-6">
                    <div className="p-6 bg-gray-50 rounded-2xl">
                        <h3 className="text-lg font-bold text-text-main mb-3">1. 회원가입 시</h3>
                        <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
                            <li><strong>필수항목:</strong> 이메일, 비밀번호, 닉네임</li>
                            <li><strong>선택항목:</strong> 전화번호, SNS URL</li>
                        </ul>
                    </div>

                    <div className="p-6 bg-gray-50 rounded-2xl">
                        <h3 className="text-lg font-bold text-text-main mb-3">2. 광고주 회원가입 시</h3>
                        <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
                            <li><strong>추가 필수항목:</strong> 회사명, 사업자등록번호</li>
                        </ul>
                    </div>

                    <div className="p-6 bg-gray-50 rounded-2xl">
                        <h3 className="text-lg font-bold text-text-main mb-3">3. 서비스 이용 과정에서 자동 수집되는 정보</h3>
                        <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
                            <li>IP주소, 쿠키, 방문일시, 서비스 이용기록, 불량 이용기록</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* 제4조 */}
            <section className="mb-12">
                <h2 className="text-xl font-bold text-text-main mb-6 pb-3 border-b-2 border-primary">제4조 (개인정보의 제3자 제공)</h2>
                
                <p className="text-text-secondary leading-relaxed mb-4">
                    ① 회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
                </p>

                <p className="text-text-secondary leading-relaxed mb-4">
                    ② 회사는 다음과 같이 개인정보를 제3자에게 제공하고 있습니다:
                </p>

                <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
                    <p className="text-text-secondary">
                        <strong>현재 제3자 제공 내역이 없습니다.</strong> 향후 제3자 제공이 필요한 경우 사전에 동의를 받겠습니다.
                    </p>
                </div>
            </section>

            {/* 제5조 */}
            <section className="mb-12">
                <h2 className="text-xl font-bold text-text-main mb-6 pb-3 border-b-2 border-primary">제5조 (개인정보의 파기)</h2>
                
                <p className="text-text-secondary leading-relaxed mb-4">
                    ① 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.
                </p>

                <p className="text-text-secondary leading-relaxed mb-4">
                    ② 개인정보 파기의 절차 및 방법은 다음과 같습니다:
                </p>

                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-bold text-text-main mb-2">파기절차</h3>
                        <p className="text-text-secondary leading-relaxed">
                            회원님이 입력하신 정보는 목적 달성 후 별도의 DB에 옮겨져(종이의 경우 별도의 서류) 내부 방침 및 기타 관련 법령에 따라 일정기간 저장된 후 혹은 즉시 파기됩니다.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-text-main mb-2">파기방법</h3>
                        <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
                            <li>전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다.</li>
                            <li>종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* 제6조 */}
            <section className="mb-12">
                <h2 className="text-xl font-bold text-text-main mb-6 pb-3 border-b-2 border-primary">제6조 (정보주체의 권리·의무 및 행사방법)</h2>
                
                <p className="text-text-secondary leading-relaxed mb-4">
                    ① 정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:
                </p>

                <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4 mb-4">
                    <li>개인정보 열람요구</li>
                    <li>오류 등이 있을 경우 정정 요구</li>
                    <li>삭제요구</li>
                    <li>처리정지 요구</li>
                </ul>

                <p className="text-text-secondary leading-relaxed mb-4">
                    ② 제1항에 따른 권리 행사는 회사에 대해 서면, 전화, 전자우편 등을 통하여 하하실 수 있으며 회사는 이에 대해 지체없이 조치하겠습니다.
                </p>
            </section>

            {/* 제7조 */}
            <section className="mb-12">
                <h2 className="text-xl font-bold text-text-main mb-6 pb-3 border-b-2 border-primary">제7조 (개인정보 보호책임자)</h2>
                
                <p className="text-text-secondary leading-relaxed mb-4">
                    회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다:
                </p>

                <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100">
                    <h3 className="text-lg font-bold text-text-main mb-3">개인정보 보호책임자</h3>
                    <div className="space-y-2 text-text-secondary">
                        <p><strong>성명:</strong> 신지호</p>
                        <p><strong>직책:</strong> 대표이사</p>
                        <p><strong>연락처:</strong> 050-71395-0204</p>
                        <p className="text-sm mt-4">
                            ※ 개인정보 보호 담당부서로 연결됩니다.
                        </p>
                    </div>
                </div>
            </section>

            {/* 제8조 */}
            <section className="mb-12">
                <h2 className="text-xl font-bold text-text-main mb-6 pb-3 border-b-2 border-primary">제8조 (개인정보의 안전성 확보조치)</h2>
                
                <p className="text-text-secondary leading-relaxed mb-4">
                    회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:
                </p>

                <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
                    <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육 등</li>
                    <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치</li>
                    <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
                </ul>
            </section>

            {/* 제9조 */}
            <section className="mb-12">
                <h2 className="text-xl font-bold text-text-main mb-6 pb-3 border-b-2 border-primary">제9조 (개인정보 자동 수집 장치의 설치·운영 및 거부에 관한 사항)</h2>
                
                <p className="text-text-secondary leading-relaxed mb-4">
                    ① 회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다.
                </p>

                <p className="text-text-secondary leading-relaxed mb-4">
                    ② 쿠키는 웹사이트를 운영하는데 이용되는 서버(http)가 이용자의 컴퓨터 브라우저에게 보내는 소량의 정보이며 이용자들의 PC 컴퓨터내의 하드디스크에 저장되기도 합니다.
                </p>

                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-bold text-text-main mb-2">쿠키의 사용목적</h3>
                        <p className="text-text-secondary leading-relaxed">
                            이용자가 방문한 각 서비스와 웹 사이트들에 대한 방문 및 이용형태, 인기 검색어, 보안접속 여부 등을 파악하여 이용자에게 최적화된 정보 제공을 위해 사용됩니다.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-text-main mb-2">쿠키의 설치·운영 및 거부</h3>
                        <p className="text-text-secondary leading-relaxed mb-2">
                            웹브라우저 상단의 도구 &gt; 인터넷 옵션 &gt; 개인정보 메뉴의 옵션 설정을 통해 쿠키 저장을 거부할 수 있습니다.
                        </p>
                        <p className="text-text-secondary leading-relaxed">
                            다만, 쿠키 저장을 거부할 경우 맞춤형 서비스 이용에 어려움이 발생할 수 있습니다.
                        </p>
                    </div>
                </div>
            </section>
            
            {/* 제10조 */}
            <section className="mb-12">
                <h2 className="text-xl font-bold text-text-main mb-6 pb-3 border-b-2 border-primary">제10조 (이메일 수신 동의 및 거부)</h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                    ① 회사는 회원의 사전 동의 없이 영리 목적의 광고성 정보를 전송하지 않습니다.
                </p>
                <p className="text-text-secondary leading-relaxed mb-4">
                    ② 회원은 언제든지 개인정보관리 화면 또는 이메일 하단의 '수신거부(Unsubscribe)' 링크를 통해 광고성 이메일 수신을 거부할 수 있습니다. 다만, 서비스 운영에 필수적인 트랜잭션 메일(계정 인증, 캠페인 선정 안내 등)은 관련 법령에 따라 발송될 수 있습니다.
                </p>
            </section>

            {/* 부칙 */}
            <section className="mb-8">
                <h2 className="text-xl font-bold text-text-main mb-6 pb-3 border-b-2 border-primary">부칙</h2>
                <p className="text-text-secondary leading-relaxed mb-2">
                    <strong>시행일자:</strong> 본 방침은 2026년 1월 5일부터 시행됩니다.
                </p>
                <p className="text-text-secondary leading-relaxed">
                    개인정보처리방침의 내용 추가, 삭제 및 수정이 있을 시에는 개정 최소 7일전부터 홈페이지의 '공지사항'을 통해 고지할 것입니다.
                </p>
            </section>

            {/* 문의 안내 */}
            <div className="mt-8 p-5 bg-rose-50 rounded-2xl border border-rose-100">
                <h3 className="text-base font-bold text-text-main mb-1.5">개인정보 관련 문의</h3>
                <p className="text-sm text-text-secondary mb-3">
                    개인정보 보호와 관련하여 문의사항이 있으시면 아래로 연락 주시기 바랍니다.
                </p>
                <div className="space-y-1 text-sm text-text-secondary">
                    <CompanyInfo variant="minimal" />
                </div>
            </div>
        </div>
    );
}
