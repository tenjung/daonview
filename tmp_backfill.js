require('dotenv').config({ path: '.env.local' });
const { calculateDaonIndex } = require('./src/lib/services/daon-index.ts'); 
// wait we cannot easily require TS in JS.
// Let's just use the HTTP trigger and see the JSON response.
const http = require('http');

http.get({
  hostname: 'localhost',
  port: 3000,
  path: '/api/cron/update-daon-index',
  headers: {
    'Authorization': 'Bearer ' + process.env.CRON_SECRET
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response:', data));
}).on('error', err => console.error(err));
