type Handler = () => void;
let _handler: Handler | null = null;

export function registerSessionExpiredHandler(fn: Handler): void {
  _handler = fn;
}

export function notifySessionExpired(): void {
  _handler?.();
}
