import Fastify from 'fastify';
import dotenv from 'dotenv';

dotenv.config();

const server = Fastify({
  logger: true
});

server.get('/health', async () => {
  return { status: 'ok' };
});

const port = Number(process.env.PORT) || 3001;
const host = process.env.HOST || '0.0.0.0';

server
  .listen({ port, host })
  .then((address) => {
    server.log.info(`meta-api listening at ${address}`);
  })
  .catch((error) => {
    server.log.error(error);
    process.exit(1);
  });
