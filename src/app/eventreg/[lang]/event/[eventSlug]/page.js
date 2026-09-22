"use client";

import { useParams } from "next/navigation";
import PublicEventPage from "@/components/registration/PublicEventPage";
import { getPublicEventBySlug } from "@/services/eventreg/eventService";

export default function EventRegEventPage() {
  const { eventSlug } = useParams();
  return (
    <PublicEventPage
      getEventBySlug={getPublicEventBySlug}
      registrationRouteBase="/eventreg"
      checkoutRedirectBase="/checkout"
      bookingRedirect={eventSlug === "omnex-b2b" ? "https://whitewall.simplybook.me/v2/#book" : null}
    />
  );
}
