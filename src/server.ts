import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { redis } from './config/redis';

async function main() {
  await prisma.$connect();

  const server = app.listen(env.PORT, () => {
    console.log(`Server listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal: string) => {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await prisma.$disconnect();
      redis.disconnect();
      process.exit(0);
    });
    // don't hang forever on open connections
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
