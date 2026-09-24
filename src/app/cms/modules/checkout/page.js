"use client";

import PermissionGuard from "@/components/PermissionGuard";
import ModuleWorkingRedirect from "@/components/modules/ModuleWorkingRedirect";

export default function CheckoutHome() {
  return (
    <PermissionGuard module="checkout">
      <ModuleWorkingRedirect href="/cms/modules/checkout/events" />
    </PermissionGuard>
  );
}
