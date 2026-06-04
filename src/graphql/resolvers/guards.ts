import type { GraphQLContext, AuthUser } from '../context.js';

export function requireUser(context: GraphQLContext): AuthUser {
  if (!context.user) {
    throw new Error('Unauthorized');
  }

  return context.user;
}

export function requireRole(context: GraphQLContext, roles: string[]): AuthUser {
  const user = requireUser(context);

  if (!roles.includes(user.role)) {
    throw new Error('Forbidden');
  }

  return user;
}
