"use client";

import { useAuthStore } from "@/store/auth.store";

type Permission = string;

type UsePermissionsReturn = {
  role: string | undefined;
  isAdmin: boolean;
  isAuthenticated: boolean;
  hasRole: (role: Permission | Permission[]) => boolean;
};

export function usePermissions(): UsePermissionsReturn {
  const { user, isAuthenticated } = useAuthStore();
  const role = user?.role;

  const hasRole = (required: Permission | Permission[]): boolean => {
    if (!role) return false;
    return Array.isArray(required) ? required.includes(role) : role === required;
  };

  return {
    role,
    isAdmin: role === "admin",
    isAuthenticated,
    hasRole,
  };
}
