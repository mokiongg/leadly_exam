import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import swaggerUi from 'swagger-ui-express';

import { errorHandler, notFoundHandler, rateLimiter } from './middlewares';
import { itemsRoutes } from './modules/items';
import { reservationsRoutes } from './modules/reservations';
import { maintenanceRoutes } from './modules/maintenance';
import { swaggerSpec } from './swagger';

const app = express();
const PORT = process.env.PORT || 8080;

// This ensures req.ip and rate limiting work correctly with the real client IP if behind a proxy (Vercel proxy)
app.set('trust proxy', 1);

// ----- Middlewares -----
app.use(cors());
app.use(express.json());
app.use(rateLimiter);
// ----- End of Middlewares -----

// ----- Documentation -----
// Swagger UI (using CDN for Vercel serverless compatibility)
app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Inventory Reservation API Documentation',
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js',
    ],
    swaggerOptions: {
      operationsSorter: 'method',
    },
  })
);
// OpenAPI JSON
app.get('/openapi.json', (_, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Redirect root to documentation
app.get('/', (_, res) => {
  res.redirect('/docs');
});

// ----- Routes -----
app.use('/v1/items', itemsRoutes);
app.use('/v1/reservations', reservationsRoutes);
app.use('/v1/maintenance', maintenanceRoutes);

/**
 * GET /health
 * Health check endpoint
 *
 * @swagger
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check
 *     description: Returns the current health status of the API server.
 *     operationId: healthCheck
 *     servers:
 *       - url: /
 *         description: Root path (not versioned)
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
app.get('/health', (_, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
// ----- End of Routes -----

// ----- Error Handling -----
app.use(notFoundHandler);
app.use(errorHandler);
// ----- End of Error Handling -----

// Only start the server when not running on Vercel (serverless)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
}

export default app;
