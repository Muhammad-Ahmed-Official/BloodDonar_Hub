type Listener = (logs: string[]) => void;

const logs: string[] = [];
const listeners = new Set<Listener>();

export function debugLog(message: string) {
  const t = new Date().toTimeString().slice(0, 8);
  const entry = `[${t}] ${message}`;
  logs.unshift(entry);
  if (logs.length > 60) logs.pop();
  listeners.forEach((fn) => fn([...logs]));
}

export function subscribeToLogs(fn: Listener): () => void {
  listeners.add(fn);
  fn([...logs]);
  return () => listeners.delete(fn);
}

export function clearLogs() {
  logs.length = 0;
  listeners.forEach((fn) => fn([]));
}
