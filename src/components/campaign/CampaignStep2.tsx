'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronRight, ChevronLeft, Upload, X, Image as ImageIcon, Hash, MapPin, Link as LinkIcon, Save, Check, Info, GripVertical } from 'lucide-react';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { toast } from 'sonner';
import { CampaignActionButtons } from './CampaignActionButtons';
import { supabase } from '@/lib/supabase/client';
import { createImageVariantForUpload } from '@/lib/utils/imageUtils';
import { CampaignImageVariant } from '@/types/database';

// @dnd-kit imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const MAX_CAMPAIGN_ORIGINAL_IMAGE_BYTES = 10 * 1024 * 1024;
const CAMPAIGN_THUMBNAIL_WIDTH = 500;
const CAMPAIGN_MEDIUM_WIDTH = 1200;

// --- Sortable Image Item Component ---
interface SortableImageItemProps {
    id: string;
    url: string;
    index: number;
    onRemove: () => void;
}

function SortableImageItem({ id, url, index, onRemove }: SortableImageItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            className={`
                relative aspect-square rounded-xl overflow-hidden group transition-all duration-300
                ${index === 0 
                    ? 'border-2 border-rose-500 shadow-md ring-2 ring-rose-50' 
                    : 'border-2 border-slate-100 hover:border-slate-300'}
                ${isDragging ? 'opacity-50 scale-105 shadow-xl z-50' : 'opacity-100'}
            `}
        >
            <img src={url} alt={`CamImg-${index}`} className="w-full h-full object-cover" />
            
            {/* 드래그 영역 (전체 커버) */}
            <div 
                {...attributes} 
                {...listeners} 
                className="absolute inset-0 cursor-move z-0" 
            />

            {/* 컨트롤 레이어 */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
            
            {/* 순서 핸들 아이콘 (호버 시 표시) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none">
                <GripVertical className="text-white" size={24} />
            </div>

            {/* 대표 배지 */}
            {index === 0 && (
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-md shadow-sm z-10 animate-in fade-in zoom-in duration-300">
                    대표 이미지
                </div>
            )}

            {/* 삭제 버튼 */}
            <button 
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemove();
                }}
                className="absolute top-2 right-2 p-1.5 bg-white/90 text-slate-600 rounded-full hover:bg-rose-500 hover:text-white transition-all shadow-sm z-10 opacity-0 group-hover:opacity-100"
            >
                <X size={14} />
            </button>
        </div>
    );
}


// Step1Data 인터페이스 (Step1에서 전달받는 데이터)
interface Step1Data {
    campaignType: 'DELIVERY' | 'VISIT' | 'PRESS' | null;
    includeReview: boolean;
    includeNaver: boolean;
    includeInstagram: boolean;
    productUrl: string;
    productName: string;
    campaignTitle: string; 
    platform: 'BLOG' | 'INSTAGRAM' | null;
    stores?: { storeName: string; address?: string; naverPlaceUrl?: string; }[];
    region?: string;
    category?: string;
    productOptions?: { id: string; optionName: string; optionPrice: string; recruitmentCount: string; }[];
}

interface Step2Data {
    campaignTitle: string;
    campaignImages: string[];
    campaignImageVariants: CampaignImageVariant[];

    // 구매평 가이드 (Shopping Mall Review)
    purchaseNotes: string;
    reviewMissionContent: string;

    // 공통 리뷰 가이드
    textLength: 'free' | 'short' | 'medium' | 'long' | 'custom';
    photoCount: '1' | '3' | '5' | 'none';
    videoRequired: 'yes' | 'no';
    missionGuide: string;
    keywords: string[];
    prohibitedWords: string[];
    additionalNotes: string;

    blogMainKeywords: string[];
    blogTitleGuide: string;
    blogContentGuide: string;
    blogMapRequired: boolean;
    blogRequiredLinks: string[];

    // 인스타그램 가이드 (Instagram)
    instagramHashtags: string[];
    instagramAccountTag: string;
    instagramPhotoGuide: string;
    instagramReelsRequired: boolean;
}

interface CampaignStep2Props {
    onNext: (data?: Step2Data) => void;
    onPrev: () => void;
    onSaveDraft?: () => void;
    isEdit?: boolean;
    submitTrigger?: number;
}

import { useCampaignStore } from '@/store/campaignStore';

