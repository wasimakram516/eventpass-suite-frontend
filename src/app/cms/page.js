"use client";

import {
  Box,
  Typography,
  Container,
  Grid,
  Avatar,
  Divider,
  Chip,
  Stack,
  Button,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import SportsEsportsOutlinedIcon from "@mui/icons-material/SportsEsportsOutlined";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";

import { useAuth } from "@/contexts/AuthContext";
import { useGlobalConfig } from "@/contexts/GlobalConfigContext";
import BusinessAlertModal from "@/components/modals/BusinessAlertModal";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useCallback } from "react";
import { useTheme, alpha } from "@mui/material/styles";
import {
  getDashboardInsights,
  refreshDashboardInsights,
} from "@/services/dashboardService";
import LoadingState from "@/components/LoadingState";
import { wrapTextBox } from "@/utils/wrapTextStyles";
import { getModuleIcon } from "@/utils/iconMapper";
import ICONS from "@/utils/iconUtil";
import { resolveModuleColor } from "@/styles/theme";
import useI18nLayout from "@/hooks/useI18nLayout";
import { toArabicDigits } from "@/utils/arabicDigits";
import { getAllBusinesses } from "@/services/businessService";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { formatDateTimeWithLocale } from "@/utils/dateUtils";
import useDashboardSocket from "@/hooks/useDashboardSocket";
import { useModules, useModuleCategories } from "@/hooks/useModules";
import { groupByModuleCategory, getCategoryLabel, getCategoryMeta } from "@/utils/moduleCategories";
import AppCard from "@/components/cards/AppCard";
import { PieChart } from "@mui/x-charts";

const translations = {
  en: {
    greetingMorning: "Good Morning",
    greetingAfternoon: "Good Afternoon",
    greetingEvening: "Good Evening",
    overviewIntro: "Here’s a quick overview of your modules and engagement.",
    recompute: "Recompute",
    lastUpdated: "Last updated:",
    globalOverview: "Global Overview",
    trash: "Trash",
    totalEvents: "Total Events",
    unknownBusiness: "Unknown business",
    viewDetails: "View Details",
    eventBreakdown: "Events by Business",
    eventCount: "Events",
    close: "Close",
    users: "Users",
    businesses: "Businesses",
    noTotals: "No totals available.",
    modulesSectionTitle: "Modules & Analytics",
    allCategories: "All categories",
    coreModule: "Core Module",
    openModule: "Open",
    noPermission: "You currently do not have access to any modules.",
    contactSupport: "Please contact support to request access:",
  },
  ar: {
    greetingMorning: "صباح الخير",
    greetingAfternoon: "مساء الخير",
    greetingEvening: "مساء الخير",
    overviewIntro: "إليك نظرة عامة سريعة على وحداتك ومشاركاتك.",
    recompute: "إعادة الحساب",
    lastUpdated: "آخر تحديث:",
    globalOverview: "نظرة عامة عالمية",
    trash: "المحذوفات",
    totalEvents: "إجمالي الفعاليات",
    unknownBusiness: "شركة غير معروفة",
    viewDetails: "عرض التفاصيل",
    eventBreakdown: "الفعاليات حسب الشركة",
    eventCount: "الفعاليات",
    close: "إغلاق",
    users: "المستخدمون",
    businesses: "الشركات",
    noTotals: "لا توجد بيانات متاحة.",
    modulesSectionTitle: "الوحدات والتحليلات",
    allCategories: "كل الفئات",
    coreModule: "الوحدة الأساسية",
    openModule: "فتح",
    noPermission: "ليس لديك إذن للوصول إلى أي وحدات حالياً.",
    contactSupport: "يرجى الاتصال بالدعم لطلب الوصول:",
  },
};

const CATEGORY_ICON_MAP = {
  EventAvailableOutlined: EventAvailableOutlinedIcon,
  CampaignOutlined: CampaignOutlinedIcon,
  SportsEsportsOutlined: SportsEsportsOutlinedIcon,
  MarkEmailReadOutlined: MarkEmailReadOutlinedIcon,
  CategoryOutlined: CategoryOutlinedIcon,
};

