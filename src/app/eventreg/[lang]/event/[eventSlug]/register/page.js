"use client";

import Registration from "@/components/registration/PublicRegistrationPage";
import { createRegistration } from "@/services/eventreg/registrationService";
import { getPublicEventBySlug } from "@/services/eventreg/eventService";

export default function EventRegRegistration() {
  return (
    <Registration
      getEventBySlug={getPublicEventBySlug}
      register={createRegistration}
      moduleName="eventreg"
      eventRouteBase="/eventreg"
      paymentRouteBase="/eventreg"
      checkoutRedirectBase="/checkout"
    />
  );
}
