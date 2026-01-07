"use client";

import { Container, Grid, Typography, Stack, Divider } from "@mui/material";
import { useParams } from "next/navigation";
import DashboardCard from "@/components/cards/DashboardCard";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";

const translations = {
  en: {
    title: "WhatsApp Management",
    description:
      "Monitor message delivery, view user replies, and communicate with attendees via WhatsApp.",
    logsTitle: "WhatsApp Logs",
    logsDescription:
      "Track message delivery status, failures, and read receipts.",
    logsButton: "View Logs",
    inboxTitle: "WhatsApp Inbox",
    inboxDescription:
      "View incoming messages from attendees and reply in real time.",
    inboxButton: "Open Inbox",
  },
  ar: {
    title: "إدارة واتساب",
    description:
      "مراقبة حالة تسليم الرسائل، عرض ردود المستخدمين، والتواصل مع الحضور عبر واتساب.",
    logsTitle: "سجلات واتساب",
    logsDescription:
      "تتبع حالة تسليم الرسائل، الإخفاقات، وإشعارات القراءة.",
    logsButton: "عرض السجلات",
    inboxTitle: "صندوق وارد واتساب",
    inboxDescription:
      "عرض رسائل الحضور الواردة والرد عليها في الوقت الفعلي.",
    inboxButton: "فتح الصندوق",
  },
};

export default function WhatsAppDashboard() {
  const { eventSlug } = useParams();
  const { t, dir } = useI18nLayout(translations);

  return (
    <Container dir={dir} maxWidth="lg">
      <BreadcrumbsNav />

      <Stack spacing={1} alignItems="flex-start" mb={4}>
        <Typography variant="h4" fontWeight="bold">
          {t.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t.description}
        </Typography>
        <Divider sx={{ width: "100%", mt: 2 }} />
      </Stack>

      {/* Cards Grid */}
      <Grid container spacing={3} justifyContent="center">
        {/* Logs */}
        <Grid item xs={12} sm={6} md={4}>
          <DashboardCard
            title={t.logsTitle}
            description={t.logsDescription}
            buttonLabel={t.logsButton}
            icon={<ICONS.list />}
            color="#42a5f5" // blue (audit / logs)
            route={`/cms/modules/checkin/events/${eventSlug}/whatsapp/logs`}
          />
        </Grid>

        {/* Inbox */}
        <Grid item xs={12} sm={6} md={4}>
          <DashboardCard
            title={t.inboxTitle}
            description={t.inboxDescription}
            buttonLabel={t.inboxButton}
            icon={<ICONS.whatsapp />}
            color="#25D366" // WhatsApp green
            route={`/cms/modules/checkin/events/${eventSlug}/whatsapp/inbox`}
          />
        </Grid>
      </Grid>
    </Container>
  );
}
