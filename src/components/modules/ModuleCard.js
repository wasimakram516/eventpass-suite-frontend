"use client";

import { useMemo, useState } from "react";
import { Box, Button, Divider, Stack, Tooltip, Typography } from "@mui/material";
import { alpha, darken, lighten, useTheme } from "@mui/material/styles";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import Link from "next/link";
import AppCard from "@/components/cards/AppCard";
import DonutStat, { DONUT_SERIES_ID } from "@/components/chart/DonutStat";
import { buildDonutData } from "@/utils/charts";
import { getModuleIcon } from "@/utils/iconMapper";
import { resolveModuleColor } from "@/styles/theme";
import { toArabicDigits } from "@/utils/arabicDigits";
import ICONS from "@/utils/iconUtil";

const LEGEND_LIMIT = 4;
const DONUT_SIZE = 112;
const WIDE_CARD = "@container module-card (min-width: 620px)";

const humanizeKey = (key) =>
  String(key)
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase());

const tonalPalette = (color) => [
  color,
  lighten(color, 0.45),
  darken(color, 0.35),
  lighten(color, 0.7),
  darken(color, 0.55),
  lighten(color, 0.25),
];

const startIconSx = {
  margin: 0,
  marginInlineStart: "-2px",
  marginInlineEnd: "10px",
};

