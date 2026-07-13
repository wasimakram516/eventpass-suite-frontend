"use client";

import { alpha, useTheme } from "@mui/material/styles";
import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Box, Button, CircularProgress, Paper, Typography } from "@mui/material";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";
import ICONS from "@/utils/iconUtil";
import Background from "@/components/Background";
import { verifyPayment } from "@/services/eventreg/paymentService";
import BadgeCard from "@/components/badges/BadgeCard";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

export default function PaymentSuccessPage() {
  const { eventSlug } = useParams();
  const searchParams = useSearchParams();
  const registrationId = searchParams.get("registration_id");
  const urlLang = searchParams.get("lang") || "en";
  const theme = useTheme();
  const { language, setLanguage } = useLanguage();

  // Seed context from URL param on first load
  useEffect(() => {
    if (urlLang && urlLang !== language) setLanguage(urlLang);
  }, []);

  const isArabic = language === "ar";
  const lang = language;
  const dir = isArabic ? "rtl" : "ltr";

  const t = {
    verifying: isArabic ? "جارٍ التحقق من الدفع..." : "Verifying your payment...",
    verifyingNote: isArabic ? "يرجى الانتظار لحظة" : "This will only take a moment",
    successTitle: isArabic ? "تم الدفع بنجاح!" : "Payment Successful!",
    successMessage: isArabic
      ? "تم تأكيد تسجيلك. نتطلع إلى رؤيتك!"
      : "Your registration is confirmed. We look forward to seeing you!",
    emailNote: isArabic
      ? "تم إرسال بريد تأكيد يتضمن تفاصيل تذكرتك إلى صندوق الوارد الخاص بك"
      : "A confirmation email with your ticket details has been sent to your inbox",
    backToEvent: isArabic ? "العودة إلى الفعالية" : "Back to Event",
    downloadBadge: isArabic ? "تحميل الشارة" : "Download Badge",
    errorTitle: isArabic ? "فشل التحقق من الدفع" : "Verification Failed",
    errorMessage: isArabic
      ? "لم نتمكن من التحقق من دفعتك. يرجى التواصل مع الدعم."
      : "We could not verify your payment. Please contact support if you believe this is an error.",
    backAndRetry: isArabic ? "العودة والمحاولة مجدداً" : "Go Back",
    missingId: isArabic ? "معرّف التسجيل مفقود." : "Registration ID is missing.",
    scanLabel: isArabic ? "امسح عند الدخول للتحقق من الهوية" : "Show or scan at the entrance to check in",
    // BadgeCard keys
    badgeTitle: isArabic ? "شارتك" : "Your Badge",
    attendee: isArabic ? "المشترك" : "Attendee",
    ticket: isArabic ? "التذكرة" : "Ticket",
    date: isArabic ? "التاريخ" : "Date",
    venue: isArabic ? "المكان" : "Venue",
    token: isArabic ? "الرمز" : "Token",
    poweredBy: isArabic ? "مدعوم بواسطة" : "Powered by",
    noName: isArabic ? "حضور" : "Attendee",
    noTicket: isArabic ? "حضور" : "Attendee",
    eventRegFilter: isArabic ? "تسجيل الحدث" : "Event Reg",
    checkInFilter: isArabic ? "تسجيل الدخول" : "Check-In",
  };

  const [status, setStatus] = useState("loading");
  const [token, setToken] = useState(null);
  const [registrationData, setRegistrationData] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const badgeRef = useRef(null);
  const qrRef = useRef(null);

  useEffect(() => {
    if (!registrationId) {
      setStatus("error");
      setErrorMessage(t.missingId);
      return;
    }

    const verify = async () => {
      const result = await verifyPayment(registrationId);
      if (!result?.error && result?.status === "paid") {
        setToken(result.token);
        setRegistrationData(result.registration || null);
        setEventData(result.event || null);
        setStatus("success");
      } else {
        setErrorMessage(result?.message || t.errorMessage);
        setStatus("error");
      }
    };

    verify();
  }, [registrationId]);

  const handleDownloadBadge = async () => {
    const el = badgeRef.current;
    if (!el) return;
    try {
      const canvas = await html2canvas(el, {
        backgroundColor: null,
        useCORS: true,
        scale: Math.max(window.devicePixelRatio || 1, 2),
        logging: false,
      });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `badge-${token || "ticket"}.png`;
      link.click();
    } catch (err) {
      console.error("Badge download failed:", err);
    }
  };

  return (
    <>
      <LanguageSelector top={20} right={20} />
      <Box
        dir={dir}
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          py: 4,
          position: "relative",
        }}
      >
        <Background />

        {/* ── Loading ── */}
        {status === "loading" && (
          <Box sx={{ maxWidth: 460, width: "100%", position: "relative", zIndex: 1 }}>
            <Paper
              elevation={6}
              sx={{
                borderRadius: 4, p: 6, textAlign: "center",
                backgroundColor: (theme) => theme.palette.overlay.cardExtraHeavy,
              }}
            >
              <Box
                sx={{
                  width: 80, height: 80, borderRadius: "50%",
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  mx: "auto", mb: 3,
                }}
              >
                <CircularProgress size={40} thickness={4} />
              </Box>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>{t.verifying}</Typography>
              <Typography variant="body2" color="text.secondary">{t.verifyingNote}</Typography>
            </Paper>
          </Box>
        )}

        {/* ── Success ── */}
        {status === "success" && (
          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              width: "100%",
              maxWidth: { xs: 480, md: 960 },
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: { xs: 3, md: 4 },
              alignItems: { xs: "stretch", md: "flex-start" },
            }}
          >
            {/* ── Left: success info ── */}
            <Box
              sx={{
                flex: "1 1 0", minWidth: 0,
                display: "flex", flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                pt: { xs: 0, md: 2 },
              }}
            >
              {/* Icon + title */}
              <Box sx={{ textAlign: "center", width: "100%" }}>
                <Box
                  sx={{
                    width: 72, height: 72, borderRadius: "50%",
                    background: (theme) => theme.palette.gradients.successHeader,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    mb: 2, mx: "auto",
                    boxShadow: (theme) => theme.palette.shadow.successIcon,
                  }}
                >
                  <ICONS.checkCircle sx={{ fontSize: 42, color: "common.white" }} />
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ mb: 1, color: "text.primary", letterSpacing: -0.5 }}>
                  {t.successTitle}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, maxWidth: 360, mx: "auto", textAlign: "center" }}>
                  {t.successMessage}
                </Typography>
              </Box>

              {/* Email notice */}
              <Box
                sx={{
                  display: "flex", alignItems: "flex-start", gap: 1.5,
                  backgroundColor: (theme) => alpha(theme.palette.success.main, 0.08),
                  border: (theme) => `1px solid ${alpha(theme.palette.success.main, 0.25)}`,
                  borderRadius: 2, px: 2, py: 1.5, width: "100%",
                }}
              >
                <ICONS.emailOutline sx={{ fontSize: 19, color: (theme) => theme.palette.success.icon, flexShrink: 0, mt: 0.1 }} />
                <Typography
                  variant="caption"
                  sx={{
                    lineHeight: 1.6,
                    color: (theme) => theme.palette.success.icon,
                  }}
                >
                  {t.emailNote}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%" }}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<ICONS.download />}
                  onClick={handleDownloadBadge}
                  sx={{
                    py: 1.5, fontWeight: 700,
                    textTransform: "none", fontSize: "0.95rem",
                    backgroundColor: "success.main", "&:hover": { backgroundColor: "success.dark" },
                    ...getStartIconSpacing(dir),
                  }}
                >
                  {t.downloadBadge}
                </Button>
                <Button
                  variant="outlined"
                  href={`/eventreg/${lang}/event/${eventSlug}`}
                  fullWidth
                  size="large"
                  startIcon={<ICONS.back />}
                  sx={{
                    py: 1.5, fontWeight: 700,
                    textTransform: "none", fontSize: "0.95rem",
                    borderColor: theme.palette.success.border, color: theme.palette.success.border,
                    "&:hover": { backgroundColor: theme.palette.success.light, borderColor: theme.palette.success.hover },
                    ...getStartIconSpacing(dir),
                  }}
                >
                  {t.backToEvent}
                </Button>
              </Box>
            </Box>

            {/* ── Right: badge ── */}
            <Box
              sx={{
                flex: "1 1 0", minWidth: 0,
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 2,
              }}
            >
              {/* Hidden QR for download */}
              <Box sx={{ display: "none" }} ref={qrRef}>
                {token && (
                  <QRCodeCanvas value={token} size={180} bgColor={theme.palette.qr.background} includeMargin />
                )}
              </Box>

              <Box ref={badgeRef} sx={{ width: "100%", maxWidth: 430 }}>
                <BadgeCard
                  registration={registrationData || { token, fullName: null, customFields: {}, ticketTypeName: null }}
                  event={eventData || { name: eventSlug }}
                  module={eventData?.module || "eventreg"}
                  qrRef={qrRef}
                  t={t}
                  compact={false}
                />
              </Box>

            </Box>
          </Box>
        )}

        {/* ── Error ── */}
        {status === "error" && (
          <Box sx={{ maxWidth: 460, width: "100%", position: "relative", zIndex: 1 }}>
            <Paper
              elevation={6}
              sx={{
                borderRadius: 4, overflow: "hidden",
                backgroundColor: (theme) =>
                  theme.palette.overlay.cardOpaque,

              }}
            >
              <Box
                sx={{
                  background: (theme) => theme.palette.gradients.errorHeader, px: 4, pt: 4.5, pb: 5,
                  textAlign: "center", color: "common.white",
                }}
              >
                <Box
                  sx={{
                    width: 84, height: 84, borderRadius: "50%",
                    backgroundColor: (theme) => theme.palette.overlay.whiteGlassLight,
                    border: (theme) =>
                      `2.5px solid ${theme.palette.overlay.whiteGlassBorderLight}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    mx: "auto", mb: 2.5,
                  }}
                >
                  <ICONS.errorOutline sx={{ fontSize: 50, color: "common.white" }} />
                </Box>
                <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>{t.errorTitle}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.88, lineHeight: 1.6, maxWidth: 320, mx: "auto" }}>
                  {errorMessage || t.errorMessage}
                </Typography>
              </Box>
              <Box sx={{ px: 4, pt: 4, pb: 4 }}>
                <Button
                  variant="outlined"
                  color="error"
                  href={`/eventreg/${lang}/event/${eventSlug}`}
                  fullWidth
                  size="large"
                  startIcon={<ICONS.back />}
                  sx={{ py: 1.5, fontWeight: 700, textTransform: "none", fontSize: "0.95rem", ...getStartIconSpacing(dir) }}
                >
                  {t.backAndRetry}
                </Button>
              </Box>
            </Paper>
          </Box>
        )}
      </Box>
    </>
  );
}