export default function CampaignStep2({ onNext, onPrev, onSaveDraft, isEdit, submitTrigger = 0 }: CampaignStep2Props) {
    const store = useCampaignStore();
    const formData = store;

    // HUD 버튼 연동
    const lastTrigger = useRef(submitTrigger);
    useEffect(() => {
        if (submitTrigger > 0 && submitTrigger !== lastTrigger.current) {
            lastTrigger.current = submitTrigger;
            handleNext();
        }
    }, [submitTrigger]);


    // DND Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px 이동해야 드래그 시작 (클릭과 구분)
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = imageVariants.findIndex((variant) => variant.thumbnailUrl === active.id);
            const newIndex = imageVariants.findIndex((variant) => variant.thumbnailUrl === over.id);
            if (oldIndex < 0 || newIndex < 0) return;
            const reorderedVariants = arrayMove(imageVariants, oldIndex, newIndex);
            store.updateFields({
                campaignImageVariants: reorderedVariants,
                campaignImages: reorderedVariants.map((variant) => variant.mediumUrl),
            });
        }
    };

    // 실시간 데이터 변경 알림 (중앙 스토어 사용으로 제거됨)

    const [keywordInput, setKeywordInput] = useState('');
    const [prohibitedInput, setProhibitedInput] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadLater, setUploadLater] = useState(false);

    // 블로그 관련 입력 상태
    const [blogMainKeywordInput, setBlogMainKeywordInput] = useState('');
    const [blogSubKeywordInput, setBlogSubKeywordInput] = useState('');
    const [blogLinkInput, setBlogLinkInput] = useState('');

    // 인스타그램 관련 입력 상태
    const [instagramHashtagInput, setInstagramHashtagInput] = useState('');
    const imageVariants = useMemo<CampaignImageVariant[]>(() => {
        if (Array.isArray(formData.campaignImageVariants) && formData.campaignImageVariants.length > 0) {
            return formData.campaignImageVariants;
        }

        return formData.campaignImages.map((url) => ({
            originalPath: null,
            thumbnailUrl: url,
            mediumUrl: url,
        }));
    }, [formData.campaignImageVariants, formData.campaignImages]);

    // AI 추천 키워드 생성 로직
    const [recommendedKeywords, setRecommendedKeywords] = useState<string[]>([]);
    const [recommendedSubKeywords, setRecommendedSubKeywords] = useState<string[]>([]);
    const [recommendedInstagramHashtags, setRecommendedInstagramHashtags] = useState<string[]>([]);
    const [recommendedGeneralKeywords, setRecommendedGeneralKeywords] = useState<string[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        const fetchAIKeywords = async () => {
            if (!formData.includeNaver && !formData.includeInstagram) return null;
            
            setIsAnalyzing(true);
            try {
                const response = await fetch('/api/campaign/ai-keywords', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        region: formData.region,
                        storeName: formData.stores?.[0]?.storeName,
                        productName: formData.productName,
                        campaignType: formData.campaignType,
                        category: formData.category,
                        campaignTitle: formData.campaignTitle
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    setRecommendedKeywords(data.mainKeywords || []);
                    setRecommendedSubKeywords(data.subKeywords || []);
                    setRecommendedInstagramHashtags(data.hashtags || []);
                    setRecommendedGeneralKeywords([...(data.mainKeywords || []), ...(data.subKeywords || [])].slice(0, 10));
                }
            } catch (error) {
                console.error('Failed to fetch AI keywords:', error);
            } finally {
                setIsAnalyzing(false);
            }
        };

        fetchAIKeywords();
    }, [formData.productName, formData.region, formData.campaignType, formData.includeNaver, formData.includeInstagram, formData.campaignTitle]);

    // 카테고리별 본문/사진 가이드 자동 설정
    useEffect(() => {
        const category = formData.category || '기타';
        const productName = formData.productName || formData.campaignTitle || '본 제품';

        // 블로그 가이드 기본값 설정
        if (formData.includeNaver && (!formData.blogContentGuide || formData.blogContentGuide.trim() === '')) {
            let blogGuide = '';
            if (category.includes('뷰티') || category.includes('미용')) {
                blogGuide = `[${productName}] 뷰티/화장품 리뷰 가이드\n- 피부 타입과 피부 고민(건성/지성 등)을 서두에 기재해 주세요.\n- 제형(텍스처)과 발림성을 시각적으로 잘 보여주는 GIF 및 텍스처 근접 사진을 필수로 1장 이상 포함해 주세요.\n- 최소 일주일 이상 직접 사용해본 후 느낀 변화점과 전/후 사진 비교를 상세하게 작성해 주세요.`;
            } else if (category.includes('맛집') || category.includes('식품')) {
                blogGuide = `[${productName}] 맛집/식품 리뷰 가이드\n- 매장 외관, 내부 인테리어 분위기, 메뉴판 사진을 필수로 포함해 주세요.\n- 메인 요리의 먹음직스러운 사진(근접샷)과 함께 생생한 맛 표현을 자유롭게 작성해 주세요.\n- 주변 볼거리나 데이트 코스와 엮어서 소개하면 더욱 좋습니다.`;
            } else if (category.includes('패션') || category.includes('의류')) {
                blogGuide = `[${productName}] 패션 리뷰 가이드\n- 본인의 평소 사이즈(키, 몸무게 등 체형 정보)를 언급해 주시면 독자들에게 도움이 됩니다.\n- 원단 느낌, 마감처리 등 디테일한 부분에 대한 사진과 설명 부탁드립니다.\n- 전신 착용 컷 및 활동하는 모습 사진 최소 3장 이상 포함해 주세요.`;
            } else if (category.includes('생활') || category.includes('가전')) {
                blogGuide = `[${productName}] 생활/가전 리뷰 가이드\n- 언박싱 사진부터 실제 사용 준비 과정까지 상세히 담아주세요.\n- 제품의 주요 기능 2~3가지를 꼽아서 직접 작동해보는 영상(GIF 포함)을 첨부해 주세요.\n- 이 제품 덕분에 일상생활이 얼마나 편리해졌는지 솔직한 후기를 남겨주세요.`;
            } else {
                blogGuide = `[${productName}] 블로그 본문 작성 가이드\n- 직접 체험(사용)하고 느낀 장점 3가지를 구체적으로 작성해 주세요.\n- 전체적인 이용 만족도와 추천 의사를 솔직하게 표현해 주시면 좋습니다.\n- 제품 패키지와 본품 사진, 그리고 실제 사용 중인 사진을 5장 이상 포함해 주세요.`;
            }
            // 이미 값이 있는 경우 덮어쓰지 않도록 초기 설정 시에만 반영
            store.setField('blogContentGuide', blogGuide);
        }

        // 인스타그램 가이드 기본값 설정
        if (formData.includeInstagram && (!formData.instagramPhotoGuide || formData.instagramPhotoGuide.trim() === '')) {
            let instaGuide = '';
            if (category.includes('뷰티') || category.includes('미용')) {
                instaGuide = `[${productName}] 뷰티 포스팅 가이드\n- 얼굴에 직접 제품을 바르는 모습이나 제형이 돋보이는 영상/릴스를 1개 이상 포함해 주세요.\n- 비포/애프터 차이가 명확히 보이는 사진이나 손등 테스트 컷 2장 이상 필수.\n- 뷰티 관련 해시태그 최대한 활용해 주세요!`;
            } else if (category.includes('맛집') || category.includes('식품')) {
                instaGuide = `[${productName}] 맛집/식품 포스팅 가이드\n- 윤기가 흐르는 음식 확대컷과 먹음직스러운 동영상(릴스) 1개 이상 필수.\n- 식당의 전체적인 분위기를 느낄 수 있는 사진 1~2장 포함해 주세요.\n- 첫 장에 가장 시선을 끄는 예쁜 음식 사진을 배치해 주세요.`;
            } else if (category.includes('패션') || category.includes('의류')) {
                instaGuide = `[${productName}] 패션 포스팅 가이드\n- 전신 핏과 코디 느낌이 잘 보이는 착장 사진 최소 2장 이상 필수.\n- 제품의 디테일(로고, 색상, 소재 등)을 포인트로 한 근접컷 1장 포함해 주세요.\n- 데일리룩이나 스타일링 팁을 릴스로 제작해 주시면 더욱 좋습니다!`;
            } else if (category.includes('생활') || category.includes('가전')) {
                instaGuide = `[${productName}] 생활/가전 포스팅 가이드\n- 제품이 우리 집 인테리어와 자연스럽게 어우러지는 감성적인 연출컷 1장 필수.\n- 주요 기능이 잘 드러나는 시연 영상이나 릴스를 포함해 주세요.\n- 생활 공간에서 실제로 제품을 사용하는 자연스러운 모습을 담아주세요.`;
            } else {
                instaGuide = `[${productName}] 인스타그램 포스팅 가이드\n- 제품(서비스)의 매력이 돋보이는 썸네일 사진으로 피드 첫 장을 꾸며주세요.\n- 자유롭고 감각적인 사진 3장 이상과 체험 인증 영상을 꼭 포함해 주세요.\n- 피드 본문에 제품의 장점과 추천 이유를 솔직하게 녹여주세요.`;
            }
            store.setField('instagramPhotoGuide', instaGuide);
        }
    }, [formData.category, formData.productName, formData.campaignTitle, formData.includeNaver, formData.includeInstagram]);


    // 이미지 업로드 핸들러
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (!formData.campaignTitle && !formData.productName) {
            toast.error('캠페인 제목 또는 제품명을 먼저 입력해주세요.');
            return;
        }

        const remainingSlots = 4 - imageVariants.length;
        if (remainingSlots <= 0) {
            toast.error('최대 4개의 이미지만 업로드 가능합니다.');
            return;
        }

        setUploadingImage(true);
        const newVariants: CampaignImageVariant[] = [];
        const filesToUpload = Math.min(files.length, remainingSlots);

        try {
            for (let i = 0; i < filesToUpload; i++) {
                const file = files[i];
                // 파일 확장자 보안 체크
                const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
                const fileExt = file.name.split('.').pop()?.toLowerCase();

                if (!fileExt || !allowedExtensions.includes(fileExt)) {
                    toast.error(`허용되지 않는 파일 형식입니다: ${file.name}`);
                    continue;
                }

                if (file.size > MAX_CAMPAIGN_ORIGINAL_IMAGE_BYTES) {
                    toast.error(`${file.name} 파일이 10MB를 초과합니다. 10MB 이하 이미지만 업로드할 수 있습니다.`);
                    continue;
                }

                const [thumbnailImage, mediumImage] = await Promise.all([
                    createImageVariantForUpload(file, {
                        targetWidth: CAMPAIGN_THUMBNAIL_WIDTH,
                        quality: 0.68,
                        outputType: 'image/webp',
                        suffix: '_thumb',
                    }),
                    createImageVariantForUpload(file, {
                        targetWidth: CAMPAIGN_MEDIUM_WIDTH,
                        quality: 0.78,
                        outputType: 'image/webp',
                        suffix: '_medium',
                    }),
                ]);

                const fileBase = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
                const originalPath = `campaigns/original/${fileBase}.${fileExt}`;
                const thumbnailPath = `campaigns/thumb/${fileBase}.${thumbnailImage.extension}`;
                const mediumPath = `campaigns/medium/${fileBase}.${mediumImage.extension}`;

                const uploadFile = async (filePath: string, uploadFile: File) => {
                    const { error } = await supabase.storage
                        .from('files')
                        .upload(filePath, uploadFile, {
                            cacheControl: '31536000',
                            upsert: false
                        });

                    if (error) throw error;
                };

                await uploadFile(originalPath, file);
                await uploadFile(thumbnailPath, thumbnailImage.file);
                await uploadFile(mediumPath, mediumImage.file);

                const { data: { publicUrl: thumbnailUrl } } = supabase.storage
                    .from('files')
                    .getPublicUrl(thumbnailPath);
                const { data: { publicUrl: mediumUrl } } = supabase.storage
                    .from('files')
                    .getPublicUrl(mediumPath);

                newVariants.push({
                    originalPath,
                    thumbnailUrl,
                    mediumUrl,
                    width: mediumImage.width,
                    height: mediumImage.height,
                    originalSize: file.size,
                    thumbnailSize: thumbnailImage.size,
                    mediumSize: mediumImage.size,
                });
            }

            if (newVariants.length > 0) {
                const nextVariants = [...imageVariants, ...newVariants];
                store.updateFields({
                    campaignImageVariants: nextVariants,
                    campaignImages: nextVariants.map((variant) => variant.mediumUrl),
                });
                toast.success(`${newVariants.length}개의 이미지가 업로드되었습니다.`);
            }
        } catch (error: unknown) {
            const uploadError = error as { message?: string; status?: number };
            console.error('이미지 처리 중 치명적 오류:', error);
            if (uploadError.message?.includes('bucket not found') || uploadError.message?.includes('does not exist')) {
                toast.error('스토리지 버킷이 존재하지 않습니다. 관리자에게 문의하세요.');
            } else if (uploadError.message?.includes('permission denied') || uploadError.status === 403) {
                toast.error('이미지 업로드 권한이 없습니다. (RLS 설정 확인 필요)');
            } else {
                toast.error(`이미지 처리 중 오류 발생: ${uploadError.message || '알 수 없는 오류'}`);
            }
        } finally {
            setUploadingImage(false);
            if (e.target) e.target.value = '';
        }
    };

    const removeImage = (index: number) => {
        const nextVariants = imageVariants.filter((_, i) => i !== index);
        store.updateFields({
            campaignImageVariants: nextVariants,
            campaignImages: nextVariants.map((variant) => variant.mediumUrl),
        });
    };

    // 키워드 관련 함수
    const addKeyword = () => {
        if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
            store.setField('keywords', [...formData.keywords, keywordInput.trim()]);
            setKeywordInput('');
        }
    };

    const removeKeyword = (keyword: string) => {
        store.setField('keywords', formData.keywords.filter(k => k !== keyword));
    };

    const addProhibited = () => {
        if (prohibitedInput.trim() && !formData.prohibitedWords.includes(prohibitedInput.trim())) {
            store.setField('prohibitedWords', [...formData.prohibitedWords, prohibitedInput.trim()]);
            setProhibitedInput('');
        }
    };

    const removeProhibited = (word: string) => {
        store.setField('prohibitedWords', formData.prohibitedWords.filter(w => w !== word));
    };

    // 블로그 메인 키워드 함수
    const addBlogMainKeyword = (keyword?: string) => {
        const kw = (keyword || blogMainKeywordInput).trim();
        if (!kw) return;
        
        if (formData.blogMainKeywords.length >= 3) {
            toast.error('메인 키워드는 최대 3개까지만 등록 가능합니다.');
            return;
        }

        if (!formData.blogMainKeywords.includes(kw)) {
            store.setField('blogMainKeywords', [...formData.blogMainKeywords, kw]);
            setBlogMainKeywordInput('');
        }
    };

    const removeBlogMainKeyword = (keyword: string) => {
        store.setField('blogMainKeywords', formData.blogMainKeywords.filter(k => k !== keyword));
    };

    const addBlogSubKeyword = () => {
        if (blogSubKeywordInput.trim() && !formData.blogSubKeywords.includes(blogSubKeywordInput.trim())) {
            store.setField('blogSubKeywords', [...formData.blogSubKeywords, blogSubKeywordInput.trim()]);
            setBlogSubKeywordInput('');
        }
    };

    const removeBlogSubKeyword = (keyword: string) => {
        store.setField('blogSubKeywords', formData.blogSubKeywords.filter(k => k !== keyword));
    };

    const addBlogLink = () => {
        if (blogLinkInput.trim() && !formData.blogRequiredLinks.includes(blogLinkInput.trim())) {
            store.setField('blogRequiredLinks', [...formData.blogRequiredLinks, blogLinkInput.trim()]);
            setBlogLinkInput('');
        }
    };

    const removeBlogLink = (link: string) => {
        store.setField('blogRequiredLinks', formData.blogRequiredLinks.filter(l => l !== link));
    };

    // 인스타그램 관련 함수
    const addInstagramHashtag = () => {
        let hashtag = instagramHashtagInput.trim();
        if (!hashtag) return;

        // 자동으로 # 추가
        if (!hashtag.startsWith('#')) {
            hashtag = '#' + hashtag;
        }

        if (!formData.instagramHashtags.includes(hashtag)) {
            store.setField('instagramHashtags', [...formData.instagramHashtags, hashtag]);
            setInstagramHashtagInput('');
        }
    };

    const removeInstagramHashtag = (hashtag: string) => {
        store.setField('instagramHashtags', formData.instagramHashtags.filter(h => h !== hashtag));
    };

    // 폼 유효성 검사
    const isFormValid = () => {
        if (!formData.campaignTitle.trim()) return false;
        if (!uploadLater && imageVariants.length === 0) return false;

        // 블로그 선택 시 메인 키워드 필수 (2~3개 권장)
        if (formData.includeNaver && formData.blogMainKeywords.length < 1) {
            return false;
        }

        return true;
    };

    const handleNext = () => {
        if (isFormValid()) {
            onNext(formData);
        } else {
            toast.error('필수 항목을 모두 입력해주세요.');
        }
    };

    // 배송체험단 여부 확인
    const isDeliveryCampaign = formData.campaignType === 'DELIVERY';
    const isVisitOrPressCampaign = formData.campaignType === 'VISIT' || formData.campaignType === 'PRESS';

    // 구매평 가이드: 배송체험단 + 구매평 선택 시
    const showReviewGuide = isDeliveryCampaign && formData.includeReview;

    // 블로그 가이드: 배송체험단(includeNaver) 또는 방문/기자단(platform=BLOG)
    const showBlogGuide = formData.includeNaver || (isVisitOrPressCampaign && formData.platform === 'BLOG');

    // 인스타그램 가이드: 배송체험단(includeInstagram) 또는 방문/기자단(platform=INSTAGRAM)
    const showInstagramGuide = formData.includeInstagram || (isVisitOrPressCampaign && formData.platform === 'INSTAGRAM');

    return (
        <div className="w-full space-y-8 pb-10">


            {/* 캠페인 제목 */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-slate-800">캠페인 제목 (모집글 제목)</h2>
                            <HelpTooltip content="캠페인 제목은 1단계에서 확인 및 수정이 가능합니다. 인플루언서에게 가장 먼저 노출되는 정보이니 신중히 검토해주세요." />
                        </div>
                        <span className="text-[11px] font-bold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full uppercase">Step 1 완료</span>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            value={formData.campaignTitle || ''}
                            readOnly
                            className="w-full h-12 px-4 border border-slate-100 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed font-medium"
                        />
                    </div>
                </div>
            </section>

            {/* 캠페인 이미지 */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-900">
                            캠페인 이미지 {!uploadLater && <span className="text-red-500">*</span>}
                        </h2>
                        {!uploadLater && <HelpTooltip content="대표 이미지 1개와 상세 이미지 최대 3개(총 4개)까지 업로드 가능합니다. 고화질 이미지를 권장합니다." />}
                    </div>
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
                        <div className="mb-6">
                            <DndContext 
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext 
                                    items={imageVariants.map((variant) => variant.thumbnailUrl)}
                                    strategy={rectSortingStrategy}
                                >
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                                        {imageVariants.map((variant, index) => (
                                            <SortableImageItem
                                                key={`${variant.thumbnailUrl}-${index}`}
                                                id={variant.thumbnailUrl}
                                                url={variant.thumbnailUrl}
                                                index={index}
                                                onRemove={() => removeImage(index)}
                                            />
                                        ))}

                                        {/* 빈 슬롯 표시 */}
                                        {Array.from({ length: 4 - imageVariants.length }).map((_, idx) => (
                                            <div key={`empty-${idx}`} className="space-y-1.5">
                                                <div 
                                                    className={`
                                                        aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all cursor-pointer
                                                        ${imageVariants.length === 0 && idx === 0
                                                            ? 'border-rose-200 bg-rose-50/30' 
                                                            : 'border-slate-100 bg-slate-50/30 hover:border-slate-300 hover:bg-slate-50'}
                                                    `}
                                                    onClick={() => document.getElementById('image-upload-input')?.click()}
                                                >
                                                    <div className={`p-2 rounded-full ${imageVariants.length === 0 && idx === 0 ? 'bg-rose-100 text-rose-500' : 'bg-slate-100 text-slate-400'}`}>
                                                        <Upload size={20} />
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-400">
                                                        {imageVariants.length === 0 && idx === 0 ? '대표 이미지 등록' : '추가 등록'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>

                            <input
                                id="image-upload-input"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </div>

                        {/* 하단 도움말 */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-2">
                            <div className="flex gap-2 items-start">
                                <Info size={16} className="text-slate-400 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-[13px] text-slate-600 leading-snug">
                                        첫 번째 이미지가 <strong>대표 이미지</strong>로 설정됩니다.
                                    </p>
                                    <p className="text-[12px] text-slate-500">
                                        이미지를 드래그하여 순서를 자유롭게 변경할 수 있습니다. (최대 4개)
                                    </p>
                                </div>
                            </div>
                        </div>

                    </>
                )}
            </section>

            {/* ========== Section A: 구매평 미션 가이드 (배송체험단 + 구매평 선택 시) ========== */}
            {showReviewGuide && (
                <section className="bg-white rounded-xl shadow-sm border-2 border-blue-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="text-3xl">🛒</div>
                        <h2 className="text-2xl font-bold text-gray-900">구매평 미션 가이드</h2>
                    </div>

                    <div className="h-px bg-gradient-to-r from-blue-200 via-blue-300 to-blue-200 mb-6"></div>


                    {/* 구매 시 주의사항 */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            구매 시 주의사항
                        </label>
                        <textarea
                            value={formData.purchaseNotes || ''}
                            onChange={(e) => store.setField('purchaseNotes', e.target.value)}
                            placeholder="예: 비공개 요청, 쿠폰 사용 금지 등"
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* 미션 내용 */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            미션 내용
                        </label>
                        <textarea
                            value={formData.reviewMissionContent || ''}
                            onChange={(e) => store.setField('reviewMissionContent', e.target.value)}
                            placeholder='예: "찜하기 필수", "포토리뷰 필수"'
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* 필수 키워드 (구매평 전용) */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                            <Check size={16} className="text-blue-600" />
                            리뷰 필수 포함 키워드
                        </label>
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
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
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
                    </div>

                    {/* 구분선 */}
                    <div className="h-px bg-gradient-to-r from-blue-200 via-blue-300 to-blue-200 my-8"></div>

                    {/* 리뷰 작성 가이드 */}
                    <h3 className="text-lg font-bold text-gray-800 mb-4">📝 리뷰 작성 가이드</h3>

                    {/* 글자 수 */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            글자 수 (택1)
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
                                        onChange={(e) => store.setField('textLength', e.target.value as any)}
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
                            📷 사진 업로드 조건
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
                                        onChange={(e) => store.setField('photoCount', e.target.value as any)}
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
                            🎥 동영상 포함
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
                                        onChange={(e) => store.setField('videoRequired', e.target.value as any)}
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
                            value={formData.missionGuide || ''}
                            onChange={(e) => store.setField('missionGuide', e.target.value)}
                            placeholder="자유롭게 작성해주세요"
                            rows={6}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="mt-8 bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 flex items-start gap-3 text-left">
                        <Info size={18} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <h3 className="text-[14px] font-bold text-indigo-950 mb-1">⚠️ 경제적 대가 고지 필수 안내</h3>
                            <p className="text-[13px] text-indigo-700 leading-relaxed font-medium">
                                공정위 문구 게재 법에 따라 필수 포함되어야 하며, <strong className="font-bold">"협찬"</strong> 문구 없이 진행 시 발생하는 문제의 책임은 이용자에게 있습니다.
                            </p>
                        </div>
                    </div>
                </section>
            )}

            {/* ========== Section B-1: 블로그 포스팅 가이드 (네이버 선택 시) ========== */}
            {showBlogGuide && (
                <section className="bg-white rounded-xl shadow-sm border-2 border-rose-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="text-3xl">📝</div>
                        <h2 className="text-2xl font-bold text-gray-900">블로그 리뷰 미션</h2>
                    </div>

                    <div className="h-px bg-gradient-to-r from-rose-200 via-rose-300 to-rose-200 mb-6"></div>

                    {/* 메인 키워드 */}
                    <div className="mb-6">
                        <label className="block text-sm font-black text-gray-700 mb-2 flex items-center gap-1.5">
                            <Check size={16} className="text-purple-600" />
                            메인 필수 키워드 (2~3개 권장) <span className="text-red-500">*</span>
                        </label>
                        
                        <div className="flex gap-2 mb-3">
                            <div className={`flex-1 flex flex-wrap items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent bg-white transition-all ${formData.blogMainKeywords.length >= 3 ? 'bg-gray-50' : ''}`}>
                                {formData.blogMainKeywords.map((keyword, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-lg text-sm font-bold animate-in fade-in zoom-in duration-200"
                                    >
                                        #{keyword}
                                        <button
                                            onClick={() => removeBlogMainKeyword(keyword)}
                                            className="hover:text-purple-900 transition-colors p-0.5 hover:bg-purple-100 rounded-full"
                                        >
                                            <X size={13} />
                                        </button>
                                    </span>
                                ))}
                                <input
                                    type="text"
                                    value={blogMainKeywordInput}
                                    onChange={(e) => setBlogMainKeywordInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addBlogMainKeyword()}
                                    placeholder={formData.blogMainKeywords.length >= 3 ? "최대 3개까지 등록 가능합니다" : "키워드 입력 후 Enter"}
                                    className="flex-1 min-w-[150px] outline-none bg-transparent font-bold placeholder:font-normal"
                                    disabled={formData.blogMainKeywords.length >= 3}
                                />
                            </div>
                            <button
                                onClick={() => addBlogMainKeyword()}
                                disabled={formData.blogMainKeywords.length >= 3}
                                className={`px-6 py-2 rounded-lg font-bold transition-colors shadow-sm ${
                                    formData.blogMainKeywords.length >= 3 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : 'bg-purple-600 text-white hover:bg-purple-700'
                                }`}
                            >
                                추가
                            </button>
                        </div>
                        
                        {/* AI 추천 메인 키워드 */}
                        {isAnalyzing ? (
                            <div className="mt-3 animate-pulse">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                                    <div className="h-3 w-32 bg-gray-200 rounded"></div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="h-8 w-20 bg-gray-100 rounded-lg"></div>
                                    <div className="h-8 w-24 bg-gray-100 rounded-lg"></div>
                                </div>
                            </div>
                        ) : recommendedKeywords.length > 0 && (
                            <div className="mt-3">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[10px] text-white font-bold">AI</div>
                                    <span className="text-xs font-bold text-indigo-600">다온 AI 추천 메인 키워드</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {recommendedKeywords.map((kw, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => addBlogMainKeyword(kw)}
                                            disabled={formData.blogMainKeywords.length >= 3 || formData.blogMainKeywords.includes(kw)}
                                            className={`group relative px-3 py-1.5 bg-white text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200 shadow-sm overflow-hidden ${
                                                (formData.blogMainKeywords.length >= 3 || formData.blogMainKeywords.includes(kw)) ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                        >
                                            <span className="relative z-10 flex items-center gap-1">
                                                <span className="text-indigo-400 group-hover:text-indigo-600 transition-colors">+</span> {kw}
                                            </span>
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-100/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <p className="mt-2 text-xs text-gray-500">
                            상위 노출을 목표로 하는 키워드를 입력하세요. 인플루언서는 이 중 <strong>1개를 선택</strong>하여 리뷰를 작성하게 됩니다.
                        </p>
                    </div>

                    {/* 서브 키워드 */}
                    <div className="mb-6">
                        <label className="block text-sm font-black text-gray-700 mb-2 flex items-center gap-1.5">
                            <Check size={16} className="text-green-600" />
                            서브 필수 키워드
                        </label>
                        <div className="flex gap-2 mb-3">
                            <div className="flex-1 flex flex-wrap items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent bg-white transition-all">
                                {formData.blogSubKeywords.map((keyword, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 border border-green-100 rounded-lg text-sm font-medium animate-in fade-in zoom-in duration-200"
                                    >
                                        #{keyword}
                                        <button
                                            onClick={() => removeBlogSubKeyword(keyword)}
                                            className="hover:text-green-900 transition-colors p-0.5 hover:bg-green-100 rounded-full"
                                        >
                                            <X size={13} />
                                        </button>
                                    </span>
                                ))}
                                <input
                                    type="text"
                                    value={blogSubKeywordInput}
                                    onChange={(e) => setBlogSubKeywordInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addBlogSubKeyword()}
                                    placeholder="본문에 포함할 단어 입력 후 Enter"
                                    className="flex-1 min-w-[150px] outline-none bg-transparent"
                                />
                            </div>
                            <button
                                onClick={addBlogSubKeyword}
                                className="px-6 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors shadow-sm"
                            >
                                추가
                            </button>
                        </div>

                        {/* AI 추천 서브 키워드 */}
                        {isAnalyzing ? (
                             <div className="mb-4 animate-pulse">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                                    <div className="h-3 w-32 bg-gray-200 rounded"></div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="h-8 w-20 bg-gray-100 rounded-lg"></div>
                                    <div className="h-8 w-24 bg-gray-100 rounded-lg"></div>
                                </div>
                            </div>
                        ) : recommendedSubKeywords.length > 0 && (
                            <div className="mb-3">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[10px] text-white font-bold">AI</div>
                                    <span className="text-xs font-bold text-emerald-600">다온 AI 추천 서브 키워드</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {recommendedSubKeywords.map((kw, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                if (!formData.blogSubKeywords.includes(kw)) {
                                                    store.setField('blogSubKeywords', [...formData.blogSubKeywords, kw]);
                                                }
                                            }}
                                            className="group relative px-3 py-1.5 bg-white text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 shadow-sm overflow-hidden"
                                        >
                                            <span className="relative z-10 flex items-center gap-1">
                                                <span className="text-emerald-400 group-hover:text-emerald-600 transition-colors">+</span> {kw}
                                            </span>
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-100/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 제목 가이드 */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            제목 가이드
                        </label>
                        <input
                            type="text"
                            value={formData.blogTitleGuide || ''}
                            onChange={(e) => store.setField('blogTitleGuide', e.target.value)}
                            placeholder="노출 잘되는 제목 필수 키워드를 하나 선택하여 자연스럽게 조합해주세요"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                        />
                    </div>

                    {/* 본문 작성 가이드 */}
                    <div className="mb-6">
                        <div className="h-px bg-gradient-to-r from-rose-200 via-rose-300 to-rose-200 my-8" />
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            본문 작성 가이드
                        </label>
                        <textarea
                            value={formData.blogContentGuide || ''}
                            onChange={(e) => store.setField('blogContentGuide', e.target.value)}
                            placeholder="예: 제품 사용 후기를 상세하게 작성해주세요. 장점과 단점을 균형있게 서술하고, 실제 사용 사진을 포함해주세요."
                            rows={5}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            블로그 본문 작성 시 리뷰어가 따라야 할 가이드를 자유롭게 작성해주세요.
                        </p>
                    </div>

                    {/* 지도 삽입 여부 - 방문체험단/기자단만 표시 */}
                    {(formData.campaignType === 'VISIT' || formData.campaignType === 'PRESS') && (
                        <div className="mb-6">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={formData.blogMapRequired}
                                    onChange={(e) => store.setField('blogMapRequired', e.target.checked)}
                                    className="w-5 h-5 text-rose-500 border-gray-300 rounded focus:ring-2 focus:ring-rose-500"
                                />
                                <div className="flex items-center gap-2">
                                    <MapPin size={20} className="text-rose-600" />
                                    <span className="font-medium text-gray-900 group-hover:text-rose-600 transition-colors">
                                        지도 삽입
                                    </span>
                                    <HelpTooltip content="방문체험단/기자단은 지도 삽입을 권장합니다. 오프라인 매장의 경우 방문객 유입에 큰 도움이 됩니다." />
                                </div>
                            </label>
                        </div>
                    )}
                </section>
            )}

            {/* ========== Section B-2: 인스타그램 포스팅 가이드 (인스타 선택 시) ========== */}
            {showInstagramGuide && (
                <section className="bg-white rounded-xl shadow-sm border-2 border-pink-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="text-3xl">📸</div>
                        <h2 className="text-2xl font-bold text-gray-900">인스타그램 리뷰 미션</h2>
                    </div>

                    <div className="h-px bg-gradient-to-r from-pink-200 via-pink-300 to-pink-200 mb-6"></div>

                    {/* 필수 해시태그 */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            필수 해시태그
                        </label>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={instagramHashtagInput}
                                onChange={(e) => setInstagramHashtagInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addInstagramHashtag()}
                                placeholder="예: 맛집, OO동카페 (자동으로 #이 붙습니다)"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            />
                            <button
                                onClick={addInstagramHashtag}
                                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                            >
                                추가
                            </button>
                        </div>

                        {/* AI 추천 인스타그램 해시태그 */}
                        {isAnalyzing ? (
                            <div className="mb-4 animate-pulse">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                                    <div className="h-3 w-32 bg-gray-200 rounded"></div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="h-8 w-20 bg-gray-100 rounded-lg"></div>
                                    <div className="h-8 w-24 bg-gray-100 rounded-lg"></div>
                                </div>
                            </div>
                        ) : recommendedInstagramHashtags.length > 0 && (
                            <div className="mb-4">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-[10px] text-white font-bold">AI</div>
                                    <span className="text-xs font-bold text-pink-600">다온 AI 추천 인기 해시태그</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {recommendedInstagramHashtags.map((ht, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                if (!formData.instagramHashtags.includes(ht)) {
                                                    store.setField('instagramHashtags', [...formData.instagramHashtags, ht]);
                                                }
                                            }}
                                            className="group relative px-3 py-1.5 bg-white text-pink-700 border border-pink-200 rounded-lg text-xs font-semibold hover:border-pink-400 hover:bg-pink-50 transition-all duration-200 shadow-sm overflow-hidden"
                                        >
                                            <span className="relative z-10 flex items-center gap-1">
                                                <span className="text-pink-400 group-hover:text-pink-600 transition-colors">+</span> {ht}
                                            </span>
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-100/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                            {formData.instagramHashtags.map((hashtag, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium"
                                >
                                    <Hash size={14} />
                                    {hashtag.replace('#', '')}
                                    <button
                                        onClick={() => removeInstagramHashtag(hashtag)}
                                        className="hover:text-pink-900"
                                    >
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <HelpTooltip content="해시태그는 자동으로 # 기호가 추가됩니다." />
                            <span className="text-xs text-gray-500">도움말</span>
                        </div>
                    </div>

                    {/* 계정 태그 */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            계정 태그 (@)
                        </label>
                        <input
                            type="text"
                            value={formData.instagramAccountTag || ''}
                            onChange={(e) => store.setField('instagramAccountTag', e.target.value)}
                            placeholder="예: @your_brand_account"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            사진에 태그할 공식 계정 ID를 입력하세요.
                        </p>
                    </div>

                    {/* 촬영 가이드 */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            촬영 가이드
                        </label>
                        <textarea
                            value={formData.instagramPhotoGuide || ''}
                            onChange={(e) => store.setField('instagramPhotoGuide', e.target.value)}
                            placeholder="예: 제품 상세컷 2장 이상, 동영상 1개 필수"
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        />
                    </div>

                    {/* 릴스 여부 */}
                    <div className="mb-6">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={formData.instagramReelsRequired}
                                onChange={(e) => store.setField('instagramReelsRequired', e.target.checked)}
                                className="w-5 h-5 text-pink-500 border-gray-300 rounded focus:ring-2 focus:ring-pink-500"
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">🎬</span>
                                <span className="font-medium text-gray-900 group-hover:text-pink-600 transition-colors">
                                    릴스(Reels) 필수
                                </span>
                            </div>
                        </label>
                    </div>
                </section>
            )}



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
                    value={formData.additionalNotes || ''}
                    onChange={(e) => store.setField('additionalNotes', e.target.value)}
                    placeholder="리뷰어에게 전달할 추가 안내사항이 있다면 작성해주세요."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </section>

        </div>
    );
}
