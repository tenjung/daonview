"use client";

import { useState, useRef, useEffect } from "react";
import {
    Wand2, PenTool, Sparkles, CheckCircle2, AlertCircle,
    Copy, RefreshCw, ChevronRight, Search, MapPin, Clock, DollarSign
} from "lucide-react";

type ToneType = "친근한" | "전문적인" | "유머러스한" | "감성적인";

export default function WritingAssistantPage() {
    // Stage: 0=Input, 1=Analyzing, 2=Review(Keywords/Title), 3=Generating, 4=Result
    const [stage, setStage] = useState(0);

    // Inputs
    const [storeName, setStoreName] = useState("");
    const [menuItems, setMenuItems] = useState("");
    const [memo, setMemo] = useState("");
    const [tone, setTone] = useState<ToneType>("친근한");

    // AI Recommendations (Mock Data)
    const [keywords, setKeywords] = useState<string[]>([]);
    const [titles, setTitles] = useState<string[]>([]);
    const [selectedTitle, setSelectedTitle] = useState("");
    const [category, setCategory] = useState("");

    // Verified Info (Mock)
    const [verifiedInfo, setVerifiedInfo] = useState<any>(null);

    // Final Output
    const [generatedContent, setGeneratedContent] = useState("");
    const [loadingMsg, setLoadingMsg] = useState("");

    // Simulate Step 1: Analyze Input -> Recommend Keywords & Info
    const handleAnalyze = () => {
        if (!storeName) return;
        setStage(1);
        setLoadingMsg("매장 정보를 검색하고 사실 관계를 확인 중입니다...");

        setTimeout(() => {
            // Mock Results
            setCategory("맛집 > 카페/디저트");
            setKeywords([
                `${storeName} 추천`,
                "분위기 좋은 카페",
                "신상 핫플",
                "주말 데이트 코스",
                "디저트 맛집"
            ]);
            setTitles([
                `[${storeName}] 나만 알고 싶은 분위기 깡패 맛집 발견!`,
                `${storeName} 솔직 후기 : 주말 데이트 장소로 딱이야`,
                `웨이팅 필수? ${storeName} 내돈내산 찐후기`
            ]);
            setVerifiedInfo({
                address: "검증됨: 서울시 강남구 ...",
                hours: "검증됨: 11:00 ~ 22:00",
                isNew: true
            });
            setStage(2);
        }, 2000);
    };

    // Simulate Step 2: Generate Full Post
    const handleGenerate = () => {
        if (!selectedTitle) {
            alert("마음에 드는 제목을 선택해주세요!");
            return;
        }

        setStage(3);
        setLoadingMsg("SEO에 최적화된 글을 작성하고 있습니다...\n기승전결 구조를 설계 중입니다...");

        setTimeout(() => {
            const content = `
**제목: ${selectedTitle}**

---

안녕하세요! 오늘은 여러분께 정말 특별한 곳을 소개해드리려고 해요. 😊
최근에 다녀온 뒤로 계속 생각나는 곳, 바로 **'${storeName}'** 입니다!

**[사진: ${storeName} 매장 외관 (자연광 추천)]**

## 📍 위치 및 정보
* **위치**: ${verifiedInfo?.address || "서울 마포구 연남동 123-45"}
* **영업시간**: ${verifiedInfo?.hours || "매일 11:00 - 22:00"}
* **주차**: 가능 (매장 앞 공영주차장 이용)

사실 이곳을 알게 된 건 우연이었는데요, 입구에서부터 풍기는 힙한 분위기에 이끌려 들어가지 않을 수가 없더라고요.

## 🍽️ 메뉴 추천: ${menuItems || "시그니처 라떼 & 크로플"}
제가 주문한 건 **${menuItems || "시그니처 메뉴"}** 였는데요.

**[사진: ${menuItems || "음식"} 고화질 클로즈업샷]**

한 입 먹자마자 "와!" 소리가 절로 나왔어요. 
${memo ? `특히 ${memo} 부분이 인상적이었어요.` : "특히 재료 본연의 맛이 살아있어서 너무 좋았답니다."}
사장님께서도 너무 친절하셔서 기분 좋게 식사할 수 있었어요.

## ✨ 총평 및 꿀팁
데이트 코스로도 좋고, 친구들과 수다 떨기에도 완벽한 공간이에요.
주말 피크타임에는 웨이팅이 있을 수 있으니 **오픈런**을 추천합니다!

**[사진: 매장 내부 분위기 전체샷]**

재방문 의사 200% 입니다! 여러분도 꼭 한번 가보세요. 💕

---
#${storeName} #맛집추천 #${tone.replace(/한$/, '')}후기 ${keywords.map(k => `#${k.replace(/ /g, '')}`).join(" ")}
            `;
            setGeneratedContent(content.trim());
            setStage(4);
        }, 2500);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedContent);
        alert("글이 복사되었습니다!");
    };

    const resetProcess = () => {
        setStage(0);
        setStoreName("");
        setMenuItems("");
        setGeneratedContent("");
    };

    return (
        <div className="container max-w-7xl mx-auto py-12 px-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8 border-b border-border pb-6">
                <div className="bg-indigo-600 p-2 rounded-lg text-white">
                    <Wand2 size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">AI 블로그 글작성 도우미</h1>
                    <p className="text-gray-500 text-sm">SEO 최적화부터 팩트 체크까지, AI가 알아서 해드립니다.</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 min-h-[600px]">

                {/* Left Panel: Inputs & Configuration */}
                <div className="space-y-6">
                    {/* Basic Input Card */}
                    <div className={`bg-white border rounded-2xl p-6 shadow-sm transition-all ${stage > 0 ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-200'}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold">1</span>
                            <h2 className="font-bold text-lg">기본 정보 입력</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">매장명 / 제품명</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                                    placeholder="예: 스타벅스 강남점, 다이슨 에어랩"
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                    disabled={stage > 1}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">먹은 음식 / 제품</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-indigo-500 transition-all"
                                        placeholder="아메리카노, 케이크"
                                        value={menuItems}
                                        onChange={(e) => setMenuItems(e.target.value)}
                                        disabled={stage > 1}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">글 분위기 (Tone)</label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-indigo-500 bg-white"
                                        value={tone}
                                        onChange={(e) => setTone(e.target.value as ToneType)}
                                        disabled={stage > 1}
                                    >
                                        <option value="친근한">😊 친근한 (블로그 이웃)</option>
                                        <option value="전문적인">🧐 전문적인 (정보성)</option>
                                        <option value="유머러스한">🤣 유머러스한</option>
                                        <option value="감성적인">🌿 감성적인 (인스타)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">간단 메모 (선택)</label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-indigo-500 min-h-[80px]"
                                    placeholder="특이사항, 좋았던 점 등을 자유롭게 적어주세요."
                                    value={memo}
                                    onChange={(e) => setMemo(e.target.value)}
                                    disabled={stage > 1}
                                />
                            </div>

                            {stage === 0 && (
                                <button
                                    onClick={handleAnalyze}
                                    disabled={!storeName}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Search size={20} />
                                    정보 분석 및 추천받기
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Stage 2 Recommendation Card */}
                    {stage >= 2 && (
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold">2</span>
                                <h2 className="font-bold text-lg text-indigo-900">AI 추천 분석 결과</h2>
                                <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold flex items-center gap-1">
                                    <CheckCircle2 size={12} /> 사실검증 완료
                                </span>
                            </div>

                            <div className="space-y-5">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">수집된 정보 (검증됨)</h3>
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                                        <div className="flex items-center gap-1"><MapPin size={14} className="text-indigo-500" /> {verifiedInfo?.address || "위치 정보 확인됨"}</div>
                                        <div className="flex items-center gap-1"><Clock size={14} className="text-indigo-500" /> {verifiedInfo?.hours || "영업시간 확인됨"}</div>
                                        {menuItems && <div className="flex items-center gap-1"><DollarSign size={14} className="text-indigo-500" /> 대표메뉴 가격정보 수집됨</div>}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-gray-700 mb-2">추천 키워드 (SEO)</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {keywords.map((k, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium border border-indigo-100">
                                                # {k}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-gray-700 mb-2">제목 선택</h3>
                                    <div className="space-y-2">
                                        {titles.map((t, i) => (
                                            <div
                                                key={i}
                                                onClick={() => setSelectedTitle(t)}
                                                className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedTitle === t ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-gray-200 hover:border-indigo-300'}`}
                                            >
                                                {t}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {stage === 2 && (
                                    <button
                                        onClick={handleGenerate}
                                        className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
                                    >
                                        <PenTool size={18} />
                                        글 작성 시작하기
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel: Output & Loading */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl flex flex-col min-h-[600px] lg:h-[800px] overflow-hidden relative">
                    <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center sticky top-0 z-10">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Sparkles size={16} className="text-indigo-500" />
                            작성 결과 미리보기
                        </h3>
                        {stage === 4 && (
                            <div className="flex gap-2">
                                <button onClick={resetProcess} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-1">
                                    <RefreshCw size={12} /> 초기화
                                </button>
                                <button onClick={copyToClipboard} className="px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1">
                                    <Copy size={12} /> 전체 복사
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 p-8 overflow-y-auto">
                        {stage === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4 opacity-50">
                                <Wand2 size={64} className="text-gray-300" />
                                <p className="text-center">왼쪽에서 정보를 입력하고<br />분석 버튼을 눌러주세요.</p>
                            </div>
                        )}

                        {(stage === 1 || stage === 3) && (
                            <div className="h-full flex flex-col items-center justify-center gap-6 animate-in fade-in duration-500">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Sparkles className="text-indigo-600 animate-pulse" size={24} />
                                    </div>
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-lg font-bold text-gray-800">AI가 열심히 일하고 있어요!</p>
                                    <p className="text-sm text-gray-500 whitespace-pre-line">{loadingMsg}</p>
                                </div>
                            </div>
                        )}

                        {(stage === 2) && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                                <CheckCircle2 size={48} className="text-green-500 mb-2" />
                                <p className="text-center text-gray-600 font-medium">분석이 완료되었습니다.<br />왼쪽에서 제목을 선택하고 글 작성을 시작해주세요.</p>
                            </div>
                        )}

                        {stage === 4 && (
                            <div className="prose max-w-none prose-headings:font-bold prose-h2:text-indigo-700 prose-p:text-gray-700 prose-p:leading-relaxed">
                                {/* Simple Markdown Rendering Simulation */}
                                {generatedContent.split('\n').map((line, i) => {
                                    if (line.startsWith('**제목:')) return <h1 key={i} className="text-2xl mb-8 pb-4 border-b border-gray-200">{line.replace('**제목:', '').replace('**', '')}</h1>;
                                    if (line.startsWith('## ')) return <h2 key={i} className="text-xl mt-8 mb-4">{line.replace('## ', '')}</h2>;
                                    if (line.includes('[사진:')) return <div key={i} className="my-6 bg-gray-100 rounded-xl p-8 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500 font-medium">{line}</div>;
                                    if (line.startsWith('>')) return <blockquote key={i} className="border-l-4 border-indigo-400 pl-4 py-2 bg-indigo-50 my-4 text-indigo-900 italic">{line.replace('> ', '')}</blockquote>;
                                    if (line.trim() === '---') return <hr key={i} className="my-8 border-gray-200" />;
                                    return <p key={i} className="mb-4">{line}</p>;
                                })}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

// Ensure the Navbar doesn't clash with styles if needed
// This page is a standard page.tsx
