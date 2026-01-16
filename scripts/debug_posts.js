
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debug() {
    console.log('Fetching posts from:', supabaseUrl);
    const { data, error } = await supabase
        .from('posts')
        .select(`
            *,
            profiles (
                id,
                nickname,
                name
            )
        `)
        .eq('type', 'FREE');
    
    if (error) {
        console.log('Error found:');
        console.log(JSON.stringify(error, null, 2));
        console.log('Full error object:', error);
    } else {
        console.log('Success! Data count:', data.length);
    }
}

debug();
