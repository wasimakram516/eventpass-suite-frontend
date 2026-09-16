"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Divider,
  Stack,
  Button,
  TextField,
  InputAdornment,
  Chip,
} from "@mui/material";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import { useRouter } from "next/navigation";

import DashboardCard from "@/components/cards/DashboardCard";
import AppCard from "@/components/cards/AppCard";
import { useTheme } from "@mui/material";
import { useAuth } from "@/contexts/AuthContext";
import { getModules } from "@/services/moduleService";
import { getModuleIcon } from "@/utils/iconMapper";
import { resolveModuleColor } from "@/styles/theme";
import useI18nLayout from "@/hooks/useI18nLayout";
import { hasModuleAccess } from "@/hooks/usePermission";
import { useGlobalConfig } from "@/contexts/GlobalConfigContext";
import LoadingState from "@/components/LoadingState";
import { getCategoryLabel, groupByModuleCategory } from "@/utils/moduleCategories";

const ATTENDEE_DATA_CONSUMERS = [
  { key: "checkin", labels: { en: "Check-In", ar: "تسجيل الدخول" } },
  { key: "digipass", labels: { en: "DigiPass", ar: "DigiPass" } },
  { key: "surveyguru", labels: { en: "SurveyGuru", ar: "SurveyGuru" } },
  { key: "quiznest", labels: { en: "QuizNest", ar: "QuizNest" } },
  { key: "eventduel", labels: { en: "Event Duel", ar: "Event Duel" } },
  { key: "crosszero", labels: { en: "CrossZero", ar: "CrossZero" } },
  { key: "tapmatch", labels: { en: "TapMatch", ar: "TapMatch" } },
  { key: "eventwheel", labels: { en: "Event Wheel", ar: "عجلة الفعالية" } },
];

const translations = {
  en: {
    title: "Modules",
    subtitle:
      "Manage all your interactive event tools in one place — quizzes, polls, audience engagement, registration, and more.",
    noPermission: "You currently do not have access to any modules.",
    contactSupport: "Please contact support to request access:",
    coreModule: "Core Module",
    attendeeDataConsumers: "Attendee data is used by",
    searchModules: "Find a module",
    viewCategory: "View category",
    backToAllModules: "All modules",
    noSearchResults: "No modules match your search.",
  },
  ar: {
    title: "الوحدات",
    subtitle:
      "قم بإدارة جميع أدوات الفعاليات التفاعلية في مكان واحد — الاختبارات، الاستطلاعات، تفاعل الجمهور، التسجيل والمزيد.",
    noPermission: "ليس لديك إذن للوصول إلى أي وحدات حالياً.",
    contactSupport: "يرجى الاتصال بالدعم لطلب الوصول:",
    coreModule: "الوحدة الأساسية",
    attendeeDataConsumers: "تستخدم بيانات الحضور في",
    searchModules: "ابحث عن وحدة",
    viewCategory: "عرض الفئة",
    backToAllModules: "كل الوحدات",
    noSearchResults: "لا توجد وحدات تطابق بحثك.",
  },
};

