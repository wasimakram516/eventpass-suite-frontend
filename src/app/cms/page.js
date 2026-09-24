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
  IconButton,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
} from "@mui/material";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
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
import React, { useEffect, useState, useMemo } from "react";
import { useTheme, alpha } from "@mui/material/styles";
import {
  getDashboardInsights,
  refreshDashboardInsights,
} from "@/services/dashboardService";
import LoadingState from "@/components/LoadingState";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import { toArabicDigits } from "@/utils/arabicDigits";
import { getAllBusinesses } from "@/services/businessService";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { formatDateTimeWithLocale } from "@/utils/dateUtils";
import useDashboardSocket from "@/hooks/useDashboardSocket";
import { useModules, useModuleCategories } from "@/hooks/useModules";
import { groupByModuleCategory, getCategoryLabel, getCategoryMeta } from "@/utils/moduleCategories";
import AppCard from "@/components/cards/AppCard";
import ModuleCard from "@/components/modules/ModuleCard";
import { getModuleWorkingRoute } from "@/utils/moduleWorkingRoutes";
import DonutStat from "../../components/chart/DonutStat";
import { buildDonutData } from "@/utils/charts";

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
    current: "Current",
    upcoming: "Upcoming",
    expired: "Expired",
    registrations: "Registrations",
    paid: "Paid",
    free: "Free",
    eventregType: "EventReg",
    checkinType: "Check-In",
    checkoutType: "Checkout",
    digipassType: "DigiPass",
    close: "Close",
    users: "Users",
    businesses: "Businesses",
    noTotals: "No totals available.",
    searchBusinesses: "Search businesses...",
    noMatchingBusinesses: "No matching businesses.",
    modulesSectionTitle: "Modules & Analytics",
    allCategories: "All categories",
    coreModule: "Core Module",
    openModule: "Open",
    paymentDashboard: "Payment Dashboard",
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
    current: "حالية",
    upcoming: "قادمة",
    expired: "منتهية",
    registrations: "التسجيلات",
    paid: "مدفوعة",
    free: "مجانية",
    eventregType: "EventReg",
    checkinType: "تسجيل الدخول",
    checkoutType: "الدفع",
    digipassType: "التمرير الرقمي",
    close: "إغلاق",
    users: "المستخدمون",
    businesses: "الشركات",
    noTotals: "لا توجد بيانات متاحة.",
    searchBusinesses: "ابحث عن الشركات...",
    noMatchingBusinesses: "لا توجد شركات مطابقة.",
    modulesSectionTitle: "الوحدات والتحليلات",
    allCategories: "كل الفئات",
    coreModule: "الوحدة الأساسية",
    openModule: "فتح",
    paymentDashboard: "لوحة المدفوعات",
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

// export const buildDonutData = (data = [], emptyLabel = "Empty", donutColors = [], donutEmpty = "#e0e0e0") => {
//   const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
//   if (total === 0) {
//     return {
//       data: [
//         {
//           id: 0,
//           label: emptyLabel,
//           value: 1,
//           color: donutEmpty,
//           isEmpty: true,
//         },
//       ],
//       total: 0,
//     };
//   }
//   return {
//     data: data.map((item, idx) => ({
//       id: idx,
//       label: item.name,
//       ...item,
//       color: donutColors.length ? donutColors[idx % donutColors.length] : undefined,
//     })),
//     total,
//   };
// };

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

const dashboardStatCardSx = {
  p: 2.5,
  height: "100%",
  width: "100%",
  textAlign: "center",
  overflow: "hidden",
  borderRadius: "14px",
  border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
  borderInlineStart: (theme) => `6px solid ${alpha(theme.palette.primary.main, 0.16)}`,
  boxShadow: (theme) => `0 4px 14px ${alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.18 : 0.05)}`,
  transition: "border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
  "&:hover": {
    borderColor: (theme) => alpha(theme.palette.primary.main, 0.4),
    transform: "translateY(-2px)",
    boxShadow: (theme) => `0 10px 22px ${alpha(theme.palette.primary.main, 0.12)}`,
  },
};

