/**
 * 废土纪要字体缩放：点击正文标题栏的 ＋/－ 放大/缩小该条正文字体；
 * 使用父 document 原生事件，不依赖 iframe 内 jQuery；注入 hover/active 样式提供点击反馈。
 */
const STORAGE_KEY = '黄晓林_废土纪要_字体大小';
const NIGHT_STORAGE_KEY = '黄晓林_废土纪要_夜间模式';
const DEFAULT_PX = 23;
const MIN_PX = 16;
const MAX_PX = 28;
const STEP_PX = 2;
const DEBUG = true; // 设为 false 可关闭调试日志
const log = DEBUG ? (...args: unknown[]) => console.info('[废土纪要字体]', ...args) : () => {};

// 同时支持无前缀与 custom- 前缀两套类名（与正文美化正则一致或兼容酒馆内 custom- 版本）
const BLOCK_SELECTOR = '.wasteland-chronicle, .custom-wasteland-chronicle';
const BODY_SELECTOR = '.wc-body, .custom-wc-body';
const PLUS_SELECTOR = '.wc-font-plus, .custom-wc-font-plus, [data-wc="font-plus"]';
const MINUS_SELECTOR = '.wc-font-minus, .custom-wc-font-minus, [data-wc="font-minus"]';
const NIGHT_TOGGLE_SELECTOR = '.wc-night-toggle, .custom-wc-night-toggle, [data-wc="night-toggle"]';

function getStoredSize(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return DEFAULT_PX;
    const n = parseInt(raw, 10);
    if (Number.isNaN(n) || n < MIN_PX || n > MAX_PX) return DEFAULT_PX;
    return n;
  } catch {
    return DEFAULT_PX;
  }
}

function setStoredSize(px: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(px));
  } catch {
    // 忽略 localStorage 不可用（如隐私模式）
  }
}

