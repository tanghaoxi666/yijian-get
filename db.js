/**
 * 数据库层 — 基于 Turso（云端 SQLite，@libsql/client）
 * 持久化：用户、会话、配额、家电报错码、工具列表
 * 知识库文章为只读生成数据，由后端内存生成后通过 API 返回，不入库。
 *
 * 环境变量：
 *   TURSO_DATABASE_URL  — Turso 数据库 URL（libsql://xxx.turso.io）
 *   TURSO_AUTH_TOKEN     — Turso 认证 token
 *   若未配置，则回退到本地 SQLite 文件（开发用）
 */
const { createClient } = require('@libsql/client');
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

// 本地开发回退路径
const LOCAL_DB_PATH = path.join(__dirname, 'data', 'app.db');

let client;
if (TURSO_URL) {
  client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
  console.log('[db] 使用 Turso 云端数据库:', TURSO_URL);
} else {
  // 本地回退：使用 libsql 的本地文件模式
  try { fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true }); } catch {}
  client = createClient({ url: `file:${LOCAL_DB_PATH}` });
  console.log('[db] 使用本地 SQLite:', LOCAL_DB_PATH);
}

async function exec(sql) {
  return client.execute(sql);
}

async function query(sql, args = []) {
  const res = await client.execute({ sql, args });
  return res.rows;
}

async function queryOne(sql, args = []) {
  const rows = await query(sql, args);
  return rows[0] || null;
}

/* ============================================================
   建表（可等待的初始化 Promise）
   ============================================================ */
const initPromise = (async () => {
  try {
    const statements = [
      `CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT,
  password_salt TEXT,
  is_pro INTEGER DEFAULT 0,
  nickname TEXT,
  avatar TEXT,
  openid_wechat TEXT UNIQUE,
  openid_qq TEXT UNIQUE,
  created_at TEXT NOT NULL
)`,
      `CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)`,
      `CREATE TABLE IF NOT EXISTS quotas (
  user_id TEXT PRIMARY KEY,
  contract_audit INTEGER DEFAULT 5,
  tools INTEGER DEFAULT 15,
  appliance INTEGER DEFAULT 15,
  knowledge INTEGER DEFAULT 15,
  reset_month TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)`,
      `CREATE TABLE IF NOT EXISTS appliance_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,
  type TEXT NOT NULL,
  appliance_name TEXT,
  title TEXT,
  severity TEXT,
  brand TEXT,
  models TEXT,
  causes TEXT,
  solutions TEXT
)`,
      `CREATE TABLE IF NOT EXISTS tools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  desc TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  category_name TEXT,
  impl TEXT NOT NULL,
  uses TEXT DEFAULT '0',
  likes TEXT DEFAULT '0',
  hot INTEGER DEFAULT 0
)`,
      `PRAGMA foreign_keys = ON`,
    ];
    for (const sql of statements) {
      await exec(sql);
    }
    console.log('[db] 表结构已就绪');
  } catch (e) {
    console.error('[db] 建表失败:', e.message);
    throw e;
  }
})();

async function waitForInit() {
  await initPromise;
}

/* ============================================================
   密码哈希（scrypt，Node 内置）
   ============================================================ */
function hashPassword(password, salt) {
  if (!salt) salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}
function verifyPassword(password, hash, salt) {
  const { hash: h } = hashPassword(password, salt);
  return h === hash;
}

/* ============================================================
   工具函数
   ============================================================ */
function uid(prefix = 'u') {
  return prefix + '_' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    isPro: !!row.is_pro,
    nickname: row.nickname,
    avatar: row.avatar,
    createdAt: row.created_at,
  };
}

/* ============================================================
   用户
   ============================================================ */
