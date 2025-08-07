"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Box, Typography, CircularProgress } from "@mui/material";
import QRCode from "react-qr-code";
import Image from "next/image";
import Footer from "@/components/Footer";
import { getBusinessBySlug } from "@/services/businessService";
import LanguageSelector from "@/components/LanguageSelector";
import useI18nLayout from "@/hooks/useI18nLayout";
const translations = {
  en: {
    scanTitle: "Scan to Ask a Question",
    scanDesc:
      "Use your phone to scan this QR code and participate. You can post a new question or vote on existing ones.",
  },
  ar: {
    scanTitle: "امسح لطرح سؤال",
    scanDesc:
      "استخدم هاتفك لمسح رمز QR هذا والمشاركة. يمكنك إرسال سؤال جديد أو التصويت على الأسئلة الموجودة.",
  },
};
export default function PublicQrPage() {
  const { businessSlug } = useParams();
  const [askPageUrl, setAskPageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [business, setBusiness] = useState(null);
  const { t, dir, align } = useI18nLayout(translations);
  useEffect(() => {
    const fetchBusiness = async () => {
      setLoading(true);
      const businessData = await getBusinessBySlug(businessSlug);
      if (typeof window !== "undefined") {
        const origin = window.location.origin;
        setAskPageUrl(`${origin}/stageq/queries/${businessSlug}/ask`);
      }
      setBusiness(businessData);
      setLoading(false);
    };

    if (businessSlug) {
      fetchBusiness();
    }
  }, [businessSlug]);

  if (loading || !business || !askPageUrl) {
    return (
      <Box
        minHeight="100vh"
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <LanguageSelector top={20} right={20} />
      <Box
        dir={dir}
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          px: 2,
          pb: 8,
          textAlign: "center",
          bgcolor: "background.default",
        }}
      >
        {/* Logo */}
        {business?.logoUrl && (
          <Box sx={{ mt: 2 }}>
            <img
              src={business.logoUrl}
              alt={`${business.name} Logo`}
              style={{
                width: "auto",
                height: "100px",
                objectFit: "contain",
              }}
            />
          </Box>
        )}

        {/* Title & Description */}
        <Box sx={{ mt: 4, maxWidth: 800, textAlign: "center" }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {t.scanTitle}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {t.scanDesc}
          </Typography>
        </Box>

        {/* QR Code */}
        <Box
          sx={{
            p: 3,
            borderRadius: 2,
            backgroundColor: "#fff",
            boxShadow: 3,
            maxWidth: 300,
            width: "100%",
            mx: "auto",
            mb: 4,
          }}
        >
          <QRCode
            value={askPageUrl}
            size={256}
            bgColor="#ffffff"
            fgColor="#000000"
            style={{ width: "100%", height: "auto" }}
          />
        </Box>

        {/* Infographic */}
        <Box sx={{ width: "70%", mb: 4 }}>
          <Image
            src="/info.png"
            alt="Infographic"
            width={800}
            height={400}
            style={{ width: "100%", height: "auto", objectFit: "contain" }}
          />
        </Box>

        {/* Footer */}
        <Footer />
      </Box>
    </>
  );
}
