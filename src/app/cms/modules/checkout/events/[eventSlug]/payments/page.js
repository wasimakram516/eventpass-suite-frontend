"use client";

import { PaymentsPage } from "@/components/checkout/EventPaymentsPage";
import {
  getPaymentsByEvent,
  getPaymentStats,
} from "@/services/checkout/paymentService";
import { getCheckoutEventBySlug } from "@/services/checkout/eventService";
import PermissionGuard from "@/components/PermissionGuard";

const checkoutPaymentService = { getPaymentsByEvent, getPaymentStats };

export default function CheckoutPaymentsPage() {
  return (
    <PermissionGuard module="checkout" action="view_payments">
      <PaymentsPage
        paymentService={checkoutPaymentService}
        getEventBySlug={getCheckoutEventBySlug}
        eventBase="/cms/modules/checkout/events"
      />
    </PermissionGuard>
  );
}
