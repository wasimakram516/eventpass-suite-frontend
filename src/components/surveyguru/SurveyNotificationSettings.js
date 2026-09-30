"use client";

import { Alert, Box, FormControlLabel, Stack, Switch, Typography } from "@mui/material";
import EmailTemplateWorkspace from "@/components/modals/EmailTemplateWorkspace";
import WhatsAppMessagesTab from "@/components/whatsapp/WhatsAppMessagesTab";
import useWhatsAppCatalog from "@/hooks/useWhatsAppCatalog";
import { eventInfoFromEvent } from "@/utils/emailEventDetails";
import useI18nLayout from "@/hooks/useI18nLayout";

const translations = {
  en: {
    title: "Notification templates",
    email: "Use a custom email template for this survey",
    whatsapp: "Use custom WhatsApp templates for this survey",
  },
  ar: {
    title: "قوالب الإشعارات",
    email: "استخدام قالب بريد إلكتروني مخصص لهذا الاستبيان",
    whatsapp: "استخدام قوالب واتساب مخصصة لهذا الاستبيان",
  },
};

/**
 * Saved email and WhatsApp template editors for a SurveyGuru form.
 *
 * @param {object} props
 * @returns {JSX.Element}
 */
export default function SurveyNotificationSettings({
  value,
  onChange,
  event,
  isAnonymous,
  open,
  error,
  businessSlug,
  canConfigureWhatsApp,
  section = "options",
}) {
  const { t, dir } = useI18nLayout(translations);
  const catalog = useWhatsAppCatalog(["surveyguru"], open && value.useCustomWhatsAppMessages);
  const fieldNames = isAnonymous
    ? []
    : value.useCustomFields
      ? value.formFields.map((field) => field.inputName).filter(Boolean)
      : ["Full Name", "Email", "Phone"];
  const update = (patch) => onChange((current) => ({ ...current, ...patch }));

  if (section === "options") {
    return (
      <Stack spacing={1} dir={dir}>
        <Typography variant="h6">{t.title}</Typography>
        <FormControlLabel
          control={
            <Switch
              checked={value.useCustomEmailTemplate}
              onChange={(eventChange) => update({ useCustomEmailTemplate: eventChange.target.checked })}
            />
          }
          label={t.email}
        />
        {canConfigureWhatsApp && (
          <FormControlLabel
            control={
              <Switch
                checked={value.useCustomWhatsAppMessages}
                onChange={(eventChange) => update({ useCustomWhatsAppMessages: eventChange.target.checked })}
              />
            }
            label={t.whatsapp}
          />
        )}
      </Stack>
    );
  }

  if (section === "email") {
    return (
      <Stack spacing={2} dir={dir}>
        {error && <Alert severity="error">{error}</Alert>}
        <Box sx={{ minWidth: 0 }}>
          <EmailTemplateWorkspace
            formData={value}
            setFormData={onChange}
            isPaid={false}
            isSurvey
            businessSlug={businessSlug}
            eventInfo={eventInfoFromEvent(event)}
            errors={{ subject: false, body: false }}
            onClearError={() => {}}
          />
        </Box>
      </Stack>
    );
  }

  return (
    <Stack spacing={2} dir={dir}>
      {error && <Alert severity="error">{error}</Alert>}
      <WhatsAppMessagesTab
        messages={value.whatsappMessages}
        onChange={(whatsappMessages) => update({ whatsappMessages })}
        catalog={catalog}
        fieldNames={fieldNames}
      />
    </Stack>
  );
}
