/**
 * 数据库层 — 基于 Node.js 内置 node:sqlite（零第三方依赖）
 * 持久化：用户、会话、配额、家电报错码、工具列表
 * 知识库文章为只读生成数据，由后端内存生成后通过 API 返回，不入库。
 */
const { DatabaseSync } = require('node:sqlite');
const crypto = require('node:crypto');
const path = require('node:path');

const DB_PATH = path.join(__dirname, 'data', 'app.db');

// 确保 data 目录存在
try { require('node:fs').mkdirSync(path.join(__dirname, 'data'), { recursive: true }); } catch {}

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

/* ============================================================
   建表
   ============================================================ */
db.exec(`
CREATE TABLE IF NOT EXISTS users (
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
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quotas (
  user_id TEXT PRIMARY KEY,
  contract_audit INTEGER DEFAULT 5,
  tools INTEGER DEFAULT 15,
  appliance INTEGER DEFAULT 15,
  knowledge INTEGER DEFAULT 15,
  reset_month TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS appliance_codes (
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
);

CREATE TABLE IF NOT EXISTS tools (
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
);
`);

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
function createUser({ username, email, password, isPro = false, openidWechat, openidQq, nickname, avatar }) {
  const id = uid('u');
  let passwordHash = null, passwordSalt = null;
  if (password) {
    const { hash, salt } = hashPassword(password);
    passwordHash = hash;
    passwordSalt = salt;
  }
  db.prepare(`INSERT INTO users (id, username, email, password_hash, password_salt, is_pro, nickname, avatar, openid_wechat, openid_qq, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, username || null, email || null, passwordHash, passwordSalt, isPro ? 1 : 0,
         nickname || username || null, avatar || null, openidWechat || null, openidQq || null,
         new Date().toISOString());
  // 初始化配额
  db.prepare(`INSERT INTO quotas (user_id, contract_audit, tools, appliance, knowledge, reset_month)
              VALUES (?, 5, 15, 15, 15, ?)`)
    .run(id, currentMonth());
  return getUserById(id);
}

function getUserById(id) {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return rowToUser(row);
}

function getUserByUsername(username) {
  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  return row ? { ...rowToUser(row), passwordHash: row.password_hash, passwordSalt: row.password_salt } : null;
}

function getUserByOpenid(provider, openid) {
  const col = provider === 'wechat' ? 'openid_wechat' : 'openid_qq';
  const row = db.prepare(`SELECT * FROM users WHERE ${col} = ?`).get(openid);
  return rowToUser(row);
}

function updateUser(id, patch) {
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
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
  return getUserById(id);
}

/* ============================================================
   会话
   ============================================================ */
function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 天
  db.prepare(`INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`)
    .run(token, userId, now.toISOString(), expires.toISOString());
  return token;
}

function getSession(token) {
  if (!token) return null;
  const row = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }
  return row;
}

function deleteSession(token) {
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

function getUserByToken(token) {
  const sess = getSession(token);
  return sess ? getUserById(sess.user_id) : null;
}

/* ============================================================
   配额（按月重置）
   ============================================================ */
function getQuotas(userId) {
  const row = db.prepare('SELECT * FROM quotas WHERE user_id = ?').get(userId);
  if (!row) {
    db.prepare(`INSERT INTO quotas (user_id, contract_audit, tools, appliance, knowledge, reset_month)
                VALUES (?, 5, 15, 15, 15, ?)`).run(userId, currentMonth());
    return { contractAudit: 5, appliance: 15, tools: 15, knowledge: 15 };
  }
  const month = currentMonth();
  if (row.reset_month !== month) {
    db.prepare(`UPDATE quotas SET contract_audit = 5, tools = 15, appliance = 15, knowledge = 15, reset_month = ? WHERE user_id = ?`)
      .run(month, userId);
    return { contractAudit: 5, appliance: 15, tools: 15, knowledge: 15 };
  }
  return { contractAudit: row.contract_audit, appliance: row.appliance, tools: row.tools, knowledge: row.knowledge };
}

function useQuota(userId, type) {
  const user = getUserById(userId);
  if (!user) return { ok: false, msg: '请先登录' };
  if (user.isPro) return { ok: true };
  const col = type === 'contract' ? 'contract_audit' : type;
  const row = db.prepare(`SELECT ${col} AS v, reset_month FROM quotas WHERE user_id = ?`).get(userId);
  if (!row) return { ok: false, msg: '配额不存在' };
  if (row.reset_month !== currentMonth()) {
    getQuotas(userId); // 重置
    return useQuota(userId, type);
  }
  if (row.v <= 0) return { ok: false, msg: '本月次数已用完，请开通专业版' };
  db.prepare(`UPDATE quotas SET ${col} = ${col} - 1 WHERE user_id = ?`).run(userId);
  const after = getQuotas(userId);
  return { ok: true, remaining: after[type === 'contract' ? 'contractAudit' : type] };
}

/* ============================================================
   家电报错码（seed + 查询）
   ============================================================ */
function seedApplianceCodes(codes) {
  const count = db.prepare('SELECT COUNT(*) AS c FROM appliance_codes').get().c;
  if (count > 0) return;
  const stmt = db.prepare(`INSERT INTO appliance_codes (code, type, appliance_name, title, severity, brand, models, causes, solutions)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  db.exec('BEGIN');
  try {
    for (const r of codes) {
      stmt.run(r.code, r.appliance || r.type || '', r.applianceName || '', r.title || '',
               r.severity || 'info', r.brand || '', r.models || '',
               JSON.stringify(r.causes || []), JSON.stringify(r.solutions || []));
    }
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
}

function searchApplianceCodes(keyword, type) {
  let sql = 'SELECT * FROM appliance_codes WHERE 1=1';
  const params = [];
  if (keyword) { sql += ' AND (brand LIKE ? OR code LIKE ? OR title LIKE ? OR solutions LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`); }
  if (type && type !== 'all') { sql += ' AND type = ?'; params.push(type); }
  sql += ' ORDER BY brand LIMIT 200';
  return db.prepare(sql).all(...params).map(r => ({
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
function seedTools(tools) {
  const count = db.prepare('SELECT COUNT(*) AS c FROM tools').get().c;
  if (count > 0) return;
  const stmt = db.prepare(`INSERT INTO tools (id, name, desc, icon, category, category_name, impl, uses, likes, hot)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  db.exec('BEGIN');
  try {
    for (const t of tools) {
      stmt.run(t.id, t.name, t.desc, t.icon, t.category, t.categoryName || '', t.impl,
               String(t.uses || '0'), String(t.likes || '0'), t.hot ? 1 : 0);
    }
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
}

function getTools(category, keyword) {
  let sql = 'SELECT * FROM tools WHERE 1=1';
  const params = [];
  if (category && category !== 'all') { sql += ' AND category = ?'; params.push(category); }
  if (keyword) { sql += ' AND (name LIKE ? OR desc LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }
  sql += ' ORDER BY CAST(REPLACE(uses, \'k\', \'\') AS REAL) DESC LIMIT 1000';
  return db.prepare(sql).all(...params).map(r => ({ ...r, hot: !!r.hot, categoryName: r.category_name }));
}

function getToolById(id) {
  const r = db.prepare('SELECT * FROM tools WHERE id = ?').get(id);
  return r ? { ...r, hot: !!r.hot, categoryName: r.category_name } : null;
}

function incToolUses(id) {
  // uses 为展示字符串，不做实际自增
}

module.exports = {
  db,
  hashPassword, verifyPassword,
  uid, currentMonth,
  createUser, getUserById, getUserByUsername, getUserByOpenid, updateUser,
  createSession, getSession, deleteSession, getUserByToken,
  getQuotas, useQuota,
  seedApplianceCodes, searchApplianceCodes,
  seedTools, getTools, getToolById, incToolUses,
};
