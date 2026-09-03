"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Divider,
  Stack,
} from "@mui/material";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";

import DashboardCard from "@/components/cards/DashboardCard";
import { useAuth } from "@/contexts/AuthContext";
import { getModules } from "@/services/moduleService";
import { getModuleIcon } from "@/utils/iconMapper";
import useI18nLayout from "@/hooks/useI18nLayout";
import { hasModuleAccess } from "@/hooks/usePermission";
import { useGlobalConfig } from "@/contexts/GlobalConfigContext";
import LoadingState from "@/components/LoadingState";

const translations = {
  en: {
    title: "Modules",
    subtitle:
      "Manage all your interactive event tools in one place — quizzes, polls, audience engagement, registration, and more.",
    noPermission: "You currently do not have access to any modules.",
    contactSupport: "Please contact support to request access:",
  },
  ar: {
    title: "الوحدات",
    subtitle:
      "قم بإدارة جميع أدوات الفعاليات التفاعلية في مكان واحد — الاختبارات، الاستطلاعات، تفاعل الجمهور، التسجيل والمزيد.",
    noPermission: "ليس لديك إذن للوصول إلى أي وحدات حالياً.",
    contactSupport: "يرجى الاتصال بالدعم لطلب الوصول:",
  },
};

export default function Modules() {
  const { user } = useAuth();
  const { globalConfig } = useGlobalConfig();
  const { dir, align, language, t } = useI18nLayout(translations);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

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
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
            justifyContent: "center",
          }}
        >
          {modules.map((mod) => (
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
      )}
    </Box>
  );
}
