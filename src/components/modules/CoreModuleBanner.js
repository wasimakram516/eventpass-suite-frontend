"use client";

import { Chip, Stack, Box, Typography, Button } from "@mui/material";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import { useRouter } from "next/navigation";
import { useTheme, alpha, lighten } from "@mui/material/styles";
import { getModuleIcon } from "@/utils/iconMapper";
import { resolveModuleColor } from "@/styles/theme";
import { ATTENDEE_DATA_CONSUMER_KEYS } from "@/utils/moduleCategories";
import AppCard from "@/components/cards/AppCard";

// Diameter of the circular notch discs (px).
// Real circles (borderRadius:"50%") colored to match the page background —
// the classic "ticket stub" technique. No clip-path needed.
const NOTCH_D = 18;

export default function CoreModuleBanner({
  coreModule,
  moduleLabelsById,
  moduleRoutesById,
  language,
  t,
  onClick,
  variant = "default",
}) {
  const router = useRouter();
  const theme = useTheme();
  const resolvedColor = resolveModuleColor(coreModule?.color, theme.palette.mode) || theme.palette.primary.main;

  const handleClick = () => {
    if (onClick) onClick();
    else if (coreModule?.route) router.push(coreModule.route);
  };

  const handleModuleClick = (moduleKey, route) => {
    if (route) router.push(route);
    else if (moduleKey && moduleRoutesById?.[moduleKey]) {
      router.push(moduleRoutesById[moduleKey]);
    }
  };

  if (!coreModule) return null;

  // -- Dashboard variant --------------------------------------------------------
  if (variant === "dashboard") {
    return (
      <AppCard
        sx={{
          p: 3,
          mb: 6,
          borderInlineStart: `6px solid ${resolvedColor}`,
          bgcolor: alpha(resolvedColor, 0.04),
          boxShadow: `0 6px 24px ${alpha(resolvedColor, 0.15)}`,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2.5}
          sx={{ alignItems: { sm: "center" }, textAlign: { xs: "center", sm: "left" } }}
        >
          <Box
            sx={{
              width: 76,
              height: 76,
              borderRadius: "50%",
              bgcolor: alpha(resolvedColor, 0.10),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              alignSelf: { xs: "center", sm: "flex-start" },
              mx: { xs: "auto", sm: 0 },
            }}
          >
            {coreModule.icon && getModuleIcon(coreModule.icon, { sx: { fontSize: 38, color: resolvedColor } })}
          </Box>
          <Stack sx={{ minWidth: 0, flex: 1 }} spacing={1}>
            <Typography variant="overline" fontWeight="bold" sx={{ color: resolvedColor, letterSpacing: 1.2 }}>
              {t.coreModule}
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {coreModule.labels?.[language] ?? coreModule.labels?.en ?? coreModule.key}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {coreModule.descriptions?.[language] ?? coreModule.descriptions?.en ?? ""}
            </Typography>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>
                {t.attendeeDataConsumers}
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {ATTENDEE_DATA_CONSUMER_KEYS.map((moduleKey) => {
                  const labels = moduleLabelsById[moduleKey];
                  if (!labels) return null;
                  return (
                    <Chip
                      key={moduleKey}
                      size="small"
                      label={labels?.[language] ?? labels?.en ?? moduleKey}
                      variant="outlined"
                    />
                  );
                })}
              </Box>
            </Box>
          </Stack>
          <Button
            variant="contained"
            size="large"
            sx={{
              backgroundColor: resolvedColor,
              color: theme.palette.getContrastText(resolvedColor),
              fontWeight: "bold",
              px: 3,
              flexShrink: 0,
              alignSelf: { xs: "stretch", sm: "center" },
              "&:hover": { backgroundColor: resolvedColor, opacity: 0.9 },
            }}
            onClick={handleClick}
          >
            {coreModule.buttons?.[language] ?? coreModule.buttons?.en ?? "Open"}
          </Button>
        </Stack>
      </AppCard>
    );
  }

  // -- Default variant ----------------------------------------------------------
  //
  // Key insight: outer Box uses overflow:visible so notch circles can extend
  // beyond its bounds. CSS always clips a box's own *background* to its own
  // border-radius regardless of `overflow` — so the tinted background stays
  // rounded. The AppCard inside uses overflow:hidden so grid content is clipped
  // to the card corners. The notch circles are children of the outer Box (not
  // AppCard), so they are not clipped by the AppCard's overflow:hidden.

  return (
    <Box
      sx={{
        mb: 6,
        borderRadius: 2,
        overflow: "visible",
        position: "relative",
background: (theme) =>
          theme.palette.mode === "dark"
            ? alpha(resolvedColor, 0.12)
            : lighten(resolvedColor, 0.92),
      }}
    >
      {/* Top notch circle — md+ only */}
      <Box
        aria-hidden
        sx={{
          display: { xs: "none", md: "block" },
          position: "absolute",
          top: -(NOTCH_D / 2),
          left: "65%",
          transform: "translateX(-50%)",
          width: NOTCH_D,
          height: NOTCH_D,
          borderRadius: "50%",
          bgcolor: "background.default",
          zIndex: 2,
        }}
      />
      {/* Bottom notch circle — md+ only */}
      <Box
        aria-hidden
        sx={{
          display: { xs: "none", md: "block" },
          position: "absolute",
          bottom: -(NOTCH_D / 2),
          left: "65%",
          transform: "translateX(-50%)",
          width: NOTCH_D,
          height: NOTCH_D,
          borderRadius: "50%",
          bgcolor: "background.default",
          zIndex: 2,
        }}
      />

      {/* Inner card — overflow:hidden clips grid content to rounded corners */}
      <AppCard
        sx={{
          p: 0,
          position: "relative",
          background: "transparent",
          boxShadow: "none",
          overflow: "hidden",
          borderRadius: 2,
          "&:hover": { transform: "none", boxShadow: "none" },
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "65fr 35fr" },
            alignItems: "stretch",
            position: "relative",
          }}
        >
          {/* Vertical dotted divider — md+ only */}
          <Box
            aria-hidden
            sx={{
              display: { xs: "none", md: "block" },
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "65%",
              width: "2px",
              transform: "translateX(-50%)",
              background: (theme) =>
                `repeating-linear-gradient(to bottom, ${theme.palette.divider} 0, ${theme.palette.divider} 5px, transparent 5px, transparent 12px)`,
              zIndex: 1,
            }}
          />

          {/* Left column: icon + identity copy */}
          <Stack sx={{ p: { xs: 3, md: 4 }, height: "100%" }} spacing={2}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  bgcolor: alpha(resolvedColor, 0.10),
                  color: resolvedColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {coreModule.icon && getModuleIcon(coreModule.icon, { sx: { fontSize: 30, color: resolvedColor } })}
              </Box>
              <Stack spacing={0.75} sx={{ minWidth: 0 }}>
                <Box
                  sx={{
                    display: "inline-flex",
                    alignSelf: "flex-start",
                    alignItems: "center",
                    px: 1.25,
                    py: 0.35,
                    borderRadius: "999px",
                    bgcolor: alpha(resolvedColor, 0.10),
                    color: resolvedColor,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                  }}
                >
                  {`\u2022 ${t.coreFoundationBadge ?? "Core foundation"}`}
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ lineHeight: 1.1 }}>
                  {t.coreModuleTitle ?? "EventReg"}
                </Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ color: "text.primary", pt: 0.5 }}>
                  {t.coreTagline}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t.coreSubtext}
                </Typography>
              </Stack>
            </Stack>

            {/*
              Horizontal dotted divider — xs only.
              mx:-3 bleeds to the column padding edges so dashes run
              edge-to-edge, matching the md+ vertical divider aesthetic.
              Replaces the old solid 1px borderBottom.
            */}
            <Box
              aria-hidden
              sx={{
                display: { xs: "block", md: "none" },
                height: "2px",
                mx: -3,
                background: (theme) =>
                  `repeating-linear-gradient(to right, ${theme.palette.divider} 0, ${theme.palette.divider} 5px, transparent 5px, transparent 12px)`,
              }}
            />
          </Stack>

          {/* Right column: connected modules + CTA */}
          <Stack sx={{ p: { xs: 3, md: 4 }, height: "100%" }} spacing={2}>
            <Typography
              variant="overline"
              fontWeight="bold"
              sx={{ color: "text.secondary", letterSpacing: 0.8, lineHeight: 1.4 }}
            >
              {t.connectedModules}
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {[coreModule.key, ...ATTENDEE_DATA_CONSUMER_KEYS].map((moduleKey) => {
                const labels = moduleLabelsById[moduleKey];
                if (!labels) return null;
                const route = moduleKey === coreModule.key ? coreModule.route : moduleRoutesById?.[moduleKey];
                return (
                  <Chip
                    key={moduleKey}
                    size="small"
                    label={labels?.[language] ?? labels?.en ?? moduleKey}
                    variant="outlined"
                    onClick={() => handleModuleClick(moduleKey, route)}
                    sx={{
                      borderRadius: "999px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        bgcolor: alpha(resolvedColor, 0.12),
                        borderColor: resolvedColor,
                        color: resolvedColor,
                        transform: "translateY(-1px)",
                      },
                    }}
                  />
                );
              })}
            </Box>

            <Box sx={{ mt: { xs: 0, md: "auto" }, pt: { xs: 0, md: 1.5 } }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                sx={{
                  backgroundColor: resolvedColor,
                  color: theme.palette.getContrastText(resolvedColor),
                  fontWeight: "bold",
                  px: 3,
                  "&:hover": { backgroundColor: resolvedColor, opacity: 0.9 },
                }}
                onClick={handleClick}
                endIcon={<ArrowForwardOutlinedIcon fontSize="small" />}
              >
                {t.openEventReg ?? "Open EventReg"}
              </Button>
            </Box>
          </Stack>
        </Box>
      </AppCard>
    </Box>
  );
}
