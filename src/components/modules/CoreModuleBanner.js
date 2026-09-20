"use client";

import { Chip, Stack, Box, Typography, Button } from "@mui/material";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import { useRouter } from "next/navigation";
import { useTheme, alpha } from "@mui/material/styles";
import { getModuleIcon } from "@/utils/iconMapper";
import { resolveModuleColor } from "@/styles/theme";
import { ATTENDEE_DATA_CONSUMER_KEYS, getCategoryLabel } from "@/utils/moduleCategories";
import AppCard from "@/components/cards/AppCard";

// Radius (px) of the semicircular notches cut into the top and bottom edges of
// the card, centered on the dotted divider (which sits at 65% of the width).
const NOTCH_R = 9;

// True cutouts, like a boarding pass: a mask of two half-height layers, each
// with a transparent semicircle centered on the card edge, so the page shows
// through the notch. (Painting page-colored discs on top instead reads as full
// circles that hang outside the card.)
const NOTCH_MASK = [
  `radial-gradient(circle ${NOTCH_R}px at 65% 0, transparent ${NOTCH_R}px, #000 ${NOTCH_R + 0.5}px) top / 100% 51% no-repeat`,
  `radial-gradient(circle ${NOTCH_R}px at 65% 100%, transparent ${NOTCH_R}px, #000 ${NOTCH_R + 0.5}px) bottom / 100% 51% no-repeat`,
].join(", ");

// The default banner is a deliberate dark "hero" card in BOTH light and dark
// mode (per the approved mockup), so its colors are fixed rather than derived
// from the theme. Only the border and shadow treatment changes with the mode.
const BANNER = {
  bgLight: "linear-gradient(135deg, #0a1226 0%, #0b1d40 55%, #0d2a5c 100%)",
  bgDark: "linear-gradient(135deg, #0a1a33 0%, #0b2a52 55%, #0d3a72 100%)",
  glow: "radial-gradient(120% 140% at 100% 100%, rgba(37, 99, 235, 0.35) 0%, rgba(37, 99, 235, 0) 60%)",
  accent: "#38bdf8",
  text: "#ffffff",
  textMuted: "rgba(203, 213, 225, 0.78)",
  line: "rgba(255, 255, 255, 0.22)",
  chipBg: "rgba(255, 255, 255, 0.06)",
  chipBorder: "rgba(255, 255, 255, 0.16)",
  chipText: "#e2e8f0",
  buttonBg: "#ffffff",
  buttonText: "#0b1730",
  buttonHoverBg: "#e6eefc",
};

// What the "Connected modules" row shows and links to (per the approved design):
// the core module itself, its sibling modules, and two category shortcuts.
// Modules open their own page; categories open that category on the Modules page.
const CONNECTED_TARGETS = [
  { type: "module", key: "eventreg" },
  { type: "module", key: "checkin" },
  { type: "module", key: "digipass" },
  { type: "category", id: "engagement" },
  { type: "category", id: "post-event" },
];

