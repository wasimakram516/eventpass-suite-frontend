"use client";

import { useEffect, useRef } from "react";
import QrScanner from "qr-scanner";
import { Box, Typography } from "@mui/material";

export default function QRScanner({ onScanSuccess, onError }) {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

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
            preferredCamera: "environment", // Use Rear camera
          }
        );

        scannerRef.current = scanner;
        await scanner.start();
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
        position: "relative",
        width: "100%",
        maxWidth: 400,
        mx: "auto",
        borderRadius: 2,
        boxShadow: 3,
        overflow: "hidden",
        backgroundColor: "#000",
      }}
    >
      <video
        ref={videoRef}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
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
          bottom: 8,
          left: 0,
          width: "100%",
          textAlign: "center",
          color: "#fff",
          background: "rgba(0,0,0,0.5)",
          py: 0.5,
        }}
      >
        <Typography variant="body2">Scanning for QR code...</Typography>
      </Box>
    </Box>
  );
}
