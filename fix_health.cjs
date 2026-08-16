const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  "if (req.path.startsWith('/auth/') || req.path === '/health') {",
  "if (req.path.startsWith('/auth') || req.path.startsWith('/health') || req.path.startsWith('/gemini')) {"
);

fs.writeFileSync('server.ts', content);
