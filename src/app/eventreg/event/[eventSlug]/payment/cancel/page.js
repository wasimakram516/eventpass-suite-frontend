"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

// See the success route: this preserves callback URLs embedded in payment
// sessions created before Checkout owned payment result pages.
export default function LegacyPaymentCancelRedirect() {
  const { eventSlug } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  useEffect(() => {
    router.replace(
      `/checkout/event/${eventSlug}/payment/cancel${queryString ? `?${queryString}` : ""}`,
    );
  }, [eventSlug, queryString, router]);

  return null;
}
