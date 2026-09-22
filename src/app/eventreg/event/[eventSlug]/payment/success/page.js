"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

// Thawani stores this callback URL when a session is created. Keep this small
// compatibility route indefinitely so sessions created before Checkout's URL
// migration still reach the Checkout verifier after a deploy.
export default function LegacyPaymentSuccessRedirect() {
  const { eventSlug } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  useEffect(() => {
    router.replace(
      `/checkout/event/${eventSlug}/payment/success${queryString ? `?${queryString}` : ""}`,
    );
  }, [eventSlug, queryString, router]);

  return null;
}
