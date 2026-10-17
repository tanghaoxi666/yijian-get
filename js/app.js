/* ============================================================
   一键 Get — 共享交互逻辑（接入 Store + Tools）
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  if (window.lucide) lucide.createIcons();
  initTheme();
  initNavActive();
  try { await Store.init(); } catch (e) { console.warn('Store init failed', e); }
  initAuthUI();        // 认证 UI：登录态、登出
  initModals();
  initCheckboxes();
  initPasswordToggles();
  initSidebarDrawer();
  initThemeToggle();
  initForms();         // 登录/注册
  initSocialLogin();   // 微信/QQ/邮箱登录
  initFileUpload();    // 合同审计
  initAppliancePage(); // 家电报错
  initToolboxPage();   // 工具库
  initKnowledgePage(); // 知识库
  initSearchFilter();
  initCategorySwitch();
  initApplianceSwitch();
  initMobileTabbar();
  initMemberUpgrade(); // 开通会员
});

/* ============================================================
   主题
   ============================================================ */
function initTheme() {
  const saved = localStorage.getItem('yj-theme');
  const isDark = saved ? saved === 'dark' : true;
  applyTheme(isDark);
}
function applyTheme(dark) {
  const html = document.documentElement;
  if (dark) { html.classList.add('dark'); html.setAttribute('data-theme', 'dark'); }
  else { html.classList.remove('dark'); html.setAttribute('data-theme', 'light'); }
}
function toggleTheme() {
  const isDark = !document.documentElement.classList.contains('dark');
  applyTheme(isDark);
  localStorage.setItem('yj-theme', isDark ? 'dark' : 'light');
  if (window.lucide) lucide.createIcons();
}
function initThemeToggle() {
  document.querySelectorAll('[data-theme-toggle]').forEach(btn => btn.addEventListener('click', toggleTheme));
}

/* ============================================================
   导航高亮
   ============================================================ */
function initNavActive() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  const map = {
    'index.html': 'nav-contract-audit', 'contract-audit.html': 'nav-contract-audit',
    'home-appliance.html': 'nav-home-appliance', 'toolbox.html': 'nav-toolbox',
    'knowledge.html': 'nav-knowledge',
  };
  const activeId = map[path];
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.dataset.domId === activeId) {
      item.classList.add('nav-active');
      item.style.boxShadow = 'var(--nm-pressed)';
      item.style.color = 'var(--yj-primary)';
      item.style.fontWeight = '600';
    } else {
      item.classList.remove('nav-active');
      item.style.boxShadow = ''; item.style.color = ''; item.style.fontWeight = '';
    }
  });
}

/* ============================================================
   弹窗
   ============================================================ */
function initModals() {
  document.querySelectorAll('[data-modal-open]').forEach(btn => btn.addEventListener('click', () => openModal(btn.dataset.modalOpen)));
  document.querySelectorAll('[data-modal-close]').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.dataset.modalClose || btn.closest('[data-dom-id]')?.id;
    closeModal(id || 'member-modal');
  }));
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(overlay.id); });
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.flex').forEach(m => closeModal(m.id));
  });
}
function openModal(id) { const m = document.getElementById(id); if (!m) return; m.classList.remove('hidden'); m.classList.add('flex'); }
function closeModal(id) { const m = document.getElementById(id); if (!m) return; m.classList.add('hidden'); m.classList.remove('flex'); }

/* ============================================================
   复选框 / 密码切换 / 侧栏
   ============================================================ */
function initCheckboxes() {
  document.querySelectorAll('.nm-checkbox-wrap, .agree-wrap').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.tagName === 'A') return;
      const cb = el.querySelector('.nm-checkbox'); if (cb) cb.classList.toggle('checked');
    });
  });
}
function initPasswordToggles() {
  document.querySelectorAll('[data-toggle-password]').forEach(btn => btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.togglePassword); if (!input) return;
    const isPwd = input.type === 'password'; input.type = isPwd ? 'text' : 'password';
    const icon = btn.querySelector('i'); if (icon) icon.setAttribute('data-lucide', isPwd ? 'eye-off' : 'eye');
    if (window.lucide) lucide.createIcons();
  }));
}
function initSidebarDrawer() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const openBtn = document.querySelector('[data-sidebar-open]');
  const closeBtn = document.querySelector('[data-sidebar-close]');
  if (openBtn && sidebar) openBtn.addEventListener('click', () => { sidebar.classList.add('open'); overlay?.classList.add('active'); });
  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
  if (overlay) overlay.addEventListener('click', closeSidebar);
  function closeSidebar() { sidebar?.classList.remove('open'); overlay?.classList.remove('active'); }
}

/* ============================================================
   认证：登录/注册/登出 + 顶部用户卡
   ============================================================ */
