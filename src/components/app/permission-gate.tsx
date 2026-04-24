"use client";

import type { ReactNode } from "react";
import { usePermissions } from "@/hooks/use-permissions";

type PermissionGateProps = {
  roles: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
};

/**
 * Renders children only when the current user has one of the required roles.
 * Renders fallback (or nothing) otherwise.
 *
 * @example
 * <PermissionGate roles="admin">
 *   <DeleteButton />
 * </PermissionGate>
 *
 * <PermissionGate roles={["admin", "editor"]} fallback={<ReadOnlyView />}>
 *   <EditForm />
 * </PermissionGate>
 */
export function PermissionGate({ roles, children, fallback = null }: PermissionGateProps) {
  const { hasRole } = usePermissions();
  return hasRole(roles) ? <>{children}</> : <>{fallback}</>;
}
