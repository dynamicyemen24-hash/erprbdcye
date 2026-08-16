const http = require('http');

http.get('http://localhost:3000/', (res) => {
  console.log('⚡ Server Status Code:', res.statusCode);
  console.log('⚡ Server Headers:', res.headers['content-type']);
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log('✅ NexoraOS Server responding cleanly! HTML Length:', data.length);
  });
}).on('error', (err) => {
  console.error('Server error:', err.message);
});
