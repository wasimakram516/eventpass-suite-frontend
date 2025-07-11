"use client";

import { useState, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Stack,
  Tooltip,
} from "@mui/material";

import QrScanner from "@/components/QrScanner";
import { verifyRegistrationByToken } from "@/services/eventreg/registrationService";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

const translations = {
  en: {
    startVerification: "Start Verification",
    scanMessage: "Tap the button below to scan a QR code and verify registration.",
    openScanner: "Open Scanner",
    cancel: "Cancel",
    verifying: "Verifying registration...",
    verified: "Registration Verified",
    name: "Name",
    company: "Company",
    event: "Event",
    scanAnother: "Scan Another",
    tryAgain: "Try Again",
    tooltip: {
      openScanner: "Open QR Scanner",
      cancel: "Cancel scanning",
      scan: "Scan another code",
      retry: "Retry verification",
    },
  },
  ar: {
    startVerification: "ابدأ التحقق",
    scanMessage: "اضغط على الزر أدناه لمسح رمز QR والتحقق من التسجيل.",
    openScanner: "افتح الماسح الضوئي",
    cancel: "إلغاء",
    verifying: "جارٍ التحقق من التسجيل...",
    verified: "تم التحقق من التسجيل",
    name: "الاسم",
    company: "الشركة",
    event: "الفعالية",
    scanAnother: "مسح رمز آخر",
    tryAgain: "حاول مرة أخرى",
    tooltip: {
      openScanner: "افتح الماسح الضوئي",
      cancel: "إلغاء المسح",
      scan: "مسح رمز آخر",
      retry: "إعادة المحاولة",
    },
  },
};

export default function VerifyPage() {
  const { t, dir } = useI18nLayout(translations);

  const [showScanner, setShowScanner] = useState(false);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const successAudioRef = useRef(null);
  const errorAudioRef = useRef(null);

  const handleScanSuccess = useCallback(async (scannedToken) => {
    setShowScanner(false);
    setToken(scannedToken);
    setLoading(true);
    setError(null);
    setResult(null);

    const res = await verifyRegistrationByToken(scannedToken);

    if (res?.error) {
      errorAudioRef.current?.play();
      setError(res.message || "Invalid token.");
    } else {
      successAudioRef.current?.play();
      setResult(res);
    }

    setLoading(false);
  }, []);

  const reset = () => {
    setToken(null);
    setResult(null);
    setError(null);
    setShowScanner(false);
  };

  return (
    <Box
      dir={dir}
      p={3}
      maxWidth={500}
      mx="auto"
      minHeight="90vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      {/* Initial Button */}
      {!token && !showScanner && !loading && !result && !error && (
        <Box textAlign="center" my={4}>
          <Stack spacing={2} alignItems="center">
            <Typography variant="h6" fontWeight={600}>
              {t.startVerification}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t.scanMessage}
            </Typography>
            <Tooltip title={t.tooltip.openScanner}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<ICONS.qrCodeScanner />}
                onClick={() => {
                  setShowScanner(true);
                  setError(null);
                  setResult(null);
                }}
                sx={getStartIconSpacing(dir)}
              >
                {t.openScanner}
              </Button>
            </Tooltip>
          </Stack>
        </Box>
      )}

      {/* QR Scanner */}
      {showScanner && (
        <Box>
          <QrScanner
            onScanSuccess={handleScanSuccess}
            onError={(err) => {
              console.error("QR Error", err);
              setError(err?.toString() || "Camera error. Try again.");
              setShowScanner(false);
            }}
            onCancel={() => setShowScanner(false)}
          />
          <Box textAlign="center" mt={2}>
            <Tooltip title={t.tooltip.cancel}>
              <Button
                variant="text"
                color="error"
                startIcon={<ICONS.close />}
                onClick={() => setShowScanner(false)}
                sx={getStartIconSpacing(dir)}
              >
                {t.cancel}
              </Button>
            </Tooltip>
          </Box>
        </Box>
      )}

      {/* Loading */}
      {loading && (
        <Stack spacing={2} alignItems="center" mt={5}>
          <CircularProgress />
          <Typography variant="body2">{t.verifying}</Typography>
        </Stack>
      )}

      {/* Success */}
      {result && (
        <Stack spacing={3} alignItems="center" textAlign="center" mt={5}>
          <ICONS.checkCircle sx={{ fontSize: 64, color: "success.main" }} />
          <Typography variant="h2" color="success.main">
            {t.verified}
          </Typography>

          <Stack spacing={2} width="100%" maxWidth={400}>
            <Stack direction="row" spacing={2} alignItems="center">
              <ICONS.person sx={{ color: "text.secondary" }} />
              <Typography variant="body1" fontWeight={500}>
                {t.name}:
              </Typography>
              <Typography variant="body1">{result.fullName}</Typography>
            </Stack>

            {result.company && (
              <Stack direction="row" spacing={2} alignItems="center">
                <ICONS.business sx={{ color: "text.secondary" }} />
                <Typography variant="body1" fontWeight={500}>
                  {t.company}:
                </Typography>
                <Typography variant="body1">{result.company}</Typography>
              </Stack>
            )}

            <Stack direction="row" spacing={2} alignItems="center">
              <ICONS.event sx={{ color: "text.secondary" }} />
              <Typography variant="body1" fontWeight={500}>
                {t.event}:
              </Typography>
              <Typography variant="body1">{result.eventName}</Typography>
            </Stack>
          </Stack>

          <Tooltip title={t.tooltip.scan}>
            <Button
              variant="contained"
              startIcon={<ICONS.qrCodeScanner />}
              onClick={reset}
              sx={{ mt: 4, ...getStartIconSpacing(dir) }}
            >
              {t.scanAnother}
            </Button>
          </Tooltip>
        </Stack>
      )}

      {/* Error */}
      {error && (
        <Stack spacing={2} alignItems="center" textAlign="center" mt={5}>
          <ICONS.errorOutline sx={{ fontSize: 64, color: "error.main" }} />
          <Typography variant="h6" color="error.main">
            {error}
          </Typography>
          <Tooltip title={t.tooltip.retry}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<ICONS.replay />}
              onClick={reset}
              sx={getStartIconSpacing(dir)}
            >
              {t.tryAgain}
            </Button>
          </Tooltip>
        </Stack>
      )}

      <audio ref={successAudioRef} src="/correct.wav" preload="auto" />
      <audio ref={errorAudioRef} src="/wrong.wav" preload="auto" />
    </Box>
  );
}
