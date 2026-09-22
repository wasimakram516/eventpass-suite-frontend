"use client";

import { RegistrationsPage } from "@/components/registration/RegistrationsPage";
import PermissionGuard from "@/components/PermissionGuard";
import { getCheckoutEventBySlug } from "@/services/checkout/eventService";
import { getPaymentLink, initiatePayment } from "@/services/checkout/paymentService";
import { validatePromoCode } from "@/services/checkout/promoCodeService";
import * as registrationService from "@/services/checkout/registrationService";

export default function CheckoutRegistrationsPage() {
  return (
    <PermissionGuard module="checkout">
      <RegistrationsPage
        moduleKey="checkout"
        registrationService={registrationService}
        getEventBySlug={getCheckoutEventBySlug}
        getPaymentLinkForRegistration={getPaymentLink}
        routeBase="/cms/modules/checkout/events"
        registrationModalProps={{
          paymentInitiate: initiatePayment,
          promoCodeValidator: validatePromoCode,
          externalRegistrationDuplicateCheck: registrationService.checkExternalRegistrationDuplicate,
        }}
        showPaymentFeatures
      />
    </PermissionGuard>
  );
}
