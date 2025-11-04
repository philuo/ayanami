// HTTPS 服务器，支持 SharedArrayBuffer 所需的 COOP/COEP 头部
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HTTPS_PORT = 8443;
const HTTP_PORT = 8080;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.wasm': 'application/wasm',
    '.wat': 'text/plain',
};

// 请求处理函数
function handleRequest(req, res) {
    // 设置 SharedArrayBuffer 所需的关键头部
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    // 额外的安全头部
    res.setHeader('X-Content-Type-Options', 'nosniff');

    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './test.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>404 - 文件未找到</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('服务器错误: ' + error.code + '\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
}

// 检查证书是否存在
const certPath = path.join(__dirname, 'certs', 'localhost.pem');
const keyPath = path.join(__dirname, 'certs', 'localhost-key.pem');

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    // 启动 HTTPS 服务器
    const httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
    };

    const httpsServer = https.createServer(httpsOptions, handleRequest);

    httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
        console.log('🔒 ========================================');
        console.log(`✅ HTTPS 服务器运行在: https://127.0.0.1:${HTTPS_PORT}/`);
        console.log(`📊 性能测试页面: https://127.0.0.1:${HTTPS_PORT}/test.html`);
        console.log('🔒 ========================================');
        console.log('✅ SharedArrayBuffer 支持已启用');
        console.log('   - COOP: same-origin');
        console.log('   - COEP: require-corp');
        console.log('🔒 ========================================');
        console.log('⚠️  浏览器可能会警告自签名证书不安全');
        console.log('   Chrome: 点击 "高级" -> "继续访问"');
        console.log('   Firefox: 点击 "高级" -> "接受风险并继续"');
        console.log('🔒 ========================================');
    });
} else {
    console.log('❌ 未找到 SSL 证书文件');
    console.log('📝 请先运行以下命令生成自签名证书：');
    console.log('');
    console.log('   npm install -g mkcert');
    console.log('   或手动生成：');
    console.log('   openssl req -x509 -newkey rsa:2048 -nodes -sha256 \\');
    console.log('     -keyout localhost-key.pem -out localhost.pem \\');
    console.log('     -days 365 -subj "/CN=localhost"');
    console.log('');
    console.log('💡 启动 HTTP 备用服务器（不支持 SharedArrayBuffer）...');

    // 启动 HTTP 备用服务器
    const httpServer = http.createServer(handleRequest);
    httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
        console.log('');
        console.log(`⚠️  HTTP 服务器运行在: http://127.0.0.1:${HTTP_PORT}/`);
        console.log('⚠️  注意: SharedArrayBuffer 需要 HTTPS 环境');
    });
}
