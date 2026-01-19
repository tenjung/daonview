"use client";

import { Sparkles, Search, PenTool, Wand2, MapPin, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { TopicType, VerifiedInfo } from "@/types/writing-assistant";
import { TOPIC_OPTIONS } from "@/constants/ai-service";
import ImageUploader from "@/components/ai-service/ImageUploader";

interface InputSectionProps {
    stage: number;
    selectedTopic: TopicType;
    setSelectedTopic: (topic: TopicType) => void;
    storeName: string;
    setStoreName: (name: string) => void;
    menuItems: string;
    setMenuItems: (items: string) => void;
    campaignGuide: string;
    setCampaignGuide: (guide: string) => void;
    guideImages: File[];
    setGuideImages: (files: File[]) => void;
    memo: string;
    setMemo: (memo: string) => void;
    imageFiles: File[];
    setImageFiles: (files: File[]) => void;
    handleAnalyze: () => void;
    // Place Verification Props
    verifiedInfo: VerifiedInfo | null;
    placeList: VerifiedInfo[];
    handleVerifyPlace: () => void;
    handleSelectPlace: (place: VerifiedInfo) => void;
    isVerifying: boolean;
}

export default function InputSection({
    stage,
    selectedTopic,
    setSelectedTopic,
    storeName,
    setStoreName,
    menuItems,
    setMenuItems,
    campaignGuide,
    setCampaignGuide,
    guideImages,
    setGuideImages,
    memo,
    setMemo,
    imageFiles,
    setImageFiles,
    handleAnalyze,
    verifiedInfo,
    placeList,
    handleVerifyPlace,
    handleSelectPlace,
    isVerifying,
}: InputSectionProps) {
    return (
        <section className={`bg-white border rounded-[2.5rem] p-10 shadow-sm transition-all duration-500 ${stage > 1 ? 'opacity-60 pointer-events-none' : 'border-primary/20 shadow-primary/5'}`}>
            <div className="flex items-center gap-4 mb-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg transition-all ${stage >= 0 ? 'bg-primary text-white shadow-primary/20' : 'bg-gray-100 text-gray-400'}`}>01</div>
                <div>
                    <h2 className="text-2xl font-black text-text-main">포스팅 작성 설정</h2>
                    <p className="text-sm text-text-secondary">어떤 주제로 글을 쓰실지 알려주세요.</p>
                </div>
            </div>

            <div className="space-y-8">
                {/* Topic Selection */}
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <label className="block text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <Sparkles size={16} className="text-primary" /> 작성 주제 선택 <span className="text-primary">*</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                        {TOPIC_OPTIONS.map((topic) => (
                            <button
                                key={topic.value}
                                type="button"
                                onClick={() => setSelectedTopic(topic.value)}
                                disabled={stage > 0}
                                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${selectedTopic === topic.value
                                    ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                                    : 'border-gray-100 hover:border-primary/20 bg-white'
                                    } ${stage > 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <div className="text-2xl mb-2">{topic.icon}</div>
                                <div className="text-xs font-bold text-text-main">{topic.label}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Core Info Group */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">매장명 / 제품명 <span className="text-primary">*</span></label>
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-sm font-medium"
                                placeholder="예: 다온뷰 카페, 프리미엄 영양제"
                                value={storeName}
                                onChange={(e) => setStoreName(e.target.value)}
                                disabled={stage > 0}
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        </div>
                        {selectedTopic === "VISIT_REVIEW" && (
                            <button
                                onClick={handleVerifyPlace}
                                disabled={!storeName || isVerifying}
                                className="mt-1 text-[11px] font-bold text-primary flex items-center gap-1 hover:underline disabled:opacity-50"
                            >
                                <MapPin size={12} /> 네이버 플레이스 정보 불러오기 {isVerifying && "..."}
                            </button>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">핵심 경험 (메뉴/제품) <span className="text-primary">*</span></label>
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-sm font-medium"
                                placeholder="아이스 라떼, 등심 스테이크 등"
                                value={menuItems}
                                onChange={(e) => setMenuItems(e.target.value)}
                                disabled={stage > 0}
                            />
                            <PenTool className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        </div>
                    </div>
                </div>

                {/* Place Verification UI (Inline) */}
                {selectedTopic === "VISIT_REVIEW" && (verifiedInfo || placeList.length > 0) && (
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-[2rem] p-6 animate-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-md">
                                    <MapPin size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-indigo-900">네이버 플레이스 연동 정보</h3>
                            </div>
                            <div className="px-3 py-1 bg-white border border-indigo-100 rounded-full text-[10px] font-black text-indigo-500 flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" /> LIVE
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* 검색 결과 리스트 표시 */}
                            {!verifiedInfo && placeList.length > 1 && (
                                <div className="bg-white p-5 rounded-2xl border border-indigo-50 space-y-3 max-h-[250px] overflow-y-auto">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">검색된 매장 목록 (선택해 주세요)</span>
                                    {placeList.map((place, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSelectPlace(place)}
                                            className="w-full text-left p-3 rounded-xl border border-gray-100 hover:border-primary hover:bg-primary/5 transition-all group"
                                        >
                                            <p className="text-sm font-black text-gray-700 group-hover:text-primary">{place.name}</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">{place.address}</p>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* 선택된 매장 정보 표시 */}
                            {verifiedInfo && (
                                <div className="bg-white p-5 rounded-2xl border border-indigo-50 space-y-4">
                                    <div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">검색된 매장명</span>
                                        <p className="text-base font-black text-indigo-600">{verifiedInfo.name || "정보 없음"}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">매장 주소</span>
                                        <p className="text-sm font-bold text-gray-700 leading-relaxed">{verifiedInfo.address || "주소를 찾을 수 없음"}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                <div className={`py-4 px-5 rounded-2xl flex items-center justify-between border ${verifiedInfo?.isVerified ? 'bg-green-50 border-green-100 text-green-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                                    <div className="flex items-center gap-2">
                                        {verifiedInfo?.isVerified ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                        <span className="text-sm font-black">{verifiedInfo?.isVerified ? '데이터 검증 성공' : (placeList.length > 1 ? '매장을 선택해주세요' : '매칭 데이터 없음')}</span>
                                    </div>
                                    <button onClick={handleVerifyPlace} className="p-2 hover:bg-white rounded-lg transition-colors">
                                        <RefreshCw size={14} className={isVerifying ? "animate-spin" : ""} />
                                    </button>
                                </div>
                                <div className="p-4 bg-white/50 rounded-2xl border border-indigo-50 flex gap-2">
                                    <AlertCircle size={14} className="text-indigo-300 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-indigo-400 leading-relaxed">정보가 올바르지 않으면 매장명을 다시 확인해 주세요.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Posting Guide & Memo */}
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="flex flex-col h-full">
                        <label className="text-sm font-bold text-gray-700 flex items-center justify-between mb-4 h-5">
                            업체 가이드 (선택)
                            <span className="text-[10px] text-primary bg-primary/5 px-2 py-0.5 rounded-full font-bold">비전 AI 분석</span>
                        </label>
                        <textarea
                            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-primary min-h-[150px] flex-1 outline-none text-sm resize-none"
                            placeholder="업체 가이드나 핵심 키워드를 붙여넣으세요. 이미지로 제공된 가이드도 첨부하시면 AI가 함께 분석합니다."
                            value={campaignGuide}
                            onChange={(e) => setCampaignGuide(e.target.value)}
                            disabled={stage > 0}
                        />
                        <div className="mt-6">
                            <ImageUploader
                                label="가이드 이미지 업로드"
                                images={guideImages}
                                onImagesChange={setGuideImages}
                                maxImages={3}
                                showHelpText={false}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col h-full">
                        <label className="text-sm font-bold text-gray-700 mb-4 h-5 block">참고 메모 (선택)</label>
                        <textarea
                            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-primary min-h-[150px] flex-1 outline-none text-sm resize-none"
                            placeholder="글에 반영하고 싶은 개인적인 감상이나 특징을 적어주세요."
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            disabled={stage > 0}
                        />
                        <div className="mt-6">
                            <ImageUploader
                                label="포스팅 실제 첨부 이미지"
                                images={imageFiles}
                                onImagesChange={setImageFiles}
                                maxImages={10}
                                showHelpText={false}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-center pt-2">
                    <p className="text-[11px] text-gray-400 font-medium bg-gray-50/50 px-4 py-1.5 rounded-full border border-gray-100/50">
                        * 드래그하여 순서를 변경하거나, 클릭하여 삭제할 수 있습니다.
                    </p>
                </div>

                {stage === 0 && (
                    <button
                        onClick={handleAnalyze}
                        className="w-full py-7 bg-primary text-white rounded-[2rem] font-black text-xl hover:bg-primary/90 transition-all transform hover:-translate-y-1 shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 group"
                    >
                        <Wand2 size={24} className="group-hover:rotate-12 transition-transform" />
                        AI 분석 및 리포트 생성하기
                        <Sparkles size={20} className="animate-pulse" />
                    </button>
                )}
            </div>
        </section>
    );
}
