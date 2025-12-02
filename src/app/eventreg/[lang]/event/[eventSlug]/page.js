"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Typography, CircularProgress, IconButton, Button } from "@mui/material";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import HorizontalCarousel from "@/components/HorizontalCarousel";
import { getPublicEventBySlug } from "@/services/eventreg/eventService";
import { translateTexts } from "@/services/translationService";
import Background from "@/components/Background";
import EventWelcomeCard from "@/components/cards/EventWelcomeCard";
import ICONS from "@/utils/iconUtil";
import LanguageSelector from "@/components/LanguageSelector";

export default function EventDetails() {
  const { eventSlug, lang } = useParams();
  const router = useRouter();
  const isArabic = lang === "ar";
  const dir = isArabic ? "rtl" : "ltr";

  const t = {
    welcome: isArabic ? "مرحبًا في" : "Welcome to",
    thankYou: isArabic
      ? "شكرًا لانضمامك إلينا! يرجى التسجيل أدناه لتأمين مكانك."
      : "Thank you for joining us! Please register below to secure your place.",
    registerNow: isArabic ? "سجل الآن" : "Register Now",
    takesSeconds: isArabic ? "يستغرق فقط ٥ ثوانٍ!" : "Takes only 5 seconds!",
    dateNotAvailable: isArabic ? "التاريخ غير متوفر" : "Date not available",
    to: isArabic ? "إلى" : "to",
    showEventDetails: isArabic ? "عرض تفاصيل الحدث" : "Show Event Details",
  };

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [translatedEvent, setTranslatedEvent] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const fetchEvent = async () => {
      const result = await getPublicEventBySlug(eventSlug);
      if (!result?.error) {
        setEvent(result);
        await translateEventData(result, lang);
      } else {
        setError(result.message || "Event not found.");
      }
      setLoading(false);
    };
    fetchEvent();
  }, [eventSlug, lang]);

  const translateEventData = async (eventData, targetLang) => {
    try {
      // Collect all fields that need translation
      const textsToTranslate = [
        eventData.name || "",
        eventData.venue || "",
        eventData.description || "",
      ].filter(Boolean);

      // If target is English (default), skip translation
      if (!textsToTranslate.length) {
        setTranslatedEvent(eventData);
        return;
      }

      const results = await translateTexts(textsToTranslate, targetLang);

      // Map translations back to event fields
      const translated = {
        ...eventData,
        name: results[0] || eventData.name,
        venue: results[1] || eventData.venue,
        description: results[2] || eventData.description,
      };

      setTranslatedEvent(translated);
    } catch (err) {
      console.error("Translation error:", err);
      setTranslatedEvent(eventData);
    }
  };

  const brandingMedia = useMemo(() => event?.brandingMedia || [], [event]);

  // Get background based on language
  const getBackground = useMemo(() => {
    if (!event || !event.background) return null;

    const langKey = lang === "ar" ? "ar" : "en";
    const bg = event.background[langKey];

    if (bg && typeof bg === 'object' && bg.url && String(bg.url).trim() !== '') {
      let fileType = bg.fileType;
      if (!fileType) {
        const urlLower = String(bg.url).toLowerCase();
        if (urlLower.match(/\.(mp4|webm|ogg|mov|avi)$/)) {
          fileType = "video";
        } else {
          fileType = "image";
        }
      }
      return {
        url: bg.url,
        fileType: fileType,
      };
    }

    const otherLangKey = lang === "ar" ? "en" : "ar";
    const otherBg = event.background[otherLangKey];
    if (otherBg && typeof otherBg === 'object' && otherBg.url && String(otherBg.url).trim() !== '') {
      let fileType = otherBg.fileType;
      if (!fileType) {
        const urlLower = String(otherBg.url).toLowerCase();
        if (urlLower.match(/\.(mp4|webm|ogg|mov|avi)$/)) {
          fileType = "video";
        } else {
          fileType = "image";
        }
      }
      return {
        url: otherBg.url,
        fileType: fileType,
      };
    }

    if (event.backgroundUrl) {
      return {
        url: event.backgroundUrl,
        fileType: "image",
      };
    }

    return null;
  }, [event, lang]);

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

  const { name, description, venue, startDate, endDate, logoUrl } =
    translatedEvent || event;

  const background = getBackground;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        px: 2,
        py: { xs: 2, md: 4 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        position: "relative",
        zIndex: 0,
        overflow: "hidden",
      }}
    >
      {/* Image Background */}
      {background && background.fileType === "image" && background.url && (
        <Box
          component="img"
          src={background.url}
          alt="Event background"
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

      {/* Mute/Unmute Button for Video */}
      {background?.fileType === "video" && (
        <IconButton
          onClick={() => {
            setIsMuted(!isMuted);
            if (videoRef.current) {
              videoRef.current.muted = !isMuted;
            }
          }}
          sx={{
            position: "fixed",
            bottom: 20,
            right: 20,
            bgcolor: "rgba(0,0,0,0.5)",
            color: "white",
            zIndex: 1000,
            "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
          }}
        >
          {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
        </IconButton>
      )}

      {!background && <Background />}

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: "lg",
          minHeight: "calc(100vh - 80px)",
          gap: 3,
          zIndex: 1,
        }}
      >
        {logoUrl && (
          <Box
            sx={{
              width: { xs: "auto", sm: 320, md: 500 },
              maxWidth: { xs: "100%", sm: 320, md: 500 },
              maxHeight: { xs: 120, sm: "none" },
              borderRadius: 3,
              overflow: "hidden",
              boxShadow: 3,
              mt: { xs: 2, sm: 0 },
              display: "inline-block",
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
                maxHeight: { xs: 120, sm: "none" },
                maxWidth: { xs: "100%", sm: "none" },
                objectFit: "contain",
              }}
            />
          </Box>
        )}

        {/* Main details container */}
        {showEventDetails ? (
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
            actionRoute={`/${lang}/event/${eventSlug}/register`}
            isArabic={isArabic}
          />
        ) : (
          <Button
            variant="contained"
            size="large"
            onClick={() => setShowEventDetails(true)}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: { xs: 16, md: 18 },
              fontWeight: 600,
              borderRadius: 2,
              textTransform: "none",
            }}
          >
            {t.showEventDetails}
          </Button>
        )}

        {/* Branding media carousel */}
        {brandingMedia.length > 0 && (
          <Box sx={{ width: "100%", mb: { xs: 2, md: 0 } }}>
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
          </Box>
        )}
      </Box>

      <LanguageSelector top={20} right={20} />
    </Box>
  );
}
