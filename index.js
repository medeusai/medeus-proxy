const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3000;
const TARGET = 'api.mistral.ai';

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const options = {
    hostname: TARGET,
    port: 443,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: TARGET }
  };

  const proxy = https.request(options, r => {
    res.writeHead(r.statusCode, r.headers);
    r.pipe(res);
  });

  proxy.on('error', e => { res.writeHead(502); res.end(e.message); });
  req.pipe(proxy);
}).listen(PORT, () => console.log('Proxy on ' + PORT));
