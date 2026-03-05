const http = require('http');
require('dotenv').config({ path: '.env.local' });

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
  res.on('end', () => console.log(data));
}).on('error', err => console.error(err));
