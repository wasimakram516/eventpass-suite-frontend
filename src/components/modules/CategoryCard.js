"use client";

import { ArrowBackOutlined } from "@mui/icons-material";
import { Stack, Box, Typography, Chip, Button, Divider } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { getCategoryLabel, getCategoryMeta } from "@/utils/moduleCategories";
import { getModuleIcon } from "@/utils/iconMapper";
import { resolveModuleColor } from "@/styles/theme";
import AppCard from "@/components/cards/AppCard";
import * as MuiIcons from "@mui/icons-material";

export function CategoryCard({ group, language, onOpenCategory, onOpenModule, t }) {
  const theme = useTheme();
  const { category, items } = group;
  const meta = getCategoryMeta(category.id);
  const CategoryIconName = meta.iconName;
  const CategoryIcon = CategoryIconName ? MuiIcons[CategoryIconName] : null;

  return (
    <AppCard key={category.id} sx={{ p: 3, display: "flex", flexDirection: "column" }}>
      <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              bgcolor: "action.hover",
              color: "primary.main",
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
        <Chip size="small" label={items.length} color="primary" variant="outlined" />
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
          <Box key={mod.key} sx={{ px: 1.5, py: 1, borderRadius: 1, bgcolor: "action.hover", color: "text.primary" }}>
            <Typography variant="body2" noWrap>
              {mod.labels?.[language] ?? mod.labels?.en ?? mod.key}
            </Typography>
          </Box>
        ))}
      </Box>
      <Button size="small" onClick={() => onOpenCategory(category.id)} sx={{ textTransform: "none", mt: "auto", alignSelf: "flex-start" }}>
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
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 3 }}>
        {items.map((mod) => (
          <ModuleCard key={mod.key} mod={mod} categoryLabel={getCategoryLabel(category, language)} language={language} onClick={onOpenModule} />
        ))}
      </Box>
    </Box>
  );
}

export function ModuleCard({ mod, categoryLabel, language, onClick }) {
  const theme = useTheme();
  const modColor = resolveModuleColor(mod.color, theme.palette.mode) || theme.palette.primary.main;

  const handleClick = () => {
    if (onClick) onClick(mod);
    else if (mod?.route) window.location.href = mod.route;
  };

  return (
    <AppCard key={mod.key} sx={{ p: 3, display: "flex", flexDirection: "column" }}>
      <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            bgcolor: alpha(modColor, 0.10),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: modColor,
            flexShrink: 0,
          }}
        >
          {getModuleIcon(mod.icon, { sx: { fontSize: 26, color: modColor } })}
        </Box>
        <Chip size="small" label={`• ${categoryLabel}`} variant="outlined" />
      </Stack>
      <Typography variant="h6" fontWeight="bold">
        {mod.labels?.[language] ?? mod.labels?.en ?? mod.key}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {mod.descriptions?.[language] ?? mod.descriptions?.en ?? ""}
      </Typography>
      <Button size="small" onClick={handleClick} sx={{ textTransform: "none", mt: "auto", alignSelf: "flex-start", pt: 2 }}>
        Open ›
      </Button>
    </AppCard>
  );
}