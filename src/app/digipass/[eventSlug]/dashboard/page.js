"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  LinearProgress,
  Stack,
  IconButton,
  Card,
} from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { getDigipassEventBySlug } from "@/services/digipass/digipassEventService";
import ICONS from "@/utils/iconUtil";
import { useLanguage } from "@/contexts/LanguageContext";
import { pickFullName } from "@/utils/customFieldUtils";
import { QRCodeCanvas } from "qrcode.react";
import useDigiPassSocket from "@/hooks/modules/digipass/useDigiPassSocket";
import LanguageSelector from "@/components/LanguageSelector";
import { toArabicDigits } from "@/utils/arabicDigits";

export default function DigiPassDashboard() {
  const { eventSlug } = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const dir = isArabic ? "rtl" : "ltr";

  const t = {
    welcome: isArabic ? "مرحباً بك" : "Welcome",
    activities: isArabic ? "الأنشطة" : "Activities",
    leftOutOf: isArabic ? "متبقي من" : "left out of",
    soFar: isArabic ? "حتى الآن..." : "So Far So Good!",
    scanQrCode: isArabic ? "امسح رمز QR" : "Scan QR Code",
    allCompleted: isArabic
      ? "تم إكمال جميع الأنشطة"
      : "All activities completed",
    completed: isArabic ? "تم" : "Completed",
  };

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registration, setRegistration] = useState(null);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [maxTasksPerUser, setMaxTasksPerUser] = useState(null);
  const [isMuted] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    const fetchEvent = async () => {
      const result = await getDigipassEventBySlug(eventSlug);
      if (!result?.error) {
        setEvent(result);
        setMaxTasksPerUser(result.maxTasksPerUser || null);
      }
      setLoading(false);
    };
    fetchEvent();

    const storedRegistration = sessionStorage.getItem(
      `digipass_${eventSlug}_registration`,
    );
    if (storedRegistration) {
      try {
        const regData = JSON.parse(storedRegistration);
        setRegistration(regData);
        setTasksCompleted(regData.tasksCompleted || 0);
      } catch (err) {
        console.error("Error parsing registration data:", err);
      }
    }
  }, [eventSlug]);

  // Dynamic background (match DigiPass public/register pages)
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

  const handleTaskCompletedUpdate = useCallback(
    (data) => {
      if (data.tasksCompleted !== undefined) {
        setTasksCompleted(data.tasksCompleted);
        if (registration) {
          const updatedRegistration = {
            ...registration,
            tasksCompleted: data.tasksCompleted,
          };
          setRegistration(updatedRegistration);
          sessionStorage.setItem(
            `digipass_${eventSlug}_registration`,
            JSON.stringify(updatedRegistration),
          );
        }
      }
      if (data.maxTasks !== undefined) {
        setMaxTasksPerUser(data.maxTasks);
      }
    },
    [registration, eventSlug],
  );

  useDigiPassSocket({
    eventId: event?._id,
    registrationId: registration?._id,
    onTaskCompletedUpdate: handleTaskCompletedUpdate,
  });

  if (loading || !event) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
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
            }}
          />
        )}
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
        <CircularProgress />
      </Box>
    );
  }

  const userName = registration?.fullName
    ? registration.fullName
    : registration?.customFields
    ? pickFullName(registration.customFields)
    : null;
  const welcomeMessage = userName
    ? `${t.welcome}, ${userName}!`
    : `${t.welcome}!`;
  const token = registration?.token || "";
  const tasksLeft =
    maxTasksPerUser !== null && maxTasksPerUser !== undefined
      ? maxTasksPerUser - tasksCompleted
      : 0;
  const completedCounterRaw = `${tasksCompleted}/${maxTasksPerUser ?? 0}`;
  const completedCounter = isArabic
    ? toArabicDigits(completedCounterRaw, language)
    : completedCounterRaw;

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
      dir={dir}
    >
      {/* Background — absolute, covers full viewport */}
      {background && background.fileType === "image" && background.url && (
        <Box
          component="img"
          src={background.url}
          alt="Background"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 0,
          }}
        />
      )}
      {background?.fileType === "video" && background?.url && (
        <Box sx={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
          <video
            ref={videoRef}
            src={background.url}
            autoPlay
            playsInline
            loop
            muted={isMuted}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Box>
      )}

      {/* Back Button */}
      <IconButton
        onClick={() => router.push(`/digipass/${eventSlug}`)}
        sx={{
          position: "fixed",
          top: { xs: 10, sm: 20 },
          left: { xs: 10, sm: 20 },
          backgroundColor: "primary.main",
          color: "white",
          zIndex: 9999,
        }}
      >
        <ICONS.back sx={{ fontSize: { xs: 24, md: 32 } }} />
      </IconButton>

      {/* Language Selector */}
      <Box dir="ltr">
        <LanguageSelector top={20} right={20} />
      </Box>

      {/* ── Main content: welcome + progress image, padded away from the bottom card ── */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          px: 2,
          pt: { xs: "12vw", sm: "6vw", md: "3vw" },
          pb: "clamp(480px, 78vw, 600px)",
          gap: { xs: 1, sm: 1.5 },
        }}
      >
        {/* Welcome Text */}
        <Box
          sx={{
            flexShrink: 0,
            textAlign: "center",
            backgroundColor: "rgba(0,0,0,0.35)",
            borderRadius: "12px",
            px: { xs: "4vw", sm: "3vw", md: "2vw" },
            py: { xs: "1vw", sm: "0.8vw" },
            backdropFilter: "blur(4px)",
            maxWidth: "90vw",
          }}
        >
          <Typography
            sx={{
              color: "white",
              fontSize: "clamp(0.85rem, 4vw, 1.5rem)",
              fontWeight: 500,
              lineHeight: 1.2,
              textShadow: "0 1px 6px rgba(0,0,0,0.7)",
            }}
          >
            {t.welcome}
          </Typography>
          {userName && (
            <Typography
              sx={{
                color: "white",
                fontSize: "clamp(1rem, 5.5vw, 2rem)",
                fontWeight: "bold",
                lineHeight: 1.2,
                textShadow: "0 1px 6px rgba(0,0,0,0.7)",
              }}
            >
              {userName}
            </Typography>
          )}
        </Box>

        {/* Progress Image — takes all available space above the bottom card */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            position: "relative",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              position: "relative",
              height: "100%",
              maxHeight: "100%",
              maxWidth: "min(90vw, 380px)",
              width: "100%",
            }}
          >
            <Box
              component="img"
              src={event?.progressImageUrl || "/Brain.png"}
              alt="Progress"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
                filter: "grayscale(100%)",
              }}
            />
            {maxTasksPerUser !== null && maxTasksPerUser !== undefined && (
              <Box
                component="img"
                src={event?.progressImageUrl || "/Brain.png"}
                alt="Progress"
                sx={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  filter: "grayscale(0%)",
                  clipPath: `inset(${100 - (tasksCompleted / maxTasksPerUser) * 100}% 0 0 0)`,
                  transition: "clip-path 0.5s ease-in-out",
                }}
              />
            )}
          </Box>
        </Box>
      </Box>

      {/* Bottom sheet card — absolutely anchored to the bottom of the viewport */}
      <Paper
        elevation={6}
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 2,
          borderRadius: "24px 24px 0 0",
          backgroundColor: "white",
          px: { xs: 2, sm: 3 },
          pt: { xs: 1, sm: 1.5 },
          pb: { xs: 14, sm: 16 },
          display: "flex",
          flexDirection: "column",
          gap: { xs: 1.5, sm: 2 },
          boxShadow: "0 -4px 24px rgba(0,0,0,0.18)",
        }}
      >
        {/* QR Code */}
        {token && (
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Box
              sx={{
                "& canvas": {
                  width: "clamp(180px, 42vw, 260px) !important",
                  height: "auto !important",
                },
              }}
            >
              <QRCodeCanvas
                value={token}
                size={220}
                bgColor="#ffffff"
                fgColor="#000000"
                includeMargin
              />
            </Box>
          </Box>
        )}

        {/* Activities Title */}
        <Typography
          sx={{
            fontSize: "clamp(0.9rem, 4vw, 1.3rem)",
            fontWeight: "bold",
            color: "primary.main",
            lineHeight: 1.2,
            textAlign: "center",
          }}
        >
          {t.activities}
        </Typography>

        {/* Fire Icon + Progress Row */}
        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1.5 }}>
          {/* Fire Card */}
          <Card
            sx={{
              width: "clamp(56px, 16vw, 80px)",
              height: "clamp(50px, 14vw, 72px)",
              borderRadius: "10px",
              border: "2px solid",
              borderColor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 0.75,
              backgroundColor: "white",
              flexShrink: 0,
            }}
          >
            <Box
              component="img"
              src="/fire.png"
              alt="Fire"
              sx={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </Card>

          {/* Tasks + Bar + SoFar */}
          <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0.5 }}>
            {maxTasksPerUser !== null &&
              (tasksCompleted >= maxTasksPerUser ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <ICONS.checkCircle sx={{ fontSize: "clamp(1rem, 4vw, 1.4rem)", color: "#2E7D32" }} />
                  <Typography sx={{ fontSize: "clamp(0.8rem, 3.5vw, 1rem)", fontWeight: 700, color: "#FF6B35" }}>
                    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                      <Box component="span" sx={{ unicodeBidi: "isolate" }}>{t.completed}</Box>
                      <Box component="span" dir={isArabic ? "rtl" : "ltr"} sx={{ unicodeBidi: "isolate" }}>
                        ({completedCounter})
                      </Box>
                    </Box>
                  </Typography>
                </Box>
              ) : (
                <Typography sx={{ fontSize: "clamp(0.8rem, 3.5vw, 1rem)", fontWeight: 600, color: "primary.main" }}>
                  {tasksLeft} {t.leftOutOf} {maxTasksPerUser}
                </Typography>
              ))}

            {maxTasksPerUser !== null && maxTasksPerUser !== undefined && (
              <LinearProgress
                variant="determinate"
                value={(tasksCompleted / maxTasksPerUser) * 100}
                sx={{
                  height: 8,
                  borderRadius: "8px",
                  bgcolor: "#E0E0E0",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: "8px",
                    bgcolor: "primary.main",
                    transition: "transform 0.4s linear",
                  },
                }}
              />
            )}

            <Typography sx={{ fontSize: "clamp(0.7rem, 3vw, 0.875rem)", color: "#666" }}>
              {t.soFar}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