export default function Modules() {
  const { user } = useAuth();
  const { globalConfig } = useGlobalConfig();
  const { dir, align, language, t } = useI18nLayout(translations);
  const router = useRouter();
  const theme = useTheme();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // A self-registered business user must complete their business profile
  // before role-granted modules become usable — keep the tiles empty (the
  // original "no permission" state renders) until then.
  const needsBusinessSetup =
    user?.role === "business" &&
    !user?.business?._id &&
    !user?.businessId;

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const role = user?.role || "staff";
        const modulesPayload = await getModules(role);
        if (!mounted) return;

        const serverModules = Array.isArray(modulesPayload)
          ? modulesPayload
          : [];

        // Gate a business user behind business-setup first; otherwise show
        // modules they actually have access to (fresh granular role
        // permissions, falling back to the legacy modulePermissions array) so
        // a self-registered owner's modules unlock immediately after they
        // complete their business profile. Superadmin/staff: show all.
        const permitted =
          user?.role === "superadmin"
            ? serverModules
            : user?.role === "admin"
              ? serverModules.filter((m) => hasModuleAccess(user, m.key))
              : needsBusinessSetup
                ? []
                : serverModules.filter((m) => hasModuleAccess(user, m.key));

        setModules(permitted);
      } catch {
        setModules([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user, needsBusinessSetup]);

  // The core module (EventReg) gets its own emphasized banner, split from the
  // rest. Remaining modules are grouped by category, ordered by each module's
  // embedded category.sort (server catalog order).
  const { coreModules, groupedByCategory } = useMemo(() => {
    const core = modules.filter((m) => m.isCore);
    const rest = modules.filter((m) => !m.isCore);

    return { coreModules: core, groupedByCategory: groupByModuleCategory(rest) };
  }, [modules]);

  const visibleGroups = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
    const selectedGroups = normalizedQuery
      ? groupedByCategory
      : selectedCategoryId
      ? groupedByCategory.filter((group) => group.category.id === selectedCategoryId)
      : groupedByCategory;

    if (!normalizedQuery) return selectedGroups;

    return selectedGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((module) => {
          const name = module.labels?.[language] ?? module.labels?.en ?? module.key;
          return name.toLocaleLowerCase().includes(normalizedQuery);
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [groupedByCategory, language, searchQuery, selectedCategoryId]);

  const coreModule = coreModules[0];
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const coreMatchesSearch = !normalizedQuery ||
    (coreModule?.labels?.[language] ?? coreModule?.labels?.en ?? coreModule?.key ?? "")
      .toLocaleLowerCase()
      .includes(normalizedQuery);
  const isCoreVisible = coreModule && coreMatchesSearch &&
    (!selectedCategoryId || selectedCategoryId === coreModule.category?.id);

  return (
    <Box dir={dir} sx={{ pb: 8, bgcolor: "background.default" }}>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h2"
          gutterBottom
          sx={{
            fontWeight: "bold",
            textAlign: align
          }}>
          {t.title}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: "text.secondary",
            textAlign: align
          }}>
          {t.subtitle}
        </Typography>
        <Divider sx={{ my: 2 }} />
      </Box>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <LoadingState />
        </Box>
      ) : modules?.length === 0 ? (
        <Stack spacing={2} sx={{ mt: 5, alignItems: "center" }}>
          <SupportAgentIcon color="primary" sx={{ fontSize: 64 }} />
          <Typography variant="h6" sx={{
            textAlign: "center"
          }}>
            {t.noPermission}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "text.secondary",
              textAlign: "center"
            }}>
            {t.contactSupport}
          </Typography>

          {(globalConfig?.support?.email || globalConfig?.support?.phone) && (
            <Stack
              spacing={1}
              sx={{
                textAlign: "center",
                alignItems: "center"
              }}>
              {globalConfig?.support?.email && (
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <EmailOutlinedIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {globalConfig.support.email}
                  </Typography>
                </Stack>
              )}
              {globalConfig?.support?.phone && (
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <PhoneOutlinedIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {globalConfig.support.phone}
                  </Typography>
                </Stack>
              )}
            </Stack>
          )}
        </Stack>
      ) : (
        <Box>
          {isCoreVisible && (() => {
            const core = coreModule;
            const resolvedColor = resolveModuleColor(core.color, theme.palette.mode) || theme.palette.primary.main;
            return (
              <AppCard
                sx={{
                  p: 3,
                  mb: 6,
                  borderInlineStart: `6px solid ${resolvedColor}`,
                  bgcolor: `${resolvedColor}0A`,
                  boxShadow: `0 6px 24px ${resolvedColor}26`,
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
                      bgcolor: `${resolvedColor}1A`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      alignSelf: { xs: "center", sm: "flex-start" },
                      mx: { xs: "auto", sm: 0 },
                    }}
                  >
                    {core.icon && getModuleIcon(core.icon, { sx: { fontSize: 38, color: resolvedColor } })}
                  </Box>
                  <Stack sx={{ minWidth: 0, flex: 1 }} spacing={1}>
                    <Typography
                      variant="overline"
                      fontWeight="bold"
                      sx={{ color: resolvedColor, letterSpacing: 1.2 }}
                    >
                      {t.coreModule}
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {core.labels?.[language] ?? core.labels?.en ?? core.key}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {core.descriptions?.[language] ?? core.descriptions?.en ?? ""}
                    </Typography>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>
                        {t.attendeeDataConsumers}
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                        {ATTENDEE_DATA_CONSUMERS.map((module) => (
                          <Chip
                            key={module.key}
                            size="small"
                            label={module.labels?.[language] ?? module.labels.en ?? module.key}
                            variant="outlined"
                          />
                        ))}
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
                    onClick={() => router.push(core.route)}
                  >
                    {core.buttons?.[language] ?? core.buttons?.en ?? "Open"}
                  </Button>
                </Stack>
              </AppCard>
            );
          })()}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 4 }}>
            <TextField
              fullWidth
              size="small"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                if (event.target.value) setSelectedCategoryId(null);
              }}
              placeholder={t.searchModules}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
                htmlInput: { "aria-label": t.searchModules },
              }}
            />
            {selectedCategoryId && (
              <Button
                startIcon={<ArrowBackOutlinedIcon />}
                onClick={() => setSelectedCategoryId(null)}
                sx={{ flexShrink: 0 }}
              >
                {t.backToAllModules}
              </Button>
            )}
          </Stack>

          {visibleGroups.length === 0 && !isCoreVisible ? (
            <Typography color="text.secondary" sx={{ textAlign: align }}>
              {t.noSearchResults}
            </Typography>
          ) : visibleGroups.map((group) => {
            const categoryInfo = group.category;
            const categoryLabel = getCategoryLabel(categoryInfo, language);
            return (
              <Box key={categoryInfo?.id ?? "other"} sx={{ mb: 5 }}>
                <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ textAlign: align }}>
                    {categoryLabel}
                  </Typography>
                  {!selectedCategoryId && !searchQuery && (
                    <Button size="small" onClick={() => setSelectedCategoryId(categoryInfo.id)}>
                      {t.viewCategory}
                    </Button>
                  )}
                </Stack>
                <Divider sx={{ mb: 3 }} />
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 3,
                    justifyContent: "center",
                  }}
                >
                  {group.items.map((mod) => (
                    <DashboardCard
                      key={mod.key}
                      title={mod.labels?.[language] ?? mod.labels?.en ?? mod.key}
                      description={
                        mod.descriptions?.[language] ?? mod.descriptions?.en ?? ""
                      }
                      buttonLabel={
                        mod.buttons?.[language] ?? mod.buttons?.en ?? "Open"
                      }
                      icon={getModuleIcon(mod.icon)}
                      color={mod.color || "primary"}
                      route={mod.route}
                    />
                  ))}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