const DashboardStatPreview = React.memo(function DashboardStatPreview({
  data,
  total,
  language,
  animateCharts,
  legend = [],
}) {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const visibleLegend = legend.filter((item) => !item.isEmpty).slice(0, 5);
  const hiddenLegend = legend.filter((item) => !item.isEmpty).slice(5);
  const hasLegend = visibleLegend.length > 0;

  return (
    <Box
      sx={{
        mt: 1.5,
        p: 1.5,
        borderRadius: "12px",
        bgcolor: alpha(primary, 0.04),
        border: `1px solid ${alpha(primary, 0.1)}`,
        display: "grid",
        alignItems: "center",
        gridTemplateColumns: hasLegend ? "112px minmax(0, 1fr)" : "1fr",
        columnGap: hasLegend ? 1.5 : 0,
      }}
    >
      <Box sx={{ display: "grid", placeItems: "center" }}>
        <DonutStat
          data={data}
          width={hasLegend ? 112 : 152}
          height={hasLegend ? 112 : 152}
          minWidth={0}
          innerRadius={hasLegend ? 34 : 44}
          outerRadius={hasLegend ? 48 : 64}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          centerLabel={toArabicDigits(total, language)}
          centerLabelSx={{ fontSize: "1.2rem", fontVariantNumeric: "tabular-nums" }}
          animateCharts={animateCharts}
        />
      </Box>

      {hasLegend && (
        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
          {visibleLegend.map((item) => {
            const share = total ? Number(item.value || 0) / total : 0;
            return (
              <Box key={item.name} sx={{ minWidth: 0, px: 1, py: 0.5, mx: -1, borderRadius: 1.5 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: item.color || primary, flexShrink: 0 }} />
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ flex: 1, minWidth: 0 }}>
                    {item.name}
                  </Typography>
                  <Typography variant="caption" fontWeight={700} sx={{ fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                    {toArabicDigits(item.value, language)}
                  </Typography>
                </Stack>
                <Box sx={{ mt: 0.5, marginInlineStart: 2, height: 3, borderRadius: 2, bgcolor: alpha(primary, 0.1), overflow: "hidden" }}>
                  <Box sx={{ width: `${share * 100}%`, minWidth: share > 0 ? 4 : 0, height: "100%", bgcolor: item.color || primary, borderRadius: 2 }} />
                </Box>
              </Box>
            );
          })}
          {hiddenLegend.length > 0 && (
            <Tooltip
              arrow
              title={hiddenLegend.map((item) => `${item.name}: ${toArabicDigits(item.value, language)}`).join("\n")}
            >
              <Typography variant="caption" fontWeight={700} sx={{ color: "primary.main", width: "fit-content" }}>
                +{toArabicDigits(hiddenLegend.length, language)}
              </Typography>
            </Tooltip>
          )}
        </Stack>
      )}
    </Box>
  );
});

// export const DonutStat = React.memo(function DonutStat({ data, centerLabel, height = 180, animateCharts = false }) {
//   const isEmpty = data.length === 1 && data[0]?.isEmpty;
//   return (
//     <Box
//       sx={{
//         position: "relative",
//         width: "100%",
//         height,
//         minWidth: 180,
//       }}
//     >
//       <PieChart
//         height={height}
//         skipAnimation={!animateCharts}
//         series={[
//           {
//             data,
//             innerRadius: 50,
//             outerRadius: 70,
//             paddingAngle: 2,
//             arcLabel: () => "",
//           },
//         ]}
//         slotProps={{
//           legend: { hidden: true, sx: { display: "none !important" } },
//           tooltip: { trigger: isEmpty ? "none" : "item" },
//         }}
//       />
//       <Typography
//         variant="h6"
//         sx={{
//           fontWeight: "bold",
//           position: "absolute",
//           top: "50%",
//           left: "50%",
//           transform: "translate(-50%, -50%)",
//           whiteSpace: "nowrap",
//         }}>
//         {centerLabel}
//       </Typography>
//     </Box>
//   );
// });