export default function ModuleCard({
  module,
  language,
  categoryLabel,
  primaryAction,
  secondaryAction,
  stackActions = false,
  stats,
  statsLabels = {},
  animateCharts = false,
}) {
  const theme = useTheme();
  const [highlighted, setHighlighted] = useState(null);

  const moduleColor =
    resolveModuleColor(module.color, theme.palette.mode) ||
    theme.palette.primary.main;
  const onModuleColor = theme.palette.getContrastText(moduleColor);
  const label = module.labels?.en || module.key;
  const description =
    module.descriptions?.[language] || module.descriptions?.en || "";
  const hasPrimaryAction = Boolean(primaryAction?.href || primaryAction?.onClick);
  const hasSecondaryAction = Boolean(secondaryAction?.href || secondaryAction?.onClick);
  const hasActions = hasPrimaryAction || hasSecondaryAction;
  const errorColor = theme.palette.error.main;
  const noTotalsLabel = statsLabels.noTotals || "No data yet";
  const trashLabel = statsLabels.trash || "Trash";

  const { legend, donutData, total, trashEntries } = useMemo(() => {
    if (!stats) return { legend: [], donutData: [], total: 0, trashEntries: [] };
    const palette = tonalPalette(moduleColor);
    const items = Object.entries(stats.totals || {})
      .filter(([, v]) => typeof v !== "object")
      .map(([k, v]) => ({ name: humanizeKey(k), value: Number(v || 0) }));
    const { data, total: sum } = buildDonutData(
      items,
      noTotalsLabel,
      palette,
      alpha(moduleColor, 0.12),
    );
    return {
      legend: items.map((item, index) => ({
        ...item,
        index,
        color: palette[index % palette.length],
        share: sum ? item.value / sum : 0,
      })),
      donutData: data,
      total: sum,
      trashEntries: Object.entries(stats.trash || {}),
    };
  }, [stats, moduleColor, noTotalsLabel]);

  const activeIndex =
    total > 0 && highlighted?.seriesId === DONUT_SERIES_ID ? highlighted.dataIndex : null;
  const activeItem = activeIndex != null ? legend[activeIndex] : null;
  const visibleLegend = legend.slice(0, LEGEND_LIMIT);
  const hiddenLegend = legend.slice(LEGEND_LIMIT);

  const highlightLegend = (index) =>
    setHighlighted(total > 0 ? { seriesId: DONUT_SERIES_ID, dataIndex: index } : null);

  return (
    <AppCard
      variant="module"
      dir={language === "ar" ? "rtl" : "ltr"}
      onMouseMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty("--module-hover-x", `${event.clientX - bounds.left}px`);
        event.currentTarget.style.setProperty("--module-hover-y", `${event.clientY - bounds.top}px`);
      }}
      sx={{
        border: `1px solid ${alpha(moduleColor, 0.14)}`,
        borderInlineStart: `12px solid ${alpha(moduleColor, 0.14)}`,
        boxShadow: `0 1px 2px ${alpha(theme.palette.common.black, 0.04)}, 0 6px 16px ${alpha(moduleColor, 0.06)}`,
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background: `radial-gradient(ellipse 100% 100% at var(--module-hover-x, 100%) var(--module-hover-y, 0%), ${alpha(moduleColor, 0.18)} 0%, ${alpha(moduleColor, 0.07)} 40%, transparent 72%)`,
          opacity: 0,
          transition: "opacity 0.25s ease",
        },
        "& > *": { position: "relative", zIndex: 1 },
        "&:hover": {
          borderColor: alpha(moduleColor, 0.5),
          transform: "translateY(-2px)",
          boxShadow: `0 10px 24px ${alpha(moduleColor, 0.12)}`,
        },
        "&:hover::before": { opacity: 1 },
      }}
    >
      <Box
        sx={{
          p: { xs: 2.5, sm: 3 },
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            display: "grid",
            direction: language === "ar" ? "rtl" : "ltr",
            gridTemplateColumns: "minmax(0, 1fr)",
            gap: 2.5,
            alignItems: "flex-start",
            ...(stats && {
              [WIDE_CARD]: {
                gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 340px)",
                columnGap: 3,
              },
            }),
          }}
        >
          <Stack direction="row" spacing={2.5} sx={{ alignItems: "flex-start", minWidth: 0, pt: 4, columnGap: 2.5 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: moduleColor,
                color: onModuleColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: `0 6px 14px ${alpha(moduleColor, 0.28)}`,
              }}
            >
              {getModuleIcon(module.icon, { sx: { fontSize: 34, color: onModuleColor } })}
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  columnGap: 1.5,
                  rowGap: 0.75,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 800, color: "text.primary", lineHeight: 1.25, mt: 0.5, minWidth: 0 }}
                >
                  {label}
                </Typography>

                {categoryLabel && (
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.75,
                      px: 1.25,
                      py: 0.5,
                      borderRadius: 999,
                      bgcolor: alpha(moduleColor, 0.07),
                      border: `1px solid ${alpha(moduleColor, 0.1)}`,
                      flexShrink: 0,
                    }}
                  >
                    <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: moduleColor, flexShrink: 0 }} />
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 600, color: "text.primary", lineHeight: 1.4, whiteSpace: "nowrap" }}
                    >
                      {categoryLabel}
                    </Typography>
                  </Box>
                )}
              </Box>

              {description && (
                <Typography dir={language === "ar" ? "rtl" : "ltr"} variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6, maxWidth: 480, textAlign: language === "ar" ? "right" : "left" }}>
                  {description}
                </Typography>
              )}
            </Box>
          </Stack>

          {stats && (
            <Box sx={{ minWidth: 0 }}>
              <Box
                sx={{
                  p: 1.75,
                  borderRadius: "12px",
                  bgcolor: alpha(moduleColor, 0.04),
                  border: `1px solid ${alpha(moduleColor, 0.1)}`,
                  display: "grid",
                  gridTemplateColumns: `${DONUT_SIZE}px minmax(0, 1fr)`,
                  columnGap: 2,
                  alignItems: "center",
                }}
              >
                <DonutStat
                  data={donutData}
                  width={DONUT_SIZE}
                  height={DONUT_SIZE}
                  minWidth={0}
                  innerRadius={34}
                  outerRadius={48}
                  margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                  animateCharts={animateCharts}
                  highlightedItem={highlighted}
                  onHighlightChange={setHighlighted}
                  centerLabel={toArabicDigits(activeItem ? activeItem.value : total, language)}
                  centerLabelSx={{
                    fontSize: "1.2rem",
                    fontVariantNumeric: "tabular-nums",
                    color: activeItem ? activeItem.color : "text.primary",
                    transition: "color 0.18s ease",
                  }}
                />

                <Stack spacing={0.5} sx={{ minWidth: 0, textAlign: language === "ar" ? "right" : "left" }} onMouseLeave={() => setHighlighted(null)}>
                  {legend.length === 0 ? (
                    <Typography variant="caption" color="text.secondary">
                      {noTotalsLabel}
                    </Typography>
                  ) : (
                    <>
                      {visibleLegend.map((item) => {
                        const isActive = activeIndex === item.index;
                        const isDimmed = activeIndex != null && !isActive;
                        return (
                          <Box
                            key={item.name}
                            onMouseEnter={() => highlightLegend(item.index)}
                            sx={{
                              minWidth: 0,
                              px: 1,
                              py: 0.5,
                              mx: -1,
                              borderRadius: 1.5,
                              cursor: "default",
                              bgcolor: isActive ? alpha(item.color, 0.1) : "transparent",
                              opacity: isDimmed ? 0.5 : 1,
                              transition: "background-color 0.18s ease, opacity 0.18s ease",
                            }}
                          >
                            <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: item.color, flexShrink: 0 }} />
                              <Typography
                                variant="caption"
                                color={isActive ? "text.primary" : "text.secondary"}
                                noWrap
                                title={item.name}
                                sx={{ flex: 1, minWidth: 0, fontWeight: isActive ? 700 : 400 }}
                              >
                                {item.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                fontWeight={700}
                                sx={{ fontVariantNumeric: "tabular-nums", flexShrink: 0 }}
                              >
                                {toArabicDigits(item.value, language)}
                              </Typography>
                            </Stack>
                            <Box
                              sx={{
                                mt: 0.5,
                                marginInlineStart: 2,
                                height: 3,
                                borderRadius: 2,
                                bgcolor: alpha(moduleColor, 0.1),
                                overflow: "hidden",
                              }}
                            >
                              <Box
                                sx={{
                                  width: `${item.share * 100}%`,
                                  minWidth: item.share > 0 ? 4 : 0,
                                  height: "100%",
                                  bgcolor: item.color,
                                  borderRadius: 2,
                                }}
                              />
                            </Box>
                          </Box>
                        );
                      })}
                      {hiddenLegend.length > 0 && (
                        <Tooltip
                          arrow
                          title={
                            <Stack spacing={0.25}>
                              {hiddenLegend.map((item) => (
                                <span key={item.name}>
                                  {item.name}: {toArabicDigits(item.value, language)}
                                </span>
                              ))}
                            </Stack>
                          }
                        >
                          <Typography
                            variant="caption"
                            fontWeight={700}
                            tabIndex={0}
                            sx={{ color: moduleColor, cursor: "default", width: "fit-content" }}
                          >
                            +{toArabicDigits(hiddenLegend.length, language)}
                          </Typography>
                        </Tooltip>
                      )}
                    </>
                  )}
                </Stack>
              </Box>

              {trashEntries.length > 0 && (
                <Box
                  sx={{
                    mt: 1.25,
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 999,
                    border: `1px dashed ${alpha(errorColor, 0.4)}`,
                    bgcolor: alpha(errorColor, 0.04),
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    columnGap: 1.5,
                    rowGap: 0.5,
                  }}
                >
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                    <ICONS.delete sx={{ fontSize: 16, color: errorColor }} />
                    <Typography variant="caption" fontWeight={700} color="error.main">
                      {trashLabel}
                    </Typography>
                  </Stack>
                  {trashEntries.map(([k, v]) => (
                    <Tooltip key={k} title={`${humanizeKey(k)}: ${toArabicDigits(v, language)}`} arrow>
                      <Stack component="span" direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                          {humanizeKey(k)}
                        </Typography>
                        <Typography component="span" variant="caption" sx={{ fontWeight: 700, color: "text.primary", lineHeight: 1.2 }}>
                          {toArabicDigits(v, language)}
                        </Typography>
                      </Stack>
                    </Tooltip>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Box>

        {hasActions && (
          <Box sx={{ mt: "auto" }}>
            <Divider sx={{ mt: 2.5, mb: 2, borderColor: alpha(moduleColor, 0.1) }} />
            <Stack
              direction={stackActions ? "column" : { xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{
                alignItems: stackActions ? "stretch" : { xs: "stretch", sm: "center" },
                flexWrap: "wrap",
              }}
            >
              {hasPrimaryAction && (
                <Button
                  variant="contained"
                  disableElevation
                  component={primaryAction.href ? Link : "button"}
                  href={primaryAction.href}
                  onClick={primaryAction.href ? undefined : primaryAction.onClick}
                  startIcon={primaryAction.icon ?? <SettingsRoundedIcon />}
                  sx={{
                    "& .MuiButton-startIcon": startIconSx,
                    textTransform: "none",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    px: 2.25,
                    py: 1.1,
                    borderRadius: 999,
                    bgcolor: moduleColor,
                    color: onModuleColor,
                    "&:hover": { bgcolor: darken(moduleColor, 0.12) },
                  }}
                >
                  {primaryAction.label}
                </Button>
              )}
              {hasSecondaryAction && (
                <Button
                  variant="outlined"
                  component={secondaryAction.href ? Link : "button"}
                  href={secondaryAction.href}
                  onClick={secondaryAction.href ? undefined : secondaryAction.onClick}
                  startIcon={secondaryAction.icon ?? <BarChartRoundedIcon />}
                  sx={{
                    "& .MuiButton-startIcon": { ...startIconSx, color: "text.primary" },
                    textTransform: "none",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    px: 2.25,
                    py: 1.1,
                    borderRadius: 999,
                    color: "text.primary",
                    borderColor: moduleColor,
                    bgcolor: "background.paper",
                    "&:hover": { borderColor: moduleColor, bgcolor: alpha(moduleColor, 0.06) },
                  }}
                >
                  {secondaryAction.label}
                </Button>
              )}
            </Stack>
          </Box>
        )}
      </Box>
    </AppCard>
  );
}
