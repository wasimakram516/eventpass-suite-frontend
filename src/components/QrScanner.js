"use client";

import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import {
  Box,
  Typography,
  CircularProgress,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function QRScanner({ onScanSuccess, onError, onCancel }) {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const startScanner = async () => {
      try {
        const videoEl = videoRef.current;
        if (!videoEl) throw new Error("Video element not found");

        const scanner = new QrScanner(
          videoEl,
          (result) => {
            if (!isMounted) return;
            scanner.stop();
            onScanSuccess(result.data);
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: "environment",
          }
        );

        scannerRef.current = scanner;
        await scanner.start();
        if (isMounted) setLoading(false);
      } catch (err) {
        console.error("QR Scanner error:", err);
        if (onError) {
          if (err.name === "NotAllowedError") {
            onError("Camera permission denied.");
          } else if (err.name === "NotFoundError") {
            onError("No camera found.");
          } else {
            onError(err.message || "Camera error.");
          }
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      scannerRef.current?.stop();
    };
  }, [onScanSuccess, onError]);

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        bgcolor: "#000",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Cancel Button */}
      <IconButton
        onClick={onCancel}
        sx={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 2100,
          color: "#fff",
          backgroundColor: "rgba(0,0,0,0.4)",
          "&:hover": {
            backgroundColor: "rgba(0,0,0,0.6)",
          },
        }}
      >
        <CloseIcon />
      </IconButton>

      {/* Loading Spinner */}
      {loading ? (
        <Box textAlign="center" color="#fff">
          <CircularProgress color="inherit" />
          <Typography mt={2}>Initializing camera...</Typography>
        </Box>
      ) : (
        <Box
          sx={{
            position: "relative",
            width: "100vw",
            height: "100vh",
          }}
        >
          <video
            ref={videoRef}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              border: "2px dashed #00e676",
              boxSizing: "border-box",
              pointerEvents: "none",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: 16,
              left: 0,
              width: "100%",
              textAlign: "center",
              color: "#fff",
              background: "rgba(0,0,0,0.5)",
              py: 1,
            }}
          >
            <Typography variant="body2">Scanning for QR code...</Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
