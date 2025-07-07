"use client";

import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
  Divider,
} from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import InstagramIcon from "@mui/icons-material/Instagram";
import EmailIcon from "@mui/icons-material/Email";
import LanguageSelector from "@/components/LanguageSelector";
import useI18nLayout from "@/hooks/useI18nLayout";
const landingTranslations = {
  en: {
    welcomeTitle: "Welcome to QuizNest",
    welcomeSubtitle:
      "A customizable quiz experience crafted for businesses and events.",
    platformDescription:
      "This platform is designed for businesses to engage users with interactive quizzes. If you're a player, your admin will provide you with a game link to get started.",
    adminLogin: "Admin Login",
    aboutTitle: "About WhiteWall",
    aboutDescription:
      "We specialize in digital solutions for engagement and interaction.",
    developedBy:
      "QuizNest is designed and developed by WhiteWall Digital Solutions, Oman.",
    contactTitle: "Contact Us",
  },
  ar: {
    welcomeTitle: "مرحبًا بكم في كويزنيست",
    welcomeSubtitle: "تجربة اختبار قابلة للتخصيص مصممة للشركات والفعاليات.",
    platformDescription:
      "تم تصميم هذه المنصة للشركات لإشراك المستخدمين من خلال الاختبارات التفاعلية. إذا كنت لاعبًا، فسيزودك المسؤول برابط اللعبة للبدء.",
    adminLogin: "تسجيل دخول المسؤول",
    aboutTitle: "عن وايت وول",
    aboutDescription: "نحن متخصصون في الحلول الرقمية للتفاعل والمشاركة.",
    developedBy:
      "تم تصميم وتطوير كويزنيست بواسطة وايت وول للحلول الرقمية، عُمان.",
    contactTitle: "اتصل بنا",
  },
};
export default function HomePage() {
  const router = useRouter();
  const { t, dir, align, language } = useI18nLayout(landingTranslations);

  return (
    <Box sx={{ position: "relative" }}>
      <LanguageSelector />
      <Container maxWidth="md" sx={{ py: 10, textAlign: "center" }}>
        {/* Header */}
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          {t.welcomeTitle}
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {t.welcomeSubtitle}
        </Typography>

        {/* Info */}
        <Typography variant="body1" color="text.secondary" sx={{ mt: 3 }}>
          {t.platformDescription}
        </Typography>

        <Button
          variant="contained"
          size="large"
          sx={{ mt: 4 }}
          onClick={() => router.push("/auth/login")}
        >
          {t.adminLogin}
        </Button>

        {/* Divider */}
        <Divider sx={{ my: 6 }} />

        {/* About & Contact */}
        <Stack spacing={3} alignItems="center">
          <Typography variant="h5" fontWeight="bold">
            {t.aboutTitle}
          </Typography>

          <Box
            component="img"
            src="/WWDS.png"
            alt="WhiteWall Digital Solutions"
            sx={{
              width: 300,
              height: "auto",
            }}
          />

          <Typography variant="body1" color="text.secondary" textAlign="center">
            {t.aboutDescription}
            <br />
            <strong>QuizNest</strong> {t.developedBy}{" "}
            <strong>WhiteWall Digital Solutions, Oman</strong>.
          </Typography>

          {/* Contact */}
          <Stack spacing={1} alignItems="center">
            <Typography variant="h6" fontWeight="medium">
              {t.contactTitle}
            </Typography>

            <Typography variant="body2">
              <WhatsAppIcon fontSize="small" sx={{ mr: 1 }} />
              <a href="tel:+96877121757">+968 7712 1757</a>
            </Typography>

            <Typography variant="body2">
              <InstagramIcon fontSize="small" sx={{ mr: 1 }} />
              <a
                href="https://www.instagram.com/whitewall.om"
                target="_blank"
                rel="noopener noreferrer"
              >
                whitewall.om
              </a>
            </Typography>

            <Typography variant="body2">
              <EmailIcon fontSize="small" sx={{ mr: 1 }} />
              <a href="mailto:solutions@whitewall.om">solutions@whitewall.om</a>
            </Typography>

            <Typography variant="body2">
              🌐{" "}
              <a
                href="https://www.whitewall.om"
                target="_blank"
                rel="noopener noreferrer"
              >
                www.whitewall.om
              </a>
            </Typography>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
