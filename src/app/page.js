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
  Paper,
  alpha,
} from "@mui/material";
import { useRouter } from "next/navigation";
import {
  PlayArrowRounded,
  Facebook,
  Instagram,
  LinkedIn,
  Language,
} from "@mui/icons-material";
import { useGlobalConfig } from "@/contexts/GlobalConfigContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import { getModuleIcon } from "@/utils/iconMapper";

const translations = {
  en: {
    heading: "Unified Event Engagement Suite",
    subtitle:
      "Run interactive quizzes, real-time polls, photo walls, audience Q&A, registration and check-in — all in one place.",
    button: "Go to CMS",
    features: {
      quiz: "QuizNest",
      games: "Event Duel",
      poll: "VoteCast",
      forum: "StageQ",
      image: "MosaicWall",
      assignment: "Event Reg",
      checkin: "Check-In",
      trophy: "Event Wheel",
      email: "SurveyGuru",
    },
  },
  ar: {
    heading: "مجموعة موحدة للتفاعل في الفعاليات",
    subtitle:
      "شغّل الاختبارات التفاعلية، التصويت، جدار الصور، أسئلة الجمهور، التسجيل والدخول — كل ذلك في مكان واحد.",
    button: "اذهب إلى لوحة التحكم",
    features: {
      quiz: "كويزنيست",
      games: "مبارزة الفعالية",
      poll: "تصويت كاست",
      forum: "أسئلة الجمهور",
      image: "جدار الصور",
      assignment: "تسجيل الفعالية",
      checkin: "تسجيل الدخول",
      trophy: "عجلة الجوائز",
      email: "سيرفي جورو",
    },
  },
};

export default function HomePage() {
  const router = useRouter();
  const { globalConfig } = useGlobalConfig();
  const { t, dir, align } = useI18nLayout(translations);

  const features = [
    { key: "quiz", label: t.features.quiz, hue: "#0d47a1" },
    { key: "games", label: t.features.games, hue: "#5e35b1" },
    
    { key: "assignment", label: t.features.assignment, hue: "#006064" },
    { key: "checkin", label: t.features.checkin, hue: "#0277bd" },
    
    { key: "email", label: t.features.email, hue: "#1565c0" },
    { key: "poll", label: t.features.poll, hue: "#00695c" },
    { key: "forum", label: t.features.forum, hue: "#ef6c00" },
    { key: "image", label: t.features.image, hue: "#4e342e" },
    { key: "trophy", label: t.features.trophy, hue: "#c62828" },
  ];

  return (
    <>
      {/* Fixed, full-page background (stays on scroll) */}
      <Box
        aria-hidden
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background: (th) =>
            th.palette.mode === "light"
              ? "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)"
              : "linear-gradient(180deg, #0b1220 0%, #0a0f1a 100%)",
        }}
      >
        {/* soft gradient blobs */}
        <Box
          sx={{
            position: "absolute",
            left: "-12%",
            top: "-18%",
            width: { xs: 420, md: 720 },
            height: { xs: 420, md: 720 },
            filter: "blur(80px)",
            opacity: 0.25,
            background:
              "radial-gradient(closest-side, #60a5fa 0%, transparent 60%), radial-gradient(closest-side, #a78bfa 0%, transparent 60%)",
          }}
        />
      </Box>

      {/* Content */}
      <Box
        dir={dir}
        sx={{
          position: "relative",
          zIndex: 1,
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* HERO */}
        <Box
          sx={{
            py: 6,
          }}
        >
          <Container maxWidth="lg">
            <Stack spacing={3} alignItems="center" textAlign={align}>
              <Typography
                variant="overline"
                color="primary"
                letterSpacing={2}
                fontWeight={700}
              >
                {t.heading}
              </Typography>

              <Typography
                variant="h2"
                fontWeight={800}
                sx={{
                  fontSize: { xs: "2rem", md: "3.25rem" },
                  lineHeight: 1.12,
                  textAlign: "center",
                }}
              >
                {globalConfig?.appName || "EventPass Suite"}
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ maxWidth: 860, textAlign: "center" }}
              >
                {t.subtitle}
              </Typography>

              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrowRounded />}
                onClick={() => router.push("/cms")}
                sx={(th) => ({
                  mt: 1,
                  px: 4,
                  py: 1.4,
                  borderRadius: 3,
                  textTransform: "none",
                  fontWeight: 700,
                  boxShadow: `0 12px 30px ${alpha(
                    th.palette.primary.main,
                    0.25
                  )}`,
                })}
              >
                {t.button}
              </Button>
            </Stack>
          </Container>
        </Box>

        {/* FEATURES */}
        <Container maxWidth="lg" sx={{ pb: { xs: 6, md: 10 } }}>
          <Divider sx={{ mb: 4 }} />
          <Grid
            container
            spacing={{ xs: 2, sm: 3, md: 4 }}
            columns={{ xs: 6, sm: 12, md: 12 }}
            justifyContent="center"
          >
            {features.map((f) => (
              <Grid key={f.key} item xs={3} sm={4} md={3}>
                <FeatureBadge iconKey={f.key} label={f.label} hue={f.hue} />
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* FOOTER */}
        <Footer globalConfig={globalConfig} align={align} />
      </Box>
    </>
  );
}

