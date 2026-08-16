const http = require('http');
http.get('http://localhost:3000/src/main.tsx', (res) => {
  if (res.statusCode !== 200) console.log("Main tsx status:", res.statusCode);
  res.resume();
});
