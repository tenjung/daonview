'use client';

import { useState } from 'react';
import { ChevronRight, ChevronLeft, Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Step2Data {
    campaignTitle: string;
    campaignImages: string[];
    // 구매평 가이드 옵션
    textLength: 'free' | 'short' | 'medium' | 'long' | 'custom';
    photoCount: '1' | '3' | '5' | 'none';
    videoRequired: 'yes' | 'no';
    missionGuide: string;
    keywords: string[];
    prohibitedWords: string[];
    additionalNotes: string;
}

interface CampaignStep2Props {
    onNext: (data: Step2Data) => void;
    onPrev: () => void;
    initialData?: Partial<Step2Data>;
}

export default function CampaignStep2({ onNext, onPrev, initialData }: CampaignStep2Props) {
    const [formData, setFormData] = useState<Step2Data>({
        campaignTitle: initialData?.campaignTitle || '',
        campaignImages: initialData?.campaignImages || [],
        textLength: initialData?.textLength || 'free',
        photoCount: initialData?.photoCount || '3',
        videoRequired: initialData?.videoRequired || 'no',
        missionGuide: initialData?.missionGuide || '',
        keywords: initialData?.keywords || [],
        prohibitedWords: initialData?.prohibitedWords || [],
        additionalNotes: initialData?.additionalNotes || '',
    });

    const [keywordInput, setKeywordInput] = useState('');
    const [prohibitedInput, setProhibitedInput] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadLater, setUploadLater] = useState(false); // 나중에 업로드 체크박스

    // 이미지 업로드 핸들러
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        // 최대 4개 제한
        const remainingSlots = 4 - formData.campaignImages.length;
        if (remainingSlots <= 0) {
            toast.error('최대 4개의 이미지만 업로드 가능합니다.');
            return;
        }

        setUploadingImage(true);

        // TODO: 실제 이미지 업로드 로직 (Supabase Storage 등)
        // 임시로 로컬 URL 사용
        const newImages: string[] = [];
        const filesToUpload = Math.min(files.length, remainingSlots);

        for (let i = 0; i < filesToUpload; i++) {
            const file = files[i];
            const url = URL.createObjectURL(file);
            newImages.push(url);
        }

        setFormData(prev => ({
            ...prev,
            campaignImages: [...prev.campaignImages, ...newImages],
        }));

        setUploadingImage(false);
    };

    // 이미지 삭제
    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            campaignImages: prev.campaignImages.filter((_, i) => i !== index),
        }));
    };

    // 키워드 추가
    const addKeyword = () => {
        if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
            setFormData(prev => ({
                ...prev,
                keywords: [...prev.keywords, keywordInput.trim()],
            }));
            setKeywordInput('');
        }
    };

    // 키워드 삭제
    const removeKeyword = (keyword: string) => {
        setFormData(prev => ({
            ...prev,
            keywords: prev.keywords.filter(k => k !== keyword),
        }));
    };

    // 금지어 추가
    const addProhibited = () => {
        if (prohibitedInput.trim() && !formData.prohibitedWords.includes(prohibitedInput.trim())) {
            setFormData(prev => ({
                ...prev,
                prohibitedWords: [...prev.prohibitedWords, prohibitedInput.trim()],
            }));
            setProhibitedInput('');
        }
    };

    // 금지어 삭제
    const removeProhibited = (word: string) => {
        setFormData(prev => ({
            ...prev,
            prohibitedWords: prev.prohibitedWords.filter(w => w !== word),
        }));
    };

    // 폼 유효성 검사
    const isFormValid = () => {
        if (!formData.campaignTitle.trim()) return false;
        // 나중에 업로드 체크 시 이미지 필수 아님
        if (!uploadLater && formData.campaignImages.length === 0) return false;
        // 구매평 가이드 옵션은 기본값이 있으므로 항상 유효
        // missionGuide는 선택사항
        return true;
    };

    const handleNext = () => {
        if (isFormValid()) {
            onNext(formData);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Progress Indicator */}
            <div className="flex items-center justify-center gap-4 mb-8">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-semibold">
                        ✓
                    </div>
                    <span className="font-medium text-gray-600">기본 정보</span>
                </div>
                <ChevronRight className="text-gray-400" />
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                        2
                    </div>
                    <span className="font-medium text-gray-900">미션 가이드</span>
                </div>
                <ChevronRight className="text-gray-400" />
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-semibold">
                        3
                    </div>
                    <span className="font-medium text-gray-400">결제</span>
                </div>
            </div>

            {/* 캠페인 제목 */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">캠페인 제목</h2>
                <input
                    type="text"
                    value={formData.campaignTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, campaignTitle: e.target.value }))}
                    placeholder="예: 강남 맛집 족발 체험단 모집"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
            </section>

            {/* 캠페인 이미지 */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                        캠페인 이미지 {!uploadLater && <span className="text-red-500">*</span>}
                    </h2>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={uploadLater}
                            onChange={(e) => setUploadLater(e.target.checked)}
                            className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">나중에 업로드하기</span>
                    </label>
                </div>

                {uploadLater ? (
                    <div className="p-6 bg-amber-50 rounded-lg border border-amber-200 text-center">
                        <ImageIcon size={48} className="mx-auto text-amber-600 mb-3" />
                        <p className="text-amber-900 font-medium mb-1">이미지를 나중에 업로드합니다</p>
                        <p className="text-sm text-amber-700">
                            캠페인 등록 후 관리자 페이지에서 이미지를 추가할 수 있습니다.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {/* 대표 이미지 */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                                    대표 이미지 <span className="text-red-500">*</span>
                                </h3>
                                {formData.campaignImages[0] ? (
                                    <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-blue-500 group">
                                        <img
                                            src={formData.campaignImages[0]}
                                            alt="대표 이미지"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs font-semibold rounded">
                                            대표
                                        </div>
                                        <button
                                            onClick={() => removeImage(0)}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors bg-gray-50">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                        />
                                        <Upload className="text-gray-400" size={32} />
                                        <span className="text-sm font-medium text-gray-600">대표 이미지</span>
                                    </label>
                                )}
                            </div>

                            {/* 상세 이미지 1 (기본) */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                                    상세 이미지
                                </h3>
                                {formData.campaignImages[1] ? (
                                    <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 group">
                                        <img
                                            src={formData.campaignImages[1]}
                                            alt="상세 이미지 1"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            onClick={() => removeImage(1)}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            disabled={!formData.campaignImages[0]}
                                        />
                                        <Upload className="text-gray-400" size={32} />
                                        <span className="text-sm text-gray-500">추가</span>
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* 추가 상세 이미지 (2, 3번) */}
                        {formData.campaignImages.length > 2 && (
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                {[2, 3].map((index) => (
                                    formData.campaignImages[index] && (
                                        <div key={index}>
                                            <h3 className="text-sm font-semibold text-gray-700 mb-2">
                                                상세 이미지 {index}
                                            </h3>
                                            <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 group">
                                                <img
                                                    src={formData.campaignImages[index]}
                                                    alt={`상세 이미지 ${index}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                <button
                                                    onClick={() => removeImage(index)}
                                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        )}

                        {/* 상세 이미지 추가 버튼 */}
                        {formData.campaignImages.length > 0 && formData.campaignImages.length < 4 && (
                            <button
                                onClick={() => document.getElementById('add-detail-image')?.click()}
                                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <Upload size={20} />
                                <span className="font-medium">상세 이미지 추가 (최대 3개)</span>
                                <input
                                    id="add-detail-image"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                            </button>
                        )}

                        <p className="mt-3 text-xs text-gray-500 text-center">
                            💡 대표 이미지 1개 + 상세 이미지 최대 3개 (총 4개)까지 업로드 가능합니다.
                        </p>
                    </>
                )}
            </section>

            {/* 구매평 미션 가이드 */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                    구매평 미션 가이드 <span className="text-red-500">*</span>
                </h2>

                {/* 글자 수 */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                        📝 글자 수 (택1) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-3">
                        {[
                            { value: 'free', label: '자유' },
                            { value: 'short', label: '20자 내외 간단히' },
                            { value: 'medium', label: '150자 내외' },
                            { value: 'long', label: '300자 이상' },
                            { value: 'custom', label: '가이드에 직접 작성' },
                        ].map((option) => (
                            <label
                                key={option.value}
                                className={`flex items-center px-4 py-2 border-2 rounded-lg cursor-pointer transition-all ${formData.textLength === option.value
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 hover:border-blue-300'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="textLength"
                                    value={option.value}
                                    checked={formData.textLength === option.value}
                                    onChange={(e) => setFormData(prev => ({ ...prev, textLength: e.target.value as any }))}
                                    className="mr-2"
                                />
                                <span className="text-sm font-medium">{option.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* 사진 업로드 조건 */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                        📷 사진 업로드 조건 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-3">
                        {[
                            { value: '1', label: '1장' },
                            { value: '3', label: '3장' },
                            { value: '5', label: '5장' },
                            { value: 'none', label: '사진 미포함' },
                        ].map((option) => (
                            <label
                                key={option.value}
                                className={`flex items-center px-4 py-2 border-2 rounded-lg cursor-pointer transition-all ${formData.photoCount === option.value
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 hover:border-blue-300'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="photoCount"
                                    value={option.value}
                                    checked={formData.photoCount === option.value}
                                    onChange={(e) => setFormData(prev => ({ ...prev, photoCount: e.target.value as any }))}
                                    className="mr-2"
                                />
                                <span className="text-sm font-medium">{option.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* 동영상 포함 */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                        🎥 동영상 포함 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-3">
                        {[
                            { value: 'yes', label: '포함' },
                            { value: 'no', label: '미포함' },
                        ].map((option) => (
                            <label
                                key={option.value}
                                className={`flex items-center px-4 py-2 border-2 rounded-lg cursor-pointer transition-all ${formData.videoRequired === option.value
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 hover:border-blue-300'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="videoRequired"
                                    value={option.value}
                                    checked={formData.videoRequired === option.value}
                                    onChange={(e) => setFormData(prev => ({ ...prev, videoRequired: e.target.value as any }))}
                                    className="mr-2"
                                />
                                <span className="text-sm font-medium">{option.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* 작성 가이드 */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        ✍️ 작성 가이드 (선택)
                    </label>
                    <textarea
                        value={formData.missionGuide}
                        onChange={(e) => setFormData(prev => ({ ...prev, missionGuide: e.target.value }))}
                        placeholder="자유롭게 작성해주세요"
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* 경제적 대가 고지 문구 */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <h3 className="text-sm font-bold text-amber-900 mb-2">⚠️ 경제적 대가 고지 문구</h3>
                    <p className="text-sm text-amber-800 leading-relaxed">
                        공정위 문구 게재 법에 따라 필수 포함되어야 하며, <strong>"협찬"</strong> 문구 없이 진행 시 발생하는 문제의 책임은 이용자에게 있습니다.
                    </p>
                </div>
            </section>

            {/* 필수 키워드 */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">필수 키워드</h2>

                <div className="flex gap-2 mb-3">
                    <input
                        type="text"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                        placeholder="키워드 입력 후 Enter"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        onClick={addKeyword}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        추가
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {formData.keywords.map((keyword, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                        >
                            #{keyword}
                            <button
                                onClick={() => removeKeyword(keyword)}
                                className="hover:text-blue-900"
                            >
                                <X size={14} />
                            </button>
                        </span>
                    ))}
                </div>

                {formData.keywords.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                        리뷰에 반드시 포함되어야 할 키워드를 추가해주세요.
                    </p>
                )}
            </section>

            {/* 금지 키워드 */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">금지 키워드</h2>

                <div className="flex gap-2 mb-3">
                    <input
                        type="text"
                        value={prohibitedInput}
                        onChange={(e) => setProhibitedInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addProhibited()}
                        placeholder="금지어 입력 후 Enter"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        onClick={addProhibited}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                        추가
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {formData.prohibitedWords.map((word, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                        >
                            {word}
                            <button
                                onClick={() => removeProhibited(word)}
                                className="hover:text-red-900"
                            >
                                <X size={14} />
                            </button>
                        </span>
                    ))}
                </div>

                {formData.prohibitedWords.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                        리뷰에 사용하면 안 되는 단어나 경쟁사 이름 등을 추가해주세요.
                    </p>
                )}
            </section>

            {/* 추가 안내사항 */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">추가 안내사항</h2>
                <textarea
                    value={formData.additionalNotes}
                    onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                    placeholder="리뷰어에게 전달할 추가 안내사항이 있다면 작성해주세요."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </section>

            {/* 버튼 */}
            <div className="flex justify-between">
                <button
                    onClick={onPrev}
                    className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <ChevronLeft size={20} />
                    이전 단계
                </button>

                <button
                    onClick={handleNext}
                    disabled={!isFormValid()}
                    className={`px-8 py-3 rounded-lg font-semibold transition-all ${isFormValid()
                        ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    다음 단계로
                </button>
            </div>
        </div>
    );
}
