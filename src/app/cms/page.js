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
} from "@mui/material";
import { useAuth } from "@/contexts/AuthContext";
import BusinessAlertModal from "@/components/modals/BusinessAlertModal";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  getDashboardInsights,
  refreshDashboardInsights,
} from "@/services/dashboardService";
import { getModules } from "@/services/moduleService";
import LoadingState from "@/components/LoadingState";
import { wrapTextBox } from "@/utils/wrapTextStyles";
import { getModuleIcon } from "@/utils/iconMapper";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import { getAllBusinesses } from "@/services/businessService";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { formatDateTimeWithLocale } from "@/utils/dateUtils";
import useDashboardSocket from "@/hooks/useDashboardSocket";
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
    users: "Users",
    businesses: "Businesses",
    noTotals: "No totals available.",
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
    users: "المستخدمون",
    businesses: "الشركات",
    noTotals: "لا توجد بيانات متاحة.",
  },
};

export default function HomePage() {
  const { user } = useAuth();
  const { dir, align, language, t } = useI18nLayout(translations);
  const router = useRouter();
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [insights, setInsights] = useState(null);
  const [modules, setModules] = useState([]);
  const [businessModalDismissed, setBusinessModalDismissed] = useState(false);
  const [computing, setComputing] = useState(false);
  const [animateCharts, setAnimateCharts] = useState(true);
  const effectRan = useRef(false);

  const { connected } = useDashboardSocket({
    onMetricsUpdate: (metrics) => {
      setInsights(metrics);
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

  // Load modules + insights
  useEffect(() => {
    if (effectRan.current) return;
    effectRan.current = true;

    (async () => {
      try {
        const role = user?.role || "admin";
        const mods = await getModules(role);
        const list = mods || [];
        const permitted =
          (user?.role === "admin" || user?.role === "business") &&
            Array.isArray(user?.modulePermissions)
            ? list.filter((m) => user.modulePermissions.includes(m.key))
            : list;
        setModules(permitted);

        const res = await getDashboardInsights();
        setInsights(res);
      } catch (err) {
        console.error("Failed to load dashboard insights:", err);
      }
    })();
  }, [user?.role]);

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

  const handleCloseBusinessModal = () => {
    setShowBusinessModal(false);
    setBusinessModalDismissed(true);
  };

  const { modules: moduleStats = {}, scope } = insights || {};

  const hours = new Date().getHours();
  const greeting =
    hours < 12
      ? t.greetingMorning
      : hours < 18
        ? t.greetingAfternoon
        : t.greetingEvening;

  const Clock = () => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
      const timer = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(timer);
    }, []);

    const formattedDate = now.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const formattedTime = now.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    return (
      <Typography
        variant="body2"
        textAlign={align}
        sx={{ color: "rgba(255,255,255,0.9)" }}
      >
        {formattedDate} · {formattedTime}
      </Typography>
    );
  };

  const donutColors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#9467bd", "#8c564b"];
  const sumValues = (obj = {}) =>
    Object.values(obj).reduce((sum, val) => sum + (Number(val) || 0), 0);

  const buildTrashTotal = (trash = {}) => {
    return Object.values(trash).reduce((sum, val) => {
      if (typeof val === "number") return sum + val;
      if (val && typeof val === "object") return sum + sumValues(val);
      return sum;
    }, 0);
  };

  const buildDonutData = (data = [], emptyLabel = "Empty") => {
    const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
    if (total === 0) {
      return {
        data: [
          {
            id: 0,
            label: emptyLabel,
            value: 1,
            color: "rgba(0,0,0,0.08)",
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
        color: donutColors[idx % donutColors.length],
      })),
      total,
    };
  };

  const buildTrashBreakdown = (trash = {}) => {
    const entries = Object.entries(trash).map(([key, val]) => {
      if (typeof val === "number") return { name: key, value: val };
      if (val && typeof val === "object") return { name: key, value: sumValues(val) };
      return { name: key, value: 0 };
    });
    return entries.filter((e) => e.value > 0);
  };

  const DonutStat = ({ data, centerLabel, height = 180 }) => {
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
          fontWeight="bold"
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            whiteSpace: "nowrap",
          }}
        >
          {centerLabel}
        </Typography>
      </Box>
    );
  };

  const RenderTruncatedChip = ({ label }) => (
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

  return (
    <Box sx={{ pb: 6, bgcolor: "background.default", minHeight: "100vh" }}>
      <Container
        dir={dir}
        maxWidth={false}
        sx={{ px: { xs: 2, md: 3, lg: 4 }, maxWidth: "1600px", mx: "auto" }}
      >
        {/* Welcome Header */}
        <AppCard
          sx={{
            p: 4,
            mb: 4,
            borderRadius: 3,
            color: "#fff",
            position: "relative",
            overflow: "hidden",
            background:
              "linear-gradient(135deg, #1b3a7a 0%, #3843b2 45%, #6a2ea0 100%)",
            boxShadow: "0 18px 40px rgba(27,58,122,0.25)",
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18), transparent 45%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.14), transparent 40%)",
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
              background:
                "radial-gradient(circle, rgba(255,255,255,0.18), rgba(255,255,255,0) 60%)",
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
                textAlign={align}
                sx={{
                  color: "#fff",
                  letterSpacing: "0.3px",
                  textShadow: "0 2px 12px rgba(0,0,0,0.28)",
                  fontWeight: 600,
                  lineHeight: 1.15,
                }}
              >
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
              <Clock />
              <Typography
                variant="body1"
                sx={{ mt: 2, color: "rgba(255,255,255,0.9)" }}
                textAlign={align}
              >
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
                    color: "rgba(255,255,255,0.85)",
                    textAlign: { xs: "left", sm: "right" },
                    mt: 1,
                  }}
                >
                  {t.lastUpdated}{" "}
                  {formatDateTimeWithLocale(insights.lastUpdated)}
                </Typography>
              )}
            </Box>
          </Box>
        </AppCard>

        {!insights ? (
          <LoadingState />
        ) : (
          <>
            {/* Global Overview */}
            {moduleStats.global && (
              <AppCard sx={{ p: 3, mt: 2, mb: 3, borderRadius: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Avatar sx={{ bgcolor: "#1976d2", mx: 1 }}>
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
                  );

                  const businessesDonut = buildDonutData(
                    [
                      {
                        name: t.businesses,
                        value: moduleStats.global.totals?.businesses ?? 0,
                      },
                    ],
                    t.noTotals,
                  );

                  const trashBreakdown = buildTrashBreakdown(
                    moduleStats.global.trash || {},
                  );
                  const { data: trashDonut, total: trashTotal } =
                    buildDonutData(trashBreakdown, t.noTotals);

                  return (
                    <Grid
                      container
                      spacing={2}
                      sx={{ mt: 2 }}
                      justifyContent="center"
                    >
                      <Grid item xs={12} md={4}>
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
                            centerLabel={usersTotal}
                            height={200}
                          />
                          <Stack
                            direction="row"
                            spacing={1}
                            flexWrap="wrap"
                            justifyContent="center"
                            sx={{ mt: 1 }}
                          >
                            {roleKeys.map((role) => (
                              <RenderTruncatedChip
                                key={role}
                                label={`${roleLabel(role)}: ${
                                  Number(userTotals?.[role] || 0)
                                }`}
                              />
                            ))}
                          </Stack>
                        </AppCard>
                      </Grid>
                      <Grid item xs={12} md={4}>
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
                            centerLabel={businessesDonut.total}
                            height={200}
                          />
                        </AppCard>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <AppCard
                          sx={{
                            p: 2,
                            height: "100%",
                            width: "100%",
                            textAlign: "center",
                          }}
                        >
                          <Typography variant="subtitle1" gutterBottom>
                            {t.trash}
                          </Typography>
                          <DonutStat
                            data={trashDonut}
                            centerLabel={trashTotal}
                            height={200}
                          />
                        </AppCard>
                      </Grid>
                    </Grid>
                  );
                })()}
              </AppCard>
            )}

            {/* Module Cards */}
            <Grid container spacing={3} justifyContent="center">
              {modules.map((mod) => {
                const data = moduleStats[mod.key] || {};
                const totals = data.totals || {};
                const trash = data.trash || {};
                const totalEntries = Object.entries(totals);
                const trashEntries = Object.entries(trash);
                const totalSum = sumValues(totals);
                const trashSum = sumValues(trash);
                const totalsDonutInput = totalEntries.map(([k, v]) => ({
                  name: k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
                  value: Number(v || 0),
                }));
                const { data: donutData, total: donutTotal } = buildDonutData(
                  totalsDonutInput,
                  t.noTotals,
                );

                return (
                  <Grid item xs={12} sm={6} lg={4} key={mod.key}>
                    <AppCard
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        boxShadow: "0 6px 12px rgba(0,0,0,0.1)",
                        height: "100%",
                        width: { xs: 300, sm: 350 },
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        ...wrapTextBox,
                      }}
                    >
                      <Box sx={{ ...wrapTextBox }}>
                        {/* Title + Icon */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          {getModuleIcon(mod.icon, {
                            sx: { fontSize: 40, color: mod.color },
                          })}
                          <Typography
                            variant="h6"
                            sx={{ color: mod.color, ...wrapTextBox }}
                          >
                            {mod.labels?.[language] ||
                              mod.labels?.en ||
                              mod.key}
                          </Typography>
                        </Box>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                          sx={{ ...wrapTextBox, minHeight: 44 }}
                        >
                          {mod.descriptions?.[language] || mod.descriptions?.en}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <DonutStat
                            data={donutData}
                            centerLabel={donutTotal}
                            height={160}
                          />
                        </Box>
                      </Box>
                      <Box>
                        <Divider sx={{ my: 2 }} />

                        {/* Totals */}
                        {totalEntries.length > 0 ? (
                          <Stack direction="row" flexWrap="wrap" spacing={1}>
                            {totalEntries.map(([k, v]) => (
                              <RenderTruncatedChip
                                key={k}
                                label={`${k
                                  .replace(/([A-Z])/g, " $1")
                                  .replace(/^./, (c) => c.toUpperCase())}: ${v}`}
                              />
                            ))}
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
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
                              label={`${k
                                .replace(/([A-Z])/g, " $1")
                                .replace(/^./, (c) => c.toUpperCase())}: ${v}`}
                            />
                          ))}
                            </Box>
                          </>
                        )}
                      </Box>
                    </AppCard>
                  </Grid>
                );
              })}
            </Grid>
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
      </Container>
    </Box>
  );
}
