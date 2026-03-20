
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

const ADDITIONAL_DATA = [
    // New Visit 1
    {
        title: "홍대 감성 루프탑 카페 2인 디저트 세트 체험단",
        platform: "INSTAGRAM",
        type: "VISIT",
        campaign_type: "visit",
        region: "서울/마포구",
        provision: "아메리카노 2잔 + 조각케익 1개",
        recruit_count: 10,
        recruitment_start_date: daysFromNow(-1),
        end_date: daysFromNow(6),
        description: "홍대 전경이 보이는 루프탑에서 인생샷을 남겨보세요!",
        category: "맛집"
    },
    // New Visit 2
    {
        title: "잠실 석촌호수 뷰 브런치 맛집 5만원 식사권",
        platform: "BLOG",
        type: "VISIT",
        campaign_type: "visit",
        region: "서울/송파구",
        provision: "5만원 자유 식사권",
        recruit_count: 20,
        recruitment_start_date: daysFromNow(-3),
        end_date: daysFromNow(4),
        description: "석촌호수 데이트 코스로 딱! 브런치 즐기러 오세요.",
        category: "맛집"
    },
    // New Delivery 1
    {
        title: "제주 산지직송! 고당도 타이벡 감귤 5kg",
        platform: "BLOG",
        type: "DELIVERY",
        campaign_type: "delivery",
        provision: "타이벡 감귤 5kg 1박스",
        recruit_count: 50,
        recruitment_start_date: daysFromNow(-2),
        end_date: daysFromNow(5),
        product_name: "타이벡 감귤 5kg",
        description: "제주의 햇살을 담은 달콤한 감귤 체험단",
        category: "푸드"
    },
    // New Delivery 2
    {
        title: "데일리 데님 에코백 (대학생 추천템)",
        platform: "INSTAGRAM",
        type: "DELIVERY",
        campaign_type: "delivery",
        provision: "데님 에코백 (색상 랜덤)",
        recruit_count: 15,
        recruitment_start_date: daysFromNow(0),
        end_date: daysFromNow(14),
        product_name: "데님 에코백",
        description: "어떤 룩에도 잘 어울리는 데일리 에코백입니다.",
        category: "패션"
    }
];

async function seed() {
    console.log("🌱 Seeding ADDITIONAL campaign data...");

    // 1. User ID Strategy
    let userId;

    const { data: existingData } = await supabase
        .from('campaigns')
        .select('created_by')
        .limit(1);

    if (existingData && existingData.length > 0 && existingData[0].created_by) {
        userId = existingData[0].created_by;
        console.log(`👤 Found existing User ID to reuse: ${userId}`);
    }

    if (!userId) {
        console.error("❌ No existing user found. Please run the previous seed script first or create a campaign manually.");
        // Try fallback just in case
        const { data: authData } = await supabase.auth.signUp({
            email: `seeder_${Date.now()}@example.com`,
            password: 'password123',
        });
        userId = authData?.user?.id;
    }

    if (!userId) {
        console.error("❌ Failed to resolve User ID. Aborting.");
        return;
    }

    console.log(`👤 Using User ID: ${userId}`);

    // 2. Insert Data
    for (const campaign of ADDITIONAL_DATA) {
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
            if (error.message.includes('type')) {
                console.log(`⚠️ Retrying "${campaign.title}" without explicit 'type' column...`);
                const { type, ...rest } = payload;
                const { data: retryData, error: retryError } = await supabase.from('campaigns').insert(rest).select();

                if (retryError) console.error(`❌ Failed:`, retryError.message);
                else {
                    console.log(`✅ Inserted "${campaign.title}"`);
                    if (retryData && retryData[0]) await addDummyApplicant(supabase, retryData[0].id, userId);
                }
            } else {
                console.error(`❌ Failed to insert "${campaign.title}":`, error.message);
            }
        } else {
            console.log(`✅ Inserted "${campaign.title}"`);
            if (data && data[0]) await addDummyApplicant(supabase, data[0].id, userId);
        }
    }

    console.log("✨ Additional Seeding completed!");
}

async function addDummyApplicant(supabase, campaignId, userId) {
    if (!userId) return;
    await supabase.from('applications').insert({
        campaign_id: campaignId,
        user_id: userId,
        status: 'pending'
    }).then(({ error }) => {
        if (!error) console.log(`   - Added 1 applicant`);
    });
}

seed();
