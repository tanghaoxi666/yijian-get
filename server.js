/**
 * 一键 Get — Node.js 后端服务
 * 功能：静态文件服务 + REST API + 微信/QQ OAuth 登录 + SQLite 持久化
 * 零第三方依赖，使用 Node 内置模块（node:sqlite / node:crypto / node:https）
 */
const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// 加载 .env 文件（简单实现，无第三方依赖）
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (key && !(key in process.env)) process.env[key] = val;
    }
  }
} catch {}

const db = require('./db.js');
const { SEED_APPLIANCE_CODES, buildTools } = require('./seed-data.js');

const PORT = process.env.PORT || 8080;
const ROOT = __dirname;
const SITE_URL = process.env.SITE_URL || `http://localhost:${PORT}`;

// OAuth 凭证（从环境变量读取，未配置则提示用户）
const WECHAT = {
  appId: process.env.WECHAT_APP_ID || '',
  appSecret: process.env.WECHAT_APP_SECRET || '',
  redirectUri: process.env.WECHAT_REDIRECT_URI || `${SITE_URL}/api/auth/wechat/callback`,
};
const QQ = {
  appId: process.env.QQ_APP_ID || '',
  appSecret: process.env.QQ_APP_SECRET || '',
  redirectUri: process.env.QQ_REDIRECT_URI || `${SITE_URL}/api/auth/qq/callback`,
};

/* ============================================================
   启动时种子数据（异步，Turso）
   ============================================================ */
(async () => {
  try {
    await db.seedApplianceCodes(SEED_APPLIANCE_CODES);
    await db.seedTools(buildTools());
    console.log('[seed] 家电报错码 & 工具库已就绪');
  } catch (e) {
    console.error('[seed] 种子数据失败:', e.message);
  }
})();

/* ============================================================
   MIME 类型
   ============================================================ */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

/* ============================================================
   工具函数
   ============================================================ */
function sendJSON(res, data, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function redirect(res, location, status = 302) {
  res.writeHead(status, { Location: location });
  res.end();
}

function parseBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; if (data.length > 1e6) req.destroy(); });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

function getTokenFromCookie(req) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function authUser(req) {
  const token = getTokenFromCookie(req);
  if (!token) return null;
  return db.getUserByToken(token);
}

