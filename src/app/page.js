"use client";

import Image from "next/image";
import { Box, Button, Container, Typography } from "@mui/material";
import { motion } from "framer-motion";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import { useTheme } from "@mui/material/styles";
const WEBSITE_URL =
  process.env.NEXT_PUBLIC_WEBSITE_URL || "https://eventpass.whitewall.solutions";

const translations = {
  en: {
    title: "The All-In-One Event Engagement Platform",
    subtitle:
      "The premier solution for digital event passes and attendee engagement by WhiteWall.",
    dashboard: "Go To The Dashboard",
    badge: "View Your Badge",
    learnMore: "Learn More",
  },
  ar: {
    title: "المنصة المتكاملة للتفاعل في الفعاليات",
    subtitle: "الحل الأمثل للبطاقات الرقمية وتفاعل الحضور، من وايت وول.",
    dashboard: "الذهاب إلى لوحة التحكم",
    badge: "عرض بطاقتك",
    learnMore: "اعرف أكثر",
  },
};

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18nLayout(translations);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        bgcolor: "background.default",
        color: theme.palette.common.white,
        zIndex: 0,
      }}
    >
      {/* Background */}
      <Box sx={{ position: "absolute", inset: 0 }}>
        <Image
          src="/landing-bg-image.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
      </Box>

      <Container
        maxWidth="xl"
        sx={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          px: { xs: 3, sm: 5, md: 8, lg: 10 },
          py: { xs: 4, md: 6 },
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          {/* Logo */}
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: { xs: 2, md: 3 },
            }}
          >
            <Box
              sx={{
                width: { xs: 180, sm: 330, md: 440 },
                height: { xs: 58, sm: 102, md: 138 },
                position: "relative",
              }}
            >
              <Image
                src="/logo.png"
                alt="EventPass"
                fill
                sizes="440px"
                style={{ objectFit: "contain" }}
                priority
              />
            </Box>
          </Box>

          {/* Title */}
          <Typography
            component={motion.h1}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" }}
            sx={{
              fontSize: { xs: "1.3rem", sm: "2.25rem", md: "3rem" },
              lineHeight: 1.1,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              mb: 1.2,
            }}
          >
            {t.title}
          </Typography>

          {/* Subtitle */}
          <Typography
            component={motion.p}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18, ease: "easeOut" }}
            sx={{
              maxWidth: 580,
              mx: "auto",
              color: theme.palette.landing.subtitleText,
              fontSize: { xs: "0.7rem", sm: "0.82rem", md: "0.88rem" },
              lineHeight: 1.55,
              mb: { xs: 2.5, md: 3 },
            }}
          >
            {t.subtitle}
          </Typography>

          {/* Buttons */}
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.26, ease: "easeOut" }}
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: { xs: 1.25, md: 2 },
            }}
          >
            <Button
              onClick={() => router.push(user ? "/cms" : "/auth/login")}
              variant="contained"
              startIcon={<AccessTimeRoundedIcon sx={{ fontSize: 18 }} />}
              sx={{
                minWidth: { xs: 150, sm: 230, md: 280 },
                px: { xs: 2, md: 3 },
                py: { xs: 0.9, md: 1.15 },
                borderRadius: "100px",
                background: theme.palette.landing.dashboardButton.background,
                color: theme.palette.common.white,
                border: `1px solid ${theme.palette.landing.dashboardButton.border}`,
                boxShadow: theme.palette.landing.dashboardButton.boxShadow,
                fontSize: { xs: "0.68rem", md: "0.76rem" },
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                "& .MuiButton-startIcon": { marginRight: "10px", marginLeft: 0 },
                "&:hover": {
                  background: theme.palette.landing.dashboardButton.hoverBackground,
                  borderColor: theme.palette.landing.dashboardButton.hoverBorder,
                },
              }}
            >
              {t.dashboard}
            </Button>

            <Button
              onClick={() => router.push("/my-badge")}
              variant="contained"
              startIcon={<PersonRoundedIcon sx={{ fontSize: 18 }} />}
              sx={{
                minWidth: { xs: 150, sm: 230, md: 280 },
                px: { xs: 2, md: 3 },
                py: { xs: 0.9, md: 1.15 },
                borderRadius: "100px",
                background: theme.palette.landing.badgeButton.background,
                color: theme.palette.common.white,
                border: `1px solid ${theme.palette.landing.badgeButton.border}`,
                boxShadow: theme.palette.landing.badgeButton.boxShadow,
                fontSize: { xs: "0.68rem", md: "0.76rem" },
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                "& .MuiButton-startIcon": { marginRight: "10px", marginLeft: 0 },
                "&:hover": {
                  background: theme.palette.landing.badgeButton.hoverBackground,
                  borderColor: theme.palette.landing.badgeButton.hoverBorder,
                },
              }}
            >
              {t.badge}
            </Button>

            <Button
              component="a"
              href={WEBSITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              startIcon={<InfoOutlinedIcon sx={{ fontSize: 18 }} />}
              sx={{
                minWidth: { xs: 150, sm: 230, md: 280 },
                px: { xs: 2, md: 3 },
                py: { xs: 0.9, md: 1.15 },
                borderRadius: "100px",
                background: theme.palette.landing.learnMoreButton.background,
                color: theme.palette.common.white,
                border: `1px solid ${theme.palette.landing.learnMoreButton.border}`,
                boxShadow: theme.palette.landing.learnMoreButton.boxShadow,
                fontSize: { xs: "0.68rem", md: "0.76rem" },
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                "& .MuiButton-startIcon": { marginRight: "10px", marginLeft: 0 },
                "&:hover": {
                  background: theme.palette.landing.learnMoreButton.hoverBackground,
                  borderColor: theme.palette.landing.learnMoreButton.hoverBorder,
                },
              }}
            >
              {t.learnMore}
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