function getCategoryIconComponent(categoryId) {
  const meta = getCategoryMeta(categoryId);
  return CATEGORY_ICON_MAP[meta?.iconName] || CategoryOutlinedIcon;
}

const buildDonutData = (data = [], emptyLabel = "Empty", donutColors = [], donutEmpty = "#e0e0e0") => {
  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  if (total === 0) {
    return {
      data: [
        {
          id: 0,
          label: emptyLabel,
          value: 1,
          color: donutEmpty,
          isEmpty: true,
        },
      ],
      total: 0,
    };
  }
  return {
    data: data.map((item, idx) => ({
      id: idx,
      label: item.name,
      ...item,
      color: donutColors.length ? donutColors[idx % donutColors.length] : undefined,
    })),
    total,
  };
};

const Clock = React.memo(function Clock({ language, align, color }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const locale = language === "ar" ? "ar-SA" : "en-GB";
  const formattedDate = now.toLocaleDateString(locale, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = now.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <Typography
      variant="body2"
      sx={{
        textAlign: align,
        color,
      }}>
      {formattedDate} · {formattedTime}
    </Typography>
  );
});

const DonutStat = React.memo(function DonutStat({ data, centerLabel, height = 180, animateCharts = false }) {
  const isEmpty = data.length === 1 && data[0]?.isEmpty;
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height,
        minWidth: 180,
      }}
    >
      <PieChart
        height={height}
        skipAnimation={!animateCharts}
        series={[
          {
            data,
            innerRadius: 50,
            outerRadius: 70,
            paddingAngle: 2,
            arcLabel: () => "",
          },
        ]}
        slotProps={{
          legend: { hidden: true, sx: { display: "none !important" } },
          tooltip: { trigger: isEmpty ? "none" : "item" },
        }}
      />
      <Typography
        variant="h6"
        sx={{
          fontWeight: "bold",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          whiteSpace: "nowrap",
        }}>
        {centerLabel}
      </Typography>
    </Box>
  );
});

const RenderTruncatedChip = React.memo(function RenderTruncatedChip({ label }) {
  return (
    <Tooltip title={label}>
      <Chip
        label={label}
        size="small"
        variant="outlined"
        sx={{
          maxWidth: 140,
          "& .MuiChip-label": {
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          },
        }}
      />
    </Tooltip>
  );
});

