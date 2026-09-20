"use client";

import PaymentCancelPage from "@/components/checkout/PaymentCancelPage";
import { cancelPayment } from "@/services/checkout/paymentService";

export default function CheckoutPaymentCancelPage() {
  return <PaymentCancelPage cancel={cancelPayment} eventRouteBase="/checkout" />;
}
