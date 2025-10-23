"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Typography, CircularProgress } from "@mui/material";
import HorizontalCarousel from "@/components/HorizontalCarousel";
import { getPublicEventBySlug } from "@/services/eventreg/eventService";
import LanguageSelector from "@/components/LanguageSelector";
import useI18nLayout from "@/hooks/useI18nLayout";
import Background from "@/components/Background";
import EventWelcomeCard from "@/components/EventWelcomeCard";
import ICONS from "@/utils/iconUtil";

export default function EventDetails() {
  const { eventSlug } = useParams();
  const router = useRouter();

  const { t, dir } = useI18nLayout({
    en: {
      welcome: "Welcome to",
      thankYou:
        "Thank you for joining us! Please register below to secure your place.",
      registerNow: "Register Now",
      takesSeconds: "Takes only 5 seconds!",
      dateNotAvailable: "Date not available",
      to: "to",
    },
    ar: {
      welcome: "مرحبًا في",
      thankYou: "شكرًا لانضمامك إلينا! يرجى التسجيل أدناه لتأمين مكانك.",
      registerNow: "سجل الآن",
      takesSeconds: "يستغرق فقط 5 ثوانٍ!",
      dateNotAvailable: "التاريخ غير متوفر",
      to: "إلى",
    },
  });

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvent = async () => {
      const result = await getPublicEventBySlug(eventSlug);
      if (!result?.error) setEvent(result);
      else setError(result.message || "Event not found.");
      setLoading(false);
    };
    fetchEvent();
  }, [eventSlug]);

  const brandingMedia = useMemo(() => {
    return event?.brandingMedia || [];
  }, [event]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !event) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Box>
    );
  }

  const { name, description, venue, startDate, endDate, logoUrl } = event;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        px: 2,
        py: { xs: 2, md: 4 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        position: "relative",
        backgroundImage: event?.backgroundUrl
          ? `url(${event.backgroundUrl})`
          : "none",
        backgroundSize: "cover",
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        zIndex: 0,
      }}
    >
      {/* Default background component if no bgUrl */}
      {!event?.backgroundUrl && <Background />}

      {/* Logo outside the container */}
      {logoUrl && (
        <Box
          sx={{
            width: { xs: "100%", sm: 320, md: 500 },
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: 3,
            mt: { xs: 6, sm: 0 },
          }}
        >
          <Box
            component="img"
            src={logoUrl}
            alt={`${name} Logo`}
            sx={{
              display: "block",
              width: "100%",
              height: "auto",
              objectFit: "contain",
            }}
          />
        </Box>
      )}

      {/* Main details container */}
      <EventWelcomeCard
        t={t}
        name={name}
        description={description}
        venue={venue}
        startDate={startDate}
        endDate={endDate}
        router={router}
        dir={dir}
        actionLabel={t.registerNow}
        actionIcon={<ICONS.appRegister />}
        actionRoute={`/event/${eventSlug}/register`}
      />

      {/* Branding media carousel */}
      <HorizontalCarousel
        items={brandingMedia}
        showBorders={false}
        maxWidth="lg"
        itemHeight={{ xs: 40, sm: 50, md: 60 }}
        itemMaxWidth={{ xs: 150, sm: 200, md: 250 }}
        containerPadding={{ xs: 2, md: 3 }}
        itemPadding={{ xs: 2, sm: 3 }}
        pauseOnHover={true}
        reducedMotionSupport={true}
      />

      <LanguageSelector top={20} right={20} />
    </Box>
  );
}
