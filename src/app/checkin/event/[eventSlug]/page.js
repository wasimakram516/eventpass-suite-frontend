"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Typography, CircularProgress } from "@mui/material";

import { getCheckInEventBySlug } from "@/services/checkin/checkinEventService";
import LanguageSelector from "@/components/LanguageSelector";
import useI18nLayout from "@/hooks/useI18nLayout";
import Background from "@/components/Background";
import EventWelcomeCard from "@/components/cards/EventWelcomeCard";
import ICONS from "@/utils/iconUtil";

export default function EventDetails() {
  const { eventSlug } = useParams();
  const router = useRouter();

  const { t, dir } = useI18nLayout({
    en: {
      welcome: "Welcome to",
      thankYou:
        "Thank you for joining us! Please enter your Employee ID to get your table number.",
      getTable: "Get Your Table",
      takesSeconds: "Takes only 5 seconds!",
      dateNotAvailable: "Date not available",
      to: "to",
    },
    ar: {
      welcome: "مرحبًا في",
      thankYou:
        "شكرًا لانضمامك إلينا! يرجى إدخال معرف الموظف للحصول على رقم طاولتك.",
      getTable: "احصل على طاولتك",
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
      const result = await getCheckInEventBySlug(eventSlug);
      if (!result?.error) {
        setEvent(result);
      } else {
        setError(result.message || "Event not found.");
      }
      setLoading(false);
    };

    fetchEvent();
  }, [eventSlug]);

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
        <Background />
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
        <Background />
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Box>
    );
  }

  const { name, venue, startDate, endDate, logoUrl } = event;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        px: 2,
        py: { xs: 2, md: 4 },
        gap: 2,
        position: "relative",
      }}
    >
      <Background />

      {/* Logo shown outside the card */}
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

      {/* Main welcome card */}
      <EventWelcomeCard
        t={t}
        name={name}
        venue={venue}
        startDate={startDate}
        endDate={endDate}
        router={router}
        dir={dir}
        actionLabel={t.getTable}
        actionIcon={<ICONS.diningTable />}
        actionRoute={`/checkin/event/${eventSlug}/register`}
      />

      <LanguageSelector top={20} right={20} />
    </Box>
  );
}
