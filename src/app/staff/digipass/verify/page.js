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
  Container,
} from "@mui/material";

import QrScanner from "@/components/QrScanner";
import { verifyRegistrationByToken } from "@/services/digipass/digipassRegistrationService";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { useMessage } from "@/contexts/MessageContext";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";

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
    openScanner: "Open Scanner",
    cancel: "Cancel",
    verifying: "Verifying registration...",
    verified: "Registration Verified",
    alreadyScanned: "Already Scanned",
    maxTasksReached: "Maximum Tasks Reached",
    token: "Token",
    tasksCompleted: "Completed Activities",
    scannedAt: "Scanned At",
    scannedBy: "Scanned By",
    scanAnother: "Scan Another",
    tryAgain: "Try Again",
    duplicateMessage: "This registration has already been scanned by you.",
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
    manualVerification: "التحقق اليدوي",
    manualInstructions:
      "أدخل الرمز يدويًا، أو ضع المؤشر داخل الحقل وامسح باستخدام جهاز ماسح QR متصل.",
    enterToken: "أدخل الرمز",
    verify: "تحقق",
    openScanner: "افتح الماسح الضوئي",
    cancel: "إلغاء",
    verifying: "جارٍ التحقق من التسجيل...",
    verified: "تم التحقق من التسجيل",
    alreadyScanned: "تم المسح مسبقًا",
    maxTasksReached: "تم الوصول إلى الحد الأقصى للمهام",
    token: "الرمز",
    tasksCompleted: "الأنشطة المكتملة",
    scannedAt: "تم المسح في",
    scannedBy: "تم المسح بواسطة",
    scanAnother: "مسح رمز آخر",
    tryAgain: "حاول مرة أخرى",
    duplicateMessage: "تم مسح هذا التسجيل مسبقًا بواسطتك.",
    tooltip: {
      openScanner: "افتح الماسح الضوئي",
      cancel: "إلغاء المسح",
      scan: "مسح رمز آخر",
      retry: "إعادة المحاولة",
    },
  },
};

export default function DigiPassVerifyPage() {
  const { t, dir } = useI18nLayout(translations);
  const { showMessage } = useMessage();

  const [showScanner, setShowScanner] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [alreadyScanned, setAlreadyScanned] = useState(false);

  const successAudioRef = useRef(null);
  const errorAudioRef = useRef(null);
  const scanningRef = useRef(false);

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
    setAlreadyScanned(false);

    const res = await verifyRegistrationByToken(cleaned);

    if (res?.alreadyScanned) {
      errorAudioRef.current?.play();
      setAlreadyScanned(true);
      setResult({
        token: cleaned,
        tasksCompleted: res.tasksCompleted,
        scannedAt: res.scannedAt,
        walkinId: res.walkinId,
      });
      setError(null);
    } else if (res?.error || res?.success === false) {
      errorAudioRef.current?.play();
      setAlreadyScanned(false);
      setError(res.message || "Invalid token.");
    } else {
      successAudioRef.current?.play();
      setResult(res);
      setAlreadyScanned(false);
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
    setAlreadyScanned(false);
    setShowScanner(false);
    setManualMode(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <BreadcrumbsNav />
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
        {!showScanner && !loading && !result && !error && !alreadyScanned && (
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
                        if (e.key === "Enter" && token.trim().length > 0) {
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
        {result && !alreadyScanned && (
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
                  <ICONS.checkCircle sx={{ color: "text.secondary" }} />
                </ListItemIcon>
                <ListItemText
                  primary={t.tasksCompleted}
                  secondary={result.tasksCompleted || 0}
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
              </ListItem>
              {result.scannedAt && (
                <ListItem>
                  <ListItemIcon>
                    <ICONS.time sx={{ color: "text.secondary" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={t.scannedAt}
                    secondary={formatDate(result.scannedAt)}
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItem>
              )}
              {result.scannedBy?.name && (
                <ListItem>
                  <ListItemIcon>
                    <ICONS.person sx={{ color: "text.secondary" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={t.scannedBy}
                    secondary={result.scannedBy.name}
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItem>
              )}
            </List>

            <Stack direction="column" spacing={2} mt={2}>
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

        {/* Already Scanned */}
        {result && alreadyScanned && (
          <Stack spacing={3} alignItems="center" textAlign="center" mt={5}>
            <ICONS.info sx={{ fontSize: 64, color: "warning.main" }} />
            <Typography variant="h6" color="warning.main">
              {t.alreadyScanned}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t.duplicateMessage}
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
                  <ICONS.checkCircle sx={{ color: "text.secondary" }} />
                </ListItemIcon>
                <ListItemText
                  primary={t.tasksCompleted}
                  secondary={result.tasksCompleted || 0}
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
              </ListItem>
              {result.scannedAt && (
                <ListItem>
                  <ListItemIcon>
                    <ICONS.time sx={{ color: "text.secondary" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={t.scannedAt}
                    secondary={formatDate(result.scannedAt)}
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItem>
              )}
            </List>

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
    </Container>
  );
}

