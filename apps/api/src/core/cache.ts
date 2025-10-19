import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6380',
});

redis.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

// Connect on startup
redis.connect().catch(console.error);

export default redis;