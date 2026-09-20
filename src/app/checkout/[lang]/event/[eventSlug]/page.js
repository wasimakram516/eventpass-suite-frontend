"use client";

import EventDetails from "@/components/registration/PublicEventPage";
import { getCheckoutEventBySlug } from "@/services/checkout/eventService";

export default function CheckoutEventDetails() {
  return (
    <EventDetails
      getEventBySlug={getCheckoutEventBySlug}
      registrationRouteBase="/checkout"
    />
  );
}
