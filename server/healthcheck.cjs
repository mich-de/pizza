const http = require('http');
const PORT = process.env.PORT || 3000;
http.get(`http://127.0.0.1:${PORT}/health`, r => process.exit(r.statusCode === 200 ? 0 : 1))
  .on('error', () => process.exit(1));
