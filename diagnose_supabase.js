const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            env[match[1]] = match[2].replace(/"/g, '').trim();
        }
    });

    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('환경 변수(NEXT_PUBLIC_SUPABASE_URL, KEY)를 찾을 수 없습니다.');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    async function diagnose() {
        console.log('--- Supabase 진단 시작 ---');

        // 1. Table Check
        console.log('1. campaigns 테이블 확인 중...');
        const { error: tableError } = await supabase.from('campaigns').select('id').limit(1);
        if (tableError) {
            console.error('❌ 테이블 오류:', tableError.message);
        } else {
            console.log('✅ campaigns 테이블 정상 접근 가능');
        }

        // 2. Storage Check
        console.log('2. campaign-images 스토리지 버킷 확인 중...');
        // check if bucket exists by listing
        const { data, error: listError } = await supabase.storage.from('campaign-images').list();

        if (listError) {
            console.error('❌ 버킷 오류:', listError.message);
            if (listError.message.includes('not found')) {
                console.log('💡 해결책: Supabase 대시보드 Storage에서 "campaign-images"라는 이름의 버킷을 생성하고, Public으로 설정해야 합니다.');
            }
        } else {
            console.log('✅ 버킷 접근 성공. 파일 수:', data.length);

            // 3. Upload Permission Check (Test Upload)
            console.log('3. 업로드 권한 테스트 중...');
            const dummyFile = Buffer.from('test');
            const { error: uploadError } = await supabase.storage
                .from('campaign-images')
                .upload('test_diagnose.txt', dummyFile, { upsert: true });

            if (uploadError) {
                console.error('❌ 업로드 실패:', uploadError.message);
                console.log('💡 해결책: Storage Policies(RLS)를 확인해주세요. INSERT 권한이 필요합니다.');
                // Helper for policy
                console.log('   SQL Editor에서 다음을 실행해보세요:');
                console.log(`   create policy "Public Access" on storage.objects for all using ( bucket_id = 'campaign-images' );`);
            } else {
                console.log('✅ 업로드 테스트 성공');
                // Cleanup
                await supabase.storage.from('campaign-images').remove(['test_diagnose.txt']);
            }
        }
        console.log('--- 진단 종료 ---');
    }

    diagnose();

} catch (e) {
    console.error('스크립트 실행 오류:', e);
}
