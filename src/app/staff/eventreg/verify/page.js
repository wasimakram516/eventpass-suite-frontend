"use client";

import { useState, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Stack,
  Fade,
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
    <Box p={3} maxWidth={600} mx="auto">
      <Typography variant="h4" gutterBottom textAlign="center">
        QR Code Verification
      </Typography>

      {/* Open Scanner Button */}
      {!token && !showScanner && (
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

      {/* QR Scanner View */}
      {showScanner && (
        <Box mb={2}>
          <QrScanner
            onScanSuccess={handleScanSuccess}
            onError={(err) => {
              console.error("QR Error", err);
              setError(err?.toString() || "Camera error. Try again.");
              setShowScanner(false);
            }}
          />
          <Box textAlign="center" mt={2}>
            <Button variant="text" color="error" onClick={() => setShowScanner(false)}>
              Cancel
            </Button>
          </Box>
        </Box>
      )}

      {/* Loading Spinner */}
      {loading && (
        <Box textAlign="center" mt={3}>
          <CircularProgress />
          <Typography variant="body2" mt={1}>
            Verifying registration...
          </Typography>
        </Box>
      )}

      {/* Error Message */}
      <Fade in={!!error}>
        <Box>
          {error && (
            <Alert severity="error" icon={<ErrorOutline />} sx={{ mt: 3 }}>
              {error}
            </Alert>
          )}
        </Box>
      </Fade>

      {/* Success Result */}
      <Fade in={!!result}>
        <Box>
          {result && (
            <Paper elevation={3} sx={{ mt: 3, p: 3 }}>
              <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 2 }}>
                Registration Verified
              </Alert>
              <Stack spacing={1}>
                <Typography><strong>Name:</strong> {result.fullName}</Typography>
                <Typography><strong>Email:</strong> {result.email}</Typography>
                <Typography><strong>Phone:</strong> {result.phone}</Typography>
                <Typography><strong>Company:</strong> {result.company}</Typography>
                <Typography><strong>Event:</strong> {result.eventName}</Typography>
                <Typography><strong>Registered At:</strong> {new Date(result.createdAt).toLocaleString()}</Typography>
              </Stack>
            </Paper>
          )}
        </Box>
      </Fade>

      {/* Scan Another Button */}
      {(result || error) && (
        <Box textAlign="center" mt={4}>
          <Button variant="outlined" onClick={reset}>
            Scan Another
          </Button>
        </Box>
      )}
    </Box>
  );
}