function initAuthUI() {
  const user = Store.currentUser();
  // 登录/注册页不需要显示用户卡
  const path = window.location.pathname.split('/').pop();
  if (path === 'login.html' || path === 'register.html') return;

  const userCard = document.querySelector('[data-user-card]');
  if (userCard) {
    if (user) {
      userCard.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-[var(--yj-primary)] text-white flex items-center justify-center font-bold shadow-[var(--nm-inset)]">
            ${user.username.charAt(0).toUpperCase()}
          </div>
          <div class="min-w-0">
            <div class="text-sm font-semibold text-[var(--yj-foreground)] truncate">${user.username}</div>
            <div class="text-xs text-[var(--yj-foreground-muted)] flex items-center gap-1">
              ${user.isPro ? '<i data-lucide="crown" class="w-3 h-3 text-amber-400"></i><span class="text-amber-400">专业版</span>' : '免费版'}
            </div>
          </div>
          <button id="logout-btn" class="ml-auto p-2 rounded-lg hover:bg-[var(--yj-surface-hover)] text-[var(--yj-foreground-muted)]" title="退出登录">
            <i data-lucide="log-out" class="w-4 h-4"></i>
          </button>
        </div>`;
      document.getElementById('logout-btn')?.addEventListener('click', async () => {
        try { await Store.logout(); } catch (e) {}
        showToast('已退出登录', 'info');
        setTimeout(() => { window.location.href = 'index.html'; }, 600);
      });
    } else {
      userCard.innerHTML = `
        <div class="flex items-center gap-2">
          <a href="login.html" class="px-4 py-2 rounded-lg text-sm font-medium text-[var(--yj-foreground-muted)] hover:text-[var(--yj-foreground)]">登录</a>
          <a href="register.html" class="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--yj-primary)] text-white shadow-[var(--nm-raised-sm)] hover:opacity-90">注册</a>
        </div>`;
    }
    if (window.lucide) lucide.createIcons();
  }

  // 会员 UI：专业版隐藏升级按钮、配额提示、会员引导条
  updateMemberUI();
}

// 根据会员状态显示/隐藏升级按钮、配额徽章、会员引导条，并更新配额数字
async function updateMemberUI() {
  const user = Store.currentUser();
  const isPro = user && user.isPro;

  // 升级按钮
  document.querySelectorAll('[data-upgrade-btn]').forEach(btn => {
    btn.style.display = isPro ? 'none' : '';
  });

  // 配额徽章（本月剩余）
  document.querySelectorAll('[data-quota-badge]').forEach(badge => {
    badge.style.display = isPro ? 'none' : '';
  });

  // 会员引导条
  document.querySelectorAll('[data-member-banner]').forEach(banner => {
    banner.style.display = isPro ? 'none' : '';
  });

  // 更新配额数字
  if (!isPro && user) {
    let quotas;
    try { quotas = await Store.getUserQuotas(); } catch (e) { quotas = { contractAudit: 0, tools: 0 }; }
    document.querySelectorAll('[data-quota-value]').forEach(el => {
      const type = el.dataset.quotaValue;
      if (type === 'contract') el.textContent = quotas.contractAudit;
      else if (type === 'tools') el.textContent = quotas.tools;
    });
  }
}

function initForms() {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      const account = document.getElementById('login-username')?.value.trim();
      const password = document.getElementById('login-password')?.value;
      if (!account) return showToast('请输入用户名或邮箱', 'warning');
      if (!password) return showToast('请输入密码', 'warning');
      const res = await Store.loginUser({ account, password });
      if (!res.ok) return showToast(res.msg, 'error');
      showToast('登录成功，欢迎回来！', 'success');
      setTimeout(() => { window.location.href = 'index.html'; }, 600);
    });
  }
  const regForm = document.getElementById('register-form');
  if (regForm) {
    regForm.addEventListener('submit', async e => {
      e.preventDefault();
      const username = document.getElementById('reg-username')?.value.trim();
      const email = document.getElementById('reg-email')?.value.trim();
      const pwd = document.getElementById('reg-password')?.value;
      const pwd2 = document.getElementById('reg-confirm-password')?.value;
      const agreed = regForm.querySelector('.nm-checkbox')?.classList.contains('checked');
      if (!username) return showToast('请输入用户名', 'warning');
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showToast('请输入有效邮箱', 'warning');
      if (!pwd || pwd.length < 8) return showToast('密码至少 8 位', 'warning');
      if (pwd !== pwd2) return showToast('两次密码不一致', 'error');
      if (!agreed) return showToast('请先同意用户协议', 'warning');
      const res = await Store.registerUser({ username, email, password: pwd });
      if (!res.ok) return showToast(res.msg, 'error');
      showToast('注册成功，请登录', 'success');
      setTimeout(() => { window.location.href = 'login.html'; }, 600);
    });
  }
}

/* ============================================================
   生成二维码占位图（纯 SVG，无需外部服务）
   ============================================================ */
function generateQRPlaceholder(text) {
  const size = 21; // 21x21 网格，模拟二维码
  const cells = [];
  // 根据输入文本生成种子，使不同内容图案不同
  let seed = 12345;
  if (text) { for (let i = 0; i < text.length; i++) seed = (seed * 31 + text.charCodeAt(i)) % 233280; }
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // 三个定位角（左上、右上、左下）
      const inFinder = (x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7);
      let filled;
      if (inFinder) {
        // 定位角图案：外框 7x7 黑，内 5x5 白，再内 3x3 黑
        const fx = x < 7 ? x : (x >= size - 7 ? x - (size - 7) : x);
        const fy = y < 7 ? y : (y >= size - 7 ? y - (size - 7) : y);
        const onBorder = fx === 0 || fx === 6 || fy === 0 || fy === 6;
        const inCenter = fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4;
        filled = onBorder || inCenter;
      } else {
        filled = rand() > 0.5;
      }
      if (filled) cells.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="#000"/>`);
    }
  }
  return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" class="w-full h-full" shape-rendering="crispEdges">${cells.join('')}</svg>`;
}

/* ============================================================
   第三方登录（微信 / QQ / 邮箱）
   ============================================================ */
