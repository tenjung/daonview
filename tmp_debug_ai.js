require('dotenv').config({ path: '.env.local' });
const { calculateDaonIndex } = require('./src/lib/services/daon-index.ts');

// Since calculateDaonIndex uses standard export & typescript but we run Node, 
// let's just trigger the whole HTTP endpoint and watch the logs/results again 
// but we want to specifically see the inside logs for 'damgow'.
// Wait, TS can't be executed directly by node. Let's make a test script that dynamically registers ts-node.