const DashboardModuleCard = React.memo(function DashboardModuleCard({
  mod,
  stats,
  language,
  t,
  themeMode,
  donutColors,
  donutEmpty,
  animateCharts,
  dir,
  onOpenModule,
}) {
  const totals = stats?.totals || {};
  const trash = stats?.trash || {};
  const totalEntries = Object.entries(totals);
  const trashEntries = Object.entries(trash);
  const totalsDonutInput = totalEntries.map(([k, v]) => ({
    name: k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
    value: Number(v || 0),
  }));
  const { data: donutData, total: donutTotal } = buildDonutData(
    totalsDonutInput,
    t.noTotals,
    donutColors,
    donutEmpty,
  );
  const modColor =
    resolveModuleColor(mod.color, themeMode) ||
    "#1976d2";
  const categoryLabel = getCategoryLabel(mod.category, language);

  return (
    <AppCard
      sx={{
        p: 3,
        borderRadius: 3,
        width: { xs: "100%", sm: 350 },
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        ...wrapTextBox,
      }}
    >
      <Box sx={{ ...wrapTextBox }}>
        {/* Header row: Icon + Title + Category Chip */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 1,
            mb: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            {getModuleIcon(mod.icon, {
              sx: { fontSize: 36, color: modColor, flexShrink: 0 },
            })}
            <Typography
              variant="h6"
              sx={{
                color: modColor,
                fontWeight: "bold",
                ...wrapTextBox,
              }}
            >
              {mod.labels?.[language] ||
                mod.labels?.en ||
                mod.key}
            </Typography>
          </Box>
          {categoryLabel && (
            <Chip
              size="small"
              label={categoryLabel}
              variant="outlined"
              sx={{ fontSize: "0.75rem", height: 24 }}
            />
          )}
        </Box>

        <Typography
          variant="body2"
          gutterBottom
          sx={{
            color: "text.secondary",
            ...wrapTextBox,
            minHeight: 44,
          }}
        >
          {mod.descriptions?.[language] || mod.descriptions?.en}
        </Typography>
        <Box sx={{ mt: 2 }}>
          <DonutStat
            data={donutData}
            centerLabel={toArabicDigits(donutTotal, language)}
            height={160}
            animateCharts={animateCharts}
          />
        </Box>
      </Box>
      <Box>
        <Divider sx={{ my: 2 }} />

        {/* Totals */}
        {totalEntries.length > 0 ? (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              flexWrap: "wrap",
              gap: 0.5,
            }}
          >
            {totalEntries.map(([k, v]) => (
              <RenderTruncatedChip
                key={k}
                label={toArabicDigits(
                  `${k
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (c) => c.toUpperCase())}: ${v}`,
                  language,
                )}
              />
            ))}
          </Stack>
        ) : (
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
            }}
          >
            {t.noTotals}
          </Typography>
        )}

        {/* Trash */}
        {trashEntries.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            {/* Trash title row */}
            <Box
              sx={{
                display: "flex",
                gap: 1,
                mb: 1,
              }}
            >
              <ICONS.delete fontSize="small" color="error" />
              <Typography variant="subtitle2" gutterBottom>
                {t.trash}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                justifyContent: "flex-start",
              }}
            >
              {trashEntries.map(([k, v]) => (
                <RenderTruncatedChip
                  key={k}
                  label={toArabicDigits(
                    `${k
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (c) => c.toUpperCase())}: ${v}`,
                    language,
                  )}
                />
              ))}
            </Box>
          </>
        )}

        {/* Open Action */}
        {mod.route && (
          <Button
            size="small"
            onClick={() => onOpenModule(mod.route)}
            sx={{
              textTransform: "none",
              mt: 2,
              fontWeight: 600,
              alignSelf: "flex-start",
              ...getStartIconSpacing(dir),
            }}
            endIcon={<ArrowForwardOutlinedIcon fontSize="small" />}
          >
            {mod.buttons?.[language] || mod.buttons?.en || t.openModule}
          </Button>
        )}
      </Box>
    </AppCard>
  );
});