function initSocialLogin() {
  const btns = document.querySelectorAll('[data-social-login]');
  if (!btns.length) return;
  const modal = document.getElementById('social-modal');
  const body = document.getElementById('social-modal-body');

  // 确保社交账号存在并登录
  async function socialLogin(username, email, displayName) {
    // 邮箱登录走后端注册+登录接口
    const regRes = await Store.registerUser({ username, email, password: 'social123' });
    if (!regRes.ok && !/已存在/.test(regRes.msg)) { showToast('登录失败：' + regRes.msg, 'error'); return; }
    const res = await Store.loginUser({ account: username, password: 'social123' });
    if (!res.ok) { showToast('登录失败：' + res.msg, 'error'); return; }
    showToast(`${displayName}登录成功`, 'success');
    setTimeout(() => { window.location.href = 'index.html'; }, 600);
  }

  btns.forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const type = btn.dataset.socialLogin;
      if (type === 'wechat') {
        // 真实微信 OAuth：跳转到后端授权端点
        window.location.href = '/api/auth/wechat';
      } else if (type === 'qq') {
        // 真实 QQ OAuth：跳转到后端授权端点
        window.location.href = '/api/auth/qq';
      } else if (type === 'email') {
        body.innerHTML = `
          <h3 class="text-lg font-bold text-[var(--yj-foreground)] mb-1 text-center">微信扫码登录</h3>
          <p class="text-xs text-[var(--yj-foreground-muted)] text-center mb-4">请使用微信扫描下方二维码</p>
          <div class="w-48 h-48 mx-auto rounded-xl bg-white flex items-center justify-center mb-4 p-2">
            ${generateQRPlaceholder()}
          </div>
          <button class="nm-btn nm-btn-primary w-full py-2.5 rounded-[var(--yj-radius-md)] text-[13px] font-semibold" id="wechat-confirm">我已扫码，确认登录</button>
          <p class="text-[11px] text-[var(--yj-foreground-subtle)] text-center mt-3">演示环境，点击确认即可模拟微信授权登录</p>`;
        openModal('social-modal');
        if (window.lucide) lucide.createIcons();
        document.getElementById('wechat-confirm')?.addEventListener('click', () => socialLogin('wx_user', 'wx@demo.com', '微信用户'));
      } else if (type === 'qq') {
        body.innerHTML = `
          <h3 class="text-lg font-bold text-[var(--yj-foreground)] mb-1 text-center">QQ 登录</h3>
          <p class="text-xs text-[var(--yj-foreground-muted)] text-center mb-4">输入 QQ 账号快捷登录</p>
          <div class="space-y-3">
            <input type="text" id="qq-account" placeholder="QQ 号 / 邮箱" class="w-full px-4 py-2.5 rounded-[var(--yj-radius-md)] bg-[var(--yj-background)] text-[13px] outline-none" style="box-shadow: var(--nm-inset-sm);"/>
            <input type="password" id="qq-pwd" placeholder="密码" class="w-full px-4 py-2.5 rounded-[var(--yj-radius-md)] bg-[var(--yj-background)] text-[13px] outline-none" style="box-shadow: var(--nm-inset-sm);"/>
            <button class="nm-btn nm-btn-primary w-full py-2.5 rounded-[var(--yj-radius-md)] text-[13px] font-semibold" id="qq-login">登 录</button>
          </div>
          <p class="text-[11px] text-[var(--yj-foreground-subtle)] text-center mt-3">演示环境，任意 QQ 号 + 密码即可登录</p>`;
        openModal('social-modal');
        document.getElementById('qq-login')?.addEventListener('click', () => {
          const acc = document.getElementById('qq-account').value.trim();
          if (!acc) return showToast('请输入 QQ 号', 'warning');
          socialLogin('qq_' + acc, acc + '@qq.com', 'QQ用户');
        });
      } else if (type === 'email') {
        body.innerHTML = `
          <h3 class="text-lg font-bold text-[var(--yj-foreground)] mb-1 text-center">邮箱登录</h3>
          <p class="text-xs text-[var(--yj-foreground-muted)] text-center mb-4">使用邮箱验证码登录</p>
          <div class="space-y-3">
            <input type="email" id="email-addr" placeholder="邮箱地址" class="w-full px-4 py-2.5 rounded-[var(--yj-radius-md)] bg-[var(--yj-background)] text-[13px] outline-none" style="box-shadow: var(--nm-inset-sm);"/>
            <div class="flex gap-2">
              <input type="text" id="email-code" placeholder="验证码" class="flex-1 px-4 py-2.5 rounded-[var(--yj-radius-md)] bg-[var(--yj-background)] text-[13px] outline-none" style="box-shadow: var(--nm-inset-sm);"/>
              <button class="nm-btn nm-raised px-3 py-2 rounded-[var(--yj-radius-md)] text-[12px] font-medium text-[var(--yj-primary)]" id="email-send">获取验证码</button>
            </div>
            <button class="nm-btn nm-btn-primary w-full py-2.5 rounded-[var(--yj-radius-md)] text-[13px] font-semibold" id="email-login">登 录</button>
          </div>
          <p class="text-[11px] text-[var(--yj-foreground-subtle)] text-center mt-3">演示环境，点击获取验证码后输入任意 4 位即可登录</p>`;
        openModal('social-modal');
        let codeSent = false;
        document.getElementById('email-send')?.addEventListener('click', function () {
          const addr = document.getElementById('email-addr').value.trim();
          if (!addr || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) return showToast('请输入有效邮箱', 'warning');
          codeSent = true;
          showToast('验证码已发送至 ' + addr + '（演示验证码：1234）', 'success');
          let n = 60;
          this.disabled = true; this.textContent = n + 's 后重发';
          const t = setInterval(() => { n--; this.textContent = n + 's 后重发'; if (n <= 0) { clearInterval(t); this.disabled = false; this.textContent = '获取验证码'; } }, 1000);
        });
        document.getElementById('email-login')?.addEventListener('click', () => {
          const addr = document.getElementById('email-addr').value.trim();
          const code = document.getElementById('email-code').value.trim();
          if (!addr) return showToast('请输入邮箱', 'warning');
          if (!codeSent) return showToast('请先获取验证码', 'warning');
          if (!code) return showToast('请输入验证码', 'warning');
          socialLogin('email_' + addr.split('@')[0], addr, '邮箱用户');
        });
      }
    });
  });
}

