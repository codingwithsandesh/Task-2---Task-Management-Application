import http from 'http';
import path from 'path';
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db } from './db/database';
import { wsManager } from './utils/websocketServer';
import authRoutes from './routes/authRoutes';
import taskRoutes from './routes/taskRoutes';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

async function bootstrap() {
  const app = express();
  const server = http.createServer(app);

  // Standard middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize Database connection (MySQL 8.0 or persistent file-store fallback)
  await db.init();

  // Initialize WebSocket server on the same HTTP server
  wsManager.init(server);

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      status: 'healthy',
      app: 'TaskFlow',
      tagline: 'Organize. Track. Complete.',
      timestamp: new Date().toISOString(),
      database: db.getInfo(),
      version: '1.0.0',
    });
  });

  // REST API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/tasks', taskRoutes);

  // Catch-all 404 for undefined API routes
  app.all('/api/*', (_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: 'API endpoint not found.',
    });
  });

  // Vite middleware in dev or static files in production
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start HTTP server on port 3000
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`=================================================`);
    console.log(`TaskFlow – Task Management Application`);
    console.log(`"Organize. Track. Complete."`);
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
    console.log(`Health check: http://0.0.0.0:${PORT}/api/health`);
    console.log(`Database engine: ${db.getInfo().type}`);
    console.log(`=================================================`);
  });
}

bootstrap().catch((err) => {
  console.error('[TaskFlow Server] Fatal startup error:', err);
  process.exit(1);
});
