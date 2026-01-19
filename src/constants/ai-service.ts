import { TopicType, ContentCategory, ToneType } from "@/types/writing-assistant";

export const TOPIC_OPTIONS: { value: TopicType; label: string; icon: string }[] = [
    { value: "VISIT_REVIEW", label: "방문후기", icon: "🏪" },
    { value: "PRODUCT_REVIEW", label: "제품리뷰", icon: "📦" },
    { value: "TRAVEL", label: "여행", icon: "✈️" },
    { value: "DAILY_LIFE", label: "일상", icon: "☕" },
    { value: "TUTORIAL", label: "튜토리얼", icon: "📚" },
    { value: "INFORMATION", label: "정보성", icon: "💡" },
];

export const CONTENT_CATEGORIES: ContentCategory[] = [
    "정보성", "방문후기/체험기", "제품 리뷰/분석", "튜토리얼",
    "비교/리뷰", "문제 해결 가이드", "교육/설명", "보행/여행기",
    "일상/스토리", "실용/라이프", "공급/홍보", "스타일/패션",
    "인터뷰/대담", "엔터테인먼트/비디오", "IT/컴퓨터",
    "교육/학습", "라이프/실용"
];

export const TONE_OPTIONS: { value: ToneType; label: string; description: string }[] = [
    { value: "FRIENDLY_GUIDE", label: "친절한 안내자", description: "독자에게 친절하게 설명하는 톤" },
    { value: "EXPERT_CONCISE", label: "전문가의 간결체", description: "전문적이고 간결한 톤" },
    { value: "CONVERSATIONAL", label: "대화체 친근감", description: "친구와 대화하듯 편안한 톤" },
    { value: "HUMOROUS", label: "유머러스/재치", description: "재치있고 유머러스한 톤" },
    { value: "EMOTIONAL_STORY", label: "감성/스토리", description: "감성적이고 스토리텔링하는 톤" },
];