/* ============================================================
   合同审计（真实文件读取 + 许可证关键词检测）
   ============================================================ */
function initFileUpload() {
  const uploadArea = document.getElementById('upload-area');
  if (!uploadArea) return;
  const fileInput = uploadArea.querySelector('input[type="file"]');
  uploadArea.addEventListener('click', () => fileInput?.click());
  uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('dragover'); });
  uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
  uploadArea.addEventListener('drop', e => {
    e.preventDefault(); uploadArea.classList.remove('dragover');
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
  fileInput?.addEventListener('change', () => { if (fileInput.files[0]) handleFile(fileInput.files[0]); });

  async function handleFile(file) {
    const valid = ['txt', 'md', 'json'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!valid.includes(ext)) {
      return showToast('支持 .txt/.md/.json 格式，其他格式请先转为文本', 'warning');
    }
    // 检查合同审计配额
    const quotaRes = await Store.useContractAudit();
    if (!quotaRes.ok) {
      return showToast(quotaRes.msg, 'error');
    }
    // 更新配额显示
    if (typeof updateMemberUI === 'function') updateMemberUI();
    const user = Store.currentUser();
    const maxSize = (user && user.isPro) ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    const maxLabel = (user && user.isPro) ? '10MB' : '5MB';
    if (file.size > maxSize) return showToast(`文件大小不能超过 ${maxLabel}（专业版支持 10MB）`, 'error');
    const reader = new FileReader();
    reader.onload = () => runAudit(file.name, String(reader.result || ''));
    reader.onerror = () => showToast('文件读取失败', 'error');
    reader.readAsText(file, 'utf-8');
  }

  // 根据会员状态更新上传提示
  const hint = document.querySelector('[data-upload-hint]');
  if (hint) {
    const u = Store.currentUser();
    const limit = (u && u.isPro) ? '10MB' : '5MB';
    hint.textContent = `支持 .txt .md .json 格式，单文件不超过 ${limit}`;
  }
}

// 许可证风险关键词规则（覆盖主流开源许可证版本）
const LICENSE_RULES = [
  { type: 'high', label: '高风险·强Copyleft', keywords: ['GPL-3.0', 'GPLv3', 'GPL 3.0', 'AGPL-3.0', 'AGPLv3', 'AGPL 3.0', 'AGPL-1.0', 'GNU Affero', 'copyleft', '传染性', 'GPL-2.0', 'GPLv2', 'GPL 2.0', 'GPL-1.0', 'GPLv1'],
    desc: '该许可证具有强传染性，若使用（含静态链接）可能导致你的项目整体被迫以相同许可证开源。' },
  { type: 'medium', label: '中风险·弱Copyleft', keywords: ['LGPL-2.1', 'LGPLv2.1', 'LGPL-2.0', 'LGPLv2', 'LGPL-3.0', 'LGPLv3', 'LGPL 3.0', 'MPL-2.0', 'MPL 1.1', 'EPL-1.0', 'EPL-2.0', 'EPL', 'CDDL', '弱 Copyleft', 'Lesser GPL'],
    desc: '存在一定传染性：动态链接通常安全，静态链接或修改源码可能需要开源衍生部分。' },
  { type: 'low', label: '低风险·宽松许可', keywords: ['MIT', 'MIT License', 'Apache-2.0', 'Apache 2.0', 'Apache-1.0', 'Apache-1.1', 'BSD-2-Clause', 'BSD-3-Clause', 'BSD 2-Clause', 'BSD 3-Clause', 'ISC', 'ISC License', 'Unlicense', 'CC0', 'CC0-1.0', '0BSD', 'WTFPL', 'Zlib', 'libpng', 'OpenSSL', 'Artistic-2.0'],
    desc: '宽松许可证，可自由商用、修改、闭源分发，但需保留原版权声明与许可证文本。' },
  { type: 'info', label: '注意事项·专利与署名', keywords: ['专利', '专利授权', '专利诉讼', 'patent', '商标', '署名', 'attribution', 'Creative Commons', 'CC-BY', 'CC-BY-SA', 'CC-BY-NC', 'CC-BY-ND', '非商业', '禁止演绎'],
    desc: '涉及专利授权、署名或非商业/禁止演绎条款，请确保遵守使用限制并保留原始声明。' },
];

function runAudit(fileName, content) {
  showToast('正在审计合同内容...', 'info');
  const uploadEl = document.getElementById('upload-area');
  const resultEl = document.getElementById('audit-result');
  if (!uploadEl || !resultEl) return;
  uploadEl.style.display = 'none';
  resultEl.classList.remove('hidden');
  resultEl.classList.add('block');

  const fileTitle = resultEl.querySelector('[data-file-name]');
  if (fileTitle) fileTitle.textContent = fileName;

  // 文本预处理
  const text = content.toLowerCase();
  const findings = [];
  LICENSE_RULES.forEach(rule => {
    rule.keywords.forEach(kw => {
      if (text.includes(kw.toLowerCase())) {
        findings.push({ type: rule.type, label: rule.label, keyword: kw, desc: rule.desc });
      }
    });
  });

  // 通用条款检查
  const checks = [
    { test: /违约|违约金|违约责任/, label: '违约责任', present: /违约|违约金|违约责任/.test(content) },
    { test: /保密|保密协议|NDA/i, label: '保密条款', present: /保密|保密协议|NDA/i.test(content) },
    { test: /知识产权|版权|著作权/, label: '知识产权', present: /知识产权|版权|著作权/.test(content) },
    { test: /争议解决|仲裁|管辖/, label: '争议解决', present: /争议解决|仲裁|管辖/.test(content) },
    { test: /不可抗力/, label: '不可抗力', present: /不可抗力/.test(content) },
    { test: /解除|终止/, label: '合同解除', present: /解除|终止/.test(content) },
  ];

  // 渲染发现
  const riskList = resultEl.querySelector('#risk-list');
  if (riskList) {
    if (findings.length === 0) {
      riskList.innerHTML = `<div class="p-4 rounded-xl bg-emerald-500/10 text-emerald-500 text-sm">未发现明显许可证风险关键词。请人工复核整体条款。</div>`;
    } else {
      riskList.innerHTML = findings.map(f => {
        const color = { high: 'text-rose-500 bg-rose-500/10', medium: 'text-amber-500 bg-amber-500/10', low: 'text-emerald-500 bg-emerald-500/10', info: 'text-sky-500 bg-sky-500/10' }[f.type];
        return `<div class="p-3 rounded-xl ${color}">
          <div class="flex items-center gap-2 font-semibold text-sm">
            <span class="px-2 py-0.5 rounded bg-black/10">${f.label}</span>
            <span>命中关键词：${f.keyword}</span>
          </div>
          <div class="mt-1 text-xs opacity-90">${f.desc}</div>
        </div>`;
      }).join('');
    }
  }

  // 渲染条款检查
  const clauseList = resultEl.querySelector('#clause-check');
  if (clauseList) {
    clauseList.innerHTML = checks.map(c => `
      <div class="flex items-center justify-between p-3 rounded-xl bg-[var(--yj-surface)] shadow-[var(--nm-inset-sm)]">
        <span class="text-sm">${c.label}</span>
        <span class="text-xs px-2 py-1 rounded ${c.present ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'}">
          ${c.present ? '已包含' : '未包含'}
        </span>
      </div>`).join('');
  }

  // 保存历史
  Store.addAuditHistory({ fileName, riskCount: findings.length, summary: findings.map(f => f.keyword).join(', ') || '无明显风险' });

  resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  showToast(`审计完成，发现 ${findings.length} 项风险`, findings.length ? 'warning' : 'success');
}

/* ============================================================
   家电报错查询
   ============================================================ */
function initAppliancePage() {
  const grid = document.getElementById('appliance-grid');
  const detail = document.getElementById('code-detail');
  if (!grid) return;

  let currentType = 'all';
  let currentBrand = 'all';
  const typeButtons = document.querySelectorAll('[data-appliance]');
  const brandBtn = document.querySelector('[data-brand-btn]');
  const brandDropdown = document.querySelector('[data-brand-dropdown]');
  const brandLabel = document.querySelector('[data-brand-label]');

  // 收集所有品牌并填充下拉
  const allCodes = Store.getApplianceCodes();
  const brands = [...new Set(allCodes.map(c => c.brand).filter(Boolean))];
  if (brandDropdown) {
    brandDropdown.innerHTML = `<button class="w-full text-left px-3 py-2 rounded-[var(--yj-radius-sm)] text-[13px] ${currentBrand === 'all' ? 'text-[var(--yj-primary)] bg-[var(--yj-primary)]/10' : 'text-[var(--yj-foreground-muted)]'}" data-brand="all">全部品牌</button>` +
      brands.map(b => `<button class="w-full text-left px-3 py-2 rounded-[var(--yj-radius-sm)] text-[13px] text-[var(--yj-foreground-muted)] hover:bg-[var(--yj-primary)]/10 hover:text-[var(--yj-primary)]" data-brand="${b}">${b}</button>`).join('');
  }

  function render(keyword = '') {
    let codes = Store.searchApplianceCodes(keyword, currentType === 'all' ? '' : currentType);
    if (currentBrand !== 'all') codes = codes.filter(c => c.brand === currentBrand);
    if (!codes.length) {
      grid.innerHTML = `<div class="col-span-full text-center py-12 text-[var(--yj-foreground-muted)]">未找到匹配的报错代码</div>`;
      return;
    }
    grid.innerHTML = codes.map(c => {
      const color = { error: 'text-rose-500 bg-rose-500/10', warning: 'text-amber-500 bg-amber-500/10', info: 'text-sky-500 bg-sky-500/10' }[c.severity];
      const sevText = { error: '严重', warning: '警告', info: '提示' }[c.severity];
      return `
        <button class="code-card p-4 rounded-2xl bg-[var(--yj-surface)] shadow-[var(--nm-raised)] hover:shadow-[var(--nm-raised-hover)] text-left transition" data-code="${c.code}" data-appliance="${c.appliance}">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xl font-bold text-[var(--yj-foreground)]">${c.code}</span>
            <span class="text-xs px-2 py-0.5 rounded ${color}">${sevText}</span>
          </div>
          <div class="text-sm text-[var(--yj-foreground)] font-medium truncate">${c.title}</div>
          <div class="text-xs text-[var(--yj-foreground-muted)] mt-1">${c.applianceName} · ${c.brand}</div>
        </button>`;
    }).join('');
    grid.querySelectorAll('.code-card').forEach(card => {
      card.addEventListener('click', () => showCodeDetail(card.dataset.code, card.dataset.appliance));
    });
  }

  function showCodeDetail(code, appliance) {
    const c = Store.getApplianceCodes().find(x => x.code.toLowerCase() === code.toLowerCase() && x.appliance === appliance);
    if (!c) return;
    const color = { error: 'text-rose-500 bg-rose-500/10', warning: 'text-amber-500 bg-amber-500/10', info: 'text-sky-500 bg-sky-500/10' }[c.severity];
    const sevText = { error: '严重', warning: '警告', info: '提示' }[c.severity];
    detail.querySelector('[data-detail-code]').textContent = c.code;
    detail.querySelector('[data-detail-title]').textContent = c.title;
    const badge = detail.querySelector('[data-detail-severity]');
    badge.textContent = sevText;
    badge.className = `text-xs px-2 py-1 rounded ${color}`;
    detail.querySelector('[data-detail-meta]').textContent = `${c.applianceName} · ${c.brand} · ${c.models}`;
    detail.querySelector('[data-detail-causes]').innerHTML = c.causes.map(x => `<li class="text-sm text-[var(--yj-foreground-muted)]">${x}</li>`).join('');
    detail.querySelector('[data-detail-solutions]').innerHTML = c.solutions.map((x, i) => `<li class="text-sm text-[var(--yj-foreground-muted)]"><span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--yj-primary)] text-white text-xs mr-2">${i+1}</span>${x}</li>`).join('');
    detail.classList.remove('hidden');
    detail.classList.add('block');
    detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // 搜索
  const searchInput = document.querySelector('[data-appliance-search]');
  searchInput?.addEventListener('input', () => render(searchInput.value));
  document.querySelector('[data-appliance-search]')?.closest('section')?.querySelector('button.nm-btn-primary')?.addEventListener('click', () => render(searchInput?.value || ''));

  // 品牌下拉
  brandBtn?.addEventListener('click', e => {
    e.stopPropagation();
    brandDropdown.classList.toggle('hidden');
  });
  document.addEventListener('click', () => brandDropdown?.classList.add('hidden'));
  brandDropdown?.addEventListener('click', e => e.stopPropagation());
  brandDropdown?.querySelectorAll('[data-brand]').forEach(opt => {
    opt.addEventListener('click', () => {
      currentBrand = opt.dataset.brand;
      brandLabel.textContent = currentBrand === 'all' ? '全部品牌' : currentBrand;
      brandDropdown.querySelectorAll('[data-brand]').forEach(b => {
        b.classList.remove('text-[var(--yj-primary)]', 'bg-[var(--yj-primary)]/10');
        b.classList.add('text-[var(--yj-foreground-muted)]');
      });
      opt.classList.remove('text-[var(--yj-foreground-muted)]');
      opt.classList.add('text-[var(--yj-primary)]', 'bg-[var(--yj-primary)]/10');
      brandDropdown.classList.add('hidden');
      render(searchInput?.value || '');
    });
  });

  // 类型切换
  typeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentType = btn.dataset.appliance;
      typeButtons.forEach(b => {
        b.dataset.active = 'false';
        const inner = b.querySelector('div');
        if (inner) inner.style.boxShadow = 'var(--nm-raised-sm)';
        const label = b.querySelector('span'); const icon = b.querySelector('i');
        if (label) label.style.color = 'var(--yj-foreground-muted)';
        if (icon) icon.style.color = 'var(--yj-foreground-muted)';
      });
      btn.dataset.active = 'true';
      const inner = btn.querySelector('div');
      if (inner) inner.style.boxShadow = 'var(--nm-pressed)';
      const label = btn.querySelector('span'); const icon = btn.querySelector('i');
      if (label) label.style.color = 'var(--yj-primary)';
      if (icon) icon.style.color = 'var(--yj-primary)';
      render(searchInput?.value || '');
    });
  });

  // 热门代码快捷入口
  document.querySelectorAll('[data-hot-code]').forEach(el => {
    el.addEventListener('click', () => {
      const code = el.dataset.hotCode;
      const appliance = el.dataset.hotAppliance || 'ac';
      showCodeDetail(code, appliance);
    });
  });

  render();
}