function getStoredNight(): boolean {
  try {
    return localStorage.getItem(NIGHT_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function setStoredNight(on: boolean): void {
  try {
    localStorage.setItem(NIGHT_STORAGE_KEY, on ? '1' : '0');
  } catch {
    // 忽略
  }
}

/** 收集节点及其 Shadow 子树内所有正文容器（.wc-body / .custom-wc-body） */
function collectWcBodies(root: ParentNode): HTMLElement[] {
  const list: HTMLElement[] = [];
  const walk = (node: ParentNode): void => {
    node.querySelectorAll(BODY_SELECTOR).forEach((el) => list.push(el as HTMLElement));
    node.querySelectorAll('*').forEach((el) => {
      const host = el as HTMLElement & { shadowRoot?: ShadowRoot };
      if (host.shadowRoot) walk(host.shadowRoot);
    });
  };
  walk(root);
  return list;
}

/** 直接对 .wc-body 设置 fontSize（并设子元素 inherit），同时保留 CSS 变量；支持 Shadow DOM */
function applySizeToBlock(block: HTMLElement, px: number): void {
  const size = `${px}px`;
  block.style.setProperty('--wc-body-font-size', size);
  const bodyEl = block.querySelector(BODY_SELECTOR) as HTMLElement | null;
  const allBodies = bodyEl ? [bodyEl, ...collectWcBodies(block)] : collectWcBodies(block);
  const unique = Array.from(new Set(allBodies));
  unique.forEach((el) => {
    el.style.setProperty('font-size', size, 'important');
    el.querySelectorAll('*').forEach((child) => {
      (child as HTMLElement).style.setProperty('font-size', 'inherit', 'important');
    });
  });
  if (DEBUG && unique.length > 0) {
    const win = block.ownerDocument.defaultView;
    const computed = win ? win.getComputedStyle(unique[0]).fontSize : '';
    log('applySizeToBlock 已应用', px + 'px', 'computed=', computed);
  }
}

/** 收集 doc 内所有废土纪要块（.wasteland-chronicle / .custom-wasteland-chronicle，含 Shadow 子树） */
function collectWastelandBlocks(doc: Document): HTMLElement[] {
  const list: HTMLElement[] = [];
  const walk = (root: ParentNode): void => {
    root.querySelectorAll(BLOCK_SELECTOR).forEach((el) => list.push(el as HTMLElement));
    root.querySelectorAll('*').forEach((el) => {
      const host = el as HTMLElement & { shadowRoot?: ShadowRoot };
      if (host.shadowRoot) walk(host.shadowRoot);
    });
  };
  walk(doc.body || doc.documentElement);
  return list;
}

function applyStoredSizeToAll(doc: Document): void {
  if (!doc.body && !doc.documentElement) return;
  const px = getStoredSize();
  collectWastelandBlocks(doc).forEach((block) => {
    ensureBodyParagraphs(block);
    applySizeToBlock(block, px);
  });
}

/** 废土纪要正文块直接子元素中的 .wc-body；优先带 data-wc-body 的（避免误伤 optional），无则退回仅按 class（兼容旧消息） */
function getWastelandBodyDirect(block: HTMLElement): HTMLElement | null {
  let withAttr: HTMLElement | null = null;
  for (let i = 0; i < block.children.length; i++) {
    const el = block.children[i] as HTMLElement;
    if (!el.classList?.contains('wc-body') && !el.classList?.contains('custom-wc-body')) continue;
    if (el.getAttribute('data-wc-body') === '1' || el.hasAttribute('data-wc-body')) return el;
    if (!withAttr) withAttr = el;
  }
  return withAttr;
}

/** 将正文块内纯文本按双换行拆成 <p>，仅处理尚未处理且无块级标签的内容，避免影响 optional 等 */
function ensureBodyParagraphs(block: HTMLElement): void {
  const body = getWastelandBodyDirect(block);
  if (!body || body.getAttribute('data-wc-paragraphed') === '1') return;
  const html = body.innerHTML.trim();
  if (/<p[\s>]|<\/p>|<div[\s>]|<\/div>/i.test(html)) return;
  const text = body.textContent ?? '';
  const paragraphs = text.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  if (paragraphs.length <= 1) return;
  body.innerHTML = paragraphs.map((para) => `<p>${para.replace(/\n/g, '<br>')}</p>`).join('');
  body.setAttribute('data-wc-paragraphed', '1');
}

/** 根据当前存储的夜间状态，为所有废土纪要块添加或移除 .wc-night，并更新「夜间/日间」按钮文字 */
function applyNightToAll(doc: Document): void {
  if (!doc.body && !doc.documentElement) return;
  const isNight = getStoredNight();
  collectWastelandBlocks(doc).forEach((block) => {
    if (isNight) block.classList.add('wc-night');
    else block.classList.remove('wc-night');
    const btn = block.querySelector(NIGHT_TOGGLE_SELECTOR) as HTMLElement | null;
    if (btn) btn.textContent = isNight ? '日间' : '夜间';
  });
}

const attachedDocs = new WeakSet<Document>();

function injectButtonStyles(doc: Document): void {
  const id = 'wc-font-btn-styles';
  if (doc.getElementById(id)) return;
  const style = doc.createElement('style');
  style.id = id;
  style.textContent = `
.wasteland-chronicle .wc-body, .wasteland-chronicle .wc-body *, .custom-wasteland-chronicle .custom-wc-body, .custom-wasteland-chronicle .custom-wc-body * { font-size: var(--wc-body-font-size, 23px) !important; }
.wasteland-chronicle > .wc-body[data-wc-body="1"], .wasteland-chronicle > .custom-wc-body[data-wc-body="1"], .custom-wasteland-chronicle > .wc-body[data-wc-body="1"], .custom-wasteland-chronicle > .custom-wc-body[data-wc-body="1"] { line-height: 2.2 !important; }
.wasteland-chronicle > .wc-body[data-wc-body="1"] p, .custom-wasteland-chronicle > .wc-body[data-wc-body="1"] p, .wasteland-chronicle > .custom-wc-body[data-wc-body="1"] p, .custom-wasteland-chronicle > .custom-wc-body[data-wc-body="1"] p { margin-bottom: 2em !important; }
.wasteland-chronicle > .wc-body[data-wc-body="1"] p:last-child, .custom-wasteland-chronicle > .wc-body[data-wc-body="1"] p:last-child, .wasteland-chronicle > .custom-wc-body[data-wc-body="1"] p:last-child, .custom-wasteland-chronicle > .custom-wc-body[data-wc-body="1"] p:last-child { margin-bottom: 0 !important; }
.wasteland-chronicle.wc-night, .custom-wasteland-chronicle.wc-night { background: #1a1a1d !important; color: #D4C8B8; padding: 12px 80px 20px !important; border-radius: 8px; }
.wasteland-chronicle.wc-night > div:first-of-type, .custom-wasteland-chronicle.wc-night > div:first-of-type { border-bottom-color: rgba(212,200,184,0.35) !important; }
.wasteland-chronicle.wc-night > div > div > div, .wasteland-chronicle.wc-night > div > div > div *,
.custom-wasteland-chronicle.wc-night > div > div > div, .custom-wasteland-chronicle.wc-night > div > div > div * { color: #D4C8B8 !important; }
.wasteland-chronicle.wc-night .wc-body, .wasteland-chronicle.wc-night .wc-body *, .custom-wasteland-chronicle.wc-night .custom-wc-body, .custom-wasteland-chronicle.wc-night .custom-wc-body * { color: #D4C8B8 !important; }
.wasteland-chronicle.wc-night .wc-font-minus, .wasteland-chronicle.wc-night .wc-font-plus,
.wasteland-chronicle.wc-night .wc-night-toggle, .wasteland-chronicle.wc-night [data-wc="font-minus"], .wasteland-chronicle.wc-night [data-wc="font-plus"], .wasteland-chronicle.wc-night [data-wc="night-toggle"],
.custom-wasteland-chronicle.wc-night .custom-wc-font-minus, .custom-wasteland-chronicle.wc-night .custom-wc-font-plus,
.custom-wasteland-chronicle.wc-night .custom-wc-night-toggle, .custom-wasteland-chronicle.wc-night [data-wc="font-minus"], .custom-wasteland-chronicle.wc-night [data-wc="font-plus"], .custom-wasteland-chronicle.wc-night [data-wc="night-toggle"] { color: #D4C8B8 !important; border-color: rgba(212,200,184,0.5) !important; background: rgba(0,0,0,0.2) !important; }
.wasteland-chronicle.wc-night .wc-font-minus:hover, .wasteland-chronicle.wc-night .wc-font-plus:hover, .wasteland-chronicle.wc-night .wc-night-toggle:hover,
.wasteland-chronicle.wc-night [data-wc="font-minus"]:hover, .wasteland-chronicle.wc-night [data-wc="font-plus"]:hover, .wasteland-chronicle.wc-night [data-wc="night-toggle"]:hover,
.custom-wasteland-chronicle.wc-night .custom-wc-font-minus:hover, .custom-wasteland-chronicle.wc-night .custom-wc-font-plus:hover, .custom-wasteland-chronicle.wc-night .custom-wc-night-toggle:hover,
.custom-wasteland-chronicle.wc-night [data-wc="font-minus"]:hover, .custom-wasteland-chronicle.wc-night [data-wc="font-plus"]:hover, .custom-wasteland-chronicle.wc-night [data-wc="night-toggle"]:hover { background: rgba(212,200,184,0.2) !important; color: #e8ddd0 !important; }
.wc-font-minus, .wc-font-plus, .custom-wc-font-minus, .custom-wc-font-plus, .wc-night-toggle, .custom-wc-night-toggle, [data-wc="font-minus"], [data-wc="font-plus"], [data-wc="night-toggle"] { transition: background .15s, color .15s; }
.wc-font-minus:hover, .wc-font-plus:hover, .custom-wc-font-minus:hover, .custom-wc-font-plus:hover, .wc-night-toggle:hover, .custom-wc-night-toggle:hover, [data-wc="font-minus"]:hover, [data-wc="font-plus"]:hover, [data-wc="night-toggle"]:hover { background: #e8e8ec !important; color: #2c2c2e !important; }
.wc-font-minus:active, .wc-font-plus:active, .custom-wc-font-minus:active, .custom-wc-font-plus:active, .wc-night-toggle:active, .custom-wc-night-toggle:active, [data-wc="font-minus"]:active, [data-wc="font-plus"]:active, [data-wc="night-toggle"]:active { background: #d1d1d6 !important; color: #1c1c1e !important; }
`;
  (doc.head || doc.documentElement).appendChild(style);
}

function attachToDoc(doc: Document): void {
  if (!doc.body || attachedDocs.has(doc)) return;
  attachedDocs.add(doc);
  injectButtonStyles(doc);
  applyStoredSizeToAll(doc);
  applyNightToAll(doc);
  doc.addEventListener('click', makeClickHandler(doc), true);
  if (DEBUG) {
    doc.addEventListener('click', (e: Event) => {
      const el = e.target as HTMLElement;
      if (el?.closest?.(BLOCK_SELECTOR)) {
        log('收到点击（原生）doc=', doc.defaultView?.location?.href, 'target=', el.className || el.getAttribute('data-wc') || el.tagName);
      }
    }, true);
  }
  log('已绑定 document', doc.defaultView?.location?.href || '(unknown)');
}

/** 从节点向上找废土纪要块，穿透 Shadow 边界（closest 不穿透） */
function findWastelandBlockFrom(el: EventTarget | null, doc: Document): HTMLElement | null {
  let node: Node | null = el as Node;
  const root = doc.documentElement;
  while (node && node !== root) {
    if (node instanceof HTMLElement && (node.classList?.contains('wasteland-chronicle') || node.classList?.contains('custom-wasteland-chronicle'))) return node;
    const parent: Node | null = node.parentNode;
    if (parent) {
      node = parent;
    } else {
      const host: HTMLElement | undefined = (node as unknown as { host?: HTMLElement }).host;
      node = host ?? null;
    }
  }
  return null;
}

function makeClickHandler(doc: Document) {
  return (e: Event) => {
    const target = e.target as HTMLElement;
    if (!target) return;
    const block = target.closest?.(BLOCK_SELECTOR) ?? findWastelandBlockFrom(e.target, doc);
    if (!block) return;
    const bodyEl = block.querySelector(BODY_SELECTOR) as HTMLElement | null;
    if (!bodyEl) return;

    if (target.closest(PLUS_SELECTOR)) {
      e.preventDefault();
      e.stopPropagation();
      const win = doc.defaultView || window;
      const current = parseInt(win.getComputedStyle(bodyEl).fontSize || '', 10) || DEFAULT_PX;
      const next = Math.min(MAX_PX, current + STEP_PX);
      log('点击 ＋ 当前=', current, '下一档=', next);
      setStoredSize(next);
      applySizeToBlock(block as HTMLElement, next);
      return;
    }
    if (target.closest(MINUS_SELECTOR)) {
      e.preventDefault();
      e.stopPropagation();
      const win = doc.defaultView || window;
      const current = parseInt(win.getComputedStyle(bodyEl).fontSize || '', 10) || DEFAULT_PX;
      const next = Math.max(MIN_PX, current - STEP_PX);
      log('点击 － 当前=', current, '下一档=', next);
      setStoredSize(next);
      applySizeToBlock(block as HTMLElement, next);
      return;
    }
    if (target.closest(NIGHT_TOGGLE_SELECTOR)) {
      e.preventDefault();
      e.stopPropagation();
      const next = !getStoredNight();
      setStoredNight(next);
      log(next ? '夜间 开启' : '日间 恢复');
      applyNightToAll(doc);
    }
  };
}

/** 已挂过 load 的 iframe，避免重复绑定 */
const framesWithLoadListener = new WeakSet<HTMLIFrameElement>();

/**
 * 对单个 iframe：绑定其 contentDocument，并监听 load（聊天 DOM 刷新后会触发），
 * 每次 load 后重新绑定 + 重刷字号。
 */
function bindFrame(iframe: HTMLIFrameElement): void {
  try {
    const doc = iframe.contentDocument;
    if (doc) attachToDoc(doc);
  } catch {
    // 跨域 iframe 无法访问
  }
  if (framesWithLoadListener.has(iframe)) return;
  framesWithLoadListener.add(iframe);
  iframe.addEventListener('load', () => {
    try {
      const doc = iframe.contentDocument;
      if (doc) {
        attachToDoc(doc);
        applyStoredSizeToAll(doc);
        applyNightToAll(doc);
        if (DEBUG) log('iframe load 后已重新绑定 doc=', doc.defaultView?.location?.href);
      }
    } catch {
      // 跨域或已卸载的 iframe 忽略
    }
  });
}

/** 递归遍历 root 下所有 iframe，对每个执行 bindFrame */
function bindAllFrames(root: Document | DocumentFragment): void {
  root.querySelectorAll?.('iframe').forEach((el) => bindFrame(el as HTMLIFrameElement));
  root.querySelectorAll?.('iframe').forEach((el) => {
    try {
      const doc = (el as HTMLIFrameElement).contentDocument;
      if (doc) bindAllFrames(doc);
    } catch {
      // 跨域 iframe 无法访问 contentDocument
    }
  });
}

/** 绑定所有 document（本脚本 doc、父页、所有 iframe）并给 iframe 挂 load */
function bindAllDocuments(): void {
  attachToDoc(document);
  const parentWin = typeof window.parent !== 'undefined' ? window.parent : window;
  const parentDoc = parentWin.document;
  attachToDoc(parentDoc);
  bindAllFrames(parentDoc);
  forEachDocAndDescendantIframes(parentDoc, (doc) => attachToDoc(doc));
}

/** 递归遍历 doc 及其所有子 iframe 的 document，对每个执行 fn（避免重复用 attachedDocs） */
function forEachDocAndDescendantIframes(
  doc: Document,
  fn: (d: Document) => void,
  visited: WeakSet<Document> = new WeakSet(),
): void {
  if (!doc || visited.has(doc)) return;
  visited.add(doc);
  fn(doc);
  try {
    doc.querySelectorAll('iframe').forEach((iframe) => {
      try {
        const childDoc = (iframe as HTMLIFrameElement).contentDocument;
        if (childDoc) forEachDocAndDescendantIframes(childDoc, fn, visited);
      } catch {
        // 忽略跨域 iframe
      }
    });
  } catch {
    // 忽略 querySelectorAll 等异常
  }
}

$(() => {
  const selfHref = document.defaultView?.location?.href ?? '(unknown)';
  const parentHref =
    typeof window.parent !== 'undefined' && window.parent !== window
      ? window.parent.document?.defaultView?.location?.href ?? '(unknown)'
      : '(即本页)';
  log('脚本已加载');
  log('  → 脚本所在 document（本 iframe）=', selfHref);
  log('  → 父页面（聊天可能在父页或其中某层 iframe 如 about:srcdoc）=', parentHref);

  const parentDoc = typeof window.parent !== 'undefined' && window.parent.document ? window.parent.document : document;
  const reapplyAll = () => {
    forEachDocAndDescendantIframes(parentDoc, (doc) => {
      applyStoredSizeToAll(doc);
      applyNightToAll(doc);
    });
  };

  // 核心：绑定所有 document（含各层 iframe），并对每个 iframe 监听 load，聊天 DOM 刷新后重新绑定
  bindAllDocuments();
  reapplyAll();
  // 与模组美化同时开启时，optional 等脚本可能晚于我们执行并改 DOM，延迟再跑以恢复段落与样式
  setTimeout(reapplyAll, 100);
  setTimeout(reapplyAll, 400);

  // 延迟再绑一次，捕获晚创建的聊天 iframe（about:srcdoc 等）
  setTimeout(bindAllDocuments, 500);
  setTimeout(() => {
    bindAllDocuments();
    reapplyAll();
    setTimeout(reapplyAll, 100);
    setTimeout(reapplyAll, 400);
  }, 1500);

  // 父页出现新 iframe / 新消息时再绑定并重刷；防抖 + 重入保护，避免 DOM 变更触发回调→我们改 DOM→又触发→卡死
  let observerTimer: ReturnType<typeof setTimeout> | null = null;
  let reapplyInProgress = false;
  const DEBOUNCE_MS = 120;
  const runBindAndReapply = (): void => {
    if (reapplyInProgress) return;
    reapplyInProgress = true;
    try {
      bindAllDocuments();
      forEachDocAndDescendantIframes(parentDoc, (doc) => {
        applyStoredSizeToAll(doc);
        applyNightToAll(doc);
      });
      // 模组美化可能稍后改 DOM，延迟再跑一次以恢复段落
      setTimeout(reapplyAll, 100);
      setTimeout(reapplyAll, 400);
    } finally {
      reapplyInProgress = false;
    }
  };
  const observer = new MutationObserver(() => {
    if (observerTimer) clearTimeout(observerTimer);
    observerTimer = setTimeout(() => {
      observerTimer = null;
      runBindAndReapply();
    }, DEBOUNCE_MS);
  });
  if (parentDoc.body) {
    observer.observe(parentDoc.body, { childList: true, subtree: true });
  }
  log('已对父页 body 开启 MutationObserver（防抖 ' + DEBOUNCE_MS + 'ms），iframe 已监听 load 以应对聊天 DOM 刷新');
  $(window).on('pagehide', () => {
    if (observerTimer) clearTimeout(observerTimer);
    observer.disconnect();
  });
});
