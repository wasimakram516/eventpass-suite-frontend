"use client";

import {
  Box,
  Button,
  Typography,
  Stack,
  Divider,
  Link as MuiLink,
  Container,
  Grid,
} from "@mui/material";
import { useRouter } from "next/navigation";
import {
  Poll as PollIcon,
  SportsEsports as SportsEsportsIcon,
  Quiz as QuizIcon,
  Forum as ForumIcon,
  Image as ImageIcon,
  Assignment as AssignmentIcon,
  HowToReg as HowToRegIcon,
  EmojiEvents as EmojiEventsIcon,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  LinkedIn as LinkedInIcon,
  Language as LanguageIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from "@mui/icons-material";
import { useGlobalConfig } from "@/contexts/GlobalConfigContext";
import useI18nLayout from "@/hooks/useI18nLayout";

const translations = {
  en: {
    heading: "Unified Event Engagement Suite",
    subtitle:
      "Run interactive quizzes, real-time polls, photo walls, audience Q&A, registration and check-in — all in one place.",
    button: "Go to CMS",
    features: {
      quiz: "Quiznest",
      duel: "Event Duel",
      poll: "VoteCast",
      qna: "StageQ",
      wall: "MosaicWall",
      reg: "Event Reg",
      checkin: "Check-In",
      wheel: "Event Wheel",
    },
  },
  ar: {
    heading: "مجموعة موحدة للتفاعل في الفعاليات",
    subtitle:
      "شغّل الاختبارات التفاعلية، التصويت، جدار الصور، أسئلة الجمهور، التسجيل والدخول — كل ذلك في مكان واحد.",
    button: "اذهب إلى لوحة التحكم",
    features: {
      quiz: "كويزنيست",
      duel: "مبارزة الفعالية",
      poll: "تصويت كاست",
      qna: "أسئلة الجمهور",
      wall: "جدار الصور",
      reg: "تسجيل الفعالية",
      checkin: "تسجيل الدخول",
      wheel: "عجلة الجوائز",
    },
  },
};

export default function HomePage() {
  const router = useRouter();
  const { globalConfig } = useGlobalConfig();
  const { t, dir, align } = useI18nLayout(translations);

  const icons = [
    <QuizIcon color="primary" />,
    <SportsEsportsIcon color="secondary" />,
    <PollIcon color="success" />,
    <ForumIcon color="warning" />,
    <ImageIcon sx={{ color: "#6d4c41" }} />,
    <AssignmentIcon sx={{ color: "#00838f" }} />,
    <HowToRegIcon color="info" />,
    <EmojiEventsIcon color="error" />,
  ];

  const getIcon = (i) => icons[i];

  const handleCmsClick = () => {
    router.push("/cms");
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        px: 2,
        py: { xs: 4, md: 6 },
        textAlign: align,
      }}
      dir={dir}
    >
      {/* === MAIN CONTENT === */}
      <Container
        maxWidth="md"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Stack spacing={2} alignItems="center" width="100%" maxWidth={600}>
          <Typography
            variant="overline"
            color="primary"
            fontWeight="bold"
            letterSpacing={2}
            textAlign="center"
          >
            {t.heading}
          </Typography>

          <Typography
            variant="h2"
            fontWeight="bold"
            sx={{ fontSize: { xs: "2rem", md: "3rem" }, textAlign: "center" }}
          >
            {globalConfig?.appName || "EventPass Suite"}
          </Typography>

          <Typography variant="body1" color="text.secondary" textAlign="center">
            {t.subtitle}
          </Typography>

          <Button
            variant="outlined"
            color="primary"
            size="large"
            onClick={handleCmsClick}
            sx={{
              px: 4,
              py: 1.5,
              fontWeight: "bold",
              borderRadius: 3,
              textTransform: "none",
              ":hover": {
                borderColor: "primary.main",
                backgroundColor: "primary.light",
                color: "white",
              },
            }}
          >
            {t.button}
          </Button>

          <Divider flexItem sx={{ my: 3 }} />

          {/* Features */}
          <Grid
            container
            spacing={4}
            justifyContent="center"
            alignItems="center"
            sx={{ maxWidth: 600, mx: "auto" }} // optional constraint
          >
            {[
              t.features.quiz,
              t.features.duel,
              t.features.poll,
              t.features.qna,
              t.features.wall,
              t.features.reg,
              t.features.checkin,
              t.features.wheel,
            ].map((label, i) => (
              <Grid item xs={6} sm={4} md={3} key={i}>
                <Feature icon={getIcon(i)} label={label} />
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>

      {/* === FOOTER === */}
      <Stack spacing={1} mt={6} direction="column" alignItems="center">
        {globalConfig?.companyLogoUrl && (
          <Box
            component="img"
            src={globalConfig.companyLogoUrl}
            alt="Company Logo"
            sx={{ height: 64, mt: 6, opacity: 0.7 }}
          />
        )}

        {(globalConfig?.contact?.email || globalConfig?.contact?.phone) && (
          <Stack
            spacing={1}
            direction="row"
            alignItems="center"
            flexWrap="wrap"
            justifyContent="center"
            useFlexGap
          >
            {globalConfig?.contact?.email && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <EmailIcon fontSize="small" />
                <Typography variant="body2">
                  {globalConfig.contact.email}
                </Typography>
              </Stack>
            )}
            {globalConfig?.contact?.phone && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <PhoneIcon fontSize="small" />
                <Typography variant="body2">
                  {globalConfig.contact.phone}
                </Typography>
              </Stack>
            )}
          </Stack>
        )}

        {(globalConfig?.socialLinks?.facebook ||
          globalConfig?.socialLinks?.instagram ||
          globalConfig?.socialLinks?.linkedin ||
          globalConfig?.socialLinks?.website) && (
          <Stack direction="row" spacing={2} mt={1}>
            {globalConfig?.socialLinks?.facebook && (
              <MuiLink
                href={globalConfig.socialLinks.facebook}
                target="_blank"
                color="inherit"
              >
                <FacebookIcon />
              </MuiLink>
            )}
            {globalConfig?.socialLinks?.instagram && (
              <MuiLink
                href={globalConfig.socialLinks.instagram}
                target="_blank"
                color="inherit"
              >
                <InstagramIcon />
              </MuiLink>
            )}
            {globalConfig?.socialLinks?.linkedin && (
              <MuiLink
                href={globalConfig.socialLinks.linkedin}
                target="_blank"
                color="inherit"
              >
                <LinkedInIcon />
              </MuiLink>
            )}
            {globalConfig?.socialLinks?.website && (
              <MuiLink
                href={globalConfig.socialLinks.website}
                target="_blank"
                color="inherit"
              >
                <LanguageIcon />
              </MuiLink>
            )}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}

function Feature({ icon, label }) {
  return (
    <Stack alignItems="center" spacing={1} textAlign="center">
      {icon}
      <Typography variant="subtitle2" fontWeight="bold">
        {label}
      </Typography>
    </Stack>
  );
}
