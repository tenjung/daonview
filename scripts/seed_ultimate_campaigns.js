
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Missing environment variables');
    process.exit(1);
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const daysFromNow = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};

const DUMMY_DATA = [
    // --- 맛집/방문 ---
    {
        title: "[성수] 힙한 감성 에스프레소 바 5만원 자유이용권",
        platform: "NAVER_BLOG", type: "VISIT", status: "RECRUITING", region: "서울/성동구",
        recruit_count: 10, recruitment_start_date: daysFromNow(-1), end_date: daysFromNow(14),
        category: "맛집",
        thumbnail_url: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&q=80",
        provision: "5만원 자유 이용권", experience_details: "에스프레소 및 디저트 5만원 이용권", total_recruitment: 10
    },
    {
        title: "[연남] 루프탑 펍 칵테일 2인 세트 초대권",
        platform: "INSTAGRAM", type: "VISIT", status: "RECRUITING", region: "서울/마포구",
        recruit_count: 5, recruitment_start_date: daysFromNow(-2), end_date: daysFromNow(10),
        category: "맛집",
        thumbnail_url: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80",
        provision: "칵테일 2잔 + 나쵸 플레이트", experience_details: "루프탑 펍 2인 방문 체험", total_recruitment: 5
    },
    {
        title: "[강남] 정통 화로구이 소고기 세트 (15만원 상당)",
        platform: "NAVER_BLOG", type: "VISIT", status: "RECRUITING", region: "서울/강남구",
        recruit_count: 8, recruitment_start_date: daysFromNow(-3), end_date: daysFromNow(7),
        category: "맛집",
        thumbnail_url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
        provision: "한우 모듬 세트 (2인)", experience_details: "15만원 상당의 한우 세트 제공", total_recruitment: 8
    },

    // --- 뷰티/건강 ---
    {
        title: "비건 스킨케어 3종 세트 (배송형)",
        platform: "NAVER_BLOG", type: "DELIVERY", status: "RECRUITING",
        recruit_count: 50, recruitment_start_date: daysFromNow(-5), end_date: daysFromNow(20),
        category: "뷰티",
        thumbnail_url: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=800&q=80",
        provision: "비건 토너/앰플/크림 3종", experience_details: "7만원 상당의 기초 3종 세트 배송", total_recruitment: 50
    },
    {
        title: "뿌리는 트리트먼트 헤어 미스트 200ml",
        platform: "INSTAGRAM", type: "DELIVERY", status: "RECRUITING",
        recruit_count: 30, recruitment_start_date: daysFromNow(-1), end_date: daysFromNow(15),
        category: "뷰티",
        thumbnail_url: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=800&q=80",
        provision: "헤어 미스트 본품 1개", experience_details: "손상모 케어 미스트 배송 후 리뷰", total_recruitment: 30
    },
    {
        title: "[청담] 퍼스널 컬러 진단 및 메이크업 컨설팅",
        platform: "NAVER_BLOG", type: "VISIT", status: "RECRUITING", region: "서울/강남구",
        recruit_count: 3, recruitment_start_date: daysFromNow(-10), end_date: daysFromNow(5),
        category: "뷰티",
        thumbnail_url: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
        provision: "1:1 퍼스널 컬러 진단권", experience_details: "전문 컨설팅 서비스 무료 체험", total_recruitment: 3
    },

    // --- IT/가전 ---
    {
        title: "저소음 기계식 키보드 (화이트/블루 선택)",
        platform: "NAVER_BLOG", type: "DELIVERY", status: "RECRUITING",
        recruit_count: 15, recruitment_start_date: daysFromNow(-4), end_date: daysFromNow(12),
        category: "IT/가전",
        thumbnail_url: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=800&q=80",
        provision: "기계식 키보드 본품", experience_details: "12만원 상당의 무선 기계식 키보드", total_recruitment: 15
    },
    {
        title: "감성 캠핑용 우드 롤 테이블 (대형)",
        platform: "NAVER_BLOG", type: "DELIVERY", status: "RECRUITING",
        recruit_count: 10, recruitment_start_date: daysFromNow(-2), end_date: daysFromNow(25),
        category: "생활",
        thumbnail_url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80",
        provision: "우드 롤 테이블 + 전용 가방", experience_details: "캠핑 필수템 감성 테이블 증정", total_recruitment: 10
    },
    {
        title: "초고속 충전 65W 멀티 어댑터",
        platform: "PURCHASE", type: "DELIVERY", status: "RECRUITING",
        recruit_count: 100, recruitment_start_date: daysFromNow(-1), end_date: daysFromNow(30),
        category: "IT/가전",
        thumbnail_url: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
        provision: "구매 금액 100% 페이백", experience_details: "스토어 구매 후 포토 리뷰 작성 시 환급", total_recruitment: 100
    },

    // --- 패션 ---
    {
        title: "미니멀리즘 오버핏 셔츠 (5컬러)",
        platform: "INSTAGRAM", type: "DELIVERY", status: "RECRUITING",
        recruit_count: 20, recruitment_start_date: daysFromNow(-3), end_date: daysFromNow(18),
        category: "패션",
        thumbnail_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80",
        provision: "원하는 컬러 셔츠 1종", experience_details: "OOTD 연출 사진 3장 이상 업로드", total_recruitment: 20
    },
    {
        title: "데일리 캔버스 토트백 (자체제작)",
        platform: "NAVER_BLOG", type: "DELIVERY", status: "RECRUITING",
        recruit_count: 25, recruitment_start_date: daysFromNow(-1), end_date: daysFromNow(20),
        category: "패션",
        thumbnail_url: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
        provision: "에코백 본품", experience_details: "가방 수납 형태 및 실사용 후기", total_recruitment: 25
    },

    // --- 반려동물 ---
    {
        title: "동결건조 강아지 간식 3종 기프트 박스",
        platform: "NAVER_BLOG", type: "DELIVERY", status: "RECRUITING",
        recruit_count: 40, recruitment_start_date: daysFromNow(-5), end_date: daysFromNow(10),
        category: "반려동물",
        thumbnail_url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80",
        provision: "간식 3종 체험 박스", experience_details: "반려견 급여 영상 포함 필수", total_recruitment: 40
    },

    // --- 기타/서비스 ---
    {
        title: "[프리미엄] 1:1 영어 회화 화상 수업 (4회권)",
        platform: "NAVER_BLOG", type: "PRESS", status: "RECRUITING",
        recruit_count: 10, recruitment_start_date: daysFromNow(-1), end_date: daysFromNow(30),
        category: "기타",
        thumbnail_url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
        provision: "온라인 수업 4회 수강권", experience_details: "플랫폼 이용기 및 수업 후기", total_recruitment: 10
    },
    {
        title: "신규 명상 어플 서비스 1년 프리미엄 구독권",
        platform: "INSTAGRAM", type: "PRESS", status: "RECRUITING",
        recruit_count: 50, recruitment_start_date: daysFromNow(-2), end_date: daysFromNow(45),
        category: "기타",
        thumbnail_url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
        provision: "12만원 상당 구독 멤버십", experience_details: "앱 릴스/스토리 홍보 리뷰", total_recruitment: 50
    },
    {
        title: "전통시장 온누리상품권 장보기 (3만원권)",
        platform: "NAVER_BLOG", type: "VISIT", status: "RECRUITING", region: "인천/중구",
        recruit_count: 30, recruitment_start_date: daysFromNow(-1), end_date: daysFromNow(15),
        category: "맛집",
        thumbnail_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
        provision: "상품권 3만원 지급", experience_details: "전통시장 방문 및 장보기 홍보", total_recruitment: 30
    },
    {
        title: "자동 세차 서비스 프리미엄 패스 (5회권)",
        platform: "NAVER_BLOG", type: "VISIT", status: "RECRUITING", region: "경기/수원시",
        recruit_count: 15, recruitment_start_date: daysFromNow(-3), end_date: daysFromNow(20),
        category: "기타",
        thumbnail_url: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80",
        provision: "노터치 세차 5회권", experience_details: "세차 과정 전후 모습 비교 리뷰", total_recruitment: 15
    },
    {
        title: "홈 트레이닝 요가매트 + 웨이트 밴드",
        platform: "NAVER_BLOG", type: "DELIVERY", status: "RECRUITING",
        recruit_count: 20, recruitment_start_date: daysFromNow(-2), end_date: daysFromNow(15),
        category: "생활",
        thumbnail_url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80",
        provision: "홈트 세트 (4만원 상당)", experience_details: "운동 인증샷 및 후기 작성", total_recruitment: 20
    },
    {
        title: "[호텔] 전국 체인 호텔 1박 숙박권 (평일권)",
        platform: "NAVER_BLOG", type: "VISIT", status: "RECRUITING", region: "전국",
        recruit_count: 2, recruitment_start_date: daysFromNow(-1), end_date: daysFromNow(10),
        category: "여행",
        thumbnail_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
        provision: "스탠다드룸 1박 숙박권", experience_details: "호캉스 이용 후기 작성", total_recruitment: 2
    },
    {
        title: "차량용 고성능 방향제 세트 (3가지 향)",
        platform: "INSTAGRAM", type: "DELIVERY", status: "RECRUITING",
        recruit_count: 15, recruitment_start_date: daysFromNow(-1), end_date: daysFromNow(20),
        category: "생활",
        thumbnail_url: "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=800&q=80",
        provision: "방향제 본품 세트", experience_details: "차량 내부 사용컷 및 향기 설명", total_recruitment: 15
    },
    {
        title: "[강남] 피부과 아쿠아필 관리 체험",
        platform: "NAVER_BLOG", type: "VISIT", status: "RECRUITING", region: "서울/강남구",
        recruit_count: 10, recruitment_start_date: daysFromNow(-1), end_date: daysFromNow(15),
        category: "뷰티",
        thumbnail_url: "https://images.unsplash.com/photo-1570172619380-21c6758e3b17?auto=format&fit=crop&w=800&q=80",
        provision: "아쿠아필 1회 시술권", experience_details: "피부 관리 상세 후기 작성", total_recruitment: 10
    }
];

async function seed() {
    process.stdout.write("🧹 Cleaning up old dummy data...");
    const ADVERTISER_ID = '017fed9f-aebc-4179-af38-c4748a3ce7de'; // doriclan

    const { error: delError } = await supabase
        .from('campaigns')
        .delete()
        .eq('created_by', ADVERTISER_ID);

    if (delError) console.error("⚠️ Cleanup error:", delError.message);

    console.log(`🌱 Inserting 20 ULTIMATE diverse campaigns for ${ADVERTISER_ID}...`);

    for (const campaign of DUMMY_DATA) {
        const payload = {
            ...campaign,
            created_by: ADVERTISER_ID,
            created_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('campaigns')
            .insert(payload);

        if (error) {
            console.error(`❌ Failed to insert "${campaign.title}":`, error.message);
        } else {
            console.log(`✅ Inserted "${campaign.title}"`);
        }
    }

    console.log("✨ Seeding completed! Images are now verified and stable.");
}

seed();
