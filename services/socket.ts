import { SOCKET_URL } from '../constants/config';

// Raw WebSocket client that speaks the tradefind-location JSON protocol.
// Public API is identical to the previous socket.io version so no other
// files need to change.

type OutboundMsg =
  | { type: 'location:update'; lat: number; lng: number }
  | { type: 'worker:offline' }
  | { type: 'track:start'; workerId: string }
  | { type: 'track:stop'; workerId: string };

type InboundMsg =
  | { type: 'connected' }
  | { type: 'worker:moved'; lat: number; lng: number }
  | { type: 'worker:offline' }
  | { type: 'error'; message: string };

let ws: WebSocket | null = null;
let currentToken: string | null = null;
let currentWorkerId: string | null = null;
let reconnectAttempts = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const MAX_RECONNECT = 6;

const workerMovedListeners = new Set<(data: { lat: number; lng: number }) => void>();

function buildUrl(): string {
  // SOCKET_URL is ws://host:4000 or wss://host:4000
  const base = SOCKET_URL.replace(/^http/, 'ws'); // graceful if http:// is used
  let url = `${base}/ws?token=${currentToken}`;
  if (currentWorkerId) url += `&workerId=${currentWorkerId}`;
  return url;
}

function send(msg: OutboundMsg): void {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function scheduleReconnect(): void {
  if (reconnectAttempts >= MAX_RECONNECT) return;
  if (reconnectTimer) return;
  const delay = Math.min(1000 * 2 ** reconnectAttempts, 30_000);
  reconnectAttempts += 1;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, delay);
}

function connect(): void {
  if (!currentToken) return;
  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) return;

  ws = new WebSocket(buildUrl());

  ws.onopen = () => {
    reconnectAttempts = 0;
  };

  ws.onmessage = (event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data as string) as InboundMsg;
      if (msg.type === 'worker:moved') {
        workerMovedListeners.forEach((cb) => cb({ lat: msg.lat, lng: msg.lng }));
      }
    } catch {}
  };

  ws.onclose = () => {
    if (currentToken) scheduleReconnect();
  };

  ws.onerror = () => {
    // onerror always precedes onclose; let onclose handle reconnect
  };
}

// ─── Public API (matches previous socket.io surface) ──────────────────────────

export function connectSocket(accessToken: string, workerProfileId?: string): void {
  currentToken = accessToken;
  if (workerProfileId) currentWorkerId = workerProfileId;
  reconnectAttempts = 0;
  connect();
}

/**
 * Called by the API interceptor after a token refresh.
 * Re-connects the socket with the new token so tracking never breaks
 * after the 15-minute JWT expiry.
 */
export function refreshSocketToken(newToken: string): void {
  if (!currentToken) return; // socket was never connected
  currentToken = newToken;
  // Force reconnect with new token
  if (ws) {
    ws.close();
    ws = null;
  }
  reconnectAttempts = 0;
  connect();
}

export function disconnectSocket(): void {
  currentToken = null;
  currentWorkerId = null;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  ws?.close();
  ws = null;
}

export function emitLocationUpdate(lat: number, lng: number): void {
  send({ type: 'location:update', lat, lng });
}

export function emitWorkerOffline(): void {
  send({ type: 'worker:offline' });
}

export function startTracking(workerId: string): void {
  send({ type: 'track:start', workerId });
}

export function stopTracking(workerId: string): void {
  send({ type: 'track:stop', workerId });
}

export function onWorkerMoved(
  callback: (data: { lat: number; lng: number }) => void,
): () => void {
  workerMovedListeners.add(callback);
  return () => workerMovedListeners.delete(callback);
}
