"use client";

import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import {
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";

const translations = {
  en: {
    initializing: "Initializing camera...",
    tooltip: {
      cancel: "Cancel scanning",
    },
    errors: {
      permissionDenied: "Camera permission denied.",
      noCamera: "No camera found.",
      generic: "Camera error.",
    },
  },
  ar: {
    initializing: "جاري تهيئة الكاميرا...",
    tooltip: {
      cancel: "إلغاء المسح",
    },
    errors: {
      permissionDenied: "تم رفض إذن الكاميرا.",
      noCamera: "لم يتم العثور على كاميرا.",
      generic: "خطأ في الكاميرا.",
    },
  },
};

export default function QRScanner({ onScanSuccess, onError, onCancel }) {
  const { t, dir } = useI18nLayout(translations);
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready) return;

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
            onError(t.errors.permissionDenied);
          } else if (err.name === "NotFoundError") {
            onError(t.errors.noCamera);
          } else {
            onError(t.errors.generic);
          }
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      scannerRef.current?.stop();
    };
  }, [onScanSuccess, onError, ready]);

  return (
    <Box
      dir={dir}
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 9999,
        backgroundColor: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Cancel Button with Tooltip */}
      <Tooltip title={t.tooltip.cancel}>
        <IconButton
          onClick={onCancel}
          sx={{
            position: "absolute",
            top: 16,
            [dir === "rtl" ? "left" : "right"]: 16,
            color: "#fff",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <ICONS.close />
        </IconButton>
      </Tooltip>

      {/* Main Video View */}
      <Box
        sx={{
          width: "90vmin",
          height: "90vmin",
          position: "relative",
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: 5,
        }}
      >
        <video
          ref={(el) => {
            videoRef.current = el;
            if (el && !ready) setReady(true);
          }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />

        {loading && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.6)",
              flexDirection: "row",
            }}
          >
            <CircularProgress color="inherit" />
            <Typography ml={2} color="#fff">
              {t.initializing}
            </Typography>
          </Box>
        )}

        {!loading && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              border: "2px dashed #00e676",
              pointerEvents: "none",
              boxSizing: "border-box",
            }}
          />
        )}
      </Box>
    </Box>
  );
}
