"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Stack,
  Tooltip,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
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
    manualVerification: "Manual Verification",
    manualInstructions:
      "Enter the token manually, or place the cursor in the field and scan with a connected QR code scanner.",
    enterToken: "Enter Token",
    verify: "Verify",
    checkPrinter: "Check Printer Status",
    openScanner: "Open Scanner",
    cancel: "Cancel",
    verifying: "Verifying registration...",
    verified: "Registration Verified",
    token: "Token",
    name: "Name",
    company: "Company",
    title: "Title",
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
    manualVerification: "التحقق اليدوي",
    manualInstructions:
      "أدخل الرمز يدويًا، أو ضع المؤشر داخل الحقل وامسح باستخدام جهاز ماسح QR متصل.",
    enterToken: "أدخل الرمز",
    verify: "تحقق",
    checkPrinter: "تحقق من حالة الطابعة",
    openScanner: "افتح الماسح الضوئي",
    cancel: "إلغاء",
    verifying: "جارٍ التحقق من التسجيل...",
    verified: "تم التحقق من التسجيل",
    token: "الرمز",
    name: "الاسم",
    company: "الشركة",
    title: "المسمى الوظيفي",
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
  const [manualMode, setManualMode] = useState(false);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [printing, setPrinting] = useState(false);

  const successAudioRef = useRef(null);
  const errorAudioRef = useRef(null);

  // useEffect(() => {
  //   if (typeof window !== "undefined" && window.BrowserPrint) {
  //     window.BrowserPrint.getDefaultDevice(
  //       "printer",
  //       (d) => {
  //         if (d) {
  //           showMessage(`Printer ready: ${d.name}`, "success");
  //         } else {
  //           showMessage("No default Zebra printer", "warning");
  //         }
  //       },
  //       () => showMessage("Browser Print not responding", "error")
  //     );
  //   }
  // }, [showMessage]);

  const checkPrinter = () => {
    if (typeof window !== "undefined" && window.BrowserPrint) {
      window.BrowserPrint.getDefaultDevice(
        "printer",
        (d) => {
          if (d) {
            showMessage(`Printer ready: ${d.name}`, "success");
          } else {
            showMessage("No default Zebra printer", "warning");
          }
        },
        () => showMessage("Browser Print not responding", "error")
      );
    } else {
      showMessage("Browser Print not available in this browser", "error");
    }
  };

  const doVerify = useCallback(async (inputToken) => {
    let trimmed = inputToken.trim();

    // If the token contains "#BARCODE", extract token after it, like this https://meira.glueup.com/event/2025-meira-annual-conference-137620/#BARCODE00001-U5J7ZB
    const marker = "#BARCODE";
    if (trimmed.includes(marker)) {
      trimmed = trimmed.split(marker).pop();
    }

    // If it's a full URL but no #BARCODE, still try to extract last segment
    if (trimmed.startsWith("http")) {
      const hashIndex = trimmed.indexOf("#BARCODE");
      if (hashIndex >= 0) {
        trimmed = trimmed.substring(hashIndex + marker.length);
      } else {
        // fallback: take everything after last slash
        trimmed = trimmed.split("/").pop();
      }
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const res = await verifyRegistrationByToken(trimmed);
    if (res?.error) {
      errorAudioRef.current?.play();
      setError(res.message || "Invalid token.");
    } else {
      successAudioRef.current?.play();
      setResult(res);
    }

    setLoading(false);
  }, []);

  const handleScanSuccess = useCallback(
    async (scannedValue) => {
      setShowScanner(false);

      let extractedToken = scannedValue;

      // If the scanned value contains "#BARCODE", extract token after it, like this https://meira.glueup.com/event/2025-meira-annual-conference-137620/#BARCODE00001-U5J7ZB
      const marker = "#BARCODE";
      if (scannedValue.includes(marker)) {
        extractedToken = scannedValue.split(marker).pop(); // get text after #BARCODE
      }

      setToken(extractedToken);
      await doVerify(extractedToken);
    },
    [doVerify]
  );

  const reset = () => {
    setToken("");
    setResult(null);
    setError(null);
    setShowScanner(false);
    setManualMode(false);
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
      {/* Initial Options */}
      {!showScanner && !loading && !result && !error && (
        <Box textAlign="center" my={4} width="100%">
          <Stack spacing={2} alignItems="center">
            <Typography variant="h6" fontWeight={600}>
              {t.startVerification}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t.scanMessage}
            </Typography>

            {!manualMode ? (
              <>
                {/* Open Scanner CTA */}
                <Tooltip title={t.tooltip.openScanner}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<ICONS.qrCodeScanner />}
                    onClick={() => setShowScanner(true)}
                    sx={getStartIconSpacing(dir)}
                    fullWidth
                  >
                    {t.openScanner}
                  </Button>
                </Tooltip>

                {/* Manual Verification CTA */}
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<ICONS.key />}
                  onClick={() => {
                    setManualMode(true);
                    setToken("");
                  }}
                  fullWidth
                >
                  {t.manualVerification}
                </Button>

                {/* Check Printer CTA */}
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<ICONS.print />}
                  onClick={checkPrinter}
                  fullWidth
                >
                  {t.checkPrinter}
                </Button>
              </>
            ) : (
              <>
                {/* Manual Mode Instructions */}
                <Typography
                  variant="body2"
                  sx={{ mb: 1 }}
                  color="text.secondary"
                >
                  {t.manualInstructions}
                </Typography>

                <Stack direction="row" spacing={1} width="100%" maxWidth={350}>
                  <TextField
                    fullWidth
                    label={t.enterToken}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && token.trim().length === 10) {
                        doVerify(token);
                      }
                    }}
                  />

                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<ICONS.check />}
                    disabled={token.trim().length === 0}
                    onClick={() => doVerify(token)}
                    sx={{ ...getStartIconSpacing(dir), minWidth: 120, mx: 2 }}
                  >
                    {t.verify}
                  </Button>
                </Stack>
              </>
            )}
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

          <List sx={{ width: "100%", maxWidth: 400 }}>
            <ListItem>
              <ListItemIcon>
                <ICONS.key sx={{ color: "text.secondary" }} />
              </ListItemIcon>
              <ListItemText
                primary={t.token}
                secondary={result.token}
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <ICONS.person sx={{ color: "text.secondary" }} />
              </ListItemIcon>
              <ListItemText
                primary={t.name}
                secondary={result.fullName || "—"}
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItem>

            {result.company && (
              <ListItem>
                <ListItemIcon>
                  <ICONS.business sx={{ color: "text.secondary" }} />
                </ListItemIcon>
                <ListItemText
                  primary={t.company}
                  secondary={result.company}
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
              </ListItem>
            )}

            {result.title && (
              <ListItem>
                <ListItemIcon>
                  <ICONS.badge sx={{ color: "text.secondary" }} />
                </ListItemIcon>
                <ListItemText
                  primary={t.title}
                  secondary={result.title}
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
              </ListItem>
            )}

            <ListItem>
              <ListItemIcon>
                <ICONS.event sx={{ color: "text.secondary" }} />
              </ListItemIcon>
              <ListItemText
                primary={t.event}
                secondary={result.eventName}
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItem>
          </List>

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

          {/* Scan Another */}
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