export default function HomePage() {
  const { user } = useAuth();
  const { globalConfig } = useGlobalConfig();
  const { dir, align, language, t } = useI18nLayout(translations);
  const router = useRouter();
  const theme = useTheme();
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [insights, setInsights] = useState(null);
  const [businessModalDismissed, setBusinessModalDismissed] = useState(false);
  const [computing, setComputing] = useState(false);
  const [animateCharts, setAnimateCharts] = useState(true);
  const [showEventDetails, setShowEventDetails] = useState(false);

  // Module category filtering
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const { modules, loading: modulesLoading } = useModules(user, {
    fetchFullCatalog: true,
    filterByRole: true,
  });

  const { coreModules, groupedByCategory } = useModuleCategories(
    modules,
    groupByModuleCategory,
  );

  const coreModule = coreModules[0];
  const isCoreVisible =
    coreModule &&
    (!selectedCategoryId ||
      selectedCategoryId === coreModule.category?.id ||
      selectedCategoryId === "core");

  const { connected } = useDashboardSocket({
    onMetricsUpdate: (metrics) => {
      if (!metrics) return;
      const isAdmin =
        user?.role === "superadmin" || user?.role === "admin";
      const myBusinessId =
        user?.businessId ||
        user?.business?._id ||
        (typeof user?.business === "string" ? user.business : null);

      // Ignore socket updates for a different scope to prevent brief mismatches.
      if (isAdmin) {
        if (metrics.scope && metrics.scope !== "superadmin") return;
      } else if (user?.role === "business") {
        if (metrics.scope && metrics.scope !== "business") return;
        if (metrics.businessId && myBusinessId && metrics.businessId !== myBusinessId) {
          return;
        }
      }

      setInsights((prev) => {
        if (!prev) return metrics;
        const next = { ...prev, ...metrics };
        if (prev.modules || metrics.modules) {
          const mergedModules = { ...(prev.modules || {}) };
          if (metrics.modules) {
            Object.entries(metrics.modules).forEach(([key, val]) => {
              mergedModules[key] = {
                ...(prev.modules?.[key] || {}),
                ...(val || {}),
              };
            });
          }
          next.modules = mergedModules;
        }
        return next;
      });
    },
  });

  useEffect(() => {
    if (user?.role === "business" && !businessModalDismissed) {
      checkBusinessExists();
    }
  }, [user, businessModalDismissed]);

  // Animate charts once, then keep them static to avoid flicker on re-renders
  useEffect(() => {
    const timer = setTimeout(() => setAnimateCharts(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Load insights
  useEffect(() => {
    (async () => {
      try {
        const res = await getDashboardInsights();
        setInsights(res);
      } catch (err) {
        console.error("Failed to load dashboard insights:", err);
      }
    })();
  }, []);

  const handleRecomputeStats = async () => {
    if (computing) return;
    setComputing(true);
    const updated = await refreshDashboardInsights();
    if (updated && updated.modules) {
      setInsights(updated);
    }
    setComputing(false);
  };

  const checkBusinessExists = async () => {
    if (user?.role !== "business") return;

    // If user already has business data attached, don't block them.
    if (user?.business?._id || user?.businessId) return;

    const businesses = await getAllBusinesses();

    const myBusiness = businesses.find((b) => {
      // New schema
      if (Array.isArray(b.owners)) {
        return b.owners.some((o) =>
          typeof o === "string" ? o === user.id : o._id === user.id,
        );
      }

      // Legacy fallback
      if (b.owner) {
        const ownerId = typeof b.owner === "string" ? b.owner : b.owner._id;
        return ownerId === user.id;
      }

      return false;
    });

    if (!myBusiness) {
      setShowBusinessModal(true);
    }
  };

  const handleOpenModule = useCallback((route) => {
    if (route) router.push(route);
  }, [router]);

  const { modules: moduleStats = {} } = insights || {};
  const eventBusinessBreakdown = moduleStats.global?.totals?.eventsByBusiness || [];

  const hours = new Date().getHours();
  const greeting =
    hours < 12
      ? t.greetingMorning
      : hours < 18
        ? t.greetingAfternoon
        : t.greetingEvening;

  const donutColors = theme.palette.home.donutColors;
  const donutEmpty = theme.palette.home.donutEmpty;
  const totalModuleCount = modules.length;

  const displayedGroups = selectedCategoryId
    ? groupedByCategory.filter((group) => group.category.id === selectedCategoryId)
    : groupedByCategory;

  // Check if core module has its own category that is not covered by any group
  const isCoreOrphan =
    coreModule &&
    isCoreVisible &&
    !displayedGroups.some((g) => g.category.id === coreModule.category?.id);

  return (
    <Box sx={{ pb: 6, bgcolor: "background.default", minHeight: "100vh" }}>
      <Container
        dir={dir}
        maxWidth={false}
        sx={{ px: { xs: 2, md: 3, lg: 4 } }}
      >
        {/* Welcome Header */}
        <AppCard
          sx={{
            p: 4,
            mb: 4,
            borderRadius: 3,
            color: "common.white",
            position: "relative",
            overflow: "hidden",
            background: theme.palette.home.heroGradient,
            boxShadow: theme.palette.home.heroShadow,
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              background: theme.palette.home.heroOverlayBefore,
              pointerEvents: "none",
            },
            "&::after": {
              content: '""',
              position: "absolute",
              right: -120,
              top: -120,
              width: 320,
              height: 320,
              borderRadius: "50%",
              background: theme.palette.home.heroOverlayAfter,
              pointerEvents: "none",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Greeting / Info */}
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  textAlign: align,
                  color: "common.white",
                  letterSpacing: "0.3px",
                  textShadow: theme.palette.home.heroTextShadow,
                  fontWeight: 600,
                  lineHeight: 1.15,
                }}>
                {greeting},{" "}
                <Typography
                  component="span"
                  variant="h3"
                  sx={{
                    display: "inline-block",
                    fontWeight: 800,
                    lineHeight: 1.1,
                  }}
                >
                  {user?.name || "Guest"}
                </Typography>
              </Typography>
              <Clock language={language} align={align} color={theme.palette.home.heroTextSecondary} />
              <Typography
                variant="body1"
                sx={{
                  textAlign: align,
                  mt: 2,
                  color: theme.palette.home.heroTextSecondary,
                }}>
                {t.overviewIntro}
              </Typography>
            </Box>
            {/* Recompute button + last updated */}
            <Box
              dir={dir}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: { xs: "flex-start", sm: "flex-end" },
                gap: 0.5,
                width: { xs: "100%", sm: "auto" },
              }}
            >
              {connected ? (
                <Chip
                  label="Live"
                  icon={<ICONS.flash color="secondary" fontSize="small" />}
                  color="success"
                  size="small"
                  sx={{ ml: 1 }}
                />
              ) : (
                <Chip
                  label="Offline"
                  color="error"
                  size="small"
                  sx={{ ml: 1 }}
                />
              )}

              <Button
                variant="contained"
                fullWidth
                color="secondary"
                startIcon={
                  computing ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <ICONS.refresh />
                  )
                }
                disabled={computing}
                onClick={handleRecomputeStats}
                sx={{
                  width: { xs: "100%", sm: "auto" },
                  mt: 1,
                  ...getStartIconSpacing(dir),
                }}
              >
                {t.recompute}
              </Button>

              {insights?.lastUpdated && (
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.home.heroTextTertiary,
                    textAlign: { xs: "left", sm: "right" },
                    mt: 1,
                  }}
                >
                  {t.lastUpdated}{" "}
                  {formatDateTimeWithLocale(insights.lastUpdated, language === "ar" ? "ar-SA" : "en-GB")}
                </Typography>
              )}
            </Box>
          </Box>
        </AppCard>

        {(!insights || modulesLoading) ? (
          <LoadingState />
        ) : modules?.length === 0 ? (
          <Stack spacing={2} sx={{ mt: 5, alignItems: "center" }}>
            <SupportAgentIcon color="primary" sx={{ fontSize: 64 }} />
            <Typography variant="h6" sx={{ textAlign: "center" }}>
              {t.noPermission}
            </Typography>
            <Typography variant="body1" sx={{ color: "text.secondary", textAlign: "center" }}>
              {t.contactSupport}
            </Typography>

            {(globalConfig?.support?.email || globalConfig?.support?.phone) && (
              <Stack spacing={1} sx={{ textAlign: "center", alignItems: "center" }}>
                {globalConfig?.support?.email && (
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <EmailOutlinedIcon fontSize="small" color="action" />
                    <Typography variant="body2">{globalConfig.support.email}</Typography>
                  </Stack>
                )}
                {globalConfig?.support?.phone && (
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <PhoneOutlinedIcon fontSize="small" color="action" />
                    <Typography variant="body2">{globalConfig.support.phone}</Typography>
                  </Stack>
                )}
              </Stack>
            )}
          </Stack>
        ) : (
          <>
            {/* Global Overview */}
            {moduleStats.global && (
              <AppCard sx={{ p: 3, mt: 2, mb: 4, borderRadius: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Avatar sx={{ bgcolor: "info.main", mx: 1 }}>
                    <ICONS.business />
                  </Avatar>
                  <Typography variant="h6">{t.globalOverview}</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {/* Donut Charts */}
                {(() => {
                  const userTotals = moduleStats.global.totals?.users || {};
                  const roleKeys = ["superadmin", "admin", "business", "staff"];
                  const roleLabel = (role) =>
                    role === "superadmin"
                      ? "Super Admins"
                      : role.charAt(0).toUpperCase() + role.slice(1);

                  const userRoleData = roleKeys.map((role) => ({
                    name: roleLabel(role),
                    value: Number(userTotals?.[role] || 0),
                  }));
                  const { data: usersDonut, total: usersTotal } = buildDonutData(
                    userRoleData,
                    t.noTotals,
                    donutColors,
                    donutEmpty,
                  );

                  const businessesDonut = buildDonutData(
                    [
                      {
                        name: t.businesses,
                        value: moduleStats.global.totals?.businesses ?? 0,
                      },
                    ],
                    t.noTotals,
                    donutColors,
                    donutEmpty,
                  );

                  const { data: eventsDonut, total: eventsTotal } = buildDonutData(
                    eventBusinessBreakdown.map((business) => ({
                      name: business.name || t.unknownBusiness,
                      value: Number(business.count || 0),
                    })),
                    t.noTotals,
                  );

                  return (
                    <Grid
                      container
                      spacing={2}
                      sx={{
                        justifyContent: "center",
                        mt: 2,
                      }}>
                      <Grid
                        size={{
                          xs: 12,
                          md: 4,
                        }}>
                        <AppCard
                          sx={{
                            p: 2,
                            height: "100%",
                            width: "100%",
                            textAlign: "center",
                          }}
                        >
                          <Typography variant="subtitle1" gutterBottom>
                            {t.users}
                          </Typography>
                          <DonutStat
                            data={usersDonut}
                            centerLabel={toArabicDigits(usersTotal, language)}
                            height={200}
                            animateCharts={animateCharts}
                          />
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{
                              flexWrap: "wrap",
                              justifyContent: "center",
                              mt: 1,
                            }}>
                            {roleKeys.map((role) => (
                              <RenderTruncatedChip
                                key={role}
                                label={toArabicDigits(`${roleLabel(role)}: ${Number(userTotals?.[role] || 0)
                                  }`, language)}
                              />
                            ))}
                          </Stack>
                        </AppCard>
                      </Grid>
                      <Grid
                        size={{
                          xs: 12,
                          md: 4,
                        }}>
                        <AppCard
                          sx={{
                            p: 2,
                            height: "100%",
                            width: "100%",
                            textAlign: "center",
                          }}
                        >
                          <Typography variant="subtitle1" gutterBottom>
                            {t.businesses}
                          </Typography>
                          <DonutStat
                            data={businessesDonut.data}
                            centerLabel={toArabicDigits(businessesDonut.total, language)}
                            height={200}
                            animateCharts={animateCharts}
                          />
                        </AppCard>
                      </Grid>
                      <Grid
                        size={{
                          xs: 12,
                          md: 4,
                        }}>
                        <AppCard
                          sx={{
                            p: 2,
                            height: "100%",
                            width: "100%",
                            textAlign: "center",
                          }}
                        >
                          <Typography variant="subtitle1" gutterBottom>
                            {t.totalEvents}
                          </Typography>
                          <DonutStat
                            data={eventsDonut}
                            centerLabel={toArabicDigits(eventsTotal, language)}
                            height={200}
                            animateCharts={animateCharts}
                          />
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setShowEventDetails(true)}
                            sx={{
                              mt: 1,
                              width: "50%",
                              alignSelf: "center",
                            }}
                          >
                            {t.viewDetails}
                          </Button>
                        </AppCard>
                      </Grid>
                    </Grid>
                  );
                })()}
              </AppCard>
            )}

            {/* Categorized Modules Section */}
            <Box sx={{ mt: 4 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight="bold" sx={{ textAlign: align }}>
                  {t.modulesSectionTitle}
                </Typography>
              </Box>

              {/* Category Filter Chips */}
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mb: 4, gap: 1 }}>
                <Chip
                  label={`${t.allCategories} (${totalModuleCount})`}
                  clickable
                  onClick={() => setSelectedCategoryId(null)}
                  color={!selectedCategoryId ? "primary" : "default"}
                  variant={!selectedCategoryId ? "filled" : "outlined"}
                />
                {groupedByCategory.map((group) => {
                  const isCoreInThisCategory =
                    coreModule && coreModule.category?.id === group.category.id;
                  const count =
                    group.items.length + (isCoreInThisCategory ? 1 : 0);
                  return (
                    <Chip
                      key={group.category.id}
                      label={`${getCategoryLabel(group.category, language)} (${count})`}
                      clickable
                      onClick={() =>
                        setSelectedCategoryId(
                          selectedCategoryId === group.category.id ? null : group.category.id,
                        )
                      }
                      color={group.category.id === selectedCategoryId ? "primary" : "default"}
                      variant={group.category.id === selectedCategoryId ? "filled" : "outlined"}
                    />
                  );
                })}
              </Stack>

              <Box>
                {/* If coreModule is orphan (not part of any rendered category group) */}
                {isCoreOrphan && (
                  <Box sx={{ mb: 6 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 1.5,
                        mb: 2,
                      }}
                    >
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                        <Box
                          sx={{
                            width: 42,
                            height: 42,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            color: "primary.main",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <EventAvailableOutlinedIcon fontSize="small" />
                        </Box>
                        <Typography variant="h6" fontWeight="bold">
                          {t.coreModule}
                        </Typography>
                      </Stack>
                      <Chip size="small" label="1" color="primary" variant="outlined" />
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 3,
                        justifyContent: { xs: "center", sm: "flex-start" },
                      }}
                    >
                      <DashboardModuleCard
                        key={coreModule.key}
                        mod={coreModule}
                        stats={moduleStats[coreModule.key]}
                        language={language}
                        t={t}
                        themeMode={theme.palette.mode}
                        donutColors={donutColors}
                        donutEmpty={donutEmpty}
                        animateCharts={animateCharts}
                        dir={dir}
                        onOpenModule={handleOpenModule}
                      />
                    </Box>
                  </Box>
                )}

                {/* Render category sections */}
                {displayedGroups.map((group) => {
                  const meta = getCategoryMeta(group.category.id);
                  const CategoryIcon = getCategoryIconComponent(group.category.id);
                  const categoryLabel = getCategoryLabel(group.category, language);
                  const isCoreInCategory =
                    coreModule &&
                    coreModule.category?.id === group.category.id &&
                    (!selectedCategoryId || selectedCategoryId === group.category.id);

                  return (
                    <Box key={group.category.id} sx={{ mb: 6 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: 1.5,
                          mb: 2,
                        }}
                      >
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                          <Box
                            sx={{
                              width: 42,
                              height: 42,
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.primary.main, 0.08),
                              color: "primary.main",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <CategoryIcon fontSize="small" />
                          </Box>
                          <Box>
                            <Typography variant="h6" fontWeight="bold" sx={{ textAlign: align }}>
                              {categoryLabel}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: align }}>
                              {meta.descriptions?.[language] ?? meta.descriptions?.en ?? ""}
                            </Typography>
                          </Box>
                        </Stack>
                        <Chip
                          size="small"
                          label={`${group.items.length + (isCoreInCategory ? 1 : 0)}`}
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                      <Divider sx={{ mb: 3 }} />

                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 3,
                          justifyContent: { xs: "center", sm: "flex-start" },
                        }}
                      >
                        {isCoreInCategory && (
                          <DashboardModuleCard
                            key={coreModule.key}
                            mod={coreModule}
                            stats={moduleStats[coreModule.key]}
                            language={language}
                            t={t}
                            themeMode={theme.palette.mode}
                            donutColors={donutColors}
                            donutEmpty={donutEmpty}
                            animateCharts={animateCharts}
                            dir={dir}
                            onOpenModule={handleOpenModule}
                          />
                        )}
                        {group.items.map((mod) => (
                          <DashboardModuleCard
                            key={mod.key}
                            mod={mod}
                            stats={moduleStats[mod.key]}
                            language={language}
                            t={t}
                            themeMode={theme.palette.mode}
                            donutColors={donutColors}
                            donutEmpty={donutEmpty}
                            animateCharts={animateCharts}
                            dir={dir}
                            onOpenModule={handleOpenModule}
                          />
                        ))}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </>
        )}

        {/* Business Alert Modal */}
        <BusinessAlertModal
          open={showBusinessModal}
          onClose={() => setShowBusinessModal(false)}
          onNavigate={() => {
            router.push("/cms/settings/business");
            setShowBusinessModal(false);
          }}
        />

        <Dialog
          open={showEventDetails}
          onClose={() => setShowEventDetails(false)}
          fullWidth
          maxWidth="sm"
          dir={dir}
        >
          <DialogTitle>{t.eventBreakdown}</DialogTitle>
          <DialogContent dividers>
            {eventBusinessBreakdown.length > 0 ? (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell align={align}>{t.businesses}</TableCell>
                    <TableCell align={align}>{t.eventCount}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {eventBusinessBreakdown.map((business) => (
                    <TableRow key={business.businessId || business.name}>
                      <TableCell align={align}>
                        {business.name || t.unknownBusiness}
                      </TableCell>
                      <TableCell align={align}>
                        {toArabicDigits(Number(business.count || 0), language)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Typography color="text.secondary">{t.noTotals}</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowEventDetails(false)}>{t.close}</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
