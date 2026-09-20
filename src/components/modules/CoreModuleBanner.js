"use client";

import { Chip } from "@mui/material";
import { Stack, Box, Typography, Button } from "@mui/material";
import { useRouter } from "next/navigation";
import { useTheme, alpha } from "@mui/material/styles";
import { getModuleIcon } from "@/utils/iconMapper";
import { resolveModuleColor } from "@/styles/theme";
import { ATTENDEE_DATA_CONSUMER_KEYS } from "@/utils/moduleCategories";
import AppCard from "@/components/cards/AppCard";

export default function CoreModuleBanner({
  coreModule,
  moduleLabelsById,
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

  if (!coreModule) return null;

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