"use client";

import { useState, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Stack,
} from "@mui/material";

import QrScanner from "@/components/QrScanner";
import { verifyRegistrationByToken } from "@/services/eventreg/registrationService";
import ICONS from "@/utils/iconUtil";

export default function VerifyPage() {
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
      p={3}
      maxWidth={500}
      mx="auto"
      minHeight="90vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      {/* Open Scanner */}
      {!token && !showScanner && !loading && !result && !error && (
        <Box textAlign="center" my={4}>
          <Stack spacing={2} alignItems="center">
            <Typography variant="h6" fontWeight={600}>
              Start Verification
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tap the button below to scan a QR code and verify registration.
            </Typography>

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
            >
              Open Scanner
            </Button>
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
            <Button
              variant="text"
              color="error"
              startIcon={<ICONS.close />}
              onClick={() => setShowScanner(false)}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      )}

      {/* Loading */}
      {loading && (
        <Stack spacing={2} alignItems="center" mt={5}>
          <CircularProgress />
          <Typography variant="body2">Verifying registration...</Typography>
        </Stack>
      )}

      {/* Success */}
      {result && (
        <Stack spacing={3} alignItems="center" textAlign="center" mt={5}>
          <ICONS.checkCircle sx={{ fontSize: 64, color: "success.main" }} />
          <Typography variant="h1" color="success.main">
            Registration Verified
          </Typography>

          <Stack spacing={2} width="100%" maxWidth={400}>
            <Stack direction="row" spacing={2} alignItems="center">
              <ICONS.person sx={{ color: "text.secondary" }} />
              <Typography variant="body1" fontWeight={500}>
                Name:
              </Typography>
              <Typography variant="body1">{result.fullName}</Typography>
            </Stack>

            {result.company && (
              <Stack direction="row" spacing={2} alignItems="center">
                <ICONS.business sx={{ color: "text.secondary" }} />
                <Typography variant="body1" fontWeight={500}>
                  Company:
                </Typography>
                <Typography variant="body1">{result.company}</Typography>
              </Stack>
            )}

            <Stack direction="row" spacing={2} alignItems="center">
              <ICONS.event sx={{ color: "text.secondary" }} />
              <Typography variant="body1" fontWeight={500}>
                Event:
              </Typography>
              <Typography variant="body1">{result.eventName}</Typography>
            </Stack>
          </Stack>

          <Button variant="contained" startIcon={<ICONS.qrCodeScanner />} onClick={reset} sx={{ mt: 4 }}>
            Scan Another
          </Button>
        </Stack>
      )}

      {/* Error */}
      {error && (
        <Stack spacing={2} alignItems="center" textAlign="center" mt={5}>
          <ICONS.errorOutline sx={{ fontSize: 64, color: "error.main" }} />
          <Typography variant="h6" color="error.main">
            {error}
          </Typography>
          <Button variant="outlined" color="error" startIcon={<ICONS.replay />} onClick={reset}>
            Try Again
          </Button>
        </Stack>
      )}

      <audio ref={successAudioRef} src="/correct.wav" preload="auto" />
      <audio ref={errorAudioRef} src="/wrong.wav" preload="auto" />
    </Box>
  );
}
