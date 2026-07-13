"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Box, Paper, Typography, CircularProgress, Button } from "@mui/material";
import ICONS from "@/utils/iconUtil";
import Background from "@/components/Background";
import { cancelPayment } from "@/services/eventreg/paymentService";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { alpha, useTheme } from "@mui/material/styles";
export default function PaymentCancelPage() {
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
    cancelling: isArabic ? "جارٍ إلغاء الدفع..." : "Cancelling payment...",
    cancellingNote: isArabic ? "يرجى الانتظار لحظة" : "Please wait a moment",
    cancelledTitle: isArabic ? "تم إلغاء الدفع" : "Payment Cancelled",
    cancelledMessage: isArabic
      ? "لم تتم عملية الدفع. لم يتم خصم أي مبلغ من حسابك."
      : "Your payment was not completed. No charges have been made to your account.",
    safeNote: isArabic
      ? "يمكنك إعادة المحاولة في أي وقت — تذكرتك لا تزال متاحة"
      : "You can try again anytime — your spot may still be available",
    tryAgain: isArabic ? "المحاولة مرة أخرى" : "Try Again",
    backToEvent: isArabic ? "العودة إلى الفعالية" : "Back to Event",
  };

  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!registrationId) {
      setStatus("cancelled");
      return;
    }

    const cancel = async () => {
      await cancelPayment(registrationId);
      setStatus("cancelled");
    };

    cancel();
  }, [registrationId]);

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

        <Box sx={{ maxWidth: 460, width: "100%", position: "relative", zIndex: 1 }}>

          {/* ── Loading ── */}
          {status === "loading" && (
            <Paper
              elevation={6}
              sx={{
                borderRadius: 4,
                p: 6,
                textAlign: "center",
                backgroundColor: (theme) => theme.palette.overlay.cardExtraHeavy,
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  backgroundColor: (theme) => alpha(theme.palette.warning.main, 0.1),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 3,
                }}
              >
                <CircularProgress size={40} thickness={4} color="warning" />
              </Box>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                {t.cancelling}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t.cancellingNote}
              </Typography>
            </Paper>
          )}

          {/* ── Cancelled ── */}
          {status === "cancelled" && (
            <Paper
              elevation={6}
              sx={{
                borderRadius: 4, overflow: "hidden",
                backgroundColor: (theme) => theme.palette.overlay.cardOpaque,
              }}
            >
              {/* Amber header */}
              <Box
                sx={{
                  background: (theme) => theme.palette.gradients.warningHeader, px: 4,
                  pt: 4.5,
                  pb: 5,
                  textAlign: "center",
                  color: "common.white",
                }}
              >
                <Box
                  sx={{
                    width: 84,
                    height: 84,
                    borderRadius: "50%",
                    backgroundColor: (theme) => theme.palette.overlay.whiteGlass,
                    border: (theme) =>
                      `2.5px solid ${theme.palette.overlay.whiteGlassBorder}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 2.5,
                  }}
                >
                  <ICONS.cancel sx={{ fontSize: 50, color: "common.white" }} />
                </Box>
                <Typography variant="h5" fontWeight={800} sx={{ mb: 1, letterSpacing: -0.5 }}>
                  {t.cancelledTitle}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.88, lineHeight: 1.6, maxWidth: 300, mx: "auto" }}>
                  {t.cancelledMessage}
                </Typography>
              </Box>

              {/* Ticket-stub separator */}
              <Box sx={{ position: "relative", height: 2, mx: 0, overflow: "visible" }}>
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: "7%",
                    right: "7%",
                    borderTop: "2px dashed",
                    borderColor: "divider",
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    top: -14,
                    left: -14,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    backgroundColor: "background.default",
                    boxShadow: (theme) => theme.palette.shadow.insetSm,
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    top: -14,
                    right: -14,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    backgroundColor: "background.default",
                    boxShadow: (theme) => theme.palette.shadow.insetSm,
                  }}
                />
              </Box>

              {/* Body */}
              <Box sx={{ px: 4, pt: 4, pb: 4 }}>
                {/* Safe note */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.5,
                    backgroundColor: (theme) => theme.palette.overlay.warningCard, border: (theme) => `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                    borderRadius: 2,
                    px: 2,
                    py: 1.5,
                    mb: 3.5,
                  }}
                >
                  <ICONS.help sx={{ fontSize: 19, color: "warning.main", flexShrink: 0, mt: 0.1 }} />
                  <Typography variant="caption" color="text.primary" sx={{ lineHeight: 1.6 }}>
                    {t.safeNote}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  href={`/eventreg/${lang}/event/${eventSlug}/register`}
                  fullWidth
                  size="large"
                  startIcon={<ICONS.refresh />}
                  sx={{
                    borderRadius: 2.5,
                    py: 1.5,
                    fontWeight: 700,
                    textTransform: "none",
                    fontSize: "0.95rem",
                    mb: 1.5,
                    backgroundColor: "warning.main",
                    "&:hover": { backgroundColor: "warning.dark" },
                    ...getStartIconSpacing(dir),
                  }}
                >
                  {t.tryAgain}
                </Button>

                <Button
                  variant="outlined"
                  href={`/eventreg/${lang}/event/${eventSlug}`}
                  fullWidth
                  size="large"
                  startIcon={<ICONS.back />}
                  sx={{
                    borderRadius: 2.5,
                    py: 1.5,
                    fontWeight: 600,
                    textTransform: "none",
                    fontSize: "0.95rem",
                    borderColor: "divider",
                    color: "text.secondary",
                    "&:hover": { borderColor: "text.secondary", backgroundColor: "action.hover" },
                    ...getStartIconSpacing(dir),
                  }}
                >
                  {t.backToEvent}
                </Button>
              </Box>
            </Paper>
          )}

        </Box>
      </Box>
    </>
  );
}
