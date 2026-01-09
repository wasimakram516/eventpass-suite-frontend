"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
} from "@mui/material";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import { QRCodeCanvas } from "qrcode.react";

import { getCheckInEventBySlug } from "@/services/checkin/checkinEventService";
import {
  getCheckInRegistrationByToken,
  confirmCheckInPresence,
  updateCheckInAttendanceStatus,
} from "@/services/checkin/checkinRegistrationService";
import LanguageSelector from "@/components/LanguageSelector";
import useI18nLayout from "@/hooks/useI18nLayout";
import Background from "@/components/Background";
import EventWelcomeCard from "@/components/cards/EventWelcomeCard";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { formatDateWithShortMonth } from "@/utils/dateUtils";

export default function EventDetails() {
  const { eventSlug } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const { t, dir, language } = useI18nLayout({
    en: {
      welcome: "Welcome",
      welcomeTo: "Welcome to",
      thankYou:
        "Thank you for joining us! Please confirm your attendance using the link provided in your invitation.",
      confirmPresence: "Confirm Your Attendance",
      confirming: "Confirming...",
      presenceConfirmed: "Your attendance has been confirmed!",
      alreadyConfirmed: "Your attendance is already confirmed.",
      attendanceNotConfirmed: "You have marked your attendance as not attending.",
      alreadyNotConfirmed: "Your attendance is already marked as not attending.",
      takesSeconds: "Takes only 5 seconds!",
      dateNotAvailable: "Date not available",
      to: "to",
      registrationNotFound: "Registration not found. Please check your link.",
      failedToConfirm: "Failed to confirm attendance. Please try again.",
      confirmPresenceTitle: "Confirm Your Attendance",
      confirmPresenceMessage:
        "Kindly confirm that you are planning to attend. Don't worry, you can always inform the organizer if your plans change. For any further information, please don't hesitate to contact the organizer.",
      confirmButton: "Confirmed",
      notConfirmedButton: "Not Attending",
      cancelButton: "Cancel",
      downloadQr: "Download QR Code",
      contactOrganizer: "Please contact the organizer for more information",
      organizerContact: "Organizer Contact",
    },
    ar: {
      welcome: "مرحباً",
      welcomeTo: "مرحبًا في",
      thankYou:
        "شكرًا لانضمامك إلينا! يرجى تأكيد حضورك باستخدام الرابط المقدم في دعوتك.",
      confirmPresence: "أكد حضورك",
      confirming: "جاري التأكيد...",
      presenceConfirmed: "تم تأكيد حضورك!",
      alreadyConfirmed: "تم تأكيد حضورك مسبقاً.",
      attendanceNotConfirmed: "لقد قمت بتحديد حضورك على أنه غير مؤكد.",
      alreadyNotConfirmed: "تم تحديد حضورك بالفعل على أنه غير مؤكد.",
      takesSeconds: "يستغرق فقط 5 ثوانٍ!",
      dateNotAvailable: "التاريخ غير متوفر",
      to: "إلى",
      registrationNotFound: "التسجيل غير موجود. يرجى التحقق من الرابط.",
      failedToConfirm: "فشل تأكيد الحضور. يرجى المحاولة مرة أخرى.",
      confirmPresenceTitle: "أكد حضورك",
      confirmPresenceMessage:
        "يرجى تأكيد أنك تخطط للحضور، لا تقلق يمكنك دائمًا إبلاغ المنظم إذا تغيرت خططك، لمزيد من المعلومات لا تتردد في الاتصال بالمنظم.",
      confirmButton: "مؤكد",
      notConfirmedButton: "غير مؤكد",
      cancelButton: "إلغاء",
      downloadQr: "تحميل رمز الاستجابة السريعة",
      contactOrganizer: "يرجى الاتصال بالمنظم للحصول على مزيد من المعلومات",
      organizerContact: "جهة اتصال المنظم",
    },
  });

  const handleConfirmPresenceClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmAttendance = async (status) => {
    if (!token) return;
    setShowConfirmModal(false);
    setConfirming(true);
    setRegistrationError("");
    setJustConfirmed(false);
    setJustNotConfirmed(false);
    try {
      const result = await updateCheckInAttendanceStatus(token, status);
      if (!result?.error) {
        setConfirmed(status === "confirmed");
        setNotConfirmed(status === "not_attending");
        if (status === "confirmed") {
          setJustConfirmed(true);
        } else if (status === "not_attending") {
          setJustNotConfirmed(true);
        }
        setRegistration((prev) =>
          prev ? { ...prev, approvalStatus: status } : null
        );
      } else {
        setRegistrationError(result.message || t.failedToConfirm);
      }
    } catch (err) {
      setRegistrationError(t.failedToConfirm);
    } finally {
      setConfirming(false);
    }
  };

  const handleConfirm = () => {
    handleConfirmAttendance("confirmed");
  };

  const handleNotConfirmed = () => {
    handleConfirmAttendance("not_attending");
  };

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [registration, setRegistration] = useState(null);
  const [loadingRegistration, setLoadingRegistration] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [notConfirmed, setNotConfirmed] = useState(false);
  const [justConfirmed, setJustConfirmed] = useState(false);
  const [justNotConfirmed, setJustNotConfirmed] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const eventFetchedRef = useRef(null);
  const registrationFetchedRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (eventFetchedRef.current === eventSlug) return;
    eventFetchedRef.current = eventSlug;

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

  // Fetch registration if token is present
  useEffect(() => {
    if (!token || !event) return;
    const cacheKey = `${token}-${event._id}`;
    if (registrationFetchedRef.current === cacheKey) return;
    registrationFetchedRef.current = cacheKey;

    const fetchRegistration = async () => {
      setLoadingRegistration(true);
      setRegistrationError("");
      try {
        const result = await getCheckInRegistrationByToken(token);
        if (!result?.error) {
          setRegistration(result.registration);
          // Check if already confirmed or not confirmed
          if (result.registration.approvalStatus === "confirmed") {
            setConfirmed(true);
          } else if (result.registration.approvalStatus === "not_attending") {
            setNotConfirmed(true);
          }
        } else {
          setRegistrationError(result.message || "Registration not found.");
        }
      } catch (err) {
        setRegistrationError("Failed to load registration.");
      } finally {
        setLoadingRegistration(false);
      }
    };
    fetchRegistration();
  }, [token, event?._id]);

  // Get background based on language
  const getBackground = useMemo(() => {
    if (!event || !event.background) return null;

    const langKey = language === "ar" ? "ar" : "en";
    const bg = event.background[langKey];

    if (
      bg &&
      typeof bg === "object" &&
      bg.url &&
      String(bg.url).trim() !== ""
    ) {
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

    const otherLangKey = language === "ar" ? "en" : "ar";
    const otherBg = event.background[otherLangKey];
    if (
      otherBg &&
      typeof otherBg === "object" &&
      otherBg.url &&
      String(otherBg.url).trim() !== ""
    ) {
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

  const { name, venue, startDate, endDate, logoUrl, description } = event;
  const isArabic = dir === "rtl";
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
          justifyContent: "center",
          position: "relative",
          width: "100%",
          maxWidth: "lg",
          minHeight: "calc(100vh - 80px)",
          gap: 2,
          zIndex: 1,
        }}
      >
        {/* Logo shown outside the card */}
        {logoUrl && (
          <Box
            sx={{
              width: { xs: "100%" },
              maxWidth: { xs: 300, sm: 400, md: 500 },
              height: "auto",
              maxHeight: { xs: 120, sm: "none" },
              borderRadius: 3,
              overflow: "hidden",
              boxShadow: 3,
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
                objectFit: "cover",
              }}
            />
          </Box>
        )}

        {/* Main welcome card */}
        {token ? (
          <Box
            sx={{
              width: "100%",
              maxWidth: 800,
              textAlign: "center",
              px: 2,
            }}
          >
            {loadingRegistration ? (
              <CircularProgress />
            ) : registrationError ? (
              <Alert severity="error">{registrationError}</Alert>
            ) : registration ? (
              <Box
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.85)", // semi-transparent white
                  borderRadius: 3,
                  p: 4,
                  boxShadow: 3,
                }}
              >
                {/* Welcome message with name */}
                <Typography
                  variant="h3"
                  fontWeight="bold"
                  sx={{
                    fontSize: { xs: 32, md: 48 },
                    color: "primary.main",
                    mb: 2,
                  }}
                >
                  {t.welcome} {registration.fullName || "Guest"}!
                </Typography>

                {/* Event name */}
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  sx={{
                    fontSize: { xs: 24, md: 32 },
                    color: "text.primary",
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
                      "& h1": { fontSize: "2em", fontWeight: "bold", margin: "0.67em 0" },
                      "& h2": { fontSize: "1.5em", fontWeight: "bold", margin: "0.75em 0" },
                      "& h3": { fontSize: "1.17em", fontWeight: "bold", margin: "0.83em 0" },
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
                <Stack
                  direction="row"
                  spacing={dir === "ltr" ? 1 : 0}
                  justifyContent="center"
                  alignItems="center"
                  flexWrap="wrap"
                  sx={{ mb: 2 }}
                >
                  <ICONS.location
                    color="primary"
                    sx={{
                      ...(dir === "rtl" ? { ml: 1 } : { ml: 0 }),
                    }}
                  />
                  <Typography variant="h6" sx={{ fontSize: { xs: 16, md: 20 } }}>
                    {venue || t.dateNotAvailable}
                  </Typography>
                </Stack>

                {/* Dates */}
                <Stack
                  direction="row"
                  spacing={dir === "ltr" ? 1 : 0}
                  justifyContent="center"
                  alignItems="center"
                  flexWrap="wrap"
                  sx={{ mb: 3 }}
                >
                  <ICONS.event
                    color="primary"
                    sx={{
                      ...(dir === "rtl" ? { ml: 1 } : { ml: 0 }),
                    }}
                  />
                  {startDate && endDate ? (
                    startDate === endDate ? (
                      <Typography variant="h6" sx={{ fontSize: { xs: 16, md: 20 } }}>
                        {formatDateWithShortMonth(
                          startDate,
                          isArabic ? "ar-SA" : "en-GB"
                        )}
                      </Typography>
                    ) : (
                      <Typography variant="h6" sx={{ fontSize: { xs: 16, md: 20 } }}>
                        {`${formatDateWithShortMonth(
                          startDate,
                          isArabic ? "ar-SA" : "en-GB"
                        )} ${t.to} ${formatDateWithShortMonth(
                          endDate,
                          isArabic ? "ar-SA" : "en-GB"
                        )}`}
                      </Typography>
                    )
                  ) : (
                    <Typography variant="h6" sx={{ fontSize: { xs: 16, md: 20 } }}>
                      {t.dateNotAvailable}
                    </Typography>
                  )}
                </Stack>

                {/* Organizer Contact Details */}
                {(event?.organizerName || event?.organizerEmail || event?.organizerPhone) && (
                  <Box
                    sx={{
                      width: "100%",
                      mt: 3,
                      mb: 2,
                      p: 2,
                      backgroundColor: "rgba(0, 74, 173, 0.05)",
                      borderRadius: 2,
                      border: "1px solid rgba(0, 74, 173, 0.1)",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        mb: 1.5,
                        textAlign: "center",
                        color: "text.secondary",
                        fontSize: { xs: 14, md: 15 },
                      }}
                    >
                      {t.contactOrganizer}
                    </Typography>
                    <Stack spacing={1.5} alignItems="center">
                      {event.organizerName && (
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{
                            fontSize: { xs: 16, md: 18 },
                            fontWeight: 600,
                            color: "primary.main",
                          }}
                        >
                          <ICONS.person fontSize="small" color="primary" />
                          <Typography
                            variant="h6"
                            sx={{
                              fontSize: { xs: 16, md: 18 },
                              fontWeight: 600,
                              color: "primary.main",
                            }}
                          >
                            {event.organizerName}
                          </Typography>
                        </Stack>
                      )}
                      {event.organizerEmail && (
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{
                            fontSize: { xs: 14, md: 16 },
                            color: "text.primary",
                          }}
                        >
                          <ICONS.email fontSize="small" color="primary" />
                          <Typography
                            sx={{
                              color: "primary.main",
                            }}
                          >
                            {event.organizerEmail}
                          </Typography>
                        </Stack>
                      )}
                      {event.organizerPhone && (
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{
                            fontSize: { xs: 14, md: 16 },
                            color: "text.primary",
                          }}
                        >
                          <ICONS.phone fontSize="small" color="primary" />
                          <Typography
                            sx={{
                              color: "primary.main",
                            }}
                          >
                            {event.organizerPhone}
                          </Typography>
                        </Stack>
                      )}
                    </Stack>
                  </Box>
                )}

                {/* QR Code (hidden, used for download) */}
                {registration?.token && (
                  <Box sx={{ display: "none" }}>
                    <QRCodeCanvas
                      id="qr-code-checkin"
                      value={registration.token}
                      size={180}
                      bgColor="#ffffff"
                      includeMargin
                    />
                  </Box>
                )}

                {/* Confirmation status */}
                <Stack spacing={2} alignItems="center" sx={{ width: "100%" }}>
                  {confirmed ? (
                    <Alert severity="success" sx={{ mb: 0, width: "100%" }}>
                      {justConfirmed ? t.presenceConfirmed : t.alreadyConfirmed}
                    </Alert>
                  ) : notConfirmed ? (
                    <Alert severity="error" sx={{ mb: 0, width: "100%" }}>
                      {justNotConfirmed ? t.attendanceNotConfirmed : t.alreadyNotConfirmed}
                    </Alert>
                  ) : (
                    <>
                      {registrationError && (
                        <Alert severity="error" sx={{ mb: 0, width: "100%" }}>
                          {registrationError}
                        </Alert>
                      )}
                      <Button
                        variant="contained"
                        size="large"
                        onClick={handleConfirmPresenceClick}
                        disabled={confirming}
                        startIcon={<ICONS.checkCircle />}
                        sx={{
                          fontSize: { xs: 16, md: 18 },
                          p: "12px 32px",
                          fontWeight: "bold",
                          borderRadius: 2,
                          textTransform: "none",
                          ...getStartIconSpacing(dir),
                        }}
                      >
                        {t.confirmPresence}
                      </Button>
                    </>
                  )}

                  {/* Download QR button (appears in all cases when token exists) */}
                  {registration?.token && (
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<ICONS.download />}
                      onClick={() => {
                        const canvas = document.getElementById("qr-code-checkin");
                        if (canvas) {
                          const pngUrl = canvas
                            .toDataURL("image/png")
                            .replace("image/png", "image/octet-stream");

                          const link = document.createElement("a");
                          link.href = pngUrl;
                          link.download = `qr-${registration.token}.png`;
                          link.click();
                        }
                      }}
                      sx={{
                        fontSize: { xs: 16, md: 18 },
                        p: "12px 32px",
                        fontWeight: "bold",
                        borderRadius: 2,
                        textTransform: "none",
                        ...getStartIconSpacing(dir),
                      }}
                    >
                      {t.downloadQr}
                    </Button>
                  )}
                </Stack>
              </Box>
            ) : null}
          </Box>
        ) : (
          // Regular event view (no token)
          <EventWelcomeCard
            t={t}
            name={name}
            description={description}
            venue={venue}
            startDate={startDate}
            endDate={endDate}
            router={router}
            dir={dir}
            actionLabel={t.confirmPresence}
            actionIcon={<ICONS.checkCircle />}
            actionRoute={`/checkin/event/${eventSlug}`}
            hideActionButton={true}
            isArabic={isArabic}
            organizerName={event?.organizerName}
            organizerEmail={event?.organizerEmail}
            organizerPhone={event?.organizerPhone}
            contactOrganizer={t.contactOrganizer}
          />
        )}
      </Box>

      <LanguageSelector top={20} right={20} />

      {/* Confirmation Modal */}
      <Dialog
        open={showConfirmModal}
        onClose={confirming ? null : () => setShowConfirmModal(false)}
        dir={dir}
        disableScrollLock={true}
        PaperProps={{
          sx: {
            borderRadius: 2,
            padding: 2,
            maxWidth: "500px",
            width: "100%",
            backgroundColor: "#f9fafb",
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: "bold",
            fontSize: "1.5rem",
            color: "#333",
            textAlign: "center",
            position: "relative",
            pb: 1,
          }}
        >
          <IconButton
            onClick={() => setShowConfirmModal(false)}
            disabled={confirming}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 36,
              height: 36,
              color: "text.secondary",
              "&:hover": {
                backgroundColor: "action.hover",
              },
            }}
          >
            <ICONS.close sx={{ fontSize: 22 }} />
          </IconButton>
          {t.confirmPresenceTitle}
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              textAlign: "center",
              margin: "1rem 0",
            }}
          >
            <DialogContentText
              sx={{
                fontSize: "1rem",
                color: "#555",
                lineHeight: 1.6,
              }}
            >
              {t.confirmPresenceMessage}
            </DialogContentText>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 2,
            paddingBottom: "1rem",
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Button
            onClick={handleNotConfirmed}
            variant="outlined"
            color="error"
            disabled={confirming}
            startIcon={<ICONS.cancel />}
            sx={{
              fontWeight: "bold",
              textTransform: "uppercase",
              padding: "0.5rem 2rem",
              ...getStartIconSpacing(dir),
            }}
          >
            {t.notConfirmedButton}
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color="success"
            disabled={confirming}
            startIcon={
              confirming ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <ICONS.checkCircle />
              )
            }
            sx={{
              fontWeight: "bold",
              textTransform: "uppercase",
              padding: "0.5rem 2rem",
              ...getStartIconSpacing(dir),
            }}
          >
            {t.confirmButton}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
