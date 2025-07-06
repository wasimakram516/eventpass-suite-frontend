"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Container,
  Divider,
} from "@mui/material";
import DashboardCard from "@/components/DashboardCard";
import { useAuth } from "@/contexts/AuthContext";
import { getModules } from "@/services/moduleService";
import { getModuleIcon } from "@/utils/iconMapper";
import useI18nLayout from "@/hooks/useI18nLayout";

const translations = {
  en: {
    title: "Modules",
    subtitle:
      "Manage all your interactive event tools in one place — quizzes, polls, audience engagement, registration, and more.",
  },
  ar: {
    title: "الوحدات",
    subtitle:
      "قم بإدارة جميع أدوات الفعاليات التفاعلية في مكان واحد — الاختبارات، الاستطلاعات، تفاعل الجمهور، التسجيل والمزيد.",
  },
};

export default function Modules() {
  const { user } = useAuth();
  const { dir, align, language, t } = useI18nLayout(translations);
  const [modules, setModules] = useState([]);

  useEffect(() => {
    const fetchModules = async () => {
      const data = await getModules();

      // Filter by user role
      const permitted =
        user?.role === "business"
          ? data.filter((mod) => user.modulePermissions.includes(mod.key))
          : data;

      setModules(permitted);
    };

    fetchModules();
  }, [user]);

  return (
    <Box dir={dir} sx={{ pb: 8, bgcolor: "background.default" }}>
      <Container>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h2" fontWeight="bold" gutterBottom textAlign={align}>
            {t.title}
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign={align}>
            {t.subtitle}
          </Typography>
          <Divider sx={{ my: 2 }} />
        </Box>

        <Grid container spacing={3} justifyContent="center">
          {modules.map((mod) => (
            <DashboardCard
              key={mod.key}
              title={mod.labels[language]}
              description={mod.descriptions[language]}
              buttonLabel={mod.buttons?.[language] || "Manage"}
              icon={getModuleIcon(mod.icon)}
              color={mod.color || "primary"}
              route={`/cms/modules/${mod.key}`}
            />
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
