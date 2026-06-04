import type { PrismaClient } from '@prisma/client';

export type AuthUser = {
  id: string;
  email?: string;
  role: string;
};

export type GraphQLContext = {
  prisma: PrismaClient;
  user: AuthUser | null;
  meta: {
    ipAddress: string | null;
    userAgent: string | null;
  };
};
