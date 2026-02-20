"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Button,
  Stack,
} from "@mui/material";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import { getVoteCastEventBySlug } from "@/services/votecast/eventService";
import { translateTexts } from "@/services/translationService";
import Background from "@/components/Background";
import LanguageSelector from "@/components/LanguageSelector";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import AppCard from "@/components/cards/AppCard";
import { formatDateWithTime, formatTime } from "@/utils/dateUtils";
import { getEventBackground } from "@/utils/eventBackground";

export default function VoteCastEventWelcome() {
  const { eventSlug } = useParams();
  const router = useRouter();
  const { language: contextLanguage } = useLanguage();
  const { lang, language } = useI18nLayout();
  const currentLang = lang || language || contextLanguage || "en";
  const isArabic = currentLang === "ar";
  const dir = isArabic ? "rtl" : "ltr";

  const t = {
    proceed: isArabic ? "المتابعة" : "Proceed",
    eventNotFound: isArabic ? "الفعالية غير موجودة" : "Event not found",
    dateNotAvailable: isArabic ? "التاريخ غير متوفر" : "Date not available",
    to: isArabic ? "إلى" : "to",
  };

  const [event, setEvent] = useState(null);
  const [translatedEvent, setTranslatedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!event) return;
    const texts = [event.name, event.description, event.venue].filter(
      (v) => typeof v === "string" && String(v).trim() !== ""
    );
    if (!texts.length) {
      setTranslatedEvent(event);
      return;
    }
    const run = async () => {
      try {
        const results = await translateTexts(texts, currentLang);
        const map = {};
        texts.forEach((txt, i) => (map[txt] = results[i] ?? txt));
        setTranslatedEvent({
          ...event,
          name: map[event.name] ?? event.name,
          description: map[event.description] ?? event.description,
          venue: map[event.venue] ?? event.venue,
        });
      } catch (err) {
        console.error("Translation error:", err);
        setTranslatedEvent(event);
      }
    };
    run();
  }, [event, currentLang]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await getVoteCastEventBySlug(eventSlug);
        if (data?.error) {
          setError(data.error);
        } else {
          setEvent(data);
        }
      } catch (err) {
        setError(err.message || "Failed to load event");
      } finally {
        setLoading(false);
      }
    };

    if (eventSlug) {
      fetchEvent();
    }
  }, [eventSlug]);

  const getBackground = useMemo(() => {
    return getEventBackground(event, currentLang);
  }, [event, currentLang]);

  useEffect(() => {
    if (
      videoRef.current &&
      getBackground?.fileType === "video" &&
      getBackground?.url
    ) {
      videoRef.current.load();
    }
  }, [getBackground]);

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
        <Typography color="error" variant="h6">
          {error || t.eventNotFound}
        </Typography>
      </Box>
    );
  }

  const displayEvent = translatedEvent || event;
  const {
    name,
    description,
    logoUrl,
    venue,
    startDate,
    endDate,
    startTime,
    endTime,
    timezone,
  } = displayEvent;
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
          key={`bg-image-${currentLang}-${background.url}`}
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
          key={`bg-video-${currentLang}-${background.url}`}
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
            key={`video-${currentLang}-${background.url}`}
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

      {!background && <Background key={`bg-default-${currentLang}`} />}

      {/* Event Logo - Moved to top of screen */}
      {logoUrl && (
        <Box
          sx={{
            height: { xs: 90, sm: 120 },
            width: "100%",
            maxWidth: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mt: 1,
            zIndex: 1,
          }}
        >
          <Box
            component="img"
            src={logoUrl}
            alt={`${name} Logo`}
            sx={{
              maxHeight: "100%",
              width: "100%",
              objectFit: "contain",
            }}
          />
        </Box>
      )}

      <Box
        sx={{
          flex: 1,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
        }}
      >
        <AppCard
          dir={dir}
          sx={{
            width: "100%",
            maxWidth: 800,
            textAlign: "center",
            p: 4,

            /* Glass effect */
            background: "rgba(255, 255, 255, 0.65)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.35)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          }}
        >
          {/* Title */}
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{
              fontSize: { xs: 28, md: 36 },
              color: "primary.main",
              letterSpacing: "1.5px",
              mb: 2,
            }}
          >
            {name}
          </Typography>

          {/* Description */}
          {description && (
            <Box
              sx={{
                fontSize: { xs: 16, md: 18 },
                color: "text.secondary",
                mb: 3,
                "& h1": {
                  fontSize: "2em",
                  fontWeight: "bold",
                  margin: "0.67em 0",
                },
                "& h2": {
                  fontSize: "1.5em",
                  fontWeight: "bold",
                  margin: "0.75em 0",
                },
                "& h3": {
                  fontSize: "1.17em",
                  fontWeight: "bold",
                  margin: "0.83em 0",
                },
                "& ul, & ol": { margin: "1em 0", paddingLeft: "2.5em" },
                "& ul": { listStyleType: "disc" },
                "& ol": { listStyleType: "decimal" },
                "& li": { margin: "0.5em 0" },
                "& p": { margin: "1em 0" },
                "& strong, & b": { fontWeight: "bold" },
                "& em, & i": { fontStyle: "italic" },
                "& u": { textDecoration: "underline" },
                "& s, & strike": { textDecoration: "line-through" },
              }}
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}

          {/* Venue */}
          {venue && (
            <Stack
              direction="row"
              spacing={dir === "ltr" ? 1 : 0}
              justifyContent="center"
              alignItems="center"
              flexWrap="wrap"
            >
              <ICONS.location
                color="primary"
                sx={{
                  ...(dir === "rtl" ? { ml: 1 } : { ml: 0 }),
                }}
              />
              <Typography variant="h6" sx={{ fontSize: { xs: 16, md: 20 } }}>
                {venue}
              </Typography>
            </Stack>
          )}

          {/* Dates */}
          {(startDate || endDate) && (
            <Stack
              direction="row"
              spacing={dir === "ltr" ? 1 : 0}
              justifyContent="center"
              alignItems="center"
              flexWrap="wrap"
              sx={{ my: 2 }}
            >
              <ICONS.event
                color="primary"
                sx={{
                  ...(dir === "rtl" ? { ml: 1 } : { ml: 0 }),
                }}
              />
              {startDate && endDate ? (
                startDate === endDate ? (
                  <Typography
                    variant="h6"
                    sx={{ fontSize: { xs: 16, md: 20 } }}
                  >
                    {formatDateWithTime(
                      startDate,
                      startTime || null,
                      isArabic ? "ar-SA" : "en-GB",
                      timezone || null,
                    )}
                    {startTime && endTime && startTime !== endTime && (
                      <>
                        {" "}
                        -{" "}
                        {formatTime(
                          endTime,
                          isArabic ? "ar-SA" : "en-GB",
                          timezone || null,
                          startDate,
                        )}
                      </>
                    )}
                  </Typography>
                ) : (
                  <Typography
                    variant="h6"
                    sx={{ fontSize: { xs: 16, md: 20 } }}
                  >
                    {`${formatDateWithTime(
                      startDate,
                      startTime || null,
                      isArabic ? "ar-SA" : "en-GB",
                      timezone || null,
                    )} ${t.to} ${formatDateWithTime(
                      endDate,
                      endTime || null,
                      isArabic ? "ar-SA" : "en-GB",
                      timezone || null,
                    )}`}
                  </Typography>
                )
              ) : startDate ? (
                <Typography variant="h6" sx={{ fontSize: { xs: 16, md: 20 } }}>
                  {formatDateWithTime(
                    startDate,
                    startTime || null,
                    isArabic ? "ar-SA" : "en-GB",
                    timezone || null,
                  )}
                </Typography>
              ) : (
                <Typography variant="h6" sx={{ fontSize: { xs: 16, md: 20 } }}>
                  {t.dateNotAvailable}
                </Typography>
              )}
            </Stack>
          )}

          {/* Proceed Button */}
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push(`/votecast/${eventSlug}/vote`)}
              startIcon={<ICONS.next />}
              sx={{
                transition: "0.3s",
                ...getStartIconSpacing(dir),
              }}
            >
              {t.proceed}
            </Button>
          </Box>
        </AppCard>
      </Box>

      <LanguageSelector top={20} right={20} />
    </Box>
  );
}
