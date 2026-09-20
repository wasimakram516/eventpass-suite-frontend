"use client";

import PaymentSuccessPage from "@/components/checkout/PaymentSuccessPage";
import { verifyPayment } from "@/services/checkout/paymentService";

export default function CheckoutPaymentSuccessPage() {
  return (
    <PaymentSuccessPage
      verify={verifyPayment}
      eventRouteBase="/checkout"
      moduleName="checkout"
    />
  );
}
