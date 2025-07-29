"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Stack,
} from "@mui/material";

import { formatDateWithShortMonth } from "@/utils/dateUtils";
import ICONS from "@/utils/iconUtil";
import { getPublicEventBySlug } from "@/services/eventreg/eventService";
import LanguageSelector from "@/components/LanguageSelector";
import useI18nLayout from "@/hooks/useI18nLayout";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

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

  const { name, venue, startDate, endDate, logoUrl } = event;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        px: 2,
        py: { xs: 2, md: 4 },
        position: "relative",
      }}
    >
      <Paper
        dir={dir}
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 700,
          width: "100%",
          textAlign: "center",
          borderRadius: 3,
          boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.15)",
        }}
      >
        {logoUrl && (
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <img
              src={logoUrl}
              alt={`${name} Logo`}
              style={{
                width: "auto",
                height: "150px",
                maxWidth: "250px",
                objectFit: "contain",
                borderRadius: 8,
              }}
            />
          </Box>
        )}

        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{
            fontSize: { xs: 28, md: 36 },
            color: "primary.main",
            letterSpacing: "1.5px",
            mb: 2,
            animation: "fadeIn 1.2s ease-in-out",
            "@keyframes fadeIn": {
              "0%": { opacity: 0, transform: "translateY(-10px)" },
              "100%": { opacity: 1, transform: "translateY(0)" },
            },
          }}
        >
          {t.welcome} {name}
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          justifyContent="center"
          alignItems="center"
          flexWrap="wrap"
        >
          <Box component="span" sx={{ display: "flex", color: "primary.main" }}>
            <ICONS.location />
          </Box>
          {dir === "rtl" && (
            <Box
              component="span"
              sx={{
                width: "8px",
                display: "inline-block",
              }}
            />
          )}
          <Typography variant="h6" sx={{ fontSize: { xs: 16, md: 20 } }}>
            {venue}
          </Typography>
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          justifyContent="center"
          alignItems="center"
          flexWrap="wrap"
          sx={{ my: 2 }}
        >
          <Box component="span" sx={{ display: "flex", color: "primary.main" }}>
            <ICONS.event />
          </Box>

          {dir === "rtl" && (
            <Box
              component="span"
              sx={{ width: "8px", display: "inline-block" }}
            />
          )}

          {startDate && endDate ? (
            startDate === endDate ? (
              <Typography
                variant="h6"
                noWrap
                sx={{ fontSize: { xs: 16, md: 20 } }}
              >
                {formatDateWithShortMonth(startDate)}
              </Typography>
            ) : (
              <Typography
                variant="h6"
                noWrap
                sx={{ fontSize: { xs: 16, md: 20 } }}
              >
                {`${formatDateWithShortMonth(startDate)} ${
                  t.to
                } ${formatDateWithShortMonth(endDate)}`}
              </Typography>
            )
          ) : (
            <Typography
              variant="h6"
              noWrap
              sx={{ fontSize: { xs: 16, md: 20 } }}
            >
              {t.dateNotAvailable}
            </Typography>
          )}
        </Stack>

        <Typography
          variant="body2"
          sx={{
            fontSize: { xs: 14, md: 16 },
            color: "text.secondary",
            mb: 4,
          }}
        >
          {t.thankYou}
        </Typography>

        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={() =>
            router.replace(`/eventreg/event/${eventSlug}/register`)
          }
          startIcon={<ICONS.appRegister />}
          sx={{
            maxWidth: { xs: "100%", sm: 300 },
            fontSize: { xs: 16, md: 18 },
            p: "12px",
            fontWeight: "bold",
            borderRadius: 2,
            textTransform: "none",
            background: "primary.main",
            transition: "0.3s",
            "&:hover": {
              background: "secondary.main",
              transform: "scale(1.05)",
            },
            ...getStartIconSpacing(dir),
          }}
        >
          {t.registerNow}
        </Button>

        <Stack
          direction="row"
          spacing={dir === "ltr" ? 1 : 0}
          justifyContent="center"
          alignItems="center"
          mt={3}
        >
          <Box component="span" sx={{ display: "flex", color: "primary.main" }}>
            <ICONS.time fontSize="small" />
          </Box>
          {dir === "rtl" && (
            <Box
              component="span"
              sx={{
                width: "8px",
                display: "inline-block",
              }}
            />
          )}
          <Typography variant="caption" fontSize={14}>
            {t.takesSeconds}
          </Typography>
        </Stack>
      </Paper>
      <LanguageSelector top={20} right={20} />
    </Box>
  );
}
