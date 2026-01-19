"use client";

import { BarChart3, FileText, Sparkles, PenTool, CheckCircle2, ChevronRight } from "lucide-react";
import { ToneType, ContentCategory, RecommendedKeyword, RecommendedTitle } from "@/types/writing-assistant";
import { CONTENT_CATEGORIES, TONE_OPTIONS } from "@/constants/ai-service";

interface AnalysisReportProps {
    stage: number;
    editableKeywords: string[];
    setEditableKeywords: (keywords: string[]) => void;
    selectedCategories: ContentCategory[];
    setSelectedCategories: (categories: ContentCategory[]) => void;
    selectedTone: ToneType;
    setSelectedTone: (tone: ToneType) => void;
    titles: RecommendedTitle[];
    selectedTitle: string;
    setSelectedTitle: (title: string) => void;
    handleGenerate: () => void;
}

export default function AnalysisReport({
    stage,
    editableKeywords,
    setEditableKeywords,
    selectedCategories,
    setSelectedCategories,
    selectedTone,
    setSelectedTone,
    titles,
    selectedTitle,
    setSelectedTitle,
    handleGenerate,
}: AnalysisReportProps) {
    if (stage < 2) return null;

    return (
        <section className="bg-white border border-gray-100 rounded-[2.5rem] p-6 md:p-8 shadow-2xl shadow-gray-200/50 animate-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center gap-4 mb-8 px-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-primary/20">02</div>
                <div>
                    <h2 className="text-2xl font-black text-text-main tracking-tight">AI 분석 리포트</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-xs text-text-secondary font-medium">전략을 검토하고 원고를 완성하세요.</p>
                    </div>
                </div>
            </div>

            <div className="relative space-y-8 max-w-4xl mx-auto">
                {/* Vertical Timeline Line */}
                <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent hidden md:block" />

                {/* 1. Keywords Section */}
                <div className="relative md:pl-16 group">
                    <div className="absolute left-4 top-0 w-4 h-4 rounded-full bg-white border-4 border-primary shadow-md hidden md:flex items-center justify-center z-10 transition-transform group-hover:scale-125" />

                    <div className="space-y-4 bg-gray-50/50 p-5 rounded-[1.5rem] border border-gray-100 shadow-sm transition-all hover:bg-white">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <BarChart3 size={16} />
                                </div>
                                <h3 className="text-base font-black text-text-main tracking-tight uppercase">SEO Keywords</h3>
                            </div>
                            <button
                                onClick={() => {
                                    const val = prompt("추가할 키워드를 입력하세요:");
                                    if (val?.trim()) setEditableKeywords([...editableKeywords, val.trim()]);
                                }}
                                className="px-4 py-1.5 bg-text-main text-white rounded-lg text-[10px] font-black hover:bg-black transition-all shadow-md"
                            >
                                + ADD KEYWORD
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {editableKeywords.map((kw, i) => (
                                <div key={i} className="group relative px-3 py-1.5 bg-white border border-gray-100 rounded-xl text-[12px] font-bold text-gray-700 shadow-sm hover:border-primary/50 hover:text-primary transition-all">
                                    # {kw}
                                    <button
                                        onClick={() => setEditableKeywords(editableKeywords.filter((_, idx) => idx !== i))}
                                        className="ml-1 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-rose-600"
                                    > × </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. Content Intent Section */}
                <div className="relative md:pl-16 group">
                    <div className="absolute left-4 top-0 w-4 h-4 rounded-full bg-white border-4 border-primary/40 shadow-md hidden md:flex items-center justify-center z-10" />

                    <div className="space-y-4 bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                                <FileText size={16} />
                            </div>
                            <h3 className="text-base font-black text-text-main tracking-tight">글의 의도 설정 (중복 선택)</h3>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {CONTENT_CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => {
                                        if (selectedCategories.includes(cat)) setSelectedCategories(selectedCategories.filter(c => c !== cat));
                                        else setSelectedCategories([...selectedCategories, cat]);
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${selectedCategories.includes(cat)
                                        ? 'bg-primary border-primary text-white shadow-md'
                                        : 'bg-white border-gray-100 text-gray-400 hover:border-primary/30'
                                        }`}
                                > {cat} </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. Style Section */}
                <div className="relative md:pl-16 group">
                    <div className="absolute left-4 top-0 w-4 h-4 rounded-full bg-white border-4 border-primary/20 shadow-md hidden md:flex items-center justify-center z-10" />

                    <div className="space-y-4 bg-gray-50/30 p-5 rounded-[1.5rem] border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                                <Sparkles size={16} />
                            </div>
                            <h3 className="text-base font-black text-text-main tracking-tight">작성 스타일 (톤앤매너)</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                            {TONE_OPTIONS.map(tone => (
                                <button
                                    key={tone.value}
                                    onClick={() => setSelectedTone(tone.value)}
                                    className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between group/tone ${selectedTone === tone.value
                                        ? 'border-primary bg-white shadow-md'
                                        : 'border-transparent bg-white/50 hover:bg-white'
                                        }`}
                                >
                                    <div className="space-y-0.5">
                                        <div className={`text-[13px] font-black transition-colors ${selectedTone === tone.value ? 'text-primary' : 'text-text-main'}`}>{tone.label}</div>
                                        <div className="text-[10px] text-gray-400 font-medium">{tone.description}</div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${selectedTone === tone.value ? 'border-primary bg-primary text-white' : 'border-gray-100'
                                        }`}>
                                        {selectedTone === tone.value && <CheckCircle2 size={12} />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 4. Blog Title Section */}
                <div className="relative md:pl-16 group">
                    <div className="absolute left-4 top-0 w-4 h-4 rounded-full bg-white border-4 border-primary shadow-md hidden md:flex items-center justify-center z-10" />

                    <div className="space-y-6">
                        <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 shadow-inner">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-md">
                                    <PenTool size={20} />
                                </div>
                                <h3 className="text-base font-black text-primary tracking-tight">추천 블로그 제목</h3>
                            </div>

                            <div className="grid gap-3">
                                {titles.map((t, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setSelectedTitle(t.title)}
                                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 group/item ${selectedTitle === t.title
                                            ? 'border-primary bg-white shadow-lg'
                                            : 'border-white bg-white/40 hover:border-primary/20 hover:bg-white'
                                            }`}
                                    >
                                        <p className={`text-[13px] font-extrabold leading-relaxed flex-1 ${selectedTitle === t.title ? 'text-text-main' : 'text-gray-500'}`}>
                                            {t.title}
                                        </p>
                                        <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${selectedTitle === t.title ? 'bg-primary text-white' : 'bg-orange-100 text-orange-600'
                                            }`}>BEST</span>
                                    </div>
                                ))}
                            </div>

                            {selectedTitle && (
                                <div className="mt-6 space-y-2">
                                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] block ml-1">최종 제목 수정</label>
                                    <div className="relative group/input">
                                        <input
                                            type="text"
                                            value={selectedTitle}
                                            onChange={(e) => setSelectedTitle(e.target.value)}
                                            className="w-full px-6 py-4 rounded-2xl border-2 border-primary bg-white outline-none font-black text-base text-text-main shadow-lg transition-all"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {stage === 2 && (
                            <button
                                onClick={handleGenerate}
                                className="w-full py-6 bg-text-main text-white rounded-[2rem] font-black text-xl hover:bg-black transition-all transform hover:-translate-y-1 shadow-xl flex items-center justify-center gap-4 group"
                            >
                                <PenTool size={24} />
                                <span className="tracking-tight">블로그 원고 완성하기</span>
                                <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
