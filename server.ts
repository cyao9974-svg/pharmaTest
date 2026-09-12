import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import apiRoutes from './backend/src/routes/apiRoutes.js';
import { db } from './backend/src/database/db.js';
import { searchService } from './backend/src/services/searchService.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'PharmaGuard Bingerville API',
      postgres: db.isUsingPostgres(),
      time: new Date().toISOString(),
    });
  });

  // Mount API routes
  app.use('/api', apiRoutes);

  // Seed initial Bingerville demo dataset if store is completely empty
  setTimeout(async () => {
    try {
      const existing = await db.getPharmacies();
      if (existing.length === 0) {
        console.log('🌱 [Server] Empty database detected. Seeding initial Bingerville pharmacies for immediate preview...');
        await searchService.executeSearch({
          city: 'Bingerville',
          country: "Côte d'Ivoire",
          term: 'pharmacies de garde Bingerville',
          mode: 'demo',
        });
        console.log('✅ [Server] Initial seed completed successfully.');
      }
    } catch (e) {
      console.warn('⚠️ [Server] Auto-seed failed (non-fatal):', (e as Error).message);
    }
  }, 1000);

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 PharmaGuard Bingerville server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
