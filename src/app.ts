import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createYoga } from 'graphql-yoga';
import type { PrismaClient } from '@prisma/client';
import type { AuthUser } from './graphql/context.js';
import { getAccessTokenUser } from './modules/auth/token.service.js';
import { createAudioRoutes } from './modules/audio/audio.routes.js';
import { schema } from './graphql/schema.js';

function createGraphQLContext({ prisma }: { prisma: PrismaClient }) {
  return ({ request }: { request: Request }) => {
    let user: AuthUser | null = null;

    try {
      user = getAccessTokenUser(request);
    } catch (_error) {
      user = null;
    }

    return {
      prisma,
      user,
      meta: {
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    };
  };
}

export function createApp({ prisma }: { prisma: PrismaClient }) {
  const app = new Hono();
  const yoga = createYoga({
    schema: schema as any,
    graphqlEndpoint: '/graphql',
    context: createGraphQLContext({ prisma }),
  });

  app.use('*', cors());

  app.get('/health', (c) =>
    c.json({
      status: 'ok',
      service: 'streaming-app-backend',
      stack: 'hono-prisma-graphql-yoga',
      timestamp: new Date().toISOString(),
    })
  );

  app.all('/graphql', async (c) => yoga.fetch(c.req.raw));
  app.route('/tracks', createAudioRoutes({ prisma }));

  app.notFound((c) => c.json({ message: 'Route not found' }, 404));

  app.onError((error, c) => {
    console.error(error);
    return c.json({ message: error.message || 'Internal server error' }, 500);
  });

  return app;
}
