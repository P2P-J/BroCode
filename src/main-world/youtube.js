(() => {
  const findPlayer = (v) => v.closest('.html5-video-player') || document.getElementById('movie_player');

  window.addEventListener('brocode:cmd', (e) => {
    let d;
    try {
      d = JSON.parse(e.detail);
    } catch {
      return;
    }
    if (!d || d.adapter !== 'youtube' || typeof d.id !== 'string') return;
    const v = document.querySelector('video[data-brocode-target="' + CSS.escape(d.id) + '"]');
    const p = v && findPlayer(v);
    if (!p || typeof p.getVolume !== 'function' || typeof p.setVolume !== 'function') return;
    if (d.op !== 'volumeBy' || typeof d.arg !== 'number') return;
    try {
      const wasMuted = typeof p.isMuted === 'function' && p.isMuted();
      const next = Math.max(0, Math.min(100, Math.round(p.getVolume() + d.arg * 100)));
      p.setVolume(next);
      let muted = wasMuted;
      if (wasMuted && d.arg > 0 && typeof p.unMute === 'function') {
        p.unMute();
        muted = false;
      }
      window.dispatchEvent(new CustomEvent('brocode:res', { detail: JSON.stringify({ id: d.id, ok: true, volume: next / 100, muted }) }));
    } catch {}
  });
})();
