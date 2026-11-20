const KEYS = {
  works: "underwater-demo-works",
  settings: "underwater-demo-settings",
  comments: "underwater-demo-comments",
  feedback: "underwater-demo-feedback",
  visitor: "underwater-visitor-id",
  visitorData: "underwater-demo-visitors",
  stats: "underwater-demo-stats",
};

export function readLocal(key, fallback) {
  try {
    const raw = sessionStorage.getItem(KEYS[key] || key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.error(`Unable to read local demo data (${key}).`, error);
    return fallback;
  }
}

export function writeLocal(key, value) {
  sessionStorage.setItem(KEYS[key] || key, JSON.stringify(value));
}

export function visitorId() {
  let id = localStorage.getItem(KEYS.visitor);
  if (!id) {
    id = crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(KEYS.visitor, id);
  }
  return id;
}

export { KEYS };
