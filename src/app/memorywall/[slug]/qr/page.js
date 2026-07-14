"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Box, Container, Typography, useTheme } from "@mui/material";
import { QRCodeCanvas } from "qrcode.react";
import { getWallConfigBySlug } from "@/services/memorywall/wallConfigService";
import useI18nLayout from "@/hooks/useI18nLayout";
import LanguageSelector from "@/components/LanguageSelector";
import LoadingState from "@/components/LoadingState";
import Footer from "@/components/nav/Footer";

const translations = {
  en: {
    scanToCapture: "Scan to Capture your photo",
    useYourPhone: "Use your phone to scan this QR code and capture your photo.",
    poweredBy: "Powered by WhiteWall Digital Solutions",
    loading: "Loading...",
  },
  ar: {
    scanToCapture: "امسح لالتقاط صورتك",
    useYourPhone: "استخدم هاتفك لمسح رمز الاستجابة السريعة هذا والتقاط صورتك.",
    poweredBy: "مدعوم من WhiteWall Digital Solutions",
    loading: "جاري التحميل...",
  },
};
export default function PublicQrPage() {
  const theme = useTheme();
  const { slug } = useParams();
  const [capturePageUrl, setCapturePageUrl] = useState("");
  const { t, dir, align } = useI18nLayout(translations);
  useEffect(() => {
    const fetchWallConfig = async () => {
      if (slug) {
        const response = await getWallConfigBySlug(slug);
        if (response && !response.erro) {
          if (typeof window !== "undefined") {
            setCapturePageUrl(
              `${window.location.origin}/memorywall/${slug}/capture`
            );
          }
        }
      }
    };

    fetchWallConfig();
  }, [slug]);

  return (
    <>
      <Container
        maxWidth="sm"
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mt: 2,
          textAlign: align,
        }}
        dir={dir}
      >
        {/* Heading */}
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: "bold",
            mt: 4
          }}>
          {t.scanToCapture}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: "text.secondary",
            mb: 4
          }}>
          {t.useYourPhone}
        </Typography>

        {/* QR Code or Loader */}
        {capturePageUrl ? (
          <Box
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: "qr.background",
              boxShadow: (theme) => theme.palette.shadow.card,
              width: "100%",
              maxWidth: 300,
            }}
          >
            <QRCodeCanvas
              value={capturePageUrl}
              size={256}
              bgColor={theme.palette.qr.background}
              fgColor={theme.palette.qr.foreground}
              level="H"
              includeMargin={false}
            />
          </Box>
        ) : (
          <LoadingState />
        )}

        <Footer />
      </Container>
      <LanguageSelector top={10} right={20} />
    </>
  );
}
