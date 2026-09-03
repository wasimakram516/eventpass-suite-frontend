"use client";

import { useAuth } from "@/contexts/AuthContext";

// Reads the resolved "module:action" allow-list off the current user (never
// baked into a token — refreshed via AuthContext's periodic /me refetch, see
// contexts/AuthContext.js). Superadmin always passes.
export function useHasPermission(moduleKey, action = "view") {
  const { user } = useAuth();
  if (!user) return false;
  if (user.isSuper) return true;
  return Array.isArray(user.permissions) && user.permissions.includes(`${moduleKey}:${action}`);
}

export function hasModuleAccess(user, moduleKey) {
  if (!user) return false;
  if (user.isSuper) return true;
  if (
    Array.isArray(user.permissions) &&
    user.permissions.some((p) => p === moduleKey || p.startsWith(`${moduleKey}:`))
  ) {
    return true;
  }
  return (
    Array.isArray(user.modulePermissions) &&
    user.modulePermissions.includes(moduleKey)
  );
}