async function createUser({ username, email, password, isPro = false, openidWechat, openidQq, nickname, avatar }) {
  const id = uid('u');
  let passwordHash = null, passwordSalt = null;
  if (password) {
    const { hash, salt } = hashPassword(password);
    passwordHash = hash;
    passwordSalt = salt;
  }
  await query(`INSERT INTO users (id, username, email, password_hash, password_salt, is_pro, nickname, avatar, openid_wechat, openid_qq, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, username || null, email || null, passwordHash, passwordSalt, isPro ? 1 : 0,
         nickname || username || null, avatar || null, openidWechat || null, openidQq || null,
         new Date().toISOString()]);
  // 初始化配额
  await query(`INSERT INTO quotas (user_id, contract_audit, tools, appliance, knowledge, reset_month)
              VALUES (?, 5, 15, 15, 15, ?)`, [id, currentMonth()]);
  return getUserById(id);
}

async function getUserById(id) {
  const row = await queryOne('SELECT * FROM users WHERE id = ?', [id]);
  return rowToUser(row);
}

async function getUserByUsername(username) {
  const row = await queryOne('SELECT * FROM users WHERE username = ?', [username]);
  return row ? { ...rowToUser(row), passwordHash: row.password_hash, passwordSalt: row.password_salt } : null;
}

async function getUserByOpenid(provider, openid) {
  const col = provider === 'wechat' ? 'openid_wechat' : 'openid_qq';
  const row = await queryOne(`SELECT * FROM users WHERE ${col} = ?`, [openid]);
  return rowToUser(row);
}

async function updateUser(id, patch) {
  const fields = [];
  const vals = [];
  if (patch.username !== undefined) { fields.push('username = ?'); vals.push(patch.username); }
  if (patch.email !== undefined) { fields.push('email = ?'); vals.push(patch.email); }
  if (patch.isPro !== undefined) { fields.push('is_pro = ?'); vals.push(patch.isPro ? 1 : 0); }
  if (patch.nickname !== undefined) { fields.push('nickname = ?'); vals.push(patch.nickname); }
  if (patch.avatar !== undefined) { fields.push('avatar = ?'); vals.push(patch.avatar); }
  if (patch.openidWechat !== undefined) { fields.push('openid_wechat = ?'); vals.push(patch.openidWechat); }
  if (patch.openidQq !== undefined) { fields.push('openid_qq = ?'); vals.push(patch.openidQq); }
  if (!fields.length) return getUserById(id);
  vals.push(id);
  await query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, vals);
  return getUserById(id);
}

/* ============================================================
   会话
   ============================================================ */
async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  await query(`INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`,
    [token, userId, now.toISOString(), expires.toISOString()]);
  return token;
}

async function getSession(token) {
  if (!token) return null;
  const row = await queryOne('SELECT * FROM sessions WHERE token = ?', [token]);
  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) {
    await query('DELETE FROM sessions WHERE token = ?', [token]);
    return null;
  }
  return row;
}

async function deleteSession(token) {
  if (token) await query('DELETE FROM sessions WHERE token = ?', [token]);
}

async function getUserByToken(token) {
  const sess = await getSession(token);
  return sess ? getUserById(sess.user_id) : null;
}

/* ============================================================
   配额（按月重置）
   ============================================================ */
async function getQuotas(userId) {
  const row = await queryOne('SELECT * FROM quotas WHERE user_id = ?', [userId]);
  if (!row) {
    await query(`INSERT INTO quotas (user_id, contract_audit, tools, appliance, knowledge, reset_month)
                VALUES (?, 5, 15, 15, 15, ?)`, [userId, currentMonth()]);
    return { contractAudit: 5, appliance: 15, tools: 15, knowledge: 15 };
  }
  const month = currentMonth();
  if (row.reset_month !== month) {
    await query(`UPDATE quotas SET contract_audit = 5, tools = 15, appliance = 15, knowledge = 15, reset_month = ? WHERE user_id = ?`,
      [month, userId]);
    return { contractAudit: 5, appliance: 15, tools: 15, knowledge: 15 };
  }
  return { contractAudit: row.contract_audit, appliance: row.appliance, tools: row.tools, knowledge: row.knowledge };
}

async function useQuota(userId, type) {
  const user = await getUserById(userId);
  if (!user) return { ok: false, msg: '请先登录' };
  if (user.isPro) return { ok: true };
  const col = type === 'contract' ? 'contract_audit' : type;
  const row = await queryOne(`SELECT ${col} AS v, reset_month FROM quotas WHERE user_id = ?`, [userId]);
  if (!row) return { ok: false, msg: '配额不存在' };
  if (row.reset_month !== currentMonth()) {
    await getQuotas(userId);
    return useQuota(userId, type);
  }
  if (row.v <= 0) return { ok: false, msg: '本月次数已用完，请开通专业版' };
  await query(`UPDATE quotas SET ${col} = ${col} - 1 WHERE user_id = ?`, [userId]);
  const after = await getQuotas(userId);
  return { ok: true, remaining: after[type === 'contract' ? 'contractAudit' : type] };
}

/* ============================================================
   家电报错码（seed + 查询）
   ============================================================ */
async function seedApplianceCodes(codes) {
  await waitForInit();
  const countRow = await queryOne('SELECT COUNT(*) AS c FROM appliance_codes');
  if (countRow.c > 0) return;
  const stmt = `INSERT INTO appliance_codes (code, type, appliance_name, title, severity, brand, models, causes, solutions)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const steps = codes.map(r => ({
    sql: stmt,
    args: [r.code, r.appliance || r.type || '', r.applianceName || '', r.title || '',
           r.severity || 'info', r.brand || '', r.models || '',
           JSON.stringify(r.causes || []), JSON.stringify(r.solutions || [])],
  }));
  await client.batch(steps, 'write');
}

async function searchApplianceCodes(keyword, type) {
  let sql = 'SELECT * FROM appliance_codes WHERE 1=1';
  const params = [];
  if (keyword) { sql += ' AND (brand LIKE ? OR code LIKE ? OR title LIKE ? OR solutions LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`); }
  if (type && type !== 'all') { sql += ' AND type = ?'; params.push(type); }
  sql += ' ORDER BY brand LIMIT 200';
  const rows = await query(sql, params);
  return rows.map(r => ({
    ...r,
    appliance: r.type,
    applianceName: r.appliance_name,
    causes: JSON.parse(r.causes || '[]'),
    solutions: JSON.parse(r.solutions || '[]'),
  }));
}

/* ============================================================
   工具（seed + 查询）
   ============================================================ */
async function seedTools(tools) {
  await waitForInit();
  const countRow = await queryOne('SELECT COUNT(*) AS c FROM tools');
  if (countRow.c > 0) return;
  const stmt = `INSERT INTO tools (id, name, desc, icon, category, category_name, impl, uses, likes, hot)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const steps = tools.map(t => ({
    sql: stmt,
    args: [t.id, t.name, t.desc, t.icon, t.category, t.categoryName || '', t.impl,
           String(t.uses || '0'), String(t.likes || '0'), t.hot ? 1 : 0],
  }));
  await client.batch(steps, 'write');
}

async function getTools(category, keyword) {
  let sql = 'SELECT * FROM tools WHERE 1=1';
  const params = [];
  if (category && category !== 'all') { sql += ' AND category = ?'; params.push(category); }
  if (keyword) { sql += ' AND (name LIKE ? OR desc LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }
  sql += ` ORDER BY CAST(REPLACE(uses, 'k', '') AS REAL) DESC LIMIT 1000`;
  const rows = await query(sql, params);
  return rows.map(r => ({ ...r, hot: !!r.hot, categoryName: r.category_name }));
}

async function getToolById(id) {
  const r = await queryOne('SELECT * FROM tools WHERE id = ?', [id]);
  return r ? { ...r, hot: !!r.hot, categoryName: r.category_name } : null;
}

function incToolUses(id) {
  // uses 为展示字符串，不做实际自增
}

module.exports = {
  client,
  hashPassword, verifyPassword,
  uid, currentMonth,
  createUser, getUserById, getUserByUsername, getUserByOpenid, updateUser,
  createSession, getSession, deleteSession, getUserByToken,
  getQuotas, useQuota,
  seedApplianceCodes, searchApplianceCodes,
  seedTools, getTools, getToolById, incToolUses,
};
