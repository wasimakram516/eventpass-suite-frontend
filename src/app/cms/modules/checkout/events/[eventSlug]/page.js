"use client";

import { useEffect, useState } from "react";
import { Box, Button, Card, CardContent, CircularProgress, Container, Stack, Typography } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import NoDataAvailable from "@/components/NoDataAvailable";
import PermissionGuard from "@/components/PermissionGuard";
import { useHasPermission } from "@/hooks/usePermission";
import useI18nLayout from "@/hooks/useI18nLayout";
import { getCheckoutEventBySlug } from "@/services/checkout/eventService";
import ICONS from "@/utils/iconUtil";

const translations = {
  en: {
    checkout: "Checkout",
    description: "Manage ticket payments and promotional discounts for this event.",
    registrations: "Registrations",
    payments: "Payments",
    promoCodes: "Promo Codes",
  },
  ar: {
    checkout: "الدفع",
    description: "أدر مدفوعات التذاكر ورموز الخصم لهذه الفعالية.",
    registrations: "التسجيلات",
    payments: "المدفوعات",
    promoCodes: "رموز الخصم",
  },
};

export default function CheckoutEventPage() {
  const { eventSlug } = useParams();
  const router = useRouter();
  const canViewPayments = useHasPermission("checkout", "view_payments");
  const canViewPromoCodes = useHasPermission("checkout", "view_promo_codes");
  const canViewRegistrations = useHasPermission("checkout", "view");
  const { t, dir } = useI18nLayout(translations);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCheckoutEventBySlug(eventSlug).then((result) => {
      if (!result?.error) setEvent(result);
      setLoading(false);
    });
  }, [eventSlug]);

  const basePath = `/cms/modules/checkout/events/${eventSlug}`;
  const breadcrumbs = [
    { label: t.checkout, href: "/cms/modules/checkout/events" },
    { label: event?.name || eventSlug },
  ];

  return (
    <PermissionGuard module="checkout">
    <Container maxWidth="lg" sx={{ py: 3 }} dir={dir}>
      <BreadcrumbsNav items={breadcrumbs} />
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : !event ? (
        <NoDataAvailable />
      ) : (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h5" fontWeight={700}>{event.name}</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
              {t.description}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              {canViewRegistrations && (
                <Button variant="outlined" startIcon={<ICONS.people />} onClick={() => router.push(`${basePath}/registrations`)}>
                  {t.registrations}
                </Button>
              )}
              {canViewPayments && (
                <Button variant="contained" startIcon={<ICONS.payment />} onClick={() => router.push(`${basePath}/payments`)}>
                  {t.payments}
                </Button>
              )}
              {canViewPromoCodes && (
                <Button variant="outlined" startIcon={<ICONS.promoCode />} onClick={() => router.push(`${basePath}/promo-codes`)}>
                  {t.promoCodes}
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Container>
    </PermissionGuard>
  );
}
