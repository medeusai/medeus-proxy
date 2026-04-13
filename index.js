const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3000;

const ROUTES = {
  '/groq':      'api.groq.com',
  '/anthropic': 'api.anthropic.com',
};
const DEFAULT = 'api.mistral.ai';

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-api-key,anthropic-version,anthropic-dangerous-direct-browser-access');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  let target = DEFAULT;
  let path = req.url;

  for (const [prefix, host] of Object.entries(ROUTES)) {
    if (req.url.startsWith(prefix)) {
      target = host;
      path = req.url.slice(prefix.length) || '/';
      break;
    }
  }

  const options = {
    hostname: target,
    port: 443,
    path: path,
    method: req.method,
    headers: { ...req.headers, host: target }
  };

  const proxy = https.request(options, r => {
    res.writeHead(r.statusCode, r.headers);
    r.pipe(res);
  });

  proxy.on('error', e => { res.writeHead(502); res.end(e.message); });
  req.pipe(proxy);
}).listen(PORT, () => console.log('Medeus proxy on port ' + PORT));
