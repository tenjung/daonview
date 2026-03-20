// Supabase 연결 테스트 스크립트
require('dotenv').config({ path: '.env.local' });

console.log('🔍 환경 변수 확인:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 없음');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('\n❌ 환경 변수가 설정되지 않았습니다!');
    console.log('💡 .env.local 파일을 확인하세요.');
    process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('\n🔗 Supabase 연결 테스트 중...');

// 간단한 쿼리로 연결 테스트
supabase
    .from('campaigns')
    .select('count')
    .limit(1)
    .then(({ data, error }) => {
        if (error) {
            console.error('\n❌ Supabase 연결 실패:', error.message);
            console.error('상세 오류:', error);
            console.log('\n💡 확인사항:');
            console.log('1. Supabase URL이 올바른지 확인');
            console.log('2. Anon Key가 올바른지 확인');
            console.log('3. campaigns 테이블이 존재하는지 확인');
            console.log('4. RLS 정책이 올바르게 설정되었는지 확인');
        } else {
            console.log('\n✅ Supabase 연결 성공!');
            console.log('📊 데이터베이스에 접근할 수 있습니다.');
        }
    })
    .catch((err) => {
        console.error('\n❌ 예상치 못한 오류:', err.message);
        if (err.cause) {
            console.error('원인:', err.cause);
        }
    });