/* ============================================================
   实用工具
   ============================================================ */
function initToolboxPage() {
  const grid = document.getElementById('tool-grid');
  if (!grid) return;

  let currentCat = 'all';
  const catBtns = document.querySelectorAll('[data-tool-category]');

  function render(keyword = '') {
    let tools = Store.getTools();
    if (currentCat !== 'all') tools = tools.filter(t => t.category === currentCat);
    if (keyword) {
      const kw = keyword.toLowerCase();
      tools = tools.filter(t => t.name.toLowerCase().includes(kw) || t.desc.toLowerCase().includes(kw));
    }

    if (!tools.length) {
      grid.innerHTML = `<div class="col-span-full text-center py-12 text-[var(--yj-foreground-muted)]">未找到匹配的工具</div>`;
      return;
    }
    grid.innerHTML = tools.map(t => `
      <button class="tool-card group p-4 rounded-2xl bg-[var(--yj-surface)] shadow-[var(--nm-raised)] hover:shadow-[var(--nm-raised-hover)] text-left transition" data-tool-id="${t.id}">
        <div class="flex items-start gap-3">
          <div class="w-11 h-11 rounded-xl bg-[var(--yj-primary)]/10 text-[var(--yj-primary)] flex items-center justify-center flex-shrink-0">
            <i data-lucide="${t.icon}" class="w-5 h-5"></i>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <h3 class="text-sm font-semibold text-[var(--yj-foreground)] truncate">${t.name}</h3>
              ${t.hot ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-500">热门</span>' : ''}
            </div>
            <p class="text-xs text-[var(--yj-foreground-muted)] mt-0.5 truncate">${t.desc}</p>
            <div class="flex items-center gap-2 mt-1.5 text-[11px] text-[var(--yj-foreground-muted)]">
              <span class="flex items-center gap-0.5"><i data-lucide="flame" class="w-3 h-3"></i>${t.uses}</span>
              <span class="flex items-center gap-0.5"><i data-lucide="star" class="w-3 h-3"></i>${t.likes}</span>
            </div>
          </div>
        </div>
      </button>`).join('');
    grid.querySelectorAll('.tool-card').forEach(card => {
      card.addEventListener('click', () => openTool(card.dataset.toolId));
    });
    if (window.lucide) lucide.createIcons();
  }

  const searchInput = document.querySelector('[data-tool-search]');
  searchInput?.addEventListener('input', () => render(searchInput.value));

  catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currentCat = btn.dataset.toolCategory;
      catBtns.forEach(b => {
        b.dataset.active = 'false';
        b.style.boxShadow = 'var(--nm-raised-sm)';
        b.style.color = 'var(--yj-foreground-muted)';
      });
      btn.dataset.active = 'true';
      btn.style.boxShadow = 'var(--nm-pressed-sm)';
      btn.style.color = 'var(--yj-primary)';
      render(searchInput?.value || '');
    });
  });

  render();
}