export default function HomePage() {
  const { user, setSelectedBusiness } = useAuth();
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
  const [eventBusinessSearch, setEventBusinessSearch] = useState("");
  const [businessesInDrawerOrder, setBusinessesInDrawerOrder] = useState([]);

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

  useEffect(() => {
    getAllBusinesses()
      .then((businesses) => setBusinessesInDrawerOrder(Array.isArray(businesses) ? businesses : []))
      .catch(() => setBusinessesInDrawerOrder([]));
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

      const renderModuleCard = (mod) => {
    const key = String(mod.key || "");
    const stats = moduleStats[key] ?? moduleStats[key.toLowerCase()] ?? {};

    return (
      <ModuleCard
        key={mod.key}
        module={mod}
        language={language}
        categoryLabel={getCategoryLabel(mod.category, language)}
        stats={stats}
        statsLabels={{ noTotals: t.noTotals, trash: t.trash }}
        animateCharts={animateCharts}
        primaryAction={getModuleWorkingRoute(mod) ? {
          label: mod.buttons?.[language] || mod.buttons?.en || t.openModule,
          href: getModuleWorkingRoute(mod),
        } : undefined}
        secondaryAction={key.toLowerCase() === "checkout" ? {
          label: t.paymentDashboard,
          href: "/cms/modules/checkout/payments",
        } : undefined}
        // stackActions={key.toLowerCase() === "checkout"}
      />
    );
  };

  const { modules: moduleStats = {} } = insights || {};
  const eventBusinessBreakdown = moduleStats.global?.totals?.eventsByBusiness || [];
  const orderedEventBusinesses = useMemo(() => {
    const indexByBusinessId = new Map(
      businessesInDrawerOrder.map((business, index) => [String(business._id), index]),
    );
    return [...eventBusinessBreakdown].sort((a, b) =>
      (indexByBusinessId.get(String(a.businessId)) ?? Number.MAX_SAFE_INTEGER) -
      (indexByBusinessId.get(String(b.businessId)) ?? Number.MAX_SAFE_INTEGER),
    );
  }, [businessesInDrawerOrder, eventBusinessBreakdown]);
  const visibleEventBusinesses = useMemo(() => {
    const query = eventBusinessSearch.trim().toLowerCase();
    if (!query) return orderedEventBusinesses;
    return orderedEventBusinesses.filter((business) =>
      `${business.name || ""} ${business.businessSlug || ""}`.toLowerCase().includes(query),
    );
  }, [eventBusinessSearch, orderedEventBusinesses]);
  const eventStatusCounts = moduleStats.global?.totals?.eventStatusCounts || {};
  const eventStatusLabel = (status) => t[status] || status;
  const eventStatusColor = (status) => (
    status === "expired" ? "error" : status === "current" ? "primary" : "success"
  );
  const eventTypeLabel = (eventType) => ({
    public: t.eventregType,
    closed: t.checkinType,
    checkout: t.checkoutType,
    digipass: t.digipassType,
  }[eventType] || eventType || "Event");

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
                    donutColors,
                    donutEmpty,
                  );
                  const eventLegend = [...eventsDonut]
                    .filter((item) => !item.isEmpty)
                    .sort((a, b) => Number(b.value || 0) - Number(a.value || 0));

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
                          sx={dashboardStatCardSx}
                        >
                          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                            {t.users}
                          </Typography>
                          <DashboardStatPreview
                            data={usersDonut}
                            total={usersTotal}
                            language={language}
                            animateCharts={animateCharts}
                            legend={usersDonut}
                          />
                        </AppCard>
                      </Grid>
                      <Grid
                        size={{
                          xs: 12,
                          md: 4,
                        }}>
                        <AppCard
                          sx={dashboardStatCardSx}
                        >
                          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                            {t.businesses}
                          </Typography>
                          <DashboardStatPreview
                            data={businessesDonut.data}
                            total={businessesDonut.total}
                            language={language}
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
                          sx={dashboardStatCardSx}
                        >
                          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                            {t.totalEvents}
                          </Typography>
                          <DashboardStatPreview
                            data={eventsDonut}
                            total={eventsTotal}
                            language={language}
                            animateCharts={animateCharts}
                            legend={eventLegend}
                          />
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setShowEventDetails(true)}
                            sx={{
                              mt: 1,
                              width: "50%",
                              alignSelf: "center",
                              textTransform: "none",
                              fontWeight: 700,
                              borderRadius: 2,
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
                    <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 3 }}>
                      <Box
                        key={coreModule.key}
                        sx={{ display: "flex", flex: "1 1 560px", minWidth: 0, maxWidth: { xs: "100%", lg: "calc(50% - 12px)" } }}
                      >
                        {renderModuleCard(coreModule)}
                      </Box>
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
                  const categoryModuleCount = group.items.length + (isCoreInCategory ? 1 : 0);
                  const isSingleModuleCategory = categoryModuleCount === 1;

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
                      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 3 }}>
                        {isCoreInCategory && (
                          <Box
                            key={coreModule.key}
                            sx={{ display: "flex", flex: "1 1 560px", minWidth: 0, maxWidth: { xs: "100%", lg: isSingleModuleCategory ? "100%" : "calc(50% - 12px)" } }}
                          >
                            {renderModuleCard(coreModule)}
                          </Box>
                        )}
                        {group.items.map((mod) => (
                          <Box
                            key={mod.key}
                            sx={{ display: "flex", flex: "1 1 560px", minWidth: 0, maxWidth: { xs: "100%", lg: isSingleModuleCategory ? "100%" : "calc(50% - 12px)" } }}
                          >
                            {renderModuleCard(mod)}
                          </Box>
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
          onClose={() => {
            setShowEventDetails(false);
            setEventBusinessSearch("");
          }}
          fullWidth
          maxWidth="md"
          dir={dir}
          PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
        >
          <DialogTitle sx={{ px: 3, py: 2.5, color: "common.white", textAlign: align, background: (theme) => theme.palette.home.heroGradient }}>
            <Typography variant="h6" fontWeight={750}>{t.eventBreakdown}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.25 }}>
              {toArabicDigits(`${eventBusinessBreakdown.reduce((sum, business) => sum + Number(business.count || 0), 0)} ${t.eventCount}`, language)}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 4, sm: 4.5 }, bgcolor: "action.hover" }}>
            {eventBusinessBreakdown.length > 0 ? (
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", gap: 0.75, justifyContent: align === "right" ? "flex-end" : "flex-start" }}>
                  {["current", "upcoming", "expired"].map((status) => (
                    <Chip key={status} size="small" color={eventStatusColor(status)} variant="outlined" label={toArabicDigits(`${eventStatusLabel(status)}: ${Number(eventStatusCounts[status] || 0)}`, language)} />
                  ))}
                </Stack>
                <TextField
                  fullWidth
                  size="small"
                  value={eventBusinessSearch}
                  onChange={(event) => setEventBusinessSearch(event.target.value)}
                  placeholder={t.searchBusinesses}
                  inputProps={{ "aria-label": t.searchBusinesses }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <ICONS.search fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                {visibleEventBusinesses.map((business) => (
                  <Accordion
                    key={business.businessId || business.name}
                    disableGutters
                    elevation={0}
                    sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px !important", overflow: "hidden", "&:before": { display: "none" }, "&.Mui-expanded": { mt: 1.5, mb: 0 } }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2, minHeight: 76, "&.Mui-expanded": { minHeight: 76 }, "& .MuiAccordionSummary-content": { my: 1.25 }, "& .MuiAccordionSummary-content.Mui-expanded": { my: 1.25 } }}>
                      <Stack direction={dir === "rtl" ? "row-reverse" : "row"} spacing={1.25} alignItems="center" justifyContent="space-between" sx={{ width: "100%", minWidth: 0, pr: 1, textAlign: align }}>
                        <Avatar sx={{ width: 40, height: 40, bgcolor: "primary.main", fontWeight: 700 }}>
                          {(business.name || t.unknownBusiness).charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography fontWeight={750} noWrap>{business.name || t.unknownBusiness}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {toArabicDigits(`${Number(business.current || 0)} ${t.current} · ${Number(business.upcoming || 0)} ${t.upcoming} · ${Number(business.expired || 0)} ${t.expired}`, language)}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          color="primary"
                          label={toArabicDigits(Number(business.count || 0), language)}
                          sx={{ alignSelf: "center", flexShrink: 0, marginInlineStart: "auto" }}
                        />
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: { xs: 1, sm: 1.5 }, borderTop: "1px solid", borderColor: "divider", bgcolor: "background.default" }}>
                      <Stack spacing={0.75}>
                        {(business.events || []).map((event) => (
                          <Box key={event._id || event.slug} sx={{ p: { xs: 1.25, sm: 1.5 }, borderRadius: 1.5, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", textAlign: align, transition: "border-color 160ms ease", "&:hover": { borderColor: "common.black" } }}>
                            <Box sx={{ display: "flex", flexDirection: dir === "rtl" ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "flex-start", gap: 1, flexWrap: "wrap" }}>
                              <Box sx={{ minWidth: 0, flex: "1 1 180px" }}>
                                <Typography fontWeight={750} noWrap>{event.name || event.slug}</Typography>
                                <Typography variant="caption" color="text.secondary">{eventTypeLabel(event.eventType)} · {event.slug}</Typography>
                              </Box>
                              <Box sx={{ display: "flex", flexDirection: dir === "rtl" ? "row-reverse" : "row", flexWrap: "wrap", gap: 1, alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                                <Chip size="small" color={eventStatusColor(event.status)} variant="outlined" label={eventStatusLabel(event.status)} />
                                <Chip size="small" variant="outlined" label={eventTypeLabel(event.eventType)} />
                                {event.slug && ["public", "closed", "checkout", "digipass"].includes(event.eventType) && (
                                  <Tooltip title={t.openModule}>
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      aria-label={t.openModule}
                                      onClick={(clickEvent) => {
                                        clickEvent.stopPropagation();
                                        const moduleByEventType = {
                                          public: "eventreg",
                                          closed: "checkin",
                                          checkout: "checkout",
                                          digipass: "digipass",
                                        };
                                        if (business.businessSlug) {
                                          setSelectedBusiness(business.businessSlug);
                                        }
                                        router.push(`/cms/modules/${moduleByEventType[event.eventType]}/events?search=${encodeURIComponent(event.slug)}`);
                                      }}
                                      sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, "&:hover": { borderColor: "primary.main" } }}
                                    >
                                      <OpenInNewIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </Box>
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) auto" }, columnGap: 2, mt: 1.25, color: "text.secondary" }}>
                              <Stack spacing={0.6} sx={{ minWidth: 0 }}>
                                <Typography variant="body2" sx={{ display: "flex", flexDirection: dir === "rtl" ? "row-reverse" : "row", gap: 0.75, alignItems: "center", minWidth: 0 }}>
                                  <ICONS.event fontSize="small" />
                                  {event.startDate ? formatDateTimeWithLocale(event.startDate, language === "ar" ? "ar-SA" : "en-GB") : "—"}{event.endDate ? ` → ${formatDateTimeWithLocale(event.endDate, language === "ar" ? "ar-SA" : "en-GB")}` : ""}
                                </Typography>
                                <Typography variant="body2" sx={{ display: "flex", flexDirection: dir === "rtl" ? "row-reverse" : "row", gap: 0.75, alignItems: "center", minWidth: 0 }}>
                                  <ICONS.location fontSize="small" />{event.venue || "—"}
                                </Typography>
                              </Stack>
                              <Typography variant="body2" sx={{ display: "flex", flexDirection: dir === "rtl" ? "row-reverse" : "row", gap: 0.75, alignItems: "center", whiteSpace: "nowrap", justifySelf: { sm: "end" }, alignSelf: "end" }}>
                                <ICONS.people fontSize="small" />{t.registrations}: {toArabicDigits(Number(event.registrations || 0), language)}{event.capacity ? ` / ${toArabicDigits(Number(event.capacity), language)}` : ""}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                ))}
                {visibleEventBusinesses.length === 0 && (
                  <Typography color="text.secondary" sx={{ py: 3, textAlign: align }}>
                    {t.noMatchingBusinesses}
                  </Typography>
                )}
              </Stack>
            ) : (
              <Typography color="text.secondary">{t.noTotals}</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setShowEventDetails(false);
              setEventBusinessSearch("");
            }}>{t.close}</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
