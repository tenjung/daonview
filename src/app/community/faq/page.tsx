'use client';

import { useState } from 'react';

export default function FAQPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const faqData = [
        {
            q: "리뷰 등록 기한이 지났는데, 리워드가 지급 되나요?",
            a: "안녕하세요, 다온뷰입니다.\n\n■ 리뷰 등록 기한 정책\n- 리뷰 등록 기한 내에 리뷰를 등록해주셔야 리워드가 정산/지급됩니다.\n- 기한 내 미등록 시, 캠페인 참여에 대한 리워드 지급이 제한될 수 있습니다. (단, 광고주와 사전 협의된 경우 제외)\n\n기한 준수는 원활한 체험단 운영을 위해 필수적이므로 꼭 지켜주시길 부탁드립니다."
        },
        {
            q: "실명확인, 계좌확인을 꼭 해야하나요?",
            a: "네, 필수사항입니다. 포인트 출금을 할 때에는 관련법상 3.3% 사업소득세를 신고해야 합니다. 이에 따라 투명한 세무 처리를 위해 본인 명의의 실명 인증 및 계좌 확인이 반드시 필요합니다."
        },
        {
            q: "포인트는 언제 출금이 가능한가요?",
            a: "다온뷰 포인트는 10,000 포인트 이상부터 1,000원 단위로 출금 신청이 가능합니다.\n관련법상 사업소득 3.3%를 공제 후 입금되며, 매주 목요일 오후 2시 이전 신청 건에 한해 금요일에 일괄 지급됩니다."
        },
        {
            q: "사이트 이용을 할 수 없다고 나와요 (블랙리스트)",
            a: "건전한 리뷰 문화를 위해 다음과 같은 경우 이용이 제한될 수 있습니다.\n\n1. 고의적인 리뷰 미제출이 누적되는 경우\n2. 유지기간(1년) 전에 게시물을 비공개로 전환하거나 삭제하는 경우\n3. 가이드라인을 심각하게 위반하는 경우\n\n위 사유로 블랙리스트 등재 시 사이트 이용 및 캠페인 참여가 제한됩니다."
        },
        {
            q: "신청한 캠페인의 제공서비스 및 옵션을 변경할 수 있나요?",
            a: "캠페인 선정 후에는 제공 서비스 및 옵션 변경이 불가능합니다. 신청 시 상세 페이지의 제공 내역을 꼼꼼히 확인하시고, 본인이 체험 가능한 옵션으로 신중하게 신청 부탁드립니다."
        },
        {
            q: "리뷰 등록을 기간 내 못할 것 같아요 (기간 연장 요청)",
            a: "체험 기간 동안 배송 지연, 건강 등 부득이한 사정으로 포스팅 작성이 어려운 경우, 마감일 전에 미리 [마이페이지 > 1:1문의]를 통해 연락 주세요.\n광고주와 협의 후 기간 연장을 도와드릴 수 있습니다. \n(※ 무단으로 미등록 시 페널티가 발생할 수 있습니다.)"
        },
        {
            q: "[배송] 제품이 불량인 것 같아요 & 잘못 배송되었어요",
            a: "배송받으신 제품에 파손이나 불량이 있는 경우, 수령 후 3일 이내에 제품 사진과 함께 [1:1 문의]로 접수해주시면 확인 후 신속하게 교환 및 재발송 처리를 도와드립니다."
        },
        {
            q: "신청 가능한 캠페인 종류는 어떤게 있나요?",
            a: "다온뷰에는 크게 3가지 유형의 캠페인이 있습니다.\n\n1. 배송형: 신청한 주소로 제품을 배송받아 체험 후 리뷰 작성\n2. 방문형: 매장에 직접 방문하여 식사/서비스 체험 후 리뷰 작성\n3. 기자단: 제공된 원고와 사진을 활용하여 정보성 리뷰 작성"
        },
        {
            q: "리뷰는 어디서 등록하나요?",
            a: "홈페이지 상단 메뉴 [마이페이지] -> [선정된 캠페인] 목록에서 해당 캠페인을 찾으실 수 있습니다. \n'리뷰등록' 버튼을 클릭하여 작성하신 포스팅의 URL을 입력해주시면 제출이 완료됩니다."
        },
        {
            q: "리뷰 작성 시 가이드라인을 반드시 지켜야 하나요?",
            a: "네, 반드시 지켜주셔야 합니다. 캠페인별로 요청된 키워드, 사진 장수, 필수 삽입 문구 등은 광고주와의 약속입니다.\n가이드라인 미준수 시 수정 요청이 있을 수 있으며, 이에 응하지 않을 경우 포인트 지급이 보류되거나 페널티가 부과될 수 있습니다."
        },
        {
            q: "회원 탈퇴는 어디서 하나요?",
            a: "[마이페이지 > 개인정보 수정 > 비밀번호 입력] 메뉴 하단에서 '회원탈퇴하기' 버튼을 통해 가능합니다. \n※ 탈퇴 시 보유하고 계신 포인트는 즉시 소멸되며 복구되지 않으니 유의해주세요."
        },
        {
            q: "이사했는데 주소 변경이 가능한가요?",
            a: "캠페인 선정 전이라면 [개인정보 수정]에서 직접 변경 가능합니다.\n선정 후 배송 전 단계라면 [1:1 문의]로 변경 요청해주시면 도와드리겠습니다. 단, 이미 배송이 시작된 경우에는 변경이 어렵습니다."
        },
        {
            q: "[배송] 아직 제품을 배송받지 못했어요",
            a: "보통 선정 발표 후 영업일 기준 3일 이내에 발송되며, 발송 후 1~2일 내에 수령 가능합니다. \n선정 후 5일이 지나도 제품이 도착하지 않는다면 [1:1 문의] 게시판에 남겨주시면 운송장 번호 확인 및 배송 현황을 안내해 드립니다."
        },
        {
            q: "휴대폰 카메라로 촬영해도 되나요?",
            a: "네, 가능합니다. 최신 스마트폰의 경우 충분히 고화질 촬영이 가능하므로 DSLR이 없어도 참여하실 수 있습니다.\n단, 사진이 너무 흔들리거나 어두워서 식별이 어려운 경우, 혹은 성의 없는 사진은 수정 요청이나 선정 취소의 사유가 될 수 있습니다."
        },
        {
            q: "포스팅은 언제까지 유지해야 하나요?",
            a: "등록하신 모든 콘텐츠는 이용약관에 따라 작성일로부터 최소 [6개월 ~ 1년] 간 전체 공개로 유지해주셔야 합니다. \n임의로 삭제하거나 비공개 전환 시, 지급된 포인트 환수 및 위약금이 청구될 수 있습니다."
        },
        {
            q: "신청 취소는 어떻게 하나요?",
            a: "선정자 발표일 전날까지는 [신청한 캠페인] 메뉴에서 자유롭게 취소가 가능합니다. \n하지만 선정된 이후에 취소하실 경우 '선정 후 취소' 페널티가 부과되어 향후 당첨 확률이 낮아질 수 있으니 신중하게 신청 부탁드립니다."
        },
        {
            q: "제가 선정된 건 어떻게 알 수 있나요?",
            a: "당첨자 발표일 내에 선정되신 분들께는 카카오톡(또는 문자) 알림톡을발송해 드립니다. \n또한 홈페이지 [마이페이지 > 신청한 캠페인] 메뉴에서도 선정 여부를 확인하실 수 있습니다."
        }
    ];

    return (
        <div className="bg-white">
            <div className="bg-slate-50 border border-border rounded-xl py-12 mb-8">
                <div className="text-center px-6">
                    <h1 className="text-3xl font-extrabold text-text-main mb-3">자주 묻는 질문 (FAQ)</h1>
                    <p className="text-text-secondary">다온뷰 이용 중 궁금한 점을 빠르게 해결해 드립니다.</p>
                </div>
            </div>

            <div className="space-y-4">
                {faqData.map((item, idx) => (
                    <div
                        key={idx}
                        className={`border rounded-xl bg-white transition-all duration-300 ${openIndex === idx ? 'border-primary shadow-md' : 'border-border'}`}
                    >
                        <button
                            onClick={() => toggleFAQ(idx)}
                            className="w-full text-left p-6 font-bold text-lg flex justify-between items-start gap-4 hover:bg-slate-50 transition-colors rounded-t-xl"
                        >
                            <div className="flex gap-3">
                                <span className="text-primary mt-0.5">Q.</span>
                                <span className="text-text-main leading-snug">{item.q}</span>
                            </div>
                            <span className={`transform transition-transform duration-300 text-slate-400 ${openIndex === idx ? 'rotate-180 text-primary' : ''}`}>
                                ▼
                            </span>
                        </button>

                        <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === idx ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                        >
                            <div className="p-6 pt-0 bg-white border-t border-slate-100/50 text-text-secondary leading-relaxed whitespace-pre-wrap">
                                <div className="pt-4 flex gap-3">
                                    <span className="font-bold text-slate-800">A.</span>
                                    <div>{item.a}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-16 bg-rose-50 rounded-2xl p-8 text-center border border-rose-100">
                <h3 className="text-xl font-bold text-text-main mb-3">원하는 답변을 찾지 못하셨나요?</h3>
                <p className="text-text-secondary mb-6">1:1 문의를 남겨주시면 담당자가 빠르고 친절하게 답변해 드립니다.</p>
                <a href="/contact" className="btn btn-primary inline-flex items-center gap-2">
                    1:1 문의하러 가기
                    <span className="text-xs">→</span>
                </a>
            </div>
        </div>
    );
}