function openTool(toolId) {
  const tool = Store.getToolById(toolId);
  if (!tool) return;
  const modal = document.getElementById('tool-modal');
  if (!modal) return;
  modal.querySelector('[data-tool-name]').textContent = tool.name;
  modal.querySelector('[data-tool-desc]').textContent = tool.desc;
  modal.querySelector('[data-tool-category]').textContent = tool.categoryName;
  const output = modal.querySelector('[data-tool-output]');
  output.innerHTML = `<div class="text-sm text-[var(--yj-foreground-muted)] p-4 rounded-xl bg-[var(--yj-surface)] shadow-[var(--nm-inset-sm)]">在下方输入内容后点击「运行」</div>`;
  modal.querySelector('[data-tool-input]').value = '';
  openModal('tool-modal');

  const runBtn = modal.querySelector('[data-tool-run]');
  const input = modal.querySelector('[data-tool-input]');
  const handler = async () => {
    // 工具运行才消耗配额（打开不扣）
    const quotaRes = await Store.useTool();
    if (!quotaRes.ok) {
      showToast(quotaRes.msg, 'error');
      return;
    }
    if (typeof updateMemberUI === 'function') updateMemberUI();
    const result = Tools.resolve(tool.impl)(input.value);
    renderToolOutput(result, output);
  };
  runBtn.onclick = handler;
  input.onkeydown = e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handler(); };
}

