"use client";

import { ArrowBackOutlined, ArrowForwardOutlined as ArrowForwardOutlinedIcon } from "@mui/icons-material";
import { Stack, Box, Typography, Chip, Button, Divider } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { getCategoryLabel, getCategoryMeta } from "@/utils/moduleCategories";
import { getModuleIcon } from "@/utils/iconMapper";
import { resolveModuleColor } from "@/styles/theme";
import AppCard from "@/components/cards/AppCard";
import * as MuiIcons from "@mui/icons-material";

// Hover treatment shared by CategoryCard and ModuleCard: a colored border, a
// small lift, and a soft wash of the category color bleeding in from the
// top-right corner. The wash is a ::before layer (faded in with opacity, since
// gradients can't be transitioned) sitting behind the content via
// `isolation: isolate` + `zIndex: -1`.
const coloredHoverSx = (color) => ({
  position: "relative",
  isolation: "isolate",
  border: "1px solid transparent",
  transition: "border-color 0.2s ease, transform 0.2s ease",
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    zIndex: -1,
    pointerEvents: "none",
    background: `radial-gradient(ellipse 100% 100% at 100% 0%, ${alpha(color, 0.18)} 0%, ${alpha(color, 0.07)} 40%, transparent 72%)`,
    opacity: 0,
    transition: "opacity 0.25s ease",
  },
  "&:hover": { borderColor: color, transform: "translateY(-2px)" },
  "&:hover::before": { opacity: 1 },
});

// Two-column card grid that centers a lone last card instead of leaving it
// stranded on the left. It is flex rather than grid so an odd final row can be
// centered; cards in the same row still stretch to equal height. The 24px in
// the width is the `gap: 3` below.
export const cardGridSx = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: 3,
  "& > *": { width: { xs: "100%", md: "calc((100% - 24px) / 2)" } },
};

export function CategoryCard({ group, language, onOpenCategory, onOpenModule, t }) {
  const theme = useTheme();
  const { category, items } = group;
  const meta = getCategoryMeta(category.id);
  const categoryColor = meta.color || theme.palette.primary.main;
  const CategoryIconName = meta.iconName;
  const CategoryIcon = CategoryIconName ? MuiIcons[CategoryIconName] : null;

  return (
    <AppCard key={category.id} sx={{ p: 3, display: "flex", flexDirection: "column", ...coloredHoverSx(categoryColor) }}>
      <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              bgcolor: alpha(categoryColor, 0.10),
              color: categoryColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CategoryIcon fontSize="small" />
          </Box>
          <Typography variant="h6" fontWeight="bold">
            {getCategoryLabel(category, language)}
          </Typography>
        </Stack>
        <Chip size="small" label={items.length} sx={{ color: categoryColor, borderColor: alpha(categoryColor, 0.4) }} variant="outlined" />
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {meta.descriptions?.[language] ?? meta.descriptions?.en ?? ""}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 1,
          mb: 2,
        }}
      >
        {items.map((mod) => (
          <AppCard
            key={mod.key}
            onClick={() => {
              if (onOpenModule) onOpenModule(mod);
              else if (mod?.route) window.location.href = mod.route;
            }}
            sx={{
              px: 1.5,
              py: 1,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              cursor: "pointer",
              "&:hover": {
                bgcolor: alpha(categoryColor, 0.06),
                borderColor: alpha(categoryColor, 0.5),
                color: categoryColor,
                "& .module-pill-arrow": { opacity: 1, transform: "translateX(0)" },
              },
            }}
          >
            <Typography variant="body2" noWrap>
              {mod.labels?.[language] ?? mod.labels?.en ?? mod.key}
            </Typography>
            <ArrowForwardOutlinedIcon
              className="module-pill-arrow"
              sx={{
                fontSize: 16,
                color: categoryColor,
                flexShrink: 0,
                opacity: 0,
                transform: "translateX(-4px)",
                transition: "opacity 0.2s ease, transform 0.2s ease",
              }}
            />
          </AppCard>
        ))}
      </Box>
      <Button size="small" className="category-open-btn" onClick={() => onOpenCategory(category.id)} sx={{ textTransform: "none", mt: "auto", alignSelf: "flex-start", color: categoryColor, fontWeight: 600, transition: "color 0.2s ease" }}>
        {t.openCategory} ›
      </Button>
    </AppCard>
  );
}

export function CategoryDetailView({ group, language, t, onBack, onOpenModule }) {
  const theme = useTheme();
  const { category, items } = group;
  const meta = getCategoryMeta(category.id);
  const CategoryIconName = meta.iconName;
  const CategoryIcon = CategoryIconName ? MuiIcons[CategoryIconName] : null;

  return (
    <Box>
      <Button variant="outlined" size="small" startIcon={<ArrowBackOutlined />} onClick={onBack} sx={{ mb: 3, textTransform: "none" }}>
        {t.allModules}
      </Button>
      <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", minWidth: 0 }}>
          <Box sx={{ width: 64, height: 64, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.10), color: "primary.main", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CategoryIcon sx={{ fontSize: 36 }} />
          </Box>
          <Typography variant="h4" fontWeight="bold">{getCategoryLabel(category, language)}</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
          {t.moduleSummary.replace("{count}", items.length)}
        </Typography>
      </Stack>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {meta.descriptions?.[language] ?? meta.descriptions?.en ?? ""}
      </Typography>
      <Divider sx={{ mb: 3 }} />
      <Box sx={cardGridSx}>
        {items.map((mod) => (
          <ModuleCard key={mod.key} mod={mod} categoryLabel={getCategoryLabel(category, language)} categoryColor={meta.color} language={language} onClick={onOpenModule} />
        ))}
      </Box>
    </Box>
  );
}

export function ModuleCard({ mod, categoryLabel, categoryColor, language, onClick }) {
  const theme = useTheme();
  const cardColor = categoryColor || resolveModuleColor(mod.color, theme.palette.mode) || theme.palette.primary.main;

  const handleClick = () => {
    if (onClick) onClick(mod);
    else if (mod?.route) window.location.href = mod.route;
  };

  return (
    <AppCard
      key={mod.key}
      sx={{
        p: 3,
        display: "flex",
        flexDirection: "column",
        ...coloredHoverSx(cardColor),
      }}
    >
      <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            bgcolor: alpha(cardColor, 0.10),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: cardColor,
            flexShrink: 0,
          }}
        >
          {getModuleIcon(mod.icon, { sx: { fontSize: 26, color: cardColor } })}
        </Box>
        <Chip size="small" label={`• ${categoryLabel}`} variant="outlined" />
      </Stack>
      <Typography variant="h6" fontWeight="bold">
        {mod.labels?.[language] ?? mod.labels?.en ?? mod.key}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {mod.descriptions?.[language] ?? mod.descriptions?.en ?? ""}
      </Typography>
      <Button size="small" onClick={handleClick} sx={{ textTransform: "none", mt: "auto", alignSelf: "flex-start", pt: 2, color: cardColor, fontWeight: 600 }}>
        Open ›
      </Button>
    </AppCard>
  );
}