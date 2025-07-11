"use client";

import { useState, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Stack,
} from "@mui/material";
import { CheckCircle, ErrorOutline, QrCodeScanner } from "@mui/icons-material";
import QrScanner from "@/components/QrScanner";
import { verifyRegistrationByToken } from "@/services/eventreg/registrationService";

export default function VerifyPage() {
  const [showScanner, setShowScanner] = useState(false);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleScanSuccess = useCallback(async (scannedToken) => {
    setShowScanner(false);
    setToken(scannedToken);
    setLoading(true);
    setError(null);
    setResult(null);

    const res = await verifyRegistrationByToken(scannedToken);
    if (res?.error) {
      setError(res.message || "Invalid token.");
    } else {
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
      <Typography variant="h5" gutterBottom textAlign="center">
        QR Code Verification
      </Typography>

      {/* Open Scanner */}
      {!token && !showScanner && !loading && !result && !error && (
        <Box textAlign="center" my={4}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<QrCodeScanner />}
            onClick={() => {
              setShowScanner(true);
              setError(null);
              setResult(null);
            }}
          >
            Open Scanner
          </Button>
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
        <Stack spacing={2} alignItems="center" textAlign="center" mt={5}>
          <CheckCircle sx={{ fontSize: 64, color: "success.main" }} />
          <Typography variant="h6" color="success.main">
            Registration Verified
          </Typography>
          <Typography>
            <strong>Name:</strong> {result.fullName}
          </Typography>
          {result.company && (
            <Typography>
              <strong>Company:</strong> {result.company}
            </Typography>
          )}
          <Typography>
            <strong>Event:</strong> {result.eventName}
          </Typography>
          <Typography>
            <strong>Registered At:</strong>{" "}
            {new Date(result.createdAt).toLocaleString()}
          </Typography>
          <Button variant="outlined" onClick={reset} sx={{ mt: 2 }}>
            Scan Another
          </Button>
        </Stack>
      )}

      {/* Error */}
      {error && (
        <Stack spacing={2} alignItems="center" textAlign="center" mt={5}>
          <ErrorOutline sx={{ fontSize: 64, color: "error.main" }} />
          <Typography variant="h6" color="error.main">
            {error}
          </Typography>
          <Button variant="outlined" color="error" onClick={reset}>
            Try Again
          </Button>
        </Stack>
      )}
    </Box>
  );
}
