"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Container,
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

        // Business and admin: only show modules they have permission for. Superadmin/staff: show all returned.
        const permitted =
          (user?.role === "business" || user?.role === "admin") &&
            Array.isArray(user?.modulePermissions)
            ? serverModules.filter((m) =>
              user.modulePermissions.includes(m.key)
            )
            : serverModules;

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
  }, [user]);

  return (
    <Box dir={dir} sx={{ pb: 8, bgcolor: "background.default" }}>

      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h2"
          fontWeight="bold"
          gutterBottom
          textAlign={align}
        >
          {t.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign={align}>
          {t.subtitle}
        </Typography>
        <Divider sx={{ my: 2 }} />
      </Box>

      {loading ? (
        <Grid container spacing={3} justifyContent="center">
          <LoadingState />
        </Grid>
      ) : modules?.length === 0 ? (
        <Stack spacing={2} alignItems="center" sx={{ mt: 5 }}>
          <SupportAgentIcon color="primary" sx={{ fontSize: 64 }} />
          <Typography variant="h6" textAlign="center">
            {t.noPermission}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
          >
            {t.contactSupport}
          </Typography>

          {(globalConfig?.support?.email || globalConfig?.support?.phone) && (
            <Stack spacing={1} textAlign="center" alignItems="center">
              {globalConfig?.support?.email && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <EmailOutlinedIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {globalConfig.support.email}
                  </Typography>
                </Stack>
              )}
              {globalConfig?.support?.phone && (
                <Stack direction="row" spacing={1} alignItems="center">
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
        <Grid
          container
          spacing={3}
          justifyContent="center"
          sx={{
            '& > *': {
              width: { xs: '100%', sm: 'auto' }
            }
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
        </Grid>
      )}
    </Box>
  );
}
