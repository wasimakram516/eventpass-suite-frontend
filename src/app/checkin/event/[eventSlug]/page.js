"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Alert,
  Stack,
} from "@mui/material";

import { getCheckInEventBySlug } from "@/services/checkin/checkinEventService";
import {
  getCheckInRegistrationByToken,
  confirmCheckInPresence,
} from "@/services/checkin/checkinRegistrationService";
import LanguageSelector from "@/components/LanguageSelector";
import useI18nLayout from "@/hooks/useI18nLayout";
import Background from "@/components/Background";
import EventWelcomeCard from "@/components/cards/EventWelcomeCard";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { formatDateWithShortMonth } from "@/utils/dateUtils";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";

export default function EventDetails() {
  const { eventSlug } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const { t, dir } = useI18nLayout({
    en: {
      welcome: "Welcome",
      welcomeTo: "Welcome to",
      thankYou:
        "Thank you for joining us! Please confirm your presence using the link provided in your invitation.",
      confirmPresence: "Confirm Your Presence",
      confirming: "Confirming...",
      presenceConfirmed: "Your presence has been confirmed!",
      alreadyConfirmed: "Your presence is already confirmed.",
      takesSeconds: "Takes only 5 seconds!",
      dateNotAvailable: "Date not available",
      to: "to",
      registrationNotFound: "Registration not found. Please check your link.",
      failedToConfirm: "Failed to confirm presence. Please try again.",
      confirmPresenceTitle: "Confirm Your Presence",
      confirmPresenceMessage:
        "Are you sure you want to confirm your presence for this event? This action will update your registration status.",
      confirmButton: "Yes, Confirm",
      cancelButton: "Cancel",
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
      takesSeconds: "يستغرق فقط 5 ثوانٍ!",
      dateNotAvailable: "التاريخ غير متوفر",
      to: "إلى",
      registrationNotFound: "التسجيل غير موجود. يرجى التحقق من الرابط.",
      failedToConfirm: "فشل تأكيد الحضور. يرجى المحاولة مرة أخرى.",
      confirmPresenceTitle: "أكد حضورك",
      confirmPresenceMessage:
        "هل أنت متأكد أنك تريد تأكيد حضورك لهذا الحدث؟ سيتم تحديث حالة تسجيلك.",
      confirmButton: "نعم، أكد",
      cancelButton: "إلغاء",
    },
  });

  const handleConfirmPresenceClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmPresence = async () => {
    if (!token) return;
    setShowConfirmModal(false);
    setConfirming(true);
    setRegistrationError("");
    setJustConfirmed(false);
    try {
      const result = await confirmCheckInPresence(token);
      if (!result?.error) {
        setConfirmed(true);
        setJustConfirmed(true);
        setRegistration((prev) =>
          prev ? { ...prev, approvalStatus: "confirmed" } : null
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

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [registration, setRegistration] = useState(null);
  const [loadingRegistration, setLoadingRegistration] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [justConfirmed, setJustConfirmed] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const eventFetchedRef = useRef(null);
  const registrationFetchedRef = useRef(null);

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
          // Check if already confirmed
          if (result.registration.approvalStatus === "confirmed") {
            setConfirmed(true);
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
      <Background />

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
                  backgroundColor: "background.paper",
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
                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: { xs: 16, md: 18 },
                      color: "text.secondary",
                      mb: 3,
                    }}
                  >
                    {description}
                  </Typography>
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

                {/* Confirmation status */}
                {confirmed ? (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    {justConfirmed ? t.presenceConfirmed : t.alreadyConfirmed}
                  </Alert>
                ) : (
                  <>
                    {registrationError && (
                      <Alert severity="error" sx={{ mb: 3 }}>
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
          />
        )}
      </Box>

      <LanguageSelector top={20} right={20} />

      {/* Confirmation Modal */}
      <ConfirmationDialog
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmPresence}
        title={t.confirmPresenceTitle}
        message={t.confirmPresenceMessage}
        confirmButtonText={t.confirmButton}
        confirmButtonIcon={<ICONS.checkCircle />}
        confirmButtonColor="success"
      />
    </Box>
  );
}