function renderToolOutput(result, container) {
  if (result.type === 'result' || result.type === 'info' || result.type === 'error') {
    const cls = result.type === 'error' ? 'text-rose-500' : result.type === 'info' ? 'text-sky-500' : 'text-emerald-500';
    container.innerHTML = `<div class="p-4 rounded-xl bg-[var(--yj-surface)] shadow-[var(--nm-inset-sm)]">
      <div class="text-xs ${cls} mb-2">${result.label}</div>
      <pre class="text-sm text-[var(--yj-foreground)] whitespace-pre-wrap break-all">${escapeHtml(result.value)}</pre>
    </div>`;
  } else if (result.type === 'multi') {
    container.innerHTML = `<div class="space-y-2">${result.values.map(v => `
      <div class="p-3 rounded-xl bg-[var(--yj-surface)] shadow-[var(--nm-inset-sm)]">
        <div class="text-xs text-sky-500 mb-1">${v.k}</div>
        <pre class="text-sm text-[var(--yj-foreground)] whitespace-pre-wrap break-all">${escapeHtml(String(v.v))}</pre>
      </div>`).join('')}</div>`;
  } else if (result.type === 'qrcode') {
    container.innerHTML = `<div class="p-4 rounded-xl bg-white flex items-center justify-center">
      ${generateQRPlaceholder(result.value)}
    </div>
    <div class="text-xs text-[var(--yj-foreground-muted)] mt-2 break-all">${escapeHtml(result.value)}</div>`;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

/* ============================================================
   知识库
   ============================================================ */
function initKnowledgePage() {
  const grid = document.getElementById('knowledge-grid');
  const detail = document.getElementById('knowledge-detail');
  if (!grid) return;

  let currentCat = 'all';
  const catContainer = document.getElementById('knowledge-categories');

  // 动态生成分类按钮
  const allKnowledge = Store.getKnowledge();
  const catMap = new Map();
  allKnowledge.forEach(k => { if (!catMap.has(k.category)) catMap.set(k.category, k.categoryName); });
  const catList = [['all', '全部'], ...catMap.entries()];
  if (catContainer) {
    catContainer.innerHTML = catList.map(([key, name]) => `
      <button class="category-item flex-shrink-0 nm-raised-sm px-4 py-2.5 rounded-[var(--yj-radius-md)] bg-[var(--yj-background)] text-[var(--yj-foreground-muted)] text-[13px] flex items-center gap-2" data-knowledge-category="${key}" data-active="${key === 'all' ? 'true' : 'false'}" style="${key === 'all' ? 'box-shadow: var(--nm-pressed-sm); color: var(--yj-primary); font-weight: 600;' : ''}">
        <span>${name}</span>
      </button>`).join('');
  }

  function bindCatBtns() {
    const catBtns = document.querySelectorAll('[data-knowledge-category]');
    catBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        currentCat = btn.dataset.knowledgeCategory;
        catBtns.forEach(b => {
          b.dataset.active = 'false';
          b.style.boxShadow = 'var(--nm-raised-sm)';
          b.style.color = 'var(--yj-foreground-muted)';
          b.style.fontWeight = 'normal';
        });
        btn.dataset.active = 'true';
        btn.style.boxShadow = 'var(--nm-pressed-sm)';
        btn.style.color = 'var(--yj-primary)';
        btn.style.fontWeight = '600';
        render(searchInput?.value || '');
      });
    });
  }
  bindCatBtns();

  function render(keyword = '') {
    const list = Store.searchKnowledge(keyword, currentCat);
    if (!list.length) {
      grid.innerHTML = `<div class="col-span-full text-center py-12 text-[var(--yj-foreground-muted)]">未找到匹配的知识条目</div>`;
      return;
    }
    grid.innerHTML = list.map(k => `
      <button class="knowledge-card p-4 rounded-2xl bg-[var(--yj-surface)] shadow-[var(--nm-raised)] hover:shadow-[var(--nm-raised-hover)] text-left transition" data-kid="${k.id}">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xs px-2 py-0.5 rounded bg-[var(--yj-primary)]/10 text-[var(--yj-primary)]">${k.categoryName}</span>
        </div>
        <h3 class="text-sm font-semibold text-[var(--yj-foreground)] mb-1 line-clamp-1">${k.title}</h3>
        <p class="text-xs text-[var(--yj-foreground-muted)] line-clamp-2">${k.summary}</p>
        <div class="flex items-center gap-3 mt-2 text-[11px] text-[var(--yj-foreground-muted)]">
          <span class="flex items-center gap-0.5"><i data-lucide="eye" class="w-3 h-3"></i>${k.views}</span>
          <span class="flex items-center gap-0.5"><i data-lucide="star" class="w-3 h-3"></i>${k.stars}</span>
        </div>
      </button>`).join('');
    grid.querySelectorAll('.knowledge-card').forEach(card => {
      card.addEventListener('click', () => showKnowledge(card.dataset.kid));
    });
    if (window.lucide) lucide.createIcons();
  }

  function showKnowledge(id) {
    const k = Store.getKnowledgeById(id);
    if (!k) return;
    Store.addRecentKnowledge(id);
    detail.querySelector('[data-knowledge-title]').textContent = k.title;
    detail.querySelector('[data-knowledge-category]').textContent = k.categoryName;
    detail.querySelector('[data-knowledge-content]').innerHTML = `<pre class="text-sm text-[var(--yj-foreground-muted)] whitespace-pre-wrap font-sans leading-relaxed">${escapeHtml(k.content)}</pre>`;
    detail.classList.remove('hidden');
    detail.classList.add('block');
    detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const searchInput = document.querySelector('[data-knowledge-search]');
  let searchTimer = null;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => render(searchInput.value), 300);
  });
  // 搜索按钮
  const searchBtn = searchInput?.closest('section')?.querySelector('button.nm-btn-primary');
  searchBtn?.addEventListener('click', () => render(searchInput?.value || ''));

  render();
}

