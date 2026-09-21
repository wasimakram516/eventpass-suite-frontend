"use client";

import { Typography } from "@mui/material";
import useI18nLayout from "@/hooks/useI18nLayout";
import { hasEventEmailTemplate } from "@/utils/notificationEmail";

const translations = {
  en: {
    eventTemplate: "Default sends what is configured for this event: its custom email template.",
    systemTemplate: "Default sends the standard invitation email and WhatsApp templates.",
  },
  ar: {
    eventTemplate: "الافتراضي يرسل ما تم إعداده لهذه الفعالية: قالب البريد الإلكتروني المخصص.",
    systemTemplate: "الافتراضي يرسل قوالب الدعوة القياسية للبريد الإلكتروني والواتساب.",
  },
};

/**
 * One line under the "Default" message type that says what Default sends for
 * this event: its own custom email template when it has one, otherwise the
 * standard invitation templates. Shared by the bulk and single notification modals.
 *
 * @param {object} props
 * @param {object|null} [props.event] - The event being notified about
 * @returns {JSX.Element}
 */
const DefaultNotificationInfo = ({ event = null }) => {
  const { t } = useI18nLayout(translations);

  return (
    <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.85rem", lineHeight: 1.6 }}>
      {hasEventEmailTemplate(event) ? t.eventTemplate : t.systemTemplate}
    </Typography>
  );
};

export default DefaultNotificationInfo;
