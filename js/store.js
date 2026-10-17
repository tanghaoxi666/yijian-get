/* ============================================================
   一键 Get — 数据层
   架构：后端 API + 内存缓存（不再使用 localStorage 持久化用户数据）
   知识库文章为只读生成数据，保留在前端内存中生成。
   ============================================================ */

const Store = (() => {
  // 内存缓存
  const cache = {
    user: null,
    quotas: { contractAudit: 5, appliance: 15, tools: 15, knowledge: 15 },
    applianceCodes: [],
    tools: [],
    toolsMap: new Map(),
    auditHistory: [],
    recentKnowledge: [],
  };

  let _knowledgeCache = null;
  let _knowledgeIndex = null;

  /* ---------- 通用 API 请求 ---------- */
  async function api(path, options = {}) {
    const res = await fetch(path, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    return data;
  }

  /* ============================================================
     初始化：从后端拉取当前用户、配额、家电码、工具
     ============================================================ */
  async function init() {
    try {
      // 并行拉取
      const [meRes, appRes, toolRes] = await Promise.allSettled([
        api('/api/auth/me'),
        api('/api/appliance'),
        api('/api/tools'),
      ]);

      if (meRes.status === 'fulfilled' && meRes.value.ok) {
        cache.user = meRes.value.user;
        cache.quotas = meRes.value.quotas || cache.quotas;
      }
      if (appRes.status === 'fulfilled' && appRes.value.ok) {
        cache.applianceCodes = appRes.value.data || [];
      } else {
        cache.applianceCodes = SEED_APPLIANCE_CODES; // 兜底
      }
      if (toolRes.status === 'fulfilled' && toolRes.value.ok) {
        cache.tools = toolRes.value.data || [];
      } else {
        cache.tools = buildTools(); // 兜底
      }
      cache.toolsMap = new Map(cache.tools.map(t => [t.id, t]));
    } catch (e) {
      console.warn('[Store] init fallback', e);
      cache.applianceCodes = SEED_APPLIANCE_CODES;
      cache.tools = buildTools();
      cache.toolsMap = new Map(cache.tools.map(t => [t.id, t]));
    }
  }

  /* ============================================================
     用户 / 认证
     ============================================================ */
  async function registerUser({ username, email, password }) {
    const res = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    if (res.ok) { cache.user = res.user; }
    return res;
  }

  async function loginUser({ account, password }) {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ account, password }),
    });
    if (res.ok) {
      cache.user = res.user;
      // 登录后拉取配额
      const q = await api('/api/quotas');
      if (q.ok) cache.quotas = q.quotas;
    }
    return res;
  }

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' });
    cache.user = null;
    cache.quotas = { contractAudit: 5, appliance: 15, tools: 15, knowledge: 15 };
  }

  function currentUser() { return cache.user; }

  async function upgradeUser() {
    const res = await api('/api/user/upgrade', { method: 'POST' });
    if (res.ok && res.user) cache.user = res.user;
    return res;
  }

  /* ============================================================
     配额
     ============================================================ */
  function getUserQuotas() { return cache.quotas; }

  async function useContractAudit() {
    if (cache.user && cache.user.isPro) return { ok: true };
    const res = await api('/api/quotas/use', {
      method: 'POST',
      body: JSON.stringify({ type: 'contract' }),
    });
    if (res.ok) cache.quotas = res.quotas || cache.quotas;
    return res;
  }

  async function useTool() {
    if (cache.user && cache.user.isPro) return { ok: true };
    const res = await api('/api/quotas/use', {
      method: 'POST',
      body: JSON.stringify({ type: 'tools' }),
    });
    if (res.ok) cache.quotas = res.quotas || cache.quotas;
    return res;
  }

  /* ============================================================
     家电报错代码
     ============================================================ */
  function getApplianceCodes() { return cache.applianceCodes; }

  function searchApplianceCodes(keyword, applianceType) {
    const kw = (keyword || '').toLowerCase().trim();
    return cache.applianceCodes.filter(c => {
      if (applianceType && applianceType !== 'all' && c.appliance !== applianceType) return false;
      if (!kw) return true;
      return (c.code || '').toLowerCase().includes(kw)
        || (c.brand || '').toLowerCase().includes(kw)
        || (c.title || '').toLowerCase().includes(kw)
        || (c.solution || '').toLowerCase().includes(kw)
        || (c.solutions || []).some(s => s.toLowerCase().includes(kw));
    });
  }

  /* ============================================================
     工具库
     ============================================================ */
  function getTools() { return cache.tools; }
  function getToolById(id) { return cache.toolsMap.get(id) || null; }

  /* ============================================================
     审计历史 / 最近浏览（内存中，会话级）
     ============================================================ */
  function addAuditHistory(entry) {
    cache.auditHistory.unshift({ ...entry, time: Date.now() });
    if (cache.auditHistory.length > 50) cache.auditHistory.pop();
  }
  function getAuditHistory() { return cache.auditHistory; }
  function addRecentKnowledge(id) {
    cache.recentKnowledge = cache.recentKnowledge.filter(k => k !== id);
    cache.recentKnowledge.unshift(id);
    if (cache.recentKnowledge.length > 20) cache.recentKnowledge.pop();
  }

  /* ============================================================
     知识库（内存生成，不入库）
     ============================================================ */
  function getKnowledge() {
    if (!_knowledgeCache) {
      _knowledgeCache = buildKnowledge();
      _knowledgeIndex = new Map(_knowledgeCache.map(k => [k.id, k]));
    }
    return _knowledgeCache;
  }
  function getKnowledgeById(id) {
    if (!_knowledgeCache) getKnowledge();
    return _knowledgeIndex.get(id);
  }
  function searchKnowledge(keyword, category) {
    const list = getKnowledge();
    const kw = (keyword || '').toLowerCase().trim();
    const filterCat = (c) => !category || category === 'all' || c.category === category;
    if (!kw) return list.filter(filterCat).slice(0, 60);
    const tokens = [];
    for (let i = 0; i < kw.length - 1; i++) tokens.push(kw.slice(i, i + 2));
    const results = [];
    for (const k of list) {
      if (!filterCat(k)) continue;
      const title = (k.title || '').toLowerCase();
      if (title.includes(kw)) { results.push(k); continue; }
      const hay = title + ' ' + (k.summary || '').toLowerCase() + ' ' + (k.categoryName || '').toLowerCase();
      if (tokens.every(t => hay.includes(t))) results.push(k);
      if (results.length >= 60) break;
    }
    return results;
  }
  function getKnowledgeCategories() {
    if (!_knowledgeCache) getKnowledge();
    const map = new Map();
    for (const a of _knowledgeCache) {
      if (!map.has(a.category)) map.set(a.category, a.categoryName);
    }
    return Array.from(map.entries()).map(([key, name]) => ({ key, name }));
  }

  return {
    init,
    registerUser, loginUser, logout, currentUser, upgradeUser,
    getUserQuotas, useContractAudit, useTool,
    getApplianceCodes, searchApplianceCodes,
    getTools, getToolById,
    addAuditHistory, getAuditHistory, addRecentKnowledge,
    getKnowledge, getKnowledgeById, searchKnowledge, getKnowledgeCategories,
  };
})();

window.Store = Store;
