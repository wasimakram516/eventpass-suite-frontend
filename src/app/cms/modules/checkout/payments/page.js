"use client";

import { PaymentsPage } from "@/components/checkout/PaymentsDashboardPage";
import PermissionGuard from "@/components/PermissionGuard";
import { useHasPermission } from "@/hooks/usePermission";
import {
  exportInvoices,
  exportPayments,
  getAllPayments,
  getPaymentLink,
} from "@/services/checkout/paymentService";
import { getRegistrationInvoice } from "@/services/checkout/registrationService";

const checkoutPaymentService = {
  getAllPayments,
  getPaymentLink,
  exportPayments,
  exportInvoices,
};

export default function CheckoutPaymentsDashboardPage() {
  const canViewInvoice = useHasPermission("checkout", "export_payments");

  return (
    <PermissionGuard module="checkout" action="view_payments">
      <PaymentsPage
        paymentService={checkoutPaymentService}
        getRegistrationInvoice={getRegistrationInvoice}
        canViewInvoice={canViewInvoice}
        canExport={canViewInvoice}
      />
    </PermissionGuard>
  );
}
