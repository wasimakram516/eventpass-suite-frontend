"use client";

import { useHasPermission } from "@/hooks/usePermission";

// Wraps UI that should only render when the current user holds
// `module:action`. Backend guards are the real enforcement — this is UX only.
export default function PermissionGuard({ module, action = "view", fallback = null, children }) {
  const allowed = useHasPermission(module, action);
  return allowed ? children : fallback;
}
