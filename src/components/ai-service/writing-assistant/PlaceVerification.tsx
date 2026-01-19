"use client";

import { MapPin, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { VerifiedInfo, TopicType } from "@/types/writing-assistant";

interface PlaceVerificationProps {
    stage: number;
    selectedTopic: TopicType;
    storeName: string;
    setStoreName: (name: string) => void;
    handleAnalyze: () => void;
    verifiedInfo: VerifiedInfo | null;
}

export default function PlaceVerification({
    stage,
    selectedTopic,
    storeName,
    setStoreName,
    handleAnalyze,
    verifiedInfo,
}: PlaceVerificationProps) {
    if (stage < 2 || selectedTopic !== "VISIT_REVIEW") return null;

    return (
        <section className="bg-indigo-50/30 border border-indigo-100 rounded-[2.5rem] p-10 animate-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-200">
                        <MapPin size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-indigo-900">네이버 플레이스 연동 확인</h3>
                        <p className="text-xs text-indigo-600 font-medium">실제 매장 정보를 바탕으로 정확한 글을 작성합니다.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-indigo-200 rounded-full text-[10px] font-black text-indigo-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> LIVE SYNC
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-start">
                <div className="space-y-5">
                    <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-sm">
                        <label className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-3 block">검색된 매장명</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={storeName}
                                onChange={(e) => setStoreName(e.target.value)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-100 focus:border-indigo-500 outline-none text-sm font-bold"
                            />
                            <button onClick={handleAnalyze} className="px-4 bg-indigo-900 text-white rounded-xl hover:bg-black transition-all text-xs font-bold flex items-center gap-2">
                                <RefreshCw size={14} /> 재검색
                            </button>
                        </div>
                    </div>
                    <div className="p-4 bg-white/50 rounded-2xl flex items-start gap-3 border border-indigo-50">
                        <AlertCircle size={16} className="text-indigo-300 mt-0.5" />
                        <p className="text-[11px] text-indigo-400 leading-relaxed">매장명이 일치하지 않으면 원고에 잘못된 위치 정보가 포함될 수 있습니다.</p>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-[2rem] border border-indigo-100 space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">매장 주소</span>
                            <p className="text-sm font-bold text-gray-700">{verifiedInfo?.address || "주소를 찾을 수 없음"}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">전화번호</span>
                                <p className="text-sm font-bold text-gray-700">{verifiedInfo?.phone || "번호 없음"}</p>
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">영업시간</span>
                                <p className="text-sm font-bold text-gray-700 truncate">{verifiedInfo?.hours || "정보 없음"}</p>
                            </div>
                        </div>
                    </div>
                    <div className={`py-2 px-4 rounded-xl inline-flex items-center gap-2 text-[10px] font-black ${verifiedInfo?.isVerified ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                        {verifiedInfo?.isVerified ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                        {verifiedInfo?.isVerified ? '데이터 검증 성공' : '매칭 데이터 없음'}
                    </div>
                </div>
            </div>
        </section>
    );
}
