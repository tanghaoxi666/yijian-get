/* ============================================================
   一键 Get — 工具实现库（纯前端计算）
   ============================================================ */

const Tools = {
  /* ---------- Base64 编解码 ---------- */
  base64(input) {
    try {
      const encoded = btoa(unescape(encodeURIComponent(input)));
      return { type: 'result', label: '编码结果', value: encoded };
    } catch (e) {
      try {
        const decoded = decodeURIComponent(escape(atob(input)));
        return { type: 'result', label: '解码结果', value: decoded };
      } catch {
        return { type: 'error', label: '提示', value: '输入内容无法识别为 Base64 或普通文本' };
      }
    }
  },

  /* ---------- URL 编解码 ---------- */
  'url-codec'(input) {
    if (/%[0-9A-Fa-f]{2}/.test(input)) {
      try { return { type: 'result', label: '解码结果', value: decodeURIComponent(input) }; }
      catch { return { type: 'error', label: '提示', value: 'URL 解码失败' }; }
    }
    return { type: 'result', label: '编码结果', value: encodeURIComponent(input) };
  },

  /* ---------- 进制转换 ---------- */
  'base-convert'(input) {
    const lines = input.trim().split(/\n+/).filter(Boolean);
    const results = [];
    lines.forEach(line => {
      const num = line.trim();
      let val;
      if (/^0x/i.test(num)) val = parseInt(num, 16);
      else if (/^0o/i.test(num)) val = parseInt(num, 8);
      else if (/^0b/i.test(num)) val = parseInt(num, 2);
      else if (/^[01]+$/.test(num) && num.length > 2) val = parseInt(num, 2);
      else val = parseInt(num, 10);
      if (isNaN(val)) { results.push(`${num}: 无效数字`); return; }
      results.push(`${num} → 十进制:${val} 二进制:${val.toString(2)} 八进制:${val.toString(8)} 十六进制:${val.toString(16).toUpperCase()}`);
    });
    return { type: 'result', label: '转换结果', value: results.join('\n') };
  },

  /* ---------- 大小写转换 ---------- */
  'case-convert'(input) {
    return {
      type: 'multi',
      label: '转换结果',
      values: [
        { k: '全部大写', v: input.toUpperCase() },
        { k: '全部小写', v: input.toLowerCase() },
        { k: '首字母大写', v: input.replace(/\b\w/g, c => c.toUpperCase()) },
        { k: '大小写反转', v: input.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('') },
      ]
    };
  },

  /* ---------- 字数统计 ---------- */
  'word-count'(input) {
    const chars = input.length;
    const charsNoSpace = input.replace(/\s/g, '').length;
    const lines = input.split('\n').length;
    const words = input.trim() ? input.trim().split(/\s+/).length : 0;
    const chinese = (input.match(/[\u4e00-\u9fa5]/g) || []).length;
    return { type: 'multi', label: '统计结果', values: [
      { k: '总字符数', v: chars },
      { k: '不含空格字符', v: charsNoSpace },
      { k: '中文字符', v: chinese },
      { k: '单词数', v: words },
      { k: '行数', v: lines },
    ]};
  },

  /* ---------- 去除空格 ---------- */
  'trim-space'(input) {
    return { type: 'multi', label: '处理结果', values: [
      { k: '去除首尾空格', v: input.trim() },
      { k: '去除所有空格', v: input.replace(/\s+/g, '') },
      { k: '合并连续空格', v: input.replace(/\s+/g, ' ') },
    ]};
  },

  /* ---------- 文本排序 ---------- */
  'text-sort'(input) {
    const lines = input.split('\n').filter(Boolean);
    const sorted = [...lines].sort((a, b) => a.localeCompare(b, 'zh-CN'));
    const dedup = [...new Set(sorted)];
    return { type: 'multi', label: '结果', values: [
      { k: '升序排序', v: sorted.join('\n') },
      { k: '降序排序', v: sorted.reverse().join('\n') },
      { k: '去重后', v: dedup.join('\n') },
    ]};
  },

  /* ---------- 文本反转 ---------- */
  'text-reverse'(input) {
    return { type: 'result', label: '反转结果', value: input.split('').reverse().join('') };
  },

  /* ---------- HTML 转义 ---------- */
  'html-escape'(input) {
    if (/&[a-z]+;|&#\d+;/.test(input)) {
      const txt = document.createElement('textarea');
      txt.innerHTML = input;
      return { type: 'result', label: '解码结果', value: txt.value };
    }
    const div = document.createElement('div');
    div.textContent = input;
    return { type: 'result', label: '编码结果', value: div.innerHTML };
  },

  /* ---------- Unicode 转码 ---------- */
  'unicode'(input) {
    if (/\\u[0-9a-fA-F]{4}/.test(input)) {
      return { type: 'result', label: '解码结果', value: input.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))) };
    }
    const r = input.split('').map(c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')).join('');
    return { type: 'result', label: '编码结果', value: r };
  },

  /* ---------- 时间戳转换 ---------- */
  'timestamp'(input) {
    const now = Date.now();
    if (!input.trim()) {
      return { type: 'result', label: '当前时间戳', value: `秒：${Math.floor(now / 1000)}\n毫秒：${now}\n日期：${new Date(now).toLocaleString('zh-CN')}` };
    }
    const num = Number(input.trim());
    if (!isNaN(num)) {
      const ts = String(num).length <= 10 ? num * 1000 : num;
      return { type: 'result', label: '转换结果', value: new Date(ts).toLocaleString('zh-CN') };
    }
    const d = new Date(input.trim());
    if (!isNaN(d.getTime())) {
      return { type: 'result', label: '时间戳', value: `秒：${Math.floor(d.getTime() / 1000)}\n毫秒：${d.getTime()}` };
    }
    return { type: 'error', label: '提示', value: '无法识别的时间格式' };
  },

  /* ---------- JSON 格式化 ---------- */
  'json-format'(input) {
    try {
      const obj = JSON.parse(input);
      return { type: 'result', label: '格式化结果', value: JSON.stringify(obj, null, 2) };
    } catch (e) {
      return { type: 'error', label: '解析错误', value: e.message };
    }
  },

  /* ---------- 颜色取色器 ---------- */
  'color-picker'(input) {
    // input: hex like #ff8800 or rgb(255,136,0)
    const hexMatch = input.match(/#([0-9a-fA-F]{6})/);
    if (hexMatch) {
      const h = hexMatch[1];
      const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
      const mx = Math.max(r,g,b)/255, mn = Math.min(r,g,b)/255;
      const l = (mx+mn)/2;
      let s = 0, hh = 0;
      if (mx !== mn) {
        s = l > 0.5 ? (mx-mn)/(2-mx-mn) : (mx-mn)/(mx+mn);
        const d = mx-mn;
        if (mx === r/255) hh = ((g-b)/255/d + (g<b?6:0));
        else if (mx === g/255) hh = ((b-r)/255/d + 2);
        else hh = ((r-g)/255/d + 4);
        hh *= 60;
      }
      return { type: 'result', label: '转换结果', value: `HEX: #${h.toUpperCase()}\nRGB: rgb(${r}, ${g}, ${b})\nHSL: hsl(${Math.round(hh)}, ${Math.round(s*100)}%, ${Math.round(l*100)}%)` };
    }
    const rgbMatch = input.match(/rgb\s*\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
    if (rgbMatch) {
      const r = +rgbMatch[1], g = +rgbMatch[2], b = +rgbMatch[3];
      const hex = '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('').toUpperCase();
      return { type: 'result', label: 'HEX', value: hex };
    }
    return { type: 'info', label: '使用方法', value: '输入 #RRGGBB 或 rgb(r,g,b) 进行转换' };
  },

  /* ---------- 密码生成器 ---------- */
  'password-gen'(input) {
    const len = parseInt(input) || 16;
    const sets = ['abcdefghijklmnopqrstuvwxyz','ABCDEFGHIJKLMNOPQRSTUVWXYZ','0123456789','!@#$%^&*()_+-=[]{}'];
    const all = sets.join('');
    let pwd = '';
    for (let i = 0; i < len; i++) pwd += all[Math.floor(Math.random() * all.length)];
    // 确保包含各类字符
    pwd = pwd.split('');
    sets.forEach(s => { const idx = Math.floor(Math.random()*len); pwd[idx] = s[Math.floor(Math.random()*s.length)]; });
    return { type: 'result', label: '生成的密码', value: pwd.join('') };
  },

  /* ---------- 二维码生成（文字提示，可生成简单二维码占位） ---------- */
  'qrcode-gen'(input) {
    if (!input.trim()) return { type: 'info', label: '提示', value: '请输入要生成二维码的文字或链接' };
    return { type: 'qrcode', label: '二维码', value: input.trim() };
  },

  /* ---------- 摩斯电码 ---------- */
  'morse'(input) {
    const map = {A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..','0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.'};
    if (/[\.\-]/.test(input)) {
      const rev = Object.fromEntries(Object.entries(map).map(([k,v]) => [v,k]));
      return { type: 'result', label: '解码', value: input.trim().split(/\s+/).map(c => rev[c] || '?').join('') };
    }
    return { type: 'result', label: '编码', value: input.toUpperCase().split('').map(c => map[c] || '').filter(Boolean).join(' ') };
  },

  /* ---------- UUID 生成 ---------- */
  'uuid'(input) {
    const n = parseInt(input) || 1;
    const gen = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return { type: 'result', label: 'UUID', value: Array.from({length: Math.min(n,100)}, gen).join('\n') };
  },

  /* ---------- 随机数生成 ---------- */
  'random-num'(input) {
    const [min, max] = input.split(/[,，\s]+/).map(Number);
    if (isNaN(min) || isNaN(max)) return { type: 'info', label: '使用方法', value: '输入范围，如 1 100 或 1,100' };
    const count = 5;
    const nums = Array.from({length: count}, () => Math.floor(Math.random() * (max - min + 1)) + min);
    return { type: 'result', label: '随机数', value: nums.join(', ') };
  },

  /* ---------- 日期差计算 ---------- */
  'date-diff'(input) {
    const dates = input.split(/[,，\s]+/).filter(Boolean);
    if (dates.length < 2) return { type: 'info', label: '使用方法', value: '输入两个日期，如 2024-01-01 2024-12-31' };
    const d1 = new Date(dates[0]), d2 = new Date(dates[1]);
    const diff = Math.abs(d2 - d1);
    const days = Math.floor(diff / 86400000);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30.44);
    return { type: 'result', label: '日期差', value: `相差 ${days} 天\n约 ${weeks} 周\n约 ${months} 个月` };
  },

  /* ---------- 文本对比（简易） ---------- */
  'text-diff'(input) {
    const parts = input.split(/\n-{3,}\n/);
    if (parts.length < 2) return { type: 'info', label: '使用方法', value: '用一行 "---" 分隔两段文本' };
    const a = parts[0].split('\n'), b = parts[1].split('\n');
    const setB = new Set(b);
    const onlyA = a.filter(l => !setB.has(l));
    const setA = new Set(a);
    const onlyB = b.filter(l => !setA.has(l));
    return { type: 'result', label: '差异', value: `仅左侧(${onlyA.length}行):\n${onlyA.join('\n')}\n\n仅右侧(${onlyB.length}行):\n${onlyB.join('\n')}` };
  },

  /* ---------- 通用工具（未专门实现） ---------- */
  generic(input) {
    return { type: 'info', label: '提示', value: '该工具正在开发中，敬请期待。您可先使用左侧已实现的工具。' };
  },
};

// 根据 impl id 获取处理函数
Tools.resolve = function(impl) {
  return Tools[impl] || Tools.generic;
};

// 暴露到 window
window.Tools = Tools;
