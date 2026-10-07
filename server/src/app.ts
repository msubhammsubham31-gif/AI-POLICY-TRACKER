import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import apiRouter from './routes/apiRoutes';
import { errorHandler } from './middleware/errorMiddleware';

export function createApp() {
  const app = express();

  // Security Middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Allow client scripts & MapLibre tiles
  }));

  app.use(cors({
    origin: '*',
    credentials: true,
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Routes
  app.use('/api', apiRouter);

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      app: 'RegulaMap — AI Regulatory & Environmental Compliance Drift Tracking Platform',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Serve static client in production if built
  const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');
  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
