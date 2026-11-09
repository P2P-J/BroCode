(() => {
  const BRO = (globalThis.BRO ??= {});

  const MAP = {
    ArrowRight: 'seekForward',
    ArrowLeft: 'seekBack',
    ArrowUp: 'volumeUp',
    ArrowDown: 'volumeDown'
  };

  const ALL = ['seekForward', 'seekBack', 'volumeUp', 'volumeDown', 'togglePlay'];

  const TEXT_INPUTS = new Set([
    'text', 'search', 'email', 'url', 'tel', 'password', 'number',
    'date', 'datetime-local', 'month', 'week', 'time', ''
  ]);

  const command = (e, allowed = ALL) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return null;
    if (e.isComposing || e.keyCode === 229) return null;
    let cmd = MAP[e.key] || null;
    if (!cmd && (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar')) cmd = 'togglePlay';
    if (!cmd || !allowed.includes(cmd)) return null;
    return cmd;
  };

  const isEditable = (el) => {
    if (!el || !el.tagName) return false;
    if (el.isContentEditable) return true;
    const tag = el.tagName.toUpperCase();
    if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (tag === 'INPUT') return TEXT_INPUTS.has(String(el.type || '').toLowerCase());
    return false;
  };

  BRO.keys = { command, isEditable, ALL };
})();
