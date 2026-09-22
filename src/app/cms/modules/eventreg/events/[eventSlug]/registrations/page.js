"use client";

import { RegistrationsPage } from "@/components/registration/RegistrationsPage";
import * as registrationService from "@/services/eventreg/registrationService";
import { getPublicEventBySlug } from "@/services/eventreg/eventService";

export default function EventRegRegistrationsPage() {
  return (
    <RegistrationsPage
      moduleKey="eventreg"
      registrationService={registrationService}
      getEventBySlug={getPublicEventBySlug}
      routeBase="/cms/modules/eventreg/events"
    />
  );
}
