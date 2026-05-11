const http = require('http');
http.get('http://127.0.0.1:3001/health', r => process.exit(r.statusCode === 200 ? 0 : 1))
  .on('error', () => process.exit(1));
