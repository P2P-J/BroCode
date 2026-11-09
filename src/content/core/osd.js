(() => {
  const BRO = (globalThis.BRO ??= {});
  const CSS = `
    :host { all: initial; }
    .box {
      position: fixed; left: 0; top: 0; transform: translate(-50%, 0);
      padding: 8px 16px; border-radius: 999px;
      background: rgba(20, 20, 24, 0.78); color: #fff;
      font: 600 16px/1.2 system-ui, -apple-system, "Segoe UI", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
      letter-spacing: 0.01em; white-space: nowrap;
      pointer-events: none; opacity: 0; transition: opacity 160ms ease;
    }
    .box.show { opacity: 1; transition: none; }
    .box.warn { background: rgba(160, 40, 40, 0.88); }
  `;
  let host = null;
  let box = null;
  let timer = 0;

  const ensure = () => {
    if (!host) {
      host = document.createElement('brocode-osd');
      host.style.setProperty('all', 'initial', 'important');
      host.style.setProperty('position', 'fixed', 'important');
      host.style.setProperty('z-index', '2147483647', 'important');
      host.style.setProperty('pointer-events', 'none', 'important');
      const root = host.attachShadow({ mode: 'closed' });
      const style = document.createElement('style');
      style.textContent = CSS;
      box = document.createElement('div');
      box.className = 'box';
      root.append(style, box);
    }
    let parent = document.fullscreenElement;
    if (!parent || parent.tagName === 'VIDEO') parent = document.documentElement;
    if (host.parentNode !== parent) parent.appendChild(host);
  };

  const show = (video, text, opts = {}) => {
    if (!document.documentElement) return;
    ensure();
    const r = video.getBoundingClientRect();
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = Math.min(w - 60, Math.max(60, r.left + r.width / 2));
    const cy = Math.min(h - 50, Math.max(10, r.top + Math.max(12, r.height * 0.12)));
    box.style.left = cx + 'px';
    box.style.top = cy + 'px';
    box.textContent = text;
    box.classList.toggle('warn', !!opts.warn);
    box.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => box.classList.remove('show'), opts.warn ? 1800 : 700);
  };

  BRO.osd = { show };
})();
