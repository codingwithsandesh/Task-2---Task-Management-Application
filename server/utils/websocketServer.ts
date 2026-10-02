import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../middleware/authMiddleware';

interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients = new Map<string, Set<AuthenticatedSocket>>();

  public init(server: HttpServer): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: AuthenticatedSocket, req) => {
      ws.isAlive = true;

      // Extract token from query param if provided
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const token = url.searchParams.get('token');

      if (token) {
        this.authenticateClient(ws, token);
      }

      ws.on('message', (messageData) => {
        try {
          const data = JSON.parse(messageData.toString());
          if (data.type === 'auth' && data.token) {
            this.authenticateClient(ws, data.token);
          } else if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          }
        } catch {
          // ignore malformed frame
        }
      });

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('close', () => {
        if (ws.userId) {
          const userSockets = this.clients.get(ws.userId);
          if (userSockets) {
            userSockets.delete(ws);
            if (userSockets.size === 0) {
              this.clients.delete(ws.userId);
            }
          }
        }
      });
    });

    // Heartbeat check every 30 seconds
    const interval = setInterval(() => {
      if (!this.wss) return;
      this.wss.clients.forEach((wsClient) => {
        const client = wsClient as AuthenticatedSocket;
        if (client.isAlive === false) {
          return client.terminate();
        }
        client.isAlive = false;
        client.ping();
      });
    }, 30000);

    this.wss.on('close', () => {
      clearInterval(interval);
    });

    console.log('[TaskFlow WebSocket] Real-time WebSocket server initialized on path /ws');
  }

  private authenticateClient(ws: AuthenticatedSocket, token: string): void {
    try {
      const decoded = jwt.verify(token, getJwtSecret()) as { id: string };
      const userId = decoded.id;
      ws.userId = userId;

      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }
      this.clients.get(userId)!.add(ws);

      ws.send(JSON.stringify({
        type: 'auth:success',
        payload: { userId, message: 'Real-time WebSocket connection authenticated.' },
      }));
    } catch {
      ws.send(JSON.stringify({
        type: 'auth:error',
        payload: { message: 'Failed to authenticate WebSocket connection.' },
      }));
    }
  }

  public broadcastToUser(userId: string, event: { type: string; payload: unknown }): void {
    const userSockets = this.clients.get(userId);
    if (!userSockets || userSockets.size === 0) return;

    const payloadString = JSON.stringify(event);
    for (const client of userSockets) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payloadString);
      }
    }
  }

  public notifyTaskCreated(userId: string, task: unknown): void {
    this.broadcastToUser(userId, { type: 'task:created', payload: task });
  }

  public notifyTaskUpdated(userId: string, task: unknown): void {
    this.broadcastToUser(userId, { type: 'task:updated', payload: task });
  }

  public notifyTaskDeleted(userId: string, taskId: string): void {
    this.broadcastToUser(userId, { type: 'task:deleted', payload: { id: taskId } });
  }
}

export const wsManager = new WebSocketManager();
