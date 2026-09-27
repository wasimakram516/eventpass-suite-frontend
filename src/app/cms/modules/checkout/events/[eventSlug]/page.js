"use client";

import { CircularProgress, Box } from "@mui/material";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

// Checkout does not use a separate event landing screen. Keep this route as a
// compatibility redirect for existing bookmarks while routing all users to
// the registrations workspace directly.
export default function CheckoutEventPageRedirect() {
  const { eventSlug } = useParams();
  const router = useRouter();

  useEffect(() => {
    if (eventSlug) {
      router.replace(`/cms/modules/checkout/events/${eventSlug}/registrations`);
    }
  }, [eventSlug, router]);

  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
      <CircularProgress />
    </Box>
  );
}
