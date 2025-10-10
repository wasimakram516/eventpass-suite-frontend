"use client";

import { useState, useCallback, useRef } from "react";
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
  Dialog,
  IconButton,
} from "@mui/material";

import QrScanner from "@/components/QrScanner";
import { verifyRegistrationByToken } from "@/services/eventreg/registrationService";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { printZpl } from "@/utils/printZpl";
import { useMessage } from "@/contexts/MessageContext";
import { pdf } from "@react-pdf/renderer";
import QRCode from "qrcode";
import BadgePDF from "@/components/BadgePDF";
import { useAuth } from "@/contexts/AuthContext";

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
    badgeIdentifier: "Badge Identifier",
    name: "Name",
    company: "Company",
    title: "Title",
    event: "Event",
    scanAnother: "Scan Another",
    tryAgain: "Try Again",
    printBadge: "Print Badge",
    printZebra: "Print Badge (Zebra)",
    printing: "Printing...",
    tooltip: {
      openScanner: "Open QR Scanner",
      cancel: "Cancel scanning",
      scan: "Scan another code",
      retry: "Retry verification",
      print: "Print Badge",
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
    badgeIdentifier: "معرف الشارة",
    name: "الاسم",
    company: "الشركة",
    title: "المسمى الوظيفي",
    event: "الفعالية",
    scanAnother: "مسح رمز آخر",
    tryAgain: "حاول مرة أخرى",
    printBadge: "طباعة الشارة",
    printZebra: "طباعة الشارة (Zebra)",
    printing: "جارٍ الطباعة...",
    tooltip: {
      openScanner: "افتح الماسح الضوئي",
      cancel: "إلغاء المسح",
      scan: "مسح رمز آخر",
      retry: "إعادة المحاولة",
      print: "طباعة الشارة",
    },
  },
};

export default function VerifyPage() {
  const { t, dir } = useI18nLayout(translations);
  const { showMessage } = useMessage();
  const { user } = useAuth();

  const [showScanner, setShowScanner] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [printing, setPrinting] = useState(false);
  const [printPreviewUrl, setPrintPreviewUrl] = useState(null);

  const successAudioRef = useRef(null);
  const errorAudioRef = useRef(null);
  const scanningRef = useRef(false);

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

  const normalizeToken = (raw) => {
    if (!raw) return "";
    const s = String(raw).trim();

    const marker = "#BARCODE";
    const idx = s.indexOf(marker);
    if (idx >= 0) {
      return s.slice(idx + marker.length).trim();
    }

    const bIndex = s.toUpperCase().lastIndexOf("/B/");
    if (bIndex >= 0) {
      return s.slice(bIndex + 3).trim();
    }

    return s;
  };

  const doVerify = useCallback(async (inputToken) => {
    const cleaned = normalizeToken(inputToken);
    setToken(cleaned);

    setLoading(true);
    setError(null);
    setResult(null);

    const res = await verifyRegistrationByToken(cleaned);
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
      if (scanningRef.current) return;
      scanningRef.current = true;

      setShowScanner(false);

      await doVerify(scannedValue);

      setTimeout(() => {
        scanningRef.current = false;
      }, 600);
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

  const handlePrintZebra = async () => {
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

  const handlePrint = async () => {
    if (!result) return;

    try {
      const qrCodeDataUrl = await QRCode.toDataURL(result.token, {
        width: 300,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      });

      const blob = await pdf(
        <BadgePDF data={result} qrCodeDataUrl={qrCodeDataUrl} />
      ).toBlob();

      const blobUrl = URL.createObjectURL(blob);

      // iOS fallback – open in Safari viewer
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        window.open(blobUrl, "_blank");
        return;
      }

      // Other platforms – open in modal iframe
      setPrintPreviewUrl(blobUrl);
    } catch (err) {
      console.error("PDF Print Error:", err);
      showMessage("Failed to generate or preview badge.", "error");
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
              </>
            ) : (
              <>
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
            {result.badgeIdentifier && (
              <ListItem>
                <ListItemIcon>
                  <ICONS.badge sx={{ color: "text.secondary" }} />
                </ListItemIcon>
                <ListItemText
                  primary={t.badgeIdentifier}
                  secondary={result.badgeIdentifier}
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
              </ListItem>
            )}
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

          <Stack direction="column" spacing={2} mt={2}>
            {user?.staffType === "desk" && (
              <Tooltip title={t.tooltip.print}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<ICONS.print />}
                  onClick={handlePrint}
                  sx={getStartIconSpacing(dir)}
                >
                  {t.printBadge}
                </Button>
              </Tooltip>
            )}

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

      {printPreviewUrl && (
        <Dialog
          open
          onClose={() => setPrintPreviewUrl(null)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              height: "90vh",
              borderRadius: 3,
              overflow: "hidden",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 1.5,
              borderBottom: "1px solid #ddd",
              backgroundColor: "#f7f7f7",
            }}
          >
            <Typography fontWeight={600}>{t.printBadge}</Typography>

            <Stack direction="row" spacing={1}>
              <Tooltip title={t.tooltip.print}>
                <IconButton
                  color="primary"
                  onClick={() => {
                    const frame = document.getElementById("badgeFrame");
                    if (frame?.contentWindow) {
                      frame.contentWindow.focus();
                      frame.contentWindow.print();
                    }
                  }}
                >
                  <ICONS.print />
                </IconButton>
              </Tooltip>

              <Tooltip title={t.tooltip.cancel}>
                <IconButton
                  color="error"
                  onClick={() => setPrintPreviewUrl(null)}
                >
                  <ICONS.close />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          <Box sx={{ flex: 1, height: "100%", overflow: "hidden" }}>
            <iframe
              id="badgeFrame"
              src={printPreviewUrl}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
              }}
            />
          </Box>
        </Dialog>
      )}

      <audio ref={successAudioRef} src="/correct.wav" preload="auto" />
      <audio ref={errorAudioRef} src="/wrong.wav" preload="auto" />
    </Box>
  );
}
