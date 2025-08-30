"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
import { printZpl } from "@/utils/printZpl";
import { useMessage } from "@/contexts/MessageContext";

const translations = {
  en: {
    startVerification: "Start Verification",
    scanMessage:
      "Tap the button below to scan a QR code and verify registration.",
    openScanner: "Open Scanner",
    cancel: "Cancel",
    verifying: "Verifying registration...",
    verified: "Registration Verified",
    name: "Name",
    company: "Company",
    event: "Event",
    scanAnother: "Scan Another",
    tryAgain: "Try Again",
    printBadge: "Print Badge",
    printing: "Printing...",
    tooltip: {
      openScanner: "Open QR Scanner",
      cancel: "Cancel scanning",
      scan: "Scan another code",
      retry: "Retry verification",
      print: "Send badge to Zebra printer",
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
    printBadge: "طباعة الشارة",
    printing: "جارٍ الطباعة...",
    tooltip: {
      openScanner: "افتح الماسح الضوئي",
      cancel: "إلغاء المسح",
      scan: "مسح رمز آخر",
      retry: "إعادة المحاولة",
      print: "إرسال الشارة إلى طابعة Zebra",
    },
  },
};

export default function VerifyPage() {
  const { t, dir } = useI18nLayout(translations);
  const { showMessage } = useMessage();
  const [showScanner, setShowScanner] = useState(false);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [printing, setPrinting] = useState(false);

  const successAudioRef = useRef(null);
  const errorAudioRef = useRef(null);

  useEffect(() => {
    const iv = setInterval(() => {
      if (typeof window !== "undefined" && window.BrowserPrint) {
        clearInterval(iv);
        window.BrowserPrint.getDefaultDevice(
          "printer",
          (d) =>
            showMessage(
              d ? `Printer ready: ${d.name}` : "No default Zebra printer",
              d ? "success" : "warning"
            ),
          () => showMessage("Browser Print not responding", "error")
        );
      }
    }, 250);
    return () => clearInterval(iv);
  }, []);

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
    setPrinting(false);
  };

  const handlePrint = async () => {
    try {
      if (!result?.zpl) throw new Error("No ZPL received from server");
      setPrinting(true);
      await printZpl(result.zpl);
      showMessage("Badge sent to printer successfully", "success");
    } catch (e) {
      showMessage(e?.message || "Printing failed", "error");
    } finally {
      setPrinting(false);
    }
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

            {!!result.company && (
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

          {/* Print Badge */}
          <Tooltip title={t.tooltip.print}>
            <span>
              <Button
                variant="contained"
                color="primary"
                startIcon={<ICONS.print />}
                onClick={handlePrint}
                disabled={printing || !result?.zpl}
                sx={{ mt: 1, ...getStartIconSpacing(dir) }}
              >
                {printing ? t.printing : t.printBadge}
              </Button>
            </span>
          </Tooltip>

          <Tooltip title={t.tooltip.scan}>
            <Button
              variant="outlined"
              startIcon={<ICONS.qrCodeScanner />}
              onClick={reset}
              sx={{ mt: 2, ...getStartIconSpacing(dir) }}
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
