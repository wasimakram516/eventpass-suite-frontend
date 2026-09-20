"use client";

import Registration from "@/components/registration/PublicRegistrationPage";
import { getCheckoutEventBySlug } from "@/services/checkout/eventService";
import { createRegistration } from "@/services/checkout/registrationService";
import { initiatePayment } from "@/services/checkout/paymentService";
import { validatePromoCode } from "@/services/checkout/promoCodeService";

export default function CheckoutRegistration() {
  return (
    <Registration
      getEventBySlug={getCheckoutEventBySlug}
      register={createRegistration}
      startPayment={initiatePayment}
      validatePromo={validatePromoCode}
      moduleName="checkout"
      eventRouteBase="/checkout"
      paymentRouteBase="/checkout"
      checkoutEnabled
    />
  );
}
