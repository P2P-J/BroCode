(() => {
  const BRO = (globalThis.BRO ??= {});
  const subs = new Set();
  let observer = null;
  let pending = false;

  const flush = () => {
    pending = false;
    for (const fn of subs) {
      try {
        fn();
      } catch {}
    }
  };

  const schedule = () => {
    if (pending) return;
    pending = true;
    setTimeout(flush, 400);
  };

  const start = () => {
    if (observer) return;
    observer = new MutationObserver(schedule);
    observer.observe(document.documentElement || document, { childList: true, subtree: true });
  };

  const subscribe = (fn) => {
    subs.add(fn);
    start();
    return () => subs.delete(fn);
  };

  BRO.watch = { subscribe, schedule };
})();
