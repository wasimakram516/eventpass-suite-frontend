"use client";

import { Box, Container, Typography, Stack, Divider, useTheme } from "@mui/material";
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
   const theme = useTheme();
  return (
    <Container dir={dir} maxWidth={false} disableGutters>
      <BreadcrumbsNav />
      <Stack
        spacing={1}
        sx={{
          alignItems: "flex-start",
          mb: 4
        }}>
        <Typography variant="h4" sx={{
          fontWeight: "bold"
        }}>
          {t.title}
        </Typography>
        <Typography variant="body2" sx={{
          color: "text.secondary"
        }}>
          {t.description}
        </Typography>
        <Divider sx={{ width: "100%", mt: 2 }} />
      </Stack>
      {/* Cards */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "center" }}>
          <DashboardCard
            title={t.logsTitle}
            description={t.logsDescription}
            buttonLabel={t.logsButton}
            icon={<ICONS.list />}
            color={theme.palette.whatsappDashboard.logsCardColor}
            route={`/cms/modules/checkin/events/${eventSlug}/whatsapp/logs`}
          />
      </Box>
    </Container>
  );
}
