// 기존 리뷰 데이터 업데이트 스크립트
// 사용법: node scripts/update-reviews.js

const reviews = [
    { id: '31d8f420-fe18-43de-af49-85695175901e', url: 'https://blog.naver.com/hssj2615/223937595826' },
    { id: '60946c87-e7aa-4eaa-9e65-c70ec7a4d0a3', url: 'https://m.blog.naver.com/dksdidwhdk/223935688121' },
    { id: 'fe930171-e263-4cac-8cad-32abaea43fca', url: 'https://blog.naver.com/23people2000/223931380159' },
    { id: '76b213cb-adfa-4628-81c4-3d3835d718cd', url: 'https://m.blog.naver.com/le__printemps/223946363964' },
    { id: '5841f0e1-249a-4eca-8a92-09d8ec932c7b', url: 'https://blog.naver.com/jjviolin/223937120904' },
    { id: '76959dad-8b90-4d48-8fad-1981928dec27', url: 'https://blog.naver.com/didrlfska77/223944157033' },
    { id: '61acb512-49b8-415a-8b33-5382f31f77b1', url: 'https://blog.naver.com/lucia_1010/224015257144' },
    { id: 'd89b4a25-f5a2-4d6c-8fbc-e582b2120298', url: 'https://m.blog.naver.com/namkok07/224017305197' },
    { id: '0a467422-f79e-426f-9fab-b146ba38bde6', url: 'https://blog.naver.com/damgow/223998981189' },
    { id: '4035d79e-3856-4f73-a6ac-341fbe745e5b', url: 'https://blog.naver.com/znznel1/224020293815' },
    { id: 'e6d20a64-f529-4c67-8827-74af9d4d0d38', url: 'https://blog.naver.com/wkdwndus1454/224021848113' },
    { id: '94b3f172-6f2a-44bf-a634-c4af59c3929b', url: 'https://m.blog.naver.com/imgasina/224018869642' }
];

async function updateReview(review) {
    try {
        const response = await fetch('http://localhost:3000/api/scrape-blog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: review.url })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log(`✅ ${review.id}: ${result.data.authorName} - ${result.data.title}`);
            return {
                id: review.id,
                title: result.data.title,
                description: result.data.description,
                thumbnail_url: result.data.thumbnail,
                author_name: result.data.authorName
            };
        } else {
            console.error(`❌ ${review.id}: Failed`);
            return null;
        }
    } catch (error) {
        console.error(`❌ ${review.id}: ${error.message}`);
        return null;
    }
}

async function main() {
    console.log('🚀 Starting review update...\n');
    
    for (const review of reviews) {
        const data = await updateReview(review);
        if (data) {
            console.log(`   Title: ${data.title}`);
            console.log(`   Author: ${data.author_name}`);
            console.log(`   Thumbnail: ${data.thumbnail_url ? '✓' : '✗'}\n`);
        }
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('✨ Update complete!');
}

main();
