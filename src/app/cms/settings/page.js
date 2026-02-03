"use client";

import { Box, Typography, Divider, Grid, Container } from "@mui/material";
import DashboardCard from "@/components/cards/DashboardCard";
import SettingsIcon from "@mui/icons-material/Settings";
import BusinessIcon from "@mui/icons-material/Business";
import { useAuth } from "@/contexts/AuthContext";
import useI18nLayout from "@/hooks/useI18nLayout";

const translations = {
  en: {
    title: "Settings",
    subtitle:
      "Configure business settings, modules, and other platform options.",
    cards: [
      {
        title: "Global Configurations",
        description: "Configure system-level preferences.",
        route: "/cms/settings/configs",
        icon: <SettingsIcon />,
        buttonLabel: "Open Settings",
        color: "#ef6c00",
        roles: ["admin", "superadmin"],
      },
      {
        title: "Business Details",
        description: "Edit logo, name, contact info, and more.",
        route: "/cms/settings/business",
        icon: <BusinessIcon />,
        buttonLabel: "Edit Business",
        color: "#0277bd",
        roles: ["admin", "superadmin", "business"],
      },
    ],
  },
  ar: {
    title: "الإعدادات",
    subtitle: "قم بضبط إعدادات الشركة والوحدات وخيارات النظام الأخرى.",
    cards: [
      {
        title: "الإعدادات العامة",
        description: "تهيئة تفضيلات النظام العامة.",
        route: "/cms/settings/configs",
        icon: <SettingsIcon />,
        buttonLabel: "فتح الإعدادات",
        color: "#ef6c00",
        roles: ["admin", "superadmin"],
      },
      {
        title: "تفاصيل العمل",
        description: "تعديل الشعار والاسم ومعلومات التواصل.",
        route: "/cms/settings/business",
        icon: <BusinessIcon />,
        buttonLabel: "تعديل التفاصيل",
        color: "#0277bd",
        roles: ["admin", "superadmin", "business"],
      },
    ],
  },
};

export default function SettingsPage() {
  const { user } = useAuth();
  const { dir, align, t } = useI18nLayout(translations);

  const cards = t?.cards || [];
  const filteredCards = cards.filter((card) => card.roles.includes(user?.role));

  return (
    <Box dir={dir}>
      <Container>
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

        <Grid
          container
          spacing={3}
          justifyContent="center"
          sx={{
            '& > *': { 
              xs: { width: '100%' }, 
              sm: { width: 'auto' }
            }
          }}
        >
          {filteredCards.map((card, i) => (
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
