const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3000;

const ROUTES = [
  { prefix: '/groq',      host: 'api.groq.com',       rewrite: p => '/openai' + p },
  { prefix: '/anthropic', host: 'api.anthropic.com',   rewrite: p => p },
];
const DEFAULT = { host: 'api.mistral.ai', rewrite: p => p };

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-api-key,anthropic-version,anthropic-dangerous-direct-browser-access');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  let route = DEFAULT;
  let path = req.url;

  for (const r of ROUTES) {
    if (req.url.startsWith(r.prefix)) {
      route = r;
      path = r.rewrite(req.url.slice(r.prefix.length) || '/');
      break;
    }
  }

  const options = {
    hostname: route.host,
    port: 443,
    path: path,
    method: req.method,
    headers: { ...req.headers, host: route.host }
  };

  const proxy = https.request(options, r => {
    res.writeHead(r.statusCode, r.headers);
    r.pipe(res);
  });

  proxy.on('error', e => { res.writeHead(502); res.end(e.message); });
  req.pipe(proxy);
}).listen(PORT, () => console.log('Medeus proxy on port ' + PORT));
