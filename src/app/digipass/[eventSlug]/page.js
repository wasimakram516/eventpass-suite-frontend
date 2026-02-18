"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Container,
  Stack,
  Card,
} from "@mui/material";
import { getDigipassEventBySlug } from "@/services/digipass/digipassEventService";
import ICONS from "@/utils/iconUtil";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

export default function DigiPassEventDetails() {
  const { eventSlug } = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const dir = isArabic ? "rtl" : "ltr";

  const t = {
    register: isArabic ? "التسجيل" : "Register",
    signIn: isArabic ? "تسجيل الدخول" : "Sign in",
  };

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMuted] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    const fetchEvent = async () => {
      const result = await getDigipassEventBySlug(eventSlug);
      if (!result?.error) {
        setEvent(result);
      } else {
        setError(result.message || "Event not found.");
      }
      setLoading(false);
    };
    fetchEvent();
  }, [eventSlug]);

  // Background selection logic (mirrors EventReg public page)
  const background = useMemo(() => {
    if (!event || !event.background) return null;

    const langKey = language === "ar" ? "ar" : "en";
    const bg = event.background[langKey];

    const resolveFileType = (url, explicitType) => {
      if (explicitType) return explicitType;
      const urlLower = String(url || "").toLowerCase();
      if (urlLower.match(/\.(mp4|webm|ogg|mov|avi)$/)) {
        return "video";
      }
      return "image";
    };

    if (bg && typeof bg === "object" && bg.url && String(bg.url).trim() !== "") {
      return {
        url: bg.url,
        fileType: resolveFileType(bg.url, bg.fileType),
      };
    }

    const otherLangKey = language === "ar" ? "en" : "ar";
    const otherBg = event.background[otherLangKey];
    if (
      otherBg &&
      typeof otherBg === "object" &&
      otherBg.url &&
      String(otherBg.url).trim() !== ""
    ) {
      return {
        url: otherBg.url,
        fileType: resolveFileType(otherBg.url, otherBg.fileType),
      };
    }

    if (event.backgroundUrl) {
      return {
        url: event.backgroundUrl,
        fileType: "image",
      };
    }

    return null;
  }, [event, language]);

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

  const { logoUrl } = event;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 4, sm: 6, md: 8 },
        overflow: "hidden",
      }}
    >
      {/* Image Background */}
      {background && background.fileType === "image" && background.url && (
        <Box
          component="img"
          src={background.url}
          alt="Background"
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: -1,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Video Background */}
      {background?.fileType === "video" && background?.url && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: -1,
            overflow: "hidden",
          }}
        >
          <video
            ref={videoRef}
            src={background.url}
            autoPlay
            playsInline
            loop
            muted={isMuted}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </Box>
      )}
      <Container
        maxWidth="sm"
        dir={dir}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 1,
          width: "100%",
        }}
      >
        {/* Card */}
        <Card
          sx={{
            width: "100%",
            maxWidth: 600,
            borderRadius: 3,
            p: 4,
            textAlign: "center",
            backdropFilter: "blur(6px)",
            backgroundColor: "rgba(255,255,255,0.9)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            gap: { xs: 3, sm: 4, md: 5 },
          }}
        >
          {/* Event Logo */}
          {logoUrl && (
            <Box
              sx={{
                width: "100%",
                maxWidth: { xs: 220, sm: 280, md: 350 },
                height: "auto",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Box
                component="img"
                src={logoUrl}
                alt="Event Logo"
                sx={{
                  width: "100%",
                  height: "auto",
                  maxHeight: { xs: 150, sm: 200, md: 250 },
                  objectFit: "cover",
                }}
              />
            </Box>
          )}

          <Stack
            direction={{ xs: "column", sm: "row" }}
            sx={{
              width: "100%",
              mt: { xs: 2, sm: 3 },
              columnGap: 2,
              rowGap: 2,
            }}
          >
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<ICONS.register />}
              onClick={() => {
                router.push(`/digipass/${eventSlug}/register`);
              }}
              sx={{
                flex: { sm: 1 },
                ...getStartIconSpacing(dir),
                "&:hover": {
                  borderColor: "primary.dark",
                  backgroundColor: "rgba(25,118,210,0.04)",
                },
              }}
            >
              {t.register}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<ICONS.login />}
              onClick={() => {
                router.push(`/digipass/${eventSlug}/signin`);
              }}
              sx={{
                flex: { sm: 1 },
                ...getStartIconSpacing(dir),
                "&:hover": {
                  borderColor: "primary.dark",
                  backgroundColor: "rgba(25,118,210,0.04)",
                },
              }}
            >
              {t.signIn}
            </Button>
          </Stack>
        </Card>
      </Container>

      {/* Force LanguageSelector subtree to LTR so EN/AR toggle behaves correctly in Arabic */}
      <Box dir="ltr">
        <LanguageSelector top={20} right={20} />
      </Box>
    </Box>
  );
}