export default function CoreModuleBanner({
  coreModule,
  moduleLabelsById,
  moduleRoutesById,
  categoriesById,
  onOpenCategory,
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
  // Ticket-style card. The notches on the dotted divider are true cutouts: the
  // AppCard is masked, so the page shows through the semicircles. A mask also
  // clips a box-shadow, so the raised shadow is a drop-shadow filter on the
  // wrapper instead; a filter follows the masked alpha, so the shadow wraps
  // the notches as well.

  // Chips for the "Connected modules" row: each one knows its label and what a
  // click does (open the module page, or open that category on this page).
  // A target the current role can't see is skipped rather than shown dead.
  const connectedChips = CONNECTED_TARGETS.map((target) => {
    if (target.type === "category") {
      const category = categoriesById?.[target.id];
      if (!category) return null;
      return {
        id: `category:${target.id}`,
        label: getCategoryLabel(category, language),
        onClick: () => onOpenCategory?.(target.id),
      };
    }

    const isCore = target.key === coreModule.key;
    const labels = moduleLabelsById?.[target.key];
    if (!isCore && !labels) return null;
    const route = isCore ? coreModule.route : moduleRoutesById?.[target.key];
    return {
      id: `module:${target.key}`,
      label: isCore ? (t.coreModuleTitle ?? "EventReg") : (labels?.[language] ?? labels?.en ?? target.key),
      onClick: () => handleModuleClick(target.key, route),
    };
  }).filter(Boolean);

  return (
    <Box
      sx={{
        mb: 6,
        position: "relative",
        color: BANNER.text,
        // Raised card: a deep, soft drop shadow (plus a faint blue glow in dark
        // mode) and a small lift on hover.
        filter: (theme) =>
          theme.palette.mode === "dark"
            ? "drop-shadow(0 20px 26px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 18px rgba(37, 99, 235, 0.3))"
            : "drop-shadow(0 18px 22px rgba(9, 20, 45, 0.35)) drop-shadow(0 6px 10px rgba(9, 20, 45, 0.25))",
        transition: "transform 0.25s ease",
        "&:hover": { transform: "translateY(-2px)" },
      }}
    >
      {/* Card: gradient, border, and the ticket notches (cut out by the mask) */}
      <AppCard
        sx={{
          p: 0,
          position: "relative",
          overflow: "hidden",
          // No borderRadius override: inherit AppCard's own corners so the banner
          // matches every other card on the page.
          border: "1px solid",
          borderColor: (theme) =>
            theme.palette.mode === "dark" ? "rgba(56, 189, 248, 0.28)" : "rgba(148, 197, 255, 0.18)",
          background: (theme) =>
            `${BANNER.glow}, ${theme.palette.mode === "dark" ? BANNER.bgDark : BANNER.bgLight}`,
          boxShadow: "none",
          // md+ only: where the mask is transparent the card is cut away.
          WebkitMask: { xs: "none", md: NOTCH_MASK },
          mask: { xs: "none", md: NOTCH_MASK },
          "&:hover": { transform: "none", boxShadow: "none" },
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "65fr 35fr" },
            alignItems: "stretch",
            minHeight: { md: 250 },
            position: "relative",
          }}
        >
          {/* Cyan top edge, clipped to the rounded corners by the AppCard */}
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "2px",
              background: `linear-gradient(90deg, rgba(56, 189, 248, 0) 0%, ${BANNER.accent} 50%, rgba(56, 189, 248, 0) 100%)`,
              opacity: 0.85,
              zIndex: 1,
            }}
          />

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
              background: `repeating-linear-gradient(to bottom, ${BANNER.line} 0, ${BANNER.line} 5px, transparent 5px, transparent 12px)`,
              zIndex: 1,
            }}
          />

          {/* Left column: icon + identity copy */}
          <Stack sx={{ p: { xs: 3, md: 5 }, height: "100%", justifyContent: { md: "center" } }} spacing={2}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
                  color: BANNER.text,
                  boxShadow: "0 8px 20px -6px rgba(59, 130, 246, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {coreModule.icon && getModuleIcon(coreModule.icon, { sx: { fontSize: 30, color: BANNER.text } })}
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
                    gap: 0.75,
                    bgcolor: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid",
                    borderColor: BANNER.chipBorder,
                    color: BANNER.chipText,
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    letterSpacing: 0.3,
                  }}
                >
                  <Box aria-hidden sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: BANNER.accent }} />
                  {t.coreFoundationBadge ?? "Core foundation"}
                </Box>
                {/* Same h4 style as before (font family and weight come from the
                    theme); only the size is bumped so the title leads. */}
                <Typography
                  variant="h4"
                  component="h3"
                  fontWeight="bold"
                  sx={{
                    fontSize: { xs: "2.25rem", md: "3rem" },
                    lineHeight: 1.1,
                    color: BANNER.text,
                  }}
                >
                  {t.coreModuleTitle ?? "EventReg"}
                </Typography>
                <Typography variant="h6" fontWeight={600} sx={{ color: BANNER.text, pt: 0.5 }}>
                  {t.coreTagline}
                </Typography>
                <Typography variant="body2" sx={{ color: BANNER.textMuted }}>
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
                background: `repeating-linear-gradient(to right, ${BANNER.line} 0, ${BANNER.line} 5px, transparent 5px, transparent 12px)`,
              }}
            />
          </Stack>

          {/* Right column: connected modules + CTA */}
          <Stack sx={{ p: { xs: 3, md: 5 }, height: "100%" }} spacing={2}>
            <Typography variant="body2" fontWeight={600} sx={{ color: BANNER.textMuted }}>
              {t.connectedModules}
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {connectedChips.map((chip) => {
                return (
                  <Chip
                    key={chip.id}
                    size="small"
                    label={chip.label}
                    variant="outlined"
                    onClick={chip.onClick}
                    sx={{
                      borderRadius: "999px",
                      fontWeight: 600,
                      cursor: "pointer",
                      bgcolor: BANNER.chipBg,
                      borderColor: BANNER.chipBorder,
                      color: BANNER.chipText,
                      transition: "all 0.2s ease",
                      "&:hover": {
                        bgcolor: "rgba(56, 189, 248, 0.16)",
                        borderColor: BANNER.accent,
                        color: BANNER.text,
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
                  backgroundColor: BANNER.buttonBg,
                  color: BANNER.buttonText,
                  fontWeight: "bold",
                  px: 3,
                  boxShadow: "0 8px 18px -8px rgba(0, 0, 0, 0.5)",
                  "&:hover": { backgroundColor: BANNER.buttonHoverBg, boxShadow: "0 10px 22px -8px rgba(0, 0, 0, 0.55)" },
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
