"use client";

import { Box, Typography, Divider, Grid, Container } from "@mui/material";
import DashboardCard from "@/components/DashboardCard";
import SettingsIcon from "@mui/icons-material/Settings";
import BusinessIcon from "@mui/icons-material/Business";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SettingsPage() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const dir = isArabic ? "rtl" : "ltr";
  const align = isArabic ? "right" : "left";

  const translations = {
    en: {
      title: "Settings",
      subtitle: "Configure business settings, modules, and other platform options.",
      cards: [
        {
          title: "Business Details",
          description: "Edit logo, name, contact info, and more.",
          route: "/cms/settings/business",
          icon: <BusinessIcon />,
          buttonLabel: "Edit Business",
          color: "#0277bd",
        },
        {
          title: "Manage Modules",
          description: "Enable or disable features per business.",
          route: "/cms/settings/modules",
          icon: <ViewModuleIcon />,
          buttonLabel: "Manage Modules",
          color: "#5e35b1",
        },
        {
          title: "Other Settings",
          description: "Configure system-level preferences.",
          route: "/cms/settings/others",
          icon: <SettingsIcon />,
          buttonLabel: "Open Settings",
          color: "#ef6c00",
        },
      ],
    },
    ar: {
      title: "الإعدادات",
      subtitle: "قم بضبط إعدادات الشركة والوحدات وخيارات النظام الأخرى.",
      cards: [
        {
          title: "تفاصيل العمل",
          description: "تعديل الشعار والاسم ومعلومات التواصل.",
          route: "/cms/settings/business",
          icon: <BusinessIcon />,
          buttonLabel: "تعديل التفاصيل",
          color: "#0277bd",
        },
        {
          title: "إدارة الوحدات",
          description: "تفعيل أو تعطيل الوحدات لكل شركة.",
          route: "/cms/settings/modules",
          icon: <ViewModuleIcon />,
          buttonLabel: "إدارة الوحدات",
          color: "#5e35b1",
        },
        {
          title: "إعدادات أخرى",
          description: "تهيئة تفضيلات النظام العامة.",
          route: "/cms/settings/others",
          icon: <SettingsIcon />,
          buttonLabel: "فتح الإعدادات",
          color: "#ef6c00",
        },
      ],
    },
  };

  const { title, subtitle, cards } = translations[language];

  return (
    <Box dir={dir}>
      <Container >
        <Typography variant="h2" fontWeight="bold" gutterBottom textAlign={align}>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign={align}>
          {subtitle}
        </Typography>
        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3} justifyContent="center">
          {cards.map((card, i) => (
            <DashboardCard
              key={i}
              title={card.title}
              description={card.description}
              icon={card.icon}
              route={card.route}
              buttonLabel={card.buttonLabel}
              color={card.color}
            />
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
