"use client";

import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
  Divider,
  Link,
} from "@mui/material";

import {
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  LinkedIn as LinkedInIcon,
  Language as LanguageIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import LanguageSelector from "@/components/LanguageSelector";
import useI18nLayout from "@/hooks/useI18nLayout";
import { useGlobalConfig } from "@/contexts/GlobalConfigContext";
const landingTranslations = {
  en: {
    welcomeTitle: "Welcome to QuizNest",
    welcomeSubtitle:
      "A customizable quiz experience crafted for businesses and events.",
    platformDescription:
      "This platform is designed for businesses to engage users with interactive quizzes. If you're a player, your admin will provide you with a game link to get started.",
    adminLogin: "Admin Login",
  },
  ar: {
    welcomeTitle: "مرحبًا بكم في كويزنيست",
    welcomeSubtitle: "تجربة اختبار قابلة للتخصيص مصممة للشركات والفعاليات.",
    platformDescription:
      "تم تصميم هذه المنصة للشركات لإشراك المستخدمين من خلال الاختبارات التفاعلية. إذا كنت لاعبًا، فسيزودك المسؤول برابط اللعبة للبدء.",
    adminLogin: "تسجيل دخول المسؤول",
  },
};
export default function HomePage() {
  const router = useRouter();

  const { globalConfig } = useGlobalConfig();
  const { t, dir, align } = useI18nLayout(landingTranslations);

  return (
    <Box
      dir={dir}
      sx={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        px: 2,
        py: 4,
        textAlign: align,
      }}
    >
      <LanguageSelector top={20} right={20} />
      <Container maxWidth="md" sx={{ textAlign: "center" }}>
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
      </Container>

      {/* === FOOTER === */}
      {globalConfig && (
        <Stack spacing={1} mt={6} alignItems="center">
          {(globalConfig.contact.email || globalConfig.contact.phone) && (
            <Stack spacing={1} direction="column" alignItems="center">
              {globalConfig.contact.email && (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <EmailIcon fontSize="small" />
                  <Typography variant="body2">
                    {globalConfig.contact.email}
                  </Typography>
                </Stack>
              )}
              {globalConfig.contact.phone && (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <PhoneIcon fontSize="small" />
                  <Typography variant="body2">
                    {globalConfig.contact.phone}
                  </Typography>
                </Stack>
              )}
            </Stack>
          )}

          <Stack direction="row" spacing={2} mt={1}>
            {globalConfig.socialLinks.facebook && (
              <Link
                href={globalConfig.socialLinks.facebook}
                target="_blank"
                color="inherit"
              >
                <FacebookIcon />
              </Link>
            )}
            {globalConfig.socialLinks.instagram && (
              <Link
                href={globalConfig.socialLinks.instagram}
                target="_blank"
                color="inherit"
              >
                <InstagramIcon />
              </Link>
            )}
            {globalConfig.socialLinks.linkedin && (
              <Link
                href={globalConfig.socialLinks.linkedin}
                target="_blank"
                color="inherit"
              >
                <LinkedInIcon />
              </Link>
            )}
            {globalConfig.socialLinks.website && (
              <Link
                href={globalConfig.socialLinks.website}
                target="_blank"
                color="inherit"
              >
                <LanguageIcon />
              </Link>
            )}
          </Stack>
        </Stack>
      )}
    </Box>
  );
}
