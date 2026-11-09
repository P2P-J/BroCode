const tabs = new Map();
let restored = null;
let queue = Promise.resolve();

const serial = (fn) => {
  const next = queue.then(fn, fn);
  queue = next.catch(() => {});
  return next;
};

const restore = () => {
  if (!restored) {
    restored = chrome.storage.session.get(null).then((data) => {
      for (const [k, v] of Object.entries(data)) {
        if (k.startsWith('tab:') && !tabs.has(Number(k.slice(4)))) tabs.set(Number(k.slice(4)), v);
      }
    }).catch(() => {});
  }
  return restored;
};

const persist = (tabId) => {
  const frames = tabs.get(tabId);
  if (frames && Object.keys(frames).length) return chrome.storage.session.set({ ['tab:' + tabId]: frames }).catch(() => {});
  tabs.delete(tabId);
  return chrome.storage.session.remove('tab:' + tabId).catch(() => {});
};

const list = (tabId) => {
  const frames = tabs.get(tabId) || {};
  return Object.entries(frames).map(([id, f]) => ({ frameId: Number(id), ...f }));
};

const broadcast = (tabId) => {
  const frames = list(tabId).map(({ frameId, hasVideo, playing, interactedAt, score }) => ({ frameId, hasVideo, playing, interactedAt, score }));
  chrome.tabs.sendMessage(tabId, { type: 'tab:frames', frames }).catch(() => {});
};

const pickFrame = (tabId, exclude) => {
  let best = null;
  for (const f of list(tabId)) {
    if (f.frameId === exclude || !f.hasVideo) continue;
    const rank = [f.interactedAt || 0, f.playing ? 1 : 0, f.score || 0];
    if (!best || rank[0] > best.rank[0] || (rank[0] === best.rank[0] && (rank[1] > best.rank[1] || (rank[1] === best.rank[1] && rank[2] > best.rank[2])))) {
      best = { frameId: f.frameId, rank };
    }
  }
  return best ? best.frameId : null;
};

const onFrameState = async (msg, sender) => {
  await restore();
  const tabId = sender.tab.id;
  const frames = tabs.get(tabId) || {};
  const prev = frames[sender.frameId];
  if (msg.hasVideo || sender.frameId === 0 || prev) {
    frames[sender.frameId] = {
      hasVideo: !!msg.hasVideo,
      videoCount: Number(msg.videoCount) || 0,
      playing: !!msg.playing,
      score: Number(msg.score) || 0,
      interactedAt: Number(msg.interactedAt) || 0,
      presets: Array.isArray(msg.presets) ? msg.presets.slice(0, 10).map(String) : []
    };
    tabs.set(tabId, frames);
    await persist(tabId);
    broadcast(tabId);
  }
  return { frameId: sender.frameId };
};

const onFrameGone = async (sender) => {
  await restore();
  const frames = tabs.get(sender.tab.id);
  if (!frames) return;
  delete frames[sender.frameId];
  await persist(sender.tab.id);
  broadcast(sender.tab.id);
};

const onForward = async (msg, sender) => {
  await restore();
  const frameId = pickFrame(sender.tab.id, sender.frameId);
  if (frameId === null) return { ok: false };
  await chrome.tabs.sendMessage(sender.tab.id, { type: 'key:exec', cmd: msg.cmd }, { frameId }).catch(() => {});
  return { ok: true, frameId };
};

const onPopupInfo = async (msg) => {
  await restore();
  const frames = list(Number(msg.tabId));
  const presets = new Set();
  let videoCount = 0;
  for (const f of frames) {
    videoCount += f.videoCount || 0;
    for (const p of f.presets || []) presets.add(p);
  }
  return { videoCount, presets: [...presets] };
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || typeof msg.type !== 'string') return false;
  const fromTab = sender.tab && typeof sender.tab.id === 'number';
  let job = null;
  if (msg.type === 'frame:state' && fromTab) job = () => onFrameState(msg, sender);
  else if (msg.type === 'frame:gone' && fromTab) job = () => onFrameGone(sender);
  else if (msg.type === 'key:forward' && fromTab) job = () => onForward(msg, sender);
  else if (msg.type === 'popup:info' && !fromTab) job = () => onPopupInfo(msg);
  if (!job) return false;
  serial(job).then(sendResponse, () => sendResponse(null));
  return true;
});

chrome.tabs.onRemoved.addListener((tabId) => {
  serial(async () => {
    await restore();
    tabs.delete(tabId);
    await persist(tabId);
  });
});
