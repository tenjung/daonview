import { calculateDaonIndex } from './src/lib/services/daon-index';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function run() {
    console.log("=== Testing AI Keyword + 3 Page Rank (DaonIndex 3.0) ===");
    const damgowUrl = 'https://blog.naver.com/damgow';
    
    console.log(`Analyzing: ${damgowUrl}`);
    const score = await calculateDaonIndex(damgowUrl);
    
    console.log(`\n=== FINAL DAON SCORE: ${score} ===`);
}

run();
