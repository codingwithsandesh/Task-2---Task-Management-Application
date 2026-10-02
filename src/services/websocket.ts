import { getStoredToken } from './api';
import { Task } from '../types';

type WebSocketStatus = 'connected' | 'connecting' | 'disconnected';

interface WebSocketListeners {
  onTaskCreated?: (task: Task) => void;
  onTaskUpdated?: (task: Task) => void;
  onTaskDeleted?: (payload: { id: string }) => void;
  onStatusChange?: (status: WebSocketStatus) => void;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: WebSocketListeners = {};
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private isExplicitlyClosed = false;

  public setListeners(listeners: WebSocketListeners) {
    this.listeners = { ...this.listeners, ...listeners };
  }

  public connect(): void {
    const token = getStoredToken();
    if (!token) return;

    this.isExplicitlyClosed = false;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.listeners.onStatusChange?.('connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.listeners.onStatusChange?.('connected');
        // also send explicit auth frame
        this.socket?.send(JSON.stringify({ type: 'auth', token }));
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case 'task:created':
              this.listeners.onTaskCreated?.(data.payload as Task);
              break;
            case 'task:updated':
              this.listeners.onTaskUpdated?.(data.payload as Task);
              break;
            case 'task:deleted':
              this.listeners.onTaskDeleted?.(data.payload as { id: string });
              break;
            case 'pong':
              break;
          }
        } catch {
          // ignore
        }
      };

      this.socket.onclose = () => {
        this.listeners.onStatusChange?.('disconnected');
        this.socket = null;
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = () => {
        this.listeners.onStatusChange?.('disconnected');
      };
    } catch {
      this.listeners.onStatusChange?.('disconnected');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);

    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);
    this.reconnectAttempts++;

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.listeners.onStatusChange?.('disconnected');
  }
}

export const wsService = new WebSocketService();
