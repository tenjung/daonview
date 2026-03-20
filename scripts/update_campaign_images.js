
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

const IMAGES = {
    food: [
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80", // Restaurant
        "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80", // Cafe
        "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80", // Drink/Bar
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80"  // Fine dining
    ],
    beauty: [
        "https://images.unsplash.com/photo-1596462502278-27bfdd403348?auto=format&fit=crop&w=800&q=80", // Cosmetics
        "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80", // Skin care
        "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=800&q=80", // Spa/Massage
        "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=800&q=80"  // Makeup
    ],
    fashion: [
        "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80", // Clothing
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80", // Fashion model
        "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&q=80"  // Accessories
    ],
    tech: [
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80", // Workspace
        "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=800&q=80", // Electronics
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"  // Headphones
    ],
    pet: [
        "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80", // Dog
        "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80", // Cat
        "https://images.unsplash.com/photo-1583511655826-05700442b31b?auto=format&fit=crop&w=800&q=80"  // Pet food
    ],
    default: [
        "https://images.unsplash.com/photo-1493612276216-9c5901955d43?auto=format&fit=crop&w=800&q=80", // General aesthetic
        "https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=800&q=80"  // Lifestyle
    ]
};

const getImageForCampaign = (title, category) => {
    const text = (title + " " + (category || "")).toLowerCase();

    let pool = IMAGES.default;

    if (text.includes("맛집") || text.includes("카페") || text.includes("커피") || text.includes("식사") || text.includes("푸드") || text.includes("와인")) {
        pool = IMAGES.food;
    } else if (text.includes("뷰티") || text.includes("스파") || text.includes("마사지") || text.includes("화장품") || text.includes("로션")) {
        pool = IMAGES.beauty;
    } else if (text.includes("패션") || text.includes("옷") || text.includes("가방") || text.includes("에코백")) {
        pool = IMAGES.fashion;
    } else if (text.includes("가전") || text.includes("it") || text.includes("테크") || text.includes("이어폰")) {
        pool = IMAGES.tech;
    } else if (text.includes("반려") || text.includes("강아지") || text.includes("고양이") || text.includes("댕댕")) {
        pool = IMAGES.pet;
    }

    // Pick random from pool based on title length as seed to be deterministic somewhat, or just random
    const index = Math.floor(Math.random() * pool.length);
    return pool[index];
};

async function updateImages() {
    console.log("🖼️ Updating campaign images...");

    // 1. Fetch all campaigns
    const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('id, title, category, thumbnail_url');

    if (error) {
        console.error("❌ Failed to fetch campaigns:", error.message);
        return;
    }

    console.log(`📝 Found ${campaigns.length} campaigns.`);

    let updatedCount = 0;

    // 2. Update each
    for (const cam of campaigns) {
        // Only update if no image (or we force update, let's force update for "dummy" look if it looks like empty)
        // If it starts with http, it might be already set. But user requested to add them.
        // Let's overwrite all for now to ensure they have good looking ones, 
        // OR only overwrite if null.
        // The previous seeds didn't set them, so they are null.

        if (!cam.thumbnail_url) {
            const newImage = getImageForCampaign(cam.title, cam.category);

            const { error: updateError } = await supabase
                .from('campaigns')
                .update({ thumbnail_url: newImage })
                .eq('id', cam.id);

            if (updateError) {
                console.error(`❌ Failed to update ${cam.id}:`, updateError.message);
            } else {
                console.log(`✅ Updated "${cam.title}"`);
                updatedCount++;
            }
        }
    }

    console.log(`✨ Updated images for ${updatedCount} campaigns.`);
}

updateImages();
