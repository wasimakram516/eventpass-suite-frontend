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

  const userName = registration?.customFields
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
      {/* Base Background */}
      {background && background.fileType === "image" && background.url && (
        <Box
          component="img"
          src={background.url}
          alt="Background"
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 0,
          }}
        />
      )}
      {background?.fileType === "video" && background?.url && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 0,
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

      {/* Top 60% Section */}
      <Box
        sx={{
          height: "60%",
          width: "100%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          zIndex: 1,
        }}
      >
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
          <ICONS.back
            sx={{
              fontSize: { xs: 24, md: 32 },
            }}
          />
        </IconButton>

        {/* Welcome Text */}
        <Typography
          sx={{
            position: "absolute",
            top: { xs: "3vh", sm: "2.5vh", md: "2vh" },
            left: "50%",
            transform: "translateX(-50%)",
            color: "primary.main",
            fontSize: { xs: "6vw", sm: "5vw", md: "4.5vw" },
            fontWeight: "bold",
            zIndex: 100,
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          {welcomeMessage}
        </Typography>

        {/* Brain Image with Progress Reveal */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "45%",
            transform: "translate(-50%, -50%)",
            width: { xs: "95vw", sm: "85vw", md: "75vw" },
            maxWidth: "850px",
            zIndex: 3,
            overflow: "hidden",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: "100%",
            }}
          >
            {/* Grayscale Base Layer (Always Visible) */}
            <Box
              component="img"
              src="/Brain.png"
              alt="Brain"
              sx={{
                width: "100%",
                height: "auto",
                display: "block",
                objectFit: "contain",
                filter: "grayscale(100%)",
                position: "relative",
                zIndex: 1000,
              }}
            />
            {/* Colored Reveal Layer (Revealed from Bottom) */}
            {maxTasksPerUser !== null && maxTasksPerUser !== undefined ? (
              <Box
                component="img"
                src="/Brain.png"
                alt="Brain"
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "auto",
                  display: "block",
                  objectFit: "contain",
                  filter:
                    "grayscale(0%) drop-shadow(0 0 8px rgba(100, 181, 246, 0.9)) drop-shadow(0 0 15px rgba(100, 181, 246, 0.7))",
                  clipPath: `inset(${100 - (tasksCompleted / maxTasksPerUser) * 100}% 0 0 0)`,
                  transition: "clip-path 0.5s ease-in-out",
                  zIndex: 2,
                }}
              />
            ) : null}
          </Box>
        </Box>
      </Box>

      {/* Bottom 40% Card Section */}
      <Box
        sx={{
          height: "40%",
          width: "100%",
          position: "relative",
          zIndex: 0,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          px: 0,
          pt: { xs: "2vh", sm: "1.5vh", md: "1vh" },
          pb: { xs: "3vh", sm: "2.5vh", md: "2vh" },
        }}
      >
        <Paper
          elevation={3}
          sx={{
            width: "80%",
            height: "100%",
            borderRadius: { xs: "20px", sm: "25px", md: "30px" },
            backgroundColor: "white",
            p: { xs: "2.5vw", sm: "2vw", md: "1.5vw" },
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxSizing: "border-box",
          }}
        >
          {/* Activities Title */}
          <Typography
            sx={{
              fontSize: { xs: "4.5vw", sm: "3.8vw", md: "3vw" },
              fontWeight: "bold",
              color: "primary.main",
              mb: { xs: "1.2vh", sm: "1vh", md: "0.8vh" },
              lineHeight: 1.2,
              textAlign: "center",
            }}
          >
            {t.activities}
          </Typography>

          {/* Fire Icon and Progress Section Row — use flex gap so Arabic gets extra space */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: isArabic
                ? { xs: "2.5vw", sm: "2vw", md: "1.5vw" }
                : { xs: "2.5vw", sm: "2vw", md: "1.5vw" },
              mb: "2vh",
            }}
          >
            {/* Fire Icon Card */}
            <Card
              sx={{
                width: "25vw",
                height: "21vw",
                borderRadius: { xs: "10px", sm: "12px", md: "14px" },
                border: "2px solid",
                borderColor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: { xs: "1.2vw", sm: "1vw", md: "0.8vw" },
                backgroundColor: "white",
                flexShrink: 0,
              }}
            >
              <Box
                component="img"
                src="/fire.png"
                alt="Fire"
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            </Card>

            {/* Tasks Text, Progress Bar, and So Far Text */}
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Tasks Left Text */}
              {maxTasksPerUser !== null &&
                (tasksCompleted >= maxTasksPerUser ? (
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{
                      mb: { xs: "0.6vh", sm: "0.5vh", md: "0.4vh" },
                    }}
                  >
                    <ICONS.checkCircle
                      sx={{
                        fontSize: { xs: "5vw", sm: "4vw", md: "3vw" },
                        color: "#2E7D32",
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: { xs: "4vw", sm: "3.2vw", md: "2.4vw" },
                        fontWeight: "700",
                        lineHeight: 1.2,
                        color: "#FF6B35",
                      }}
                    >
                      Completed ({tasksCompleted}/{maxTasksPerUser})
                    </Typography>
                  </Stack>
                ) : (
                  <Typography
                    sx={{
                      fontSize: { xs: "4vw", sm: "3.2vw", md: "2.4vw" },
                      fontWeight: "600",
                      color: "primary.main",
                      mb: { xs: "0.6vh", sm: "0.5vh", md: "0.4vh" },
                      lineHeight: 1.2,
                    }}
                  >
                    {tasksLeft} {t.leftOutOf} {maxTasksPerUser}
                  </Typography>
                ))}

              {/* Progress Bar */}
              {maxTasksPerUser !== null && maxTasksPerUser !== undefined && (
                <Box
                  sx={{
                    width: "100%",
                    mb: { xs: "0.6vh", sm: "0.5vh", md: "0.4vh" },
                  }}
                >
                  <LinearProgress
                    variant="determinate"
                    value={(tasksCompleted / maxTasksPerUser) * 100}
                    sx={{
                      height: { xs: "1.5vh", sm: "1.3vh", md: "1.2vh" },
                      borderRadius: { xs: "8px", sm: "10px", md: "12px" },
                      bgcolor: "#E0E0E0",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: { xs: "8px", sm: "10px", md: "12px" },
                        bgcolor: "primary.main",
                        transition: "transform 0.4s linear",
                      },
                    }}
                  />
                </Box>
              )}

              {/* So Far Text */}
              <Typography
                sx={{
                  fontSize: { xs: "3.5vw", sm: "2.8vw", md: "2.2vw" },
                  color: "#666",
                  lineHeight: 1.2,
                }}
              >
                {t.soFar}
              </Typography>
            </Box>
          </Box>

          {/* QR Code Section */}
          {token && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mt: "2vh",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  "& canvas": {
                    width: { xs: "18vw", sm: "15vw", md: "12vw" },
                    height: "auto",
                    maxWidth: "116px",
                    maxHeight: "117px",
                  },
                }}
              >
                <QRCodeCanvas
                  value={token}
                  size={150}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  includeMargin
                />
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
      {/* Force LanguageSelector subtree to LTR so EN/AR toggle behaves correctly in Arabic */}
      <Box dir="ltr">
        <LanguageSelector top={20} right={20} />
      </Box>
    </Box>
  );
}