function FeatureBadge({ iconKey, label, hue }) {
  const iconEl = getModuleIcon(iconKey); // JSX element from icon mapper

  return (
    <Paper
      elevation={0}
      sx={(th) => ({
        p: 2.25,
        borderRadius: 3,
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        background:
          th.palette.mode === "light"
            ? `linear-gradient(180deg, ${alpha("#fff", 0.92)} 0%, ${alpha(
                "#f8fafc",
                0.92
              )} 100%)`
            : `linear-gradient(180deg, ${alpha("#0f172a", 0.7)} 0%, ${alpha(
                "#0b1220",
                0.7
              )} 100%)`,
        border: `1px solid ${alpha(th.palette.divider, 0.6)}`,
        transition:
          "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: `0 14px 36px ${alpha(hue, 0.28)}`,
          borderColor: alpha(hue, 0.5),
        },
      })}
    >
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: "16px",
          display: "grid",
          placeItems: "center",
          background: (th) =>
            th.palette.mode === "light" ? alpha(hue, 0.12) : alpha(hue, 0.22),
          outline: (th) => `1px solid ${alpha(hue, 0.35)}`,
          "& svg": { fontSize: 26, color: hue },
          flexShrink: 0,
        }}
      >
        {iconEl}
      </Box>

      <Typography variant="subtitle1" fontWeight={800}>
        {label}
      </Typography>
    </Paper>
  );
}

function Footer({ globalConfig, align }) {
  return (
    <Stack spacing={1.5} alignItems="center" sx={{ pb: { xs: 4, md: 6 } }}>
      {globalConfig?.companyLogoUrl && (
        <Box
          component="img"
          src={globalConfig.companyLogoUrl}
          alt="Company Logo"
          sx={{ height: 56, opacity: 0.7, mt: 1.5 }}
        />
      )}

      {(globalConfig?.contact?.email || globalConfig?.contact?.phone) && (
        <Typography variant="body2" color="text.secondary" textAlign={align}>
          {globalConfig?.contact?.email && (
            <>
              <strong>Email:</strong> {globalConfig.contact.email}
            </>
          )}
          {globalConfig?.contact?.email &&
            globalConfig?.contact?.phone &&
            " · "}
          {globalConfig?.contact?.phone && (
            <>
              <strong>Phone:</strong> {globalConfig.contact.phone}
            </>
          )}
        </Typography>
      )}

      {(globalConfig?.socialLinks?.facebook ||
        globalConfig?.socialLinks?.instagram ||
        globalConfig?.socialLinks?.linkedin ||
        globalConfig?.socialLinks?.website) && (
        <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
          {globalConfig?.socialLinks?.facebook && (
            <MuiLink
              href={globalConfig.socialLinks.facebook}
              target="_blank"
              underline="hover"
              color="inherit"
            >
              <Facebook fontSize="small" />
            </MuiLink>
          )}
          {globalConfig?.socialLinks?.instagram && (
            <MuiLink
              href={globalConfig.socialLinks.instagram}
              target="_blank"
              underline="hover"
              color="inherit"
            >
              <Instagram fontSize="small" />
            </MuiLink>
          )}
          {globalConfig?.socialLinks?.linkedin && (
            <MuiLink
              href={globalConfig.socialLinks.linkedin}
              target="_blank"
              underline="hover"
              color="inherit"
            >
              <LinkedIn fontSize="small" />
            </MuiLink>
          )}
          {globalConfig?.socialLinks?.website && (
            <MuiLink
              href={globalConfig.socialLinks.website}
              target="_blank"
              underline="hover"
              color="inherit"
            >
              <Language fontSize="small" />
            </MuiLink>
          )}
        </Stack>
      )}
    </Stack>
  );
}
