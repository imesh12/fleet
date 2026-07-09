import { AuthorizationError } from '@trackigniter8/errors';

export type PermissionGuardContext = {
  permissions: string[];
  roles: string[];
};

export function hasPermission(context: PermissionGuardContext, permission: string): boolean {
  if (context.roles.includes('SUPER_ADMIN')) {
    return true;
  }

  return context.permissions.includes(permission);
}

export function requirePermission(context: PermissionGuardContext, permission: string): void {
  if (!hasPermission(context, permission)) {
    throw new AuthorizationError(`Missing required permission: ${permission}`);
  }
}
