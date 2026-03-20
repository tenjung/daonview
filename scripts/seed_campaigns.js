
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

// Helper to calculate date relative to today
const daysFromNow = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

const DUMMY_DATA = [
    // 1. Visit (방문형)
    {
        title: "성수동 핫플! 분위기 좋은 와인바 10만원 자유이용권 체험단",
        platform: "BLOG",
        type: "VISIT",
        campaign_type: "visit",
        region: "서울/ 성동구",
        provision: "10만원 식사권 + 와인 1병",
        recruit_count: 50,
        recruitment_start_date: daysFromNow(-2),
        end_date: daysFromNow(5), // D-5
        description: "성수동 최고의 핫플 와인바에서 즐거운 시간을 보내세요!",
        category: "맛집"
    },
    {
        title: "강남 고급 스파 마사지 90분 코스 체험",
        platform: "INSTAGRAM",
        type: "VISIT",
        campaign_type: "visit",
        region: "서울/강남구",
        provision: "90분 전신 아로마 마사지",
        recruit_count: 10,
        recruitment_start_date: daysFromNow(-10),
        end_date: daysFromNow(1), // D-1
        description: "지친 몸을 힐링하세요. 고급 스파 마사지 체험단입니다.",
        category: "뷰티"
    },
    // 2. Delivery (배송형)
    {
        title: "환절기 필수템! 고보습 바디로션 500ml",
        platform: "BLOG",
        type: "DELIVERY",
        campaign_type: "delivery",
        provision: "바디로션 500ml 본품",
        recruit_count: 30,
        recruitment_start_date: daysFromNow(-5),
        end_date: daysFromNow(3), // D-3
        product_name: "고보습 바디로션",
        description: "환절기 거친 피부를 위한 솔루션!",
        category: "뷰티"
    },
    {
        title: "홈카페 감성 물씬, 원목 트레이 3종 세트",
        platform: "YOUTUBE",
        type: "DELIVERY",
        campaign_type: "delivery",
        provision: "원목 트레이 3종 세트",
        recruit_count: 5,
        recruitment_start_date: daysFromNow(-5),
        end_date: daysFromNow(7), // D-7
        product_name: "원목 트레이",
        description: "홈카페 영상에 딱! 감성 원목 트레이입니다.",
        category: "생활"
    },
    // 3. Purchase/Press (기자단/구매형)
    {
        title: "신제품 런칭 기념! 무선 이어폰 리뷰어 모집",
        platform: "BLOG",
        type: "PURCHASE",
        campaign_type: "press",
        provision: "원고료 5만원 + 제품 증정",
        recruit_count: 20,
        recruitment_start_date: daysFromNow(-20),
        end_date: "2099-12-31", // 상시모집
        is_always: true,
        description: "신제품 무선 이어폰을 체험하고 리뷰를 남겨주세요.",
        category: "IT/가전"
    },
    {
        title: "반려동물 영양제 찐후기 작성해주실 분 (영상 필수)",
        platform: "INSTAGRAM",
        type: "PURCHASE",
        campaign_type: "press",
        provision: "제품 + 원고료 3만원",
        recruit_count: 15,
        recruitment_start_date: daysFromNow(-5),
        end_date: daysFromNow(10), // D-10
        description: "댕댕이, 냥냥이 집사님들 모여라!",
        category: "반려동물"
    }
];

async function seed() {
    console.log("🌱 Seeding campaign data...");

    // 1. User ID Strategy
    let userId;

    // 0. Try to find an existing user ID from campaigns table
    const { data: existingData } = await supabase
        .from('campaigns')
        .select('created_by')
        .limit(1);

    if (existingData && existingData.length > 0 && existingData[0].created_by) {
        userId = existingData[0].created_by;
        console.log(`👤 Found existing User ID to reuse: ${userId}`);
    }

    // 1. If not found, try dynamic signup
    if (!userId) {
        const uniqueId = Date.now();
        const email = `seeder_${uniqueId}@example.com`;
        const password = 'password123';
        console.log(`👤 No existing user found. Attempting to create user: ${email}`);

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            console.error("⚠️ SignUp failed:", authError.message);
            // Fallback to dummy UUID
            userId = '00000000-0000-0000-0000-000000000000';
            console.log("⚠️ Using dummy UUID. This will fail if foreign key constraints are enforced.");
        } else {
            userId = authData.user.id;
        }
    }

    console.log(`👤 Using User ID: ${userId}`);

    // 2. Insert Data
    for (const campaign of DUMMY_DATA) {
        const payload = {
            ...campaign,
            created_by: userId,
            created_at: new Date().toISOString(),
            status: 'approved'
        };

        const { data, error } = await supabase
            .from('campaigns')
            .insert(payload)
            .select();

        if (error) {
            // Retry logic for 'type' column mismatch
            if (error.message.includes('type')) {
                console.log(`⚠️ Column 'type' might not exist or issue. Retrying without it for "${campaign.title}"...`);
                const { type, ...rest } = payload;
                const { data: retryData, error: retryError } = await supabase
                    .from('campaigns')
                    .insert(rest)
                    .select();

                if (retryError) {
                    console.error(`❌ Retry failed for "${campaign.title}":`, retryError.message);
                } else {
                    console.log(`✅ Inserted "${campaign.title}" (without 'type')`);
                    if (retryData && retryData[0]) await addDummyApplicant(supabase, retryData[0].id, userId, campaign.recruit_count);
                }
            } else {
                console.error(`❌ Failed to insert "${campaign.title}":`, error.message);
            }
        } else {
            console.log(`✅ Inserted "${campaign.title}"`);
            if (data && data[0]) await addDummyApplicant(supabase, data[0].id, userId, campaign.recruit_count);
        }
    }

    console.log("✨ Seeding completed!");
}

async function addDummyApplicant(supabase, campaignId, userId, recruitCount) {
    if (!userId) return;
    // Add 1 real applicant (the creator)
    await supabase.from('applications').insert({
        campaign_id: campaignId,
        user_id: userId,
        status: 'pending'
    }).then(({ error }) => {
        if (!error) console.log(`   - Added 1 applicant`);
    });
}

seed();
