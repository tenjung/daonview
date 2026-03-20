"use client";

import { CheckCircle2, AlertCircle, Copy, RefreshCw, Image as ImageIcon, Sparkles } from "lucide-react";

interface ResultViewProps {
    stage: number;
    seoReport: { totalScore: number; issues: string[]; wellDone: string[] } | null;
    generatedContent: string;
    metaDescription: string;
    imageFiles: File[];
    copyToClipboard: () => void;
    resetProcess: () => void;
    handleGenerate: () => void;
}

export default function ResultView({
    stage,
    seoReport,
    generatedContent,
    metaDescription,
    imageFiles,
    copyToClipboard,
    resetProcess,
    handleGenerate,
}: ResultViewProps) {
    if (stage !== 4) return null;

    return (
        <section className="space-y-10 animate-in fade-in duration-1000">
            {/* SEO Score Banner */}
            {seoReport && (
                <div className="bg-white border-2 border-primary/20 rounded-[2.5rem] p-10 shadow-2xl relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none overflow-hidden" />

                    <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
                        <div className="text-center md:text-left space-y-2">
                            <h3 className="text-3xl font-black text-text-main">SEO 최적화 검사 결과</h3>
                            <p className="text-text-secondary font-medium">네이버 검색 엔진 노출 확률을 분석했습니다.</p>
                        </div>
                        <div className="flex items-center gap-10">
                            <div className="text-center">
                                <div className="text-6xl font-black text-primary mb-2">{seoReport.totalScore}</div>
                                <div className="text-xs font-black text-gray-400 uppercase tracking-widest">Total SEO Score</div>
                            </div>
                            <div className="h-20 w-[1px] bg-gray-100 hidden md:block" />
                            <div className="space-y-3">
                                {/* Well Done Items Tooltip */}
                                <div className="group relative flex items-center justify-end gap-2 text-xs font-bold text-green-600 cursor-help">
                                    <span>{seoReport.wellDone.length}개 항목 최적화 완료</span>
                                    <CheckCircle2 size={16} />
                                    <div className="absolute right-0 bottom-full mb-3 hidden group-hover:block w-72 p-5 bg-white border border-gray-100 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[100] text-[11px] leading-relaxed animate-in fade-in slide-in-from-bottom-2">
                                        <div className="space-y-2.5">
                                            <p className="font-black text-green-600 uppercase tracking-widest border-b border-gray-100 pb-2 mb-2 flex items-center gap-2">
                                                <CheckCircle2 size={12} /> 최적화 성공 리스트
                                            </p>
                                            {seoReport.wellDone.map((item, idx) => (
                                                <p key={idx} className="flex gap-2 text-gray-600 font-medium text-right justify-end">
                                                    {item} <span className="text-green-500">•</span>
                                                </p>
                                            ))}
                                        </div>
                                        <div className="absolute top-full right-4 border-[8px] border-transparent border-t-white" />
                                    </div>
                                </div>

                                {/* Issues Tooltip */}
                                <div className="group relative flex items-center justify-end gap-2 text-xs font-bold text-orange-500 cursor-help">
                                    <span>{seoReport.issues.length}개 개선 제안</span>
                                    <AlertCircle size={16} />
                                    <div className="absolute right-0 bottom-full mb-3 hidden group-hover:block w-72 p-5 bg-white border border-gray-100 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[100] text-[11px] leading-relaxed animate-in fade-in slide-in-from-bottom-2">
                                        <div className="space-y-2.5">
                                            <p className="font-black text-orange-500 uppercase tracking-widest border-b border-gray-100 pb-2 mb-2 flex items-center gap-2">
                                                <AlertCircle size={12} /> 개선이 필요한 항목
                                            </p>
                                            {seoReport.issues.map((item, idx) => (
                                                <p key={idx} className="flex gap-2 text-gray-600 font-medium text-right justify-end">
                                                    {item} <span className="text-orange-400">•</span>
                                                </p>
                                            ))}
                                        </div>
                                        <div className="absolute top-full right-4 border-[8px] border-transparent border-t-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Generated Content Panel */}
            <div className="bg-white border-2 border-gray-100 rounded-[3rem] shadow-2xl shadow-gray-200/50 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                    <div className="flex items-center gap-4">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-rose-400" />
                            <div className="w-3 h-3 rounded-full bg-amber-400" />
                            <div className="w-3 h-3 rounded-full bg-emerald-400" />
                        </div>
                        <span className="text-sm font-black text-gray-400 uppercase tracking-widest ml-4">Blog Post Preview</span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                if (confirm("모든 정보를 지우고 처음부터 다시 시작하시겠습니까?")) {
                                    resetProcess();
                                }
                            }}
                            className="px-4 py-2 text-gray-400 hover:text-rose-500 font-bold text-xs transition-colors hover:bg-rose-50 rounded-xl"
                        >
                            새 글 작성
                        </button>
                        <button
                            onClick={() => {
                                if (confirm("현재 설정으로 원고를 다시 생성하시겠습니까? (기존 내용은 삭제됩니다)")) {
                                    handleGenerate();
                                }
                            }}
                            className="px-5 py-2.5 bg-white border-2 border-primary/20 text-primary hover:bg-primary/5 rounded-[1.25rem] font-black text-sm flex items-center gap-2 transition-all shadow-sm"
                        >
                            <RefreshCw size={18} /> 원고 재생성
                        </button>
                        <button onClick={copyToClipboard} className="px-8 py-3.5 bg-primary text-white rounded-[1.25rem] font-black text-sm flex items-center gap-2 shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                            <Copy size={18} /> 원고 전체 복사
                        </button>
                    </div>
                </div>

                <div className="p-12 md:p-20">
                    <div className="mb-16 pb-16 border-b-2 border-gray-50 text-center">
                        <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.3em] mb-6">Meta Description</p>
                        <p className="text-xl font-bold text-text-secondary leading-relaxed italic max-w-2xl mx-auto">"{metaDescription}"</p>
                    </div>

                    <div className="prose prose-lg prose-slate max-w-none text-text-main">
                        {(() => {
                            let photoIndex = 0;
                            return generatedContent.split('\n').map((line, i) => {
                                if (line.startsWith('# ')) return <h1 key={i} className="text-4xl md:text-5xl font-black mb-12 text-gray-900 leading-tight">{line.replace('# ', '')}</h1>;
                                if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-black mt-16 mb-8 text-primary flex items-center gap-4"><div className="w-2 h-8 bg-primary rounded-full" /> {line.replace('## ', '')}</h2>;

                                if (line.includes('[사진')) {
                                    // [사진N: 설명] 또는 [사진: 설명] 형태 추출
                                    const match = line.match(/\[사진(\d+)?:\s*(.*?)\]/);
                                    let currentPhotoIndex = photoIndex++;

                                    if (match && match[1]) {
                                        // 인덱스가 명시된 경우 (1-based를 0-based로 변환)
                                        currentPhotoIndex = parseInt(match[1]) - 1;
                                    }

                                    const uploadedFile = imageFiles[currentPhotoIndex];
                                    const photoLabel = match ? match[0] : line;

                                    return uploadedFile ? (
                                        <div key={i} className="my-12 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                                            <div className="max-w-2xl mx-auto overflow-hidden rounded-[2rem] shadow-xl border border-gray-100 bg-gray-50 text-center">
                                                <img
                                                    src={URL.createObjectURL(uploadedFile)}
                                                    alt={`blog-image-${currentPhotoIndex}`}
                                                    className="w-full h-auto object-cover hover:scale-[1.02] transition-transform duration-700"
                                                />
                                            </div>
                                            <div className="flex flex-col items-center gap-1 opacity-60">
                                                <p className="text-sm font-medium text-gray-500 italic">{photoLabel}</p>
                                                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Image Placement {currentPhotoIndex + 1}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div key={i} className="max-w-2xl mx-auto my-12 aspect-[16/9] bg-gray-50 rounded-[2rem] border-4 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-400 gap-4 group hover:bg-white transition-all">
                                            <ImageIcon size={40} className="group-hover:scale-110 transition-transform" />
                                            <div className="text-center">
                                                <p className="text-base font-bold text-gray-500">{photoLabel}</p>
                                                <p className="text-[11px] font-medium text-gray-400 mt-1">이 위치에 삽입될 사진을 업로드해 주세요.</p>
                                            </div>
                                        </div>
                                    );
                                }

                                if (line.trim() === '---') return <div key={i} className="my-20 flex items-center gap-6"><div className="flex-1 h-[1px] bg-gray-100" /><Sparkles size={16} className="text-gray-200" /><div className="flex-1 h-[1px] bg-gray-100" /></div>;

                                // 굵게(**) 처리 함수
                                const renderLine = (text: string) => {
                                    const parts = text.split(/(\*\*.*?\*\*)/g);
                                    return parts.map((part, index) => {
                                        if (part.startsWith('**') && part.endsWith('**')) {
                                            return <strong key={index} className="font-black text-gray-900">{part.slice(2, -2)}</strong>;
                                        }
                                        return part;
                                    });
                                };

                                return line.trim() ? <p key={i} className="mb-8 text-lg leading-relaxed text-gray-700">{renderLine(line)}</p> : null;
                            });
                        })()}
                    </div>
                </div>
            </div>
        </section>
    );
}
