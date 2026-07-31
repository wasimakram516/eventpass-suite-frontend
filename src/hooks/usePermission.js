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
