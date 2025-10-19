import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { config } from './core/config.js';

const app = Fastify({
  logger: true,
});

// Security plugins
app.register(helmet);
app.register(cors, {
  origin: config.WEB_ORIGIN,
  credentials: true,
});

// Auth & session plugins
app.register(jwt, {
  secret: config.JWT_SECRET,
});

app.register(cookie, {
  secret: config.JWT_SECRET,
  parseOptions: {},
});

// File upload support
app.register(multipart);

// Rate limiting
app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

// Health check
app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

// API routes
app.register(async (instance) => {
  // Auth routes
  const { registerAuthRoutes } = await import('./modules/auth/routes.js');
  await registerAuthRoutes(instance);

  // Users routes
  const { registerUserRoutes } = await import('./modules/users/routes.js');
  await registerUserRoutes(instance);

  // Pets routes
  const { registerPetRoutes } = await import('./modules/pets/routes.js');
  await registerPetRoutes(instance);

  // Listings routes
  const { registerListingRoutes } = await import('./modules/listings/routes.js');
  await registerListingRoutes(instance);

  // Bookings routes
  const { registerBookingRoutes } = await import('./modules/bookings/routes.js');
  await registerBookingRoutes(instance);

  // Reviews routes
  const { registerReviewRoutes } = await import('./modules/reviews/routes.js');
  await registerReviewRoutes(instance);

  // Messages routes
  const { registerMessageRoutes } = await import('./modules/messages/routes.js');
  await registerMessageRoutes(instance);

  // Billing routes
  const { registerBillingRoutes } = await import('./modules/billing/routes.js');
  await registerBillingRoutes(instance);

  // Favorites routes
  const { registerFavoriteRoutes } = await import('./modules/favorites/routes.js');
  await registerFavoriteRoutes(instance);

  // Health check for API
  instance.get('/v1/hello', async () => ({ 
    message: 'PetStay API v1',
    timestamp: new Date().toISOString() 
  }));
}, { prefix: '/api' });

const port = config.PORT;

app
  .listen({ port, host: '0.0.0.0' })
  .then(() => {
    app.log.info(`API running on http://localhost:${port}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