/* ============================================================
   会员开通
   ============================================================ */
function initMemberUpgrade() {
  const upgradeBtn = document.querySelector('[data-upgrade-btn]');
  if (!upgradeBtn) return;
  upgradeBtn.addEventListener('click', () => {
    const user = Store.currentUser();
    if (!user) {
      showToast('请先登录', 'warning');
      return setTimeout(() => { window.location.href = 'login.html'; }, 800);
    }
    openModal('member-modal');
  });

  // 确认开通
  document.querySelectorAll('[data-confirm-upgrade]').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        const res = await Store.upgradeUser();
        if (!res.ok) return showToast(res.msg || '开通失败', 'error');
        showToast('已开通专业版会员！', 'success');
        closeModal('member-modal');
        setTimeout(() => location.reload(), 600);
      } catch (e) {
        showToast('开通失败：' + (e.message || '未知错误'), 'error');
      }
    });
  });
}

/* ============================================================
   通用搜索过滤 / 分类切换 / 电器切换（旧页面兼容）
   ============================================================ */
function initSearchFilter() {
  const searchInput = document.querySelector('[data-search-input]');
  if (!searchInput) return;
  const cards = document.querySelectorAll('[data-search-item]');
  if (!cards.length) return;
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    cards.forEach(card => { card.style.display = !q || card.textContent.toLowerCase().includes(q) ? '' : 'none'; });
  });
}

function initCategorySwitch() {
  const cats = document.querySelectorAll('[data-category]');
  if (!cats.length) return;
  cats.forEach(btn => btn.addEventListener('click', () => {
    cats.forEach(b => { b.dataset.active = 'false'; b.style.boxShadow = 'var(--nm-raised-sm)'; b.style.color = 'var(--yj-foreground-muted)'; });
    btn.dataset.active = 'true';
    btn.style.boxShadow = 'var(--nm-pressed-sm)';
    btn.style.color = 'var(--yj-primary)';
    const cat = btn.dataset.category;
    document.querySelectorAll('[data-category-section]').forEach(sec => {
      sec.style.display = (cat === 'all' || sec.dataset.categorySection === cat) ? '' : 'none';
    });
  }));
}

function initApplianceSwitch() {
  // 已由 initAppliancePage 接管
}

/* ---------- 移动端标签栏 ---------- */
function initMobileTabbar() {
  document.querySelectorAll('[data-tab]').forEach(tab => tab.addEventListener('click', () => {
    window.location.href = tab.dataset.tab;
  }));
}

/* ---------- Toast ---------- */
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) { container = document.createElement('div'); container.className = 'toast-container'; document.body.appendChild(container); }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(-10px)'; setTimeout(() => toast.remove(), 300); }, 2200);
}

window.openModal = openModal;
window.closeModal = closeModal;
window.showToast = showToast;
window.toggleTheme = toggleTheme;
window.updateMemberUI = updateMemberUI;
