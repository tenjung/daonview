
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
    {
        title: "성수동 핫플레이스! 분위기 좋은 와인바 10만원 자유이용권",
        platform: "NAVER_BLOG",
        type: "VISIT",
        status: "RECRUITING",
        region: "서울/성동구",
        recruit_count: 5,
        recruitment_start_date: daysFromNow(-2),
        end_date: daysFromNow(12),
        description: "성수동 최고의 핫플 와인바에서 즐거운 시간을 보내세요!",
        category: "맛집",
        thumbnail_url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&auto=format&fit=crop&q=80",
        provision: "10만원 식사권 + 와인 1병 제공",
        experience_details: "10만원 식사권 + 와인 1병 제공",
        total_recruitment: 5
    },
    {
        title: "강남 고급 스파 마사지 90분 전신 코스 체험단 모집",
        platform: "INSTAGRAM",
        type: "VISIT",
        status: "RECRUITING",
        region: "서울/강남구",
        recruit_count: 10,
        recruitment_start_date: daysFromNow(-5),
        end_date: daysFromNow(10),
        description: "지친 몸을 힐링하세요. 프리미엄 스파 체험단입니다.",
        category: "뷰티",
        thumbnail_url: "https://images.unsplash.com/photo-1544161515-4af6b1d4640b?w=800&auto=format&fit=crop&q=80",
        provision: "90분 전신 아로마 마사지 체험",
        experience_details: "90분 전신 아로마 마사지 체험",
        total_recruitment: 10
    },
    {
        title: "환절기 필수! 고보습 바디로션 500ml 대용량 증정 캠페인",
        platform: "NAVER_BLOG",
        type: "DELIVERY",
        status: "RECRUITING",
        recruit_count: 30,
        recruitment_start_date: daysFromNow(-3),
        end_date: daysFromNow(15),
        description: "끈적임 없는 고보습 로션! 환절기 피부 고민 해결하세요.",
        category: "뷰티",
        thumbnail_url: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&auto=format&fit=crop&q=80",
        provision: "고보습 바디로션 500ml 본품 배송",
        experience_details: "고보습 바디로션 500ml 본품 배송",
        product_name: "고보습 바디로션",
        total_recruitment: 30
    },
    {
        title: "홈카페 감성 아이템, 원목 트레이 3종 세트 리뷰어 모집",
        platform: "INSTAGRAM",
        type: "DELIVERY",
        status: "RECRUITING",
        recruit_count: 20,
        recruitment_start_date: daysFromNow(-1),
        end_date: daysFromNow(20),
        description: "감성 가득 원목 트레이! 홈카페 분위기를 완성해줍니다.",
        category: "생활",
        thumbnail_url: "https://images.unsplash.com/photo-1581600140682-d4e68c8cde32?w=800&auto=format&fit=crop&q=80",
        provision: "원목 트레이 3종 세트 배송",
        experience_details: "원목 트레이 3종 세트 배송",
        product_name: "원목 트레이",
        total_recruitment: 20
    }
];

async function seed() {
    console.log("🧹 Cleaning up old dummy data...");
    const ADVERTISER_ID = '017fed9f-aebc-4179-af38-c4748a3ce7de'; // doriclan

    // Delete existing dummy campaigns for this user to avoid mess
    const { error: delError } = await supabase
        .from('campaigns')
        .delete()
        .eq('created_by', ADVERTISER_ID);

    if (delError) console.error("⚠️ Cleanup error:", delError.message);

    console.log("🌱 Inserting fresh dummy data with fixed images and provision...");

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

    console.log("✨ Seeding completed!");
}

seed();