function setSessionCookie(res, token) {
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
  res.setHeader('Set-Cookie',
    `session=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires}`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', 'session=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
}

/* ============================================================
   HTTPS 请求封装（用于调用微信/QQ OAuth API）
   ============================================================ */
function httpsGet(urlStr) {
  return new Promise((resolve, reject) => {
    https.get(urlStr, { headers: { 'User-Agent': 'YijianGet/1.0' } }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

// 解析 JSONP 风格的回调（QQ 接口返回 callback( {...} )）
function parseJsonp(text) {
  const m = text.match(/^callback\((.*)\);?$/s);
  if (m) { try { return JSON.parse(m[1]); } catch { return null; } }
  try { return JSON.parse(text); } catch { return null; }
}

/* ============================================================
   微信 OAuth
   ============================================================ */
async function handleWechatCallback(req, res, query) {
  if (!WECHAT.appId || !WECHAT.appSecret) {
    return sendHTML(res, '<h2>微信登录未配置</h2><p>请在服务器环境变量中设置 WECHAT_APP_ID 和 WECHAT_APP_SECRET</p><a href="/login.html">返回登录</a>', 500);
  }
  const code = query.code;
  if (!code) return redirect(res, '/login.html?err=wechat_no_code');

  try {
    // 1. 用 code 换 access_token + openid
    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${WECHAT.appId}&secret=${WECHAT.appSecret}&code=${code}&grant_type=authorization_code`;
    const tokenRes = await httpsGet(tokenUrl);
    const tokenData = JSON.parse(tokenRes);
    if (tokenData.errcode) throw new Error(tokenData.errmsg || '微信授权失败');

    const { access_token, openid } = tokenData;

    // 2. 拉取用户信息
    const userUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}`;
    const userRes = await httpsGet(userUrl);
    const userInfo = JSON.parse(userRes);

    // 3. 查找或创建用户
    let user = await db.getUserByOpenid('wechat', openid);
    if (!user) {
      user = await db.createUser({
        username: userInfo.nickname || ('wx_' + openid.slice(-8)),
        nickname: userInfo.nickname,
        avatar: userInfo.headimgurl,
        openidWechat: openid,
      });
    } else {
      user = await db.updateUser(user.id, { nickname: userInfo.nickname, avatar: userInfo.headimgurl });
    }

    // 4. 创建会话并跳转
    const token = await db.createSession(user.id);
    setSessionCookie(res, token);
    redirect(res, '/index.html');
  } catch (err) {
    console.error('[wechat]', err.message);
    redirect(res, '/login.html?err=wechat_failed');
  }
}

/* ============================================================
   QQ OAuth
   ============================================================ */
async function handleQqCallback(req, res, query) {
  if (!QQ.appId || !QQ.appSecret) {
    return sendHTML(res, '<h2>QQ登录未配置</h2><p>请在服务器环境变量中设置 QQ_APP_ID 和 QQ_APP_SECRET</p><a href="/login.html">返回登录</a>', 500);
  }
  const code = query.code;
  if (!code) return redirect(res, '/login.html?err=qq_no_code');

  try {
    // 1. 用 code 换 access_token
    const tokenUrl = `https://graph.qq.com/oauth2.0/token?grant_type=authorization_code&client_id=${QQ.appId}&client_secret=${QQ.appSecret}&code=${code}&redirect_uri=${encodeURIComponent(QQ.redirectUri)}`;
    const tokenRes = await httpsGet(tokenUrl);
    // QQ 返回 access_token=xxx&expires_in=xxx&refresh_token=xxx
    const params = new URLSearchParams(tokenRes);
    const access_token = params.get('access_token');
    if (!access_token) throw new Error('QQ 获取 token 失败');

    // 2. 获取 openid
    const meUrl = `https://graph.qq.com/oauth2.0/me?access_token=${access_token}`;
    const meRes = await httpsGet(meUrl);
    const meData = parseJsonp(meRes);
    if (!meData || !meData.openid) throw new Error('QQ 获取 openid 失败');
    const openid = meData.openid;

    // 3. 拉取用户信息
    const infoUrl = `https://graph.qq.com/user/get_user_info?access_token=${access_token}&oauth_consumer_key=${QQ.appId}&openid=${openid}`;
    const infoRes = await httpsGet(infoUrl);
    const info = JSON.parse(infoRes);

    // 4. 查找或创建用户
    let user = await db.getUserByOpenid('qq', openid);
    if (!user) {
      user = await db.createUser({
        username: info.nickname || ('qq_' + openid.slice(-8)),
        nickname: info.nickname,
        avatar: info.figureurl_qq_2 || info.figureurl_qq_1,
        openidQq: openid,
      });
    } else {
      user = await db.updateUser(user.id, { nickname: info.nickname, avatar: info.figureurl_qq_2 || info.figureurl_qq_1 });
    }

    // 5. 创建会话并跳转
    const token = await db.createSession(user.id);
    setSessionCookie(res, token);
    redirect(res, '/index.html');
  } catch (err) {
    console.error('[qq]', err.message);
    redirect(res, '/login.html?err=qq_failed');
  }
}

function sendHTML(res, html, status = 200) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

/* ============================================================
   路由处理
   ============================================================ */
const server = http.createServer(async (req, res) => {
  const parsed = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsed.pathname;
  const query = Object.fromEntries(parsed.searchParams);

  // ---- API 路由 ----
  if (pathname.startsWith('/api/')) {
    // CORS（本地开发用）
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    try {
      // ---- 认证 ----
      if (pathname === '/api/auth/register' && req.method === 'POST') {
        const { username, email, password } = await parseBody(req);
        if (!username || !password) return sendJSON(res, { ok: false, msg: '用户名和密码必填' }, 400);
        const result = await db.createUser({ username, email, password });
        const token = await db.createSession(result.id);
        setSessionCookie(res, token);
        return sendJSON(res, { ok: true, user: result });
      }

      if (pathname === '/api/auth/login' && req.method === 'POST') {
        const { account, password } = await parseBody(req);
        const u = await db.getUserByUsername(account);
        if (!u || !u.passwordHash || !db.verifyPassword(password, u.passwordHash, u.passwordSalt)) {
          return sendJSON(res, { ok: false, msg: '账号或密码错误' }, 401);
        }
        const token = await db.createSession(u.id);
        setSessionCookie(res, token);
        return sendJSON(res, { ok: true, user: { id: u.id, username: u.username, email: u.email, isPro: u.isPro, nickname: u.nickname, avatar: u.avatar } });
      }

      if (pathname === '/api/auth/logout' && req.method === 'POST') {
        await db.deleteSession(getTokenFromCookie(req));
        clearSessionCookie(res);
        return sendJSON(res, { ok: true });
      }

      if (pathname === '/api/auth/me' && req.method === 'GET') {
        const user = await authUser(req);
        if (!user) return sendJSON(res, { ok: false, msg: '未登录' }, 401);
        const quotas = await db.getQuotas(user.id);
        return sendJSON(res, { ok: true, user, quotas });
      }

      // ---- 升级会员 ----
      if (pathname === '/api/user/upgrade' && req.method === 'POST') {
        const user = await authUser(req);
        if (!user) return sendJSON(res, { ok: false, msg: '请先登录' }, 401);
        const updated = await db.updateUser(user.id, { isPro: true });
        return sendJSON(res, { ok: true, user: updated });
      }

      // ---- 微信 OAuth 入口 ----
      if (pathname === '/api/auth/wechat' && req.method === 'GET') {
        if (!WECHAT.appId) return sendJSON(res, { ok: false, msg: '微信登录未配置' }, 500);
        const state = crypto.randomBytes(8).toString('hex');
        const authUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${WECHAT.appId}&redirect_uri=${encodeURIComponent(WECHAT.redirectUri)}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`;
        return redirect(res, authUrl);
      }
      if (pathname === '/api/auth/wechat/callback' && req.method === 'GET') {
        return handleWechatCallback(req, res, query);
      }

      // ---- QQ OAuth 入口 ----
      if (pathname === '/api/auth/qq' && req.method === 'GET') {
        if (!QQ.appId) return sendJSON(res, { ok: false, msg: 'QQ登录未配置' }, 500);
        const state = crypto.randomBytes(8).toString('hex');
        const authUrl = `https://graph.qq.com/oauth2.0/authorize?response_type=code&client_id=${QQ.appId}&redirect_uri=${encodeURIComponent(QQ.redirectUri)}&state=${state}`;
        return redirect(res, authUrl);
      }
      if (pathname === '/api/auth/qq/callback' && req.method === 'GET') {
        return handleQqCallback(req, res, query);
      }

      // ---- 配额 ----
      if (pathname === '/api/quotas' && req.method === 'GET') {
        const user = await authUser(req);
        if (!user) return sendJSON(res, { ok: false, msg: '未登录' }, 401);
        return sendJSON(res, { ok: true, quotas: await db.getQuotas(user.id) });
      }
      if (pathname === '/api/quotas/use' && req.method === 'POST') {
        const user = await authUser(req);
        if (!user) return sendJSON(res, { ok: false, msg: '请先登录' }, 401);
        const { type } = await parseBody(req);
        const result = await db.useQuota(user.id, type);
        result.quotas = await db.getQuotas(user.id);
        return sendJSON(res, result);
      }

      // ---- 家电报错码 ----
      if (pathname === '/api/appliance' && req.method === 'GET') {
        const keyword = query.keyword || '';
        const type = query.type || 'all';
        return sendJSON(res, { ok: true, data: await db.searchApplianceCodes(keyword, type) });
      }

      // ---- 工具 ----
      if (pathname === '/api/tools' && req.method === 'GET') {
        const category = query.category || 'all';
        const keyword = query.keyword || '';
        return sendJSON(res, { ok: true, data: await db.getTools(category, keyword) });
      }
      if (pathname.startsWith('/api/tools/') && req.method === 'GET') {
        const id = pathname.split('/').pop();
        const tool = await db.getToolById(id);
        if (!tool) return sendJSON(res, { ok: false, msg: '工具不存在' }, 404);
        return sendJSON(res, { ok: true, data: tool });
      }

      return sendJSON(res, { ok: false, msg: '接口不存在' }, 404);
    } catch (err) {
      console.error('[api error]', err);
      return sendJSON(res, { ok: false, msg: '服务器错误' }, 500);
    }
  }

  // ---- 静态文件 ----
  let filePath = pathname;
  if (filePath === '/') filePath = '/index.html';
  const fullPath = path.join(ROOT, filePath);
  if (!fullPath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      // SPA fallback: 未知路径返回 index.html
      if (path.extname(filePath) === '') {
        fs.readFile(path.join(ROOT, 'index.html'), (e, d) => {
          if (e) { res.writeHead(404); res.end('Not Found'); return; }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
          res.end(d);
        });
        return;
      }
      res.writeHead(404); res.end('Not Found'); return;
    }
    const ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 一键 Get 服务已启动: http://localhost:${PORT}`);
  console.log(`   微信登录: ${WECHAT.appId ? '已配置' : '未配置 (设置 WECHAT_APP_ID / WECHAT_APP_SECRET)'}`);
  console.log(`   QQ 登录:   ${QQ.appId ? '已配置' : '未配置 (设置 QQ_APP_ID / QQ_APP_SECRET)'}`);
  console.log(`   数据库:   ${path.join(ROOT, 'data', 'app.db')}\n`);
});
