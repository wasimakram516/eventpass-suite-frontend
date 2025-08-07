"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Box, Container, Typography } from "@mui/material";
import { QRCodeCanvas } from "qrcode.react";
import { getWallConfigBySlug } from "@/services/mosaicwall/wallConfigService";
import useI18nLayout from "@/hooks/useI18nLayout";
import LanguageSelector from "@/components/LanguageSelector";
import LoadingState from "@/components/LoadingState";
import Footer from "@/components/Footer";

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
              `${window.location.origin}/mosaicwall/${slug}/capture`
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
        <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mt: 4 }}>
          {t.scanToCapture}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t.useYourPhone}
        </Typography>

        {/* QR Code or Loader */}
        {capturePageUrl ? (
          <Box
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: "#fff",
              boxShadow: 3,
              width: "100%",
              maxWidth: 300,
            }}
          >
            <QRCodeCanvas
              value={capturePageUrl}
              size={256}
              bgColor="#ffffff"
              fgColor="#000000"
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
