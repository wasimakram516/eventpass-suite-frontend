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

const duelLandingTranslations = {
  en: {
    welcomeTitle: "Welcome to EventDuel",
    welcomeSubtitle: "A competitive PvP experience tailored for events.",
    platformDescription:
      "This platform powers fast-paced duels between players. If you're a participant, please scan the QR code or use the event-specific link to join the game.",
    adminLogin: "Admin Login",
  },
  ar: {
    welcomeTitle: "مرحبًا بكم في إيفينت ديويل",
    welcomeSubtitle: "تجربة تنافسية مصممة خصيصًا للفعاليات.",
    platformDescription:
      "تم تصميم هذه المنصة لتقديم منافسات سريعة بين اللاعبين. إذا كنت مشاركًا، يرجى مسح رمز الاستجابة السريعة أو استخدام الرابط المخصص للانضمام إلى اللعبة.",
    adminLogin: "تسجيل دخول المسؤول",
  },
};

export default function EventDuelHomePage() {
  const router = useRouter();
  const { globalConfig } = useGlobalConfig();
  const { t, dir, align } = useI18nLayout(duelLandingTranslations);

  return (
    <>
      <LanguageSelector top={20} right={20} />
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
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            {t.welcomeTitle}
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t.welcomeSubtitle}
          </Typography>

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

          <Divider sx={{ my: 6 }} />
        </Container>

        {/* === FOOTER === */}
        {globalConfig && (
          <Stack spacing={1} mt={6} alignItems="center">
            {(globalConfig?.contact?.email || globalConfig?.contact?.phone) && (
              <Stack spacing={1} direction="column" alignItems="center">
                {globalConfig?.contact?.email && (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <EmailIcon fontSize="small" />
                    <Typography variant="body2">
                      {globalConfig?.contact?.email}
                    </Typography>
                  </Stack>
                )}
                {globalConfig?.contact?.phone && (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PhoneIcon fontSize="small" />
                    <Typography variant="body2">
                      {globalConfig?.contact?.phone}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            )}

            <Stack direction="row" spacing={2} mt={1}>
              {globalConfig?.socialLinks?.facebook && (
                <Link
                  href={globalConfig.socialLinks.facebook}
                  target="_blank"
                  color="inherit"
                >
                  <FacebookIcon />
                </Link>
              )}
              {globalConfig?.socialLinks?.instagram && (
                <Link
                  href={globalConfig.socialLinks.instagram}
                  target="_blank"
                  color="inherit"
                >
                  <InstagramIcon />
                </Link>
              )}
              {globalConfig?.socialLinks?.linkedin && (
                <Link
                  href={globalConfig.socialLinks.linkedin}
                  target="_blank"
                  color="inherit"
                >
                  <LinkedInIcon />
                </Link>
              )}
              {globalConfig?.socialLinks?.website && (
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
    </>
  );
}
