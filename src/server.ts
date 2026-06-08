import 'dotenv/config';

import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { prisma } from './prisma/client.js';

const port = Number.parseInt(process.env.PORT || '8080', 10);
const app = createApp({ prisma });

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Backend listening on http://localhost:${info.port}`);
    console.log(`GraphQL Yoga ready at http://localhost:${info.port}/graphql`);
  }
);

async function shutdown() {
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
