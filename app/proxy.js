const http = require('http');

console.log('[KeystoneJS::Startup] proxy createServer...');

http.createServer((req, res) => {
    const port = 3000;
    const _req = http.request(
        {port, path: req.url, headers: req.headers, method: req.method},
        (_res) => {
            res.writeHead(_res.statusCode, _res.headers);
            _res.pipe(res);
        }
    );
    _req.on('error', (e) => {
        console.error('proxied request failed: ' + e.message);
        res.writeHead(500);
        res.end();
    });
    req.pipe(_req);
}).listen(80, () => console.log('[KeystoneJS::Startup] proxy listening on port 80...'));
