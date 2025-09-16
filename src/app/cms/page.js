"use client";

import {
  Box,
  Typography,
  Container,
  Grid,
  Paper,
  Avatar,
  Divider,
  Chip,
  Stack,
  Button,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "@/contexts/AuthContext";
import BusinessAlertModal from "@/components/BusinessAlertModal";
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
  const { dir, align, language, isArabic, t } = useI18nLayout(translations);
  const router = useRouter();
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [insights, setInsights] = useState(null);
  const [modules, setModules] = useState([]);
  const [dateTime, setDateTime] = useState(new Date());
  const [businessModalDismissed, setBusinessModalDismissed] = useState(false);
  const [computing, setComputing] = useState(false);
  const effectRan = useRef(false);

  const { connected, socket } = useDashboardSocket({
    onMetricsUpdate: (metrics) => {
      setInsights(metrics);
    },
  });

  useEffect(() => {
    if (user?.role === "business" && !businessModalDismissed) {
      checkBusinessExists();
    }
  }, [user, businessModalDismissed]);

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load modules + insights
  useEffect(() => {
    if (effectRan.current) return;
    effectRan.current = true;

    (async () => {
      try {
        const role = user?.role || "admin";
        const mods = await getModules(role);
        setModules(mods || []);

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
    const businesses = await getAllBusinesses();
    const myBusiness = businesses.find((b) => {
      const ownerId = typeof b.owner === "string" ? b.owner : b.owner?._id;
      return ownerId === user?.id;
    });
    if (!myBusiness) {
      setShowBusinessModal(true);
    }
  };

  const handleCloseBusinessModal = () => {
    setShowBusinessModal(false);
    setBusinessModalDismissed(true);
  };

  if (!insights) return <LoadingState />;

  const { modules: moduleStats = {}, scope } = insights || {};

  const hours = dateTime.getHours();
  const greeting =
    hours < 12
      ? t.greetingMorning
      : hours < 18
      ? t.greetingAfternoon
      : t.greetingEvening;

  const formattedDate = dateTime.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = dateTime.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <Box sx={{ pb: 6, bgcolor: "#f8f9fc", minHeight: "100vh" }}>
      <Container dir={dir}>
        {/* Welcome Header */}
        <Paper
          sx={{
            p: 4,
            mb: 4,
            borderRadius: 3,
            background: "linear-gradient(135deg,#667eea,#764ba2)",
            color: "#fff",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            {/* Greeting / Info */}
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h5"
                fontWeight="bold"
                gutterBottom
                textAlign={align}
              >
                {greeting}, {user?.name || "Guest"} 👋
              </Typography>
              <Typography variant="body2" textAlign={align}>
                {formattedDate} · {formattedTime}
              </Typography>
              <Typography variant="body1" sx={{ mt: 2 }} textAlign={align}>
                {t.overviewIntro}
              </Typography>
            </Box>
            {/* Recompute button + last updated */}
            <Box
              dir={dir}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: { xs: "stretch", sm: "flex-end" },
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
                    color: "rgba(255,255,255,0.8)",
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
        </Paper>

        {/* Global Overview */}
        {moduleStats.global && (
          <Paper sx={{ p: 3, mt: 4, borderRadius: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Avatar sx={{ bgcolor: "#1976d2", mx: 1 }}>
                <ICONS.business />
              </Avatar>
              <Typography variant="h6">{t.globalOverview}</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {/* Totals */}
            <Grid container spacing={2} justifyContent="center">
              {scope === "superadmin" && (
                <Grid item>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: "center",
                      borderRadius: 2,
                      height: "100%",
                      width: { xs: 110, sm: 130 },
                    }}
                  >
                    <ICONS.business sx={{ fontSize: 32, color: "#1976d2" }} />
                    <Typography variant="h4">
                      {moduleStats.global.totals?.businesses ?? 0}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontSize: 11, textTransform: "capitalize" }}
                    >
                      {t.businesses}
                    </Typography>
                  </Paper>
                </Grid>
              )}

              {Object.entries(moduleStats.global.totals?.users || {})
                .filter(([role]) => scope === "superadmin" || role === "staff")
                .map(([role, count]) => (
                  <Grid item xs={6} sm={4} md={3} key={role}>
                    <Paper
                      sx={{
                        p: 2,
                        textAlign: "center",
                        borderRadius: 2,
                        height: "100%",
                        width: { xs: 110, sm: 130 },
                      }}
                    >
                      <ICONS.group sx={{ fontSize: 32, color: "#1976d2" }} />
                      <Typography variant="h4">{count}</Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontSize: 11, textTransform: "capitalize" }}
                      >
                        {t.users} ({role})
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
            </Grid>

            {/* Trash */}
            {moduleStats.global.trash && (
              <Box sx={{ mt: 2 }}>
                {/* Trash title row */}
                <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
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
                  {Object.entries(moduleStats.global.trash).map(([k, v]) => {
                    if (typeof v === "object" && v !== null) {
                      return Object.entries(v)
                        .filter(
                          ([role]) => scope === "superadmin" || role === "staff"
                        )
                        .map(([role, count]) => (
                          <Chip
                            key={`${k}-${role}`}
                            label={`Users (${role}): ${count}`}
                            size="small"
                            sx={{ textTransform: "capitalize" }}
                          />
                        ));
                    }
                    return (
                      scope === "superadmin" && (
                        <Chip
                          key={k}
                          label={`${
                            k.charAt(0).toUpperCase() + k.slice(1)
                          }: ${v}`}
                          size="small"
                          sx={{ textTransform: "capitalize" }}
                        />
                      )
                    );
                  })}
                </Box>
              </Box>
            )}
          </Paper>
        )}

        {/* Module Cards */}
        <Grid container spacing={3} justifyContent="center">
          {modules.map((mod) => {
            const data = moduleStats[mod.key] || {};
            const totals = data.totals || {};
            const trash = data.trash || {};
            const totalEntries = Object.entries(totals);
            const trashEntries = Object.entries(trash);

            return (
              <Grid item xs={12} sm={6} lg={4} key={mod.key}>
                <Paper
                  sx={{
                    p: 3,
                    mt: 4,
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
                  <Box>
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
                      <Typography variant="h6" sx={{ color: mod.color }}>
                        {mod.labels?.[language] || mod.labels?.en || mod.key}
                      </Typography>
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      {mod.descriptions?.[language] || mod.descriptions?.en}
                    </Typography>
                  </Box>
                  <Box>
                    <Divider sx={{ my: 2 }} />

                    {/* Totals */}
                    <Grid container spacing={2} justifyContent={"center"}>
                      {totalEntries.length > 0 ? (
                        totalEntries.map(([k, v]) => (
                          <Grid item xs={6} key={k} justifyContent={"center"}>
                            <Paper
                              sx={{
                                p: 2,
                                textAlign: "center",
                                bgcolor: mod.color,
                                color: "#fff",
                                borderRadius: 2,
                                minWidth: 80,
                                height: "100%",
                              }}
                            >
                              <Typography variant="h4">{v}</Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: 10,
                                  textTransform: "capitalize",
                                }}
                              >
                                {k.replace(/([A-Z])/g, " $1")}
                              </Typography>
                            </Paper>
                          </Grid>
                        ))
                      ) : (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ ml: 2 }}
                        >
                          {t.noTotals}
                        </Typography>
                      )}
                    </Grid>

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
                            <Chip
                              key={k}
                              label={`${
                                k.charAt(0).toUpperCase() + k.slice(1)
                              }: ${v}`}
                              size="small"
                              sx={{ textTransform: "capitalize" }}
                            />
                          ))}
                        </Box>
                      </>
                    )}
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>

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
