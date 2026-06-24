"use client";

import { Box, Button, Container, Typography, Stack } from "@mui/material";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Background from "@/components/Background";
import { useLanguage } from "@/contexts/LanguageContext";
import { toArabicDigits } from "@/utils/arabicDigits";

const translations = {
  en: {
    title: "Page Not Found",
    message:
      "Sorry, the page you're looking for doesn't exist or may have been moved.",
    goHome: "Go to Home",
    goBack: "Go Back",
    poweredBy: "Powered by",
  },
  ar: {
    title: "الصفحة غير موجودة",
    message: "عذرًا، الصفحة التي تبحث عنها غير موجودة أو ربما تم نقلها.",
    goHome: "الذهاب إلى الرئيسية",
    goBack: "العودة",
    poweredBy: "مدعوم من",
  },
};

export default function NotFoundPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  const dir = language === "ar" ? "rtl" : "ltr";

  const handleGoHome = () => router.push("/");

  return (
    <Container
      maxWidth="sm"
      sx={{
        height: "calc(100vh - 50px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
      dir={dir}
    >
      <Background/>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h1"
          sx={{
            fontWeight: "bold",
            fontSize: "5rem",
            color: "primary.main"
          }}>
          {toArabicDigits("404", language)}
        </Typography>
      </Box>
      <Typography variant="h5" gutterBottom sx={{
        fontWeight: "bold"
      }}>
        {t.title}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          color: "text.secondary",
          mb: 4
        }}>
        {t.message}
      </Typography>
      <Stack direction="row" spacing={dir === "rtl" ? 6 : 2}>
        <Button
          variant="contained"
          size="large"
          onClick={handleGoHome}
          sx={{
            textTransform: "none",
            px: 4,
            py: 1.5,
            fontWeight: 500,
          }}
        >
          {t.goHome}
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={() => router.back()}
          sx={{
            textTransform: "none",
            px: 4,
            py: 1.5,
            fontWeight: 500,
          }}
        >
          {t.goBack}
        </Button>
      </Stack>
      <Typography
        variant="caption"
        sx={{
          color: "text.secondary",
          mt: 6
        }}>
        {t.poweredBy}{" "}
        <a
          href="https://whitewall.om"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "inherit", fontWeight: 500, textDecoration: "none" }}
        >
          WhiteWall Digital Solutions
        </a>
      </Typography>
    </Container>
  );
}
