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
import { keyframes } from "@mui/system";
import { useRouter } from "next/navigation";
import { useGlobalConfig } from "@/contexts/GlobalConfigContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import { getModuleIcon } from "@/utils/iconMapper";
import ICONS from "@/utils/iconUtil";
import Background from "@/components/Background";

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

// ---------- helpers ----------
const normalizeUrl = (url) => {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
};
// -----------------------------

export default function HomePage() {
  const router = useRouter();
  const { globalConfig } = useGlobalConfig();
  const { t, dir, align } = useI18nLayout(translations);

  const features = [
    { key: "quiz", label: t.features.quiz, hue: "#0d47a1", route: "/quiznest" },
    { key: "games", label: t.features.games, hue: "#5e35b1", route: "/eventduel" },

    { key: "assignment", label: t.features.assignment, hue: "#006064", route: "/eventreg" },
    { key: "checkin", label: t.features.checkin, hue: "#0277bd", route: "/checkin" },

    { key: "email", label: t.features.email, hue: "#1565c0", route: "/surveyguru" },
    { key: "poll", label: t.features.poll, hue: "#00695c", route: "/votecast" },
    { key: "forum", label: t.features.forum, hue: "#ef6c00", route: "/stageq" },
    { key: "image", label: t.features.image, hue: "#4e342e", route: "/mosaicwall" },
    { key: "trophy", label: t.features.trophy, hue: "#c62828", route: "/eventwheel" },
  ];

  return (
    <>
      <Background />

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
        <Box sx={{ py: 6 }}>
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
                startIcon={<ICONS.play />}
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
        <Container maxWidth="lg" sx={{ pb: { xs: 3, md: 5 } }}>
          <Divider sx={{ mb: 4 }} />
          <Grid
            container
            spacing={{ xs: 2, sm: 3, md: 4 }}
            columns={{ xs: 6, sm: 12, md: 12 }}
            justifyContent="center"
          >
            {features.map((f) => (
              <Grid key={f.key} item xs={3} sm={4} md={3}>
                <FeatureBadge iconKey={f.key} label={f.label} hue={f.hue} route={f.route} />
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* CLIENT LOGOS STRIP (below features, above footer) */}
        <ClientLogoStrip logos={globalConfig?.clientLogos || []} />

        {/* FOOTER */}
        <Footer globalConfig={globalConfig} align={align} />
      </Box>
    </>
  );
}

function FeatureBadge({ iconKey, label, hue, route }) {
  const iconEl = getModuleIcon(iconKey);
  const router = useRouter();

  const handleClick = () => {
    router.push(route);
  };

  return (
    <Paper
      elevation={0}
      onClick={handleClick}
      sx={(th) => ({
        p: 2.25,
        borderRadius: 3,
        minWidth: 190,
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        cursor: "pointer",
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

/* ---------- Client Logo Strip ---------- */

const marqueeMany = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); } /* two identical halves */
`;

const marqueeFew = keyframes`
  0% { transform: translateX(100%); }   /* start off-screen on the right */
  100% { transform: translateX(-100%); }/* exit fully to the left */
`;

function ClientLogoStrip({ logos }) {
  const items = Array.isArray(logos) ? logos.filter(l => !!l?.logoUrl) : [];
  if (!items.length) return null;

  const isFew = items.length <= 5;

  // duration in seconds (your constraint: max speed = 10s)
  const duration = isFew ? Math.max(8, Math.min(10, items.length * 4)) : 15;

  return (
    <Box
      sx={(th) => ({
        borderTop: `1px solid ${th.palette.divider}`,
        borderBottom: `1px solid ${th.palette.divider}`,
        py: { xs: 1.5, md: 2 },
        position: "relative",
        "@media (prefers-reduced-motion: reduce)": {
          "& *": { animation: "none !important" },
        },
      })}
    >
      <Container
        maxWidth="md"
        sx={{
          overflow: "hidden",
          position: "relative",
          WebkitMaskImage:
            "linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,1) 10%, rgba(0,0,0,1) 90%, rgba(0,0,0,0))",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskSize: "100% 100%",
          maskImage:
            "linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,1) 10%, rgba(0,0,0,1) 90%, rgba(0,0,0,0))",
          maskRepeat: "no-repeat",
          maskSize: "100% 100%",
        }}
      >
        <Box sx={{ direction: "ltr" }}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "nowrap",
              width: "max-content",
              animation: `${isFew ? marqueeFew : marqueeMany} ${duration}s linear infinite`,
              "&:hover": { animationPlayState: "paused" },
            }}
          >
            {isFew ? (
              // FEW: single pass (starts at right, exits left)
              items.map((cl, i) => (
                <LogoItem cl={cl} key={`few-${cl._id || i}`} />
              ))
            ) : (
              // MANY: render two *flat* copies with unique keys for seamless loop
              <>
                {items.map((cl, i) => (
                  <LogoItem cl={cl} key={`a-${cl._id || i}`} />
                ))}
                {items.map((cl, i) => (
                  <LogoItem cl={cl} key={`b-${cl._id || i}`} />
                ))}
              </>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

function LogoItem({ cl }) {
  const clickable = !!cl.website;
  const Wrapper = clickable ? "a" : "div";
  return (
    <Box
      component={Wrapper}
      href={clickable ? normalizeUrl(cl.website) : undefined}
      target={clickable ? "_blank" : undefined}
      rel={clickable ? "noopener noreferrer" : undefined}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 1.25, sm: 2 },
        opacity: 0.95,
        transition: "opacity .2s ease",
        textDecoration: "none",
        "&:hover": { opacity: 1 },
      }}
    >
      <Box
        component="img"
        src={cl.logoUrl}
        alt={cl.name || "client logo"}
        sx={{
          height: { xs: 28, sm: 36, md: 44 },
          maxWidth: { xs: 120, sm: 160 },
          objectFit: "contain",
          display: "block",
        }}
      />
    </Box>
  );
}

/* -------------------------------------- */
function Footer({ globalConfig, align }) {
  return (
    <Stack
      spacing={1.5}
      alignItems="center"
      mt={4}
      sx={{ pb: { xs: 4, md: 6 } }}
    >
      {globalConfig?.companyLogoUrl && (
        <Box
          component="img"
          src={globalConfig.companyLogoUrl}
          alt="Company Logo"
          sx={{ height: 56, opacity: 0.7, mt: 1.5 }}
        />
      )}

      {(globalConfig?.contact?.email || globalConfig?.contact?.phone) && (
        <Stack
          direction="row"
          flexWrap="wrap"
          justifyContent="center"
          spacing={2}
          sx={{ maxWidth: "100%", rowGap: 0.5 }}
        >
          {globalConfig?.contact?.email && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <ICONS.email fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                {globalConfig.contact.email}
              </Typography>
            </Stack>
          )}

          {globalConfig?.contact?.phone && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <ICONS.phone fontSize="small" />
              <Typography variant="body2" color="text.secondary">
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
        <Stack
          direction="row"
          spacing={2}
          sx={{ mt: 0.5, flexWrap: "wrap" }}
          justifyContent="center"
        >
          {globalConfig?.socialLinks?.facebook && (
            <MuiLink
              href={normalizeUrl(globalConfig.socialLinks.facebook)}
              target="_blank"
              underline="hover"
              color="inherit"
            >
              <ICONS.facebook fontSize="small" />
            </MuiLink>
          )}
          {globalConfig?.socialLinks?.instagram && (
            <MuiLink
              href={normalizeUrl(globalConfig.socialLinks.instagram)}
              target="_blank"
              underline="hover"
              color="inherit"
            >
              <ICONS.instagram fontSize="small" />
            </MuiLink>
          )}
          {globalConfig?.socialLinks?.linkedin && (
            <MuiLink
              href={normalizeUrl(globalConfig.socialLinks.linkedin)}
              target="_blank"
              underline="hover"
              color="inherit"
            >
              <ICONS.linkedin fontSize="small" />
            </MuiLink>
          )}
          {globalConfig?.socialLinks?.website && (
            <MuiLink
              href={normalizeUrl(globalConfig.socialLinks.website)}
              target="_blank"
              underline="hover"
              color="inherit"
            >
              <ICONS.Language fontSize="small" />
            </MuiLink>
          )}
        </Stack>
      )}
    </Stack>
  );
}
