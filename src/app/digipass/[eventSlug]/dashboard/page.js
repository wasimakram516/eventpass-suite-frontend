"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  LinearProgress,
  Stack,
  IconButton,
} from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import LanguageSelector from "@/components/LanguageSelector";
import { getDigipassEventBySlug } from "@/services/digipass/digipassEventService";
import ICONS from "@/utils/iconUtil";
import Background from "@/components/Background";
import { useLanguage } from "@/contexts/LanguageContext";
import { pickFullName } from "@/utils/customFieldUtils";
import { QRCodeCanvas } from "qrcode.react";
import useDigiPassSocket from "@/hooks/modules/digipass/useDigiPassSocket";

export default function DigiPassDashboard() {
  const { eventSlug } = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const dir = isArabic ? "rtl" : "ltr";

  const t = {
    welcome: isArabic ? "مرحباً بك" : "Welcome",
    dashboard: isArabic ? "لوحة التحكم" : "Dashboard",
    signedIn: isArabic ? "تم تسجيل الدخول بنجاح" : "Successfully signed in",
    thisIsADummyPage: isArabic
      ? "هذه صفحة تجريبية"
      : "This is a dummy page",
    activitiesCompleted: isArabic ? "الأنشطة المكتملة" : "Activities Completed",
  };

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registration, setRegistration] = useState(null);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [maxTasksPerUser, setMaxTasksPerUser] = useState(null);

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
      `digipass_${eventSlug}_registration`
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

  const handleTaskCompletedUpdate = useCallback((data) => {
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
          JSON.stringify(updatedRegistration)
        );
      }
    }
    if (data.maxTasks !== undefined) {
      setMaxTasksPerUser(data.maxTasks);
    }
  }, [registration, eventSlug]);

  useDigiPassSocket({
    eventId: event?._id,
    registrationId: registration?._id,
    onTaskCompletedUpdate: handleTaskCompletedUpdate,
  });

  const getImageBackground = useMemo(() => {
    if (!event || !event.background) return null;

    const langKey = language === "ar" ? "ar" : "en";
    const bg = event.background[langKey];

    if (bg && typeof bg === 'object' && bg.url && bg.fileType === "image") {
      return bg.url;
    }

    const otherLangKey = language === "ar" ? "en" : "ar";
    const otherBg = event.background[otherLangKey];
    if (otherBg && typeof otherBg === 'object' && otherBg.url && otherBg.fileType === "image") {
      return otherBg.url;
    }

    return null;
  }, [event, language]);

  const imageBackgroundUrl = getImageBackground;

  if (loading || !event) {
    return (
      <Box
        minHeight="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Background type="dynamic" />
        <CircularProgress />
      </Box>
    );
  }

  const { name, logoUrl } = event;
  const userName = registration?.customFields
    ? pickFullName(registration.customFields)
    : null;
  const welcomeMessage = userName
    ? `${t.welcome}, ${userName}!`
    : `${t.welcome}!`;
  const token = registration?.token || "";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        px: 2,
        py: 4,
        position: "relative",
        overflow: "hidden",
      }}
      dir={dir}
    >
      {/* Image Background */}
      {imageBackgroundUrl && (
        <Box
          component="img"
          src={imageBackgroundUrl}
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
      {!imageBackgroundUrl && <Background type="dynamic" />}

      <LanguageSelector top={20} right={20} />

      <IconButton
        size="small"
        onClick={() => router.push(`/digipass/${eventSlug}`)}
        sx={{
          position: "fixed",
          top: 20,
          left: 20,
          bgcolor: "primary.main",
          color: "white",
          zIndex: 1000,
          "&:hover": {
            bgcolor: "primary.dark",
          },
        }}
      >
        <ICONS.back />
      </IconButton>

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

      <Paper
        dir={dir}
        elevation={3}
        sx={{
          width: "100%",
          maxWidth: 600,
          borderRadius: 3,
          p: 4,
          textAlign: "center",
          backdropFilter: "blur(6px)",
          backgroundColor: "rgba(255,255,255,0.9)",
        }}
      >
        <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
          <Typography variant="h4" fontWeight="bold">
            {welcomeMessage}
          </Typography>

          {token && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: "#fff",
                display: "inline-block",
                boxShadow: 2,
              }}
            >
              <QRCodeCanvas
                value={token}
                size={200}
                bgColor="#ffffff"
                fgColor="#000000"
                includeMargin
                style={{
                  padding: "12px",
                  background: "#ffffff",
                  borderRadius: "8px",
                }}
              />
            </Box>
          )}

          {maxTasksPerUser !== null && maxTasksPerUser !== undefined && (
            <Box sx={{ width: "100%", maxWidth: 400 }}>
              <LinearProgress
                variant="determinate"
                value={(tasksCompleted / maxTasksPerUser) * 100}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  bgcolor: "rgba(0, 0, 0, 0.1)",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 6,
                    bgcolor: "#4caf50",
                    transition: "transform 0.4s linear",
                  },
                }}
              />
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
                sx={{ mt: 2 }}
              >
                <Box
                  sx={{
                    bgcolor: "#4caf50",
                    color: "white",
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    fontWeight: 600,
                    fontSize: "1.1rem",
                  }}
                >
                  {tasksCompleted}/{maxTasksPerUser}
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 500,
                    color: "text.primary",
                  }}
                >
                  {t.activitiesCompleted}
                </Typography>
              </Stack>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

