"use client";

import { useMemo } from "react";
import {
  Alert,
  Box,
  Chip,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import useI18nLayout from "@/hooks/useI18nLayout";
import {
  WHATSAPP_APPROVED,
  WHATSAPP_MESSAGE_LIMITS,
  WHATSAPP_VARIABLE_SOURCES,
  buildVariableRows,
  describeTemplateBody,
  templateIdOf,
  templateLabel,
} from "@/utils/whatsappMessages";

const translations = {
  en: {
    name: "Message name",
    namePlaceholder: "e.g. Invitation, Reminder",
    template: "WhatsApp template",
    noTemplates: "No templates in the library yet. A superadmin can import them in Settings.",
    notApproved: "Not approved in Twilio yet. It cannot be sent until it is approved.",
    media: "Includes media",
    preview: "Preview",
    variables: "Variables",
    noVariables: "This template has no variables.",
    fillWith: "Fill with",
    field: "Registration field",
    placeholder: "Event detail",
    text: "Custom value",
    value: "Value",
    chooseField: "Choose a field",
    choosePlaceholder: "Choose a detail",
    customValue: "Text to send",
    fallback: "If empty, send",
    fallbackHelp: "Optional. Used when the guest left this empty.",
  },
  ar: {
    name: "اسم الرسالة",
    namePlaceholder: "مثال: دعوة، تذكير",
    template: "قالب واتساب",
    noTemplates: "لا توجد قوالب في المكتبة بعد. يمكن للمشرف العام استيرادها من الإعدادات.",
    notApproved: "غير معتمد في Twilio بعد. لا يمكن إرساله حتى يتم اعتماده.",
    media: "يتضمن وسائط",
    preview: "معاينة",
    variables: "المتغيرات",
    noVariables: "لا يحتوي هذا القالب على متغيرات.",
    fillWith: "تعبئة بـ",
    field: "حقل التسجيل",
    placeholder: "تفاصيل الفعالية",
    text: "قيمة مخصصة",
    value: "القيمة",
    chooseField: "اختر حقلا",
    choosePlaceholder: "اختر تفصيلا",
    customValue: "النص المرسل",
    fallback: "إذا كان فارغا، أرسل",
    fallbackHelp: "اختياري. يستخدم عندما يترك الضيف هذا الحقل فارغا.",
  },
};

/**
 * Edit one WhatsApp message: its name, its library template and what fills
 * each {{n}} of that template. Shared by the event modal and the platform
 * defaults in Settings.
 *
 * @param {object} props
 * @param {{label: string, template: string, variables: Array}} props.message - Editable message
 * @param {(message: object) => void} props.onChange - Called with the updated message
 * @param {Array<object>} props.templates - Library templates to choose from
 * @param {string[]} props.placeholders - Event detail placeholders allowed here
 * @param {string[]|null} props.fieldNames - Registration fields, or null to hide the field option
 * @returns {JSX.Element}
 */
export default function WhatsAppMessageEditor({ message, onChange, templates, placeholders, fieldNames }) {
  const { t, dir } = useI18nLayout(translations);

  const template = useMemo(
    () => templates.find((candidate) => String(candidate._id) === templateIdOf(message.template)) || null,
    [templates, message.template]
  );
  const rows = buildVariableRows(template, message.variables);
  const sourceOptions = [
    ...(fieldNames ? [{ value: WHATSAPP_VARIABLE_SOURCES.FIELD, label: t.field }] : []),
    { value: WHATSAPP_VARIABLE_SOURCES.PLACEHOLDER, label: t.placeholder },
    { value: WHATSAPP_VARIABLE_SOURCES.TEXT, label: t.text },
  ];

  const update = (changes) => onChange({ ...message, ...changes });
  const updateRow = (position, changes) =>
    update({
      variables: rows.map((row) => (row.position === position ? { ...row, ...changes } : row)),
    });

  const renderValueInput = (row) => {
    if (row.source === WHATSAPP_VARIABLE_SOURCES.TEXT) {
      return (
        <TextField
          size="small"
          fullWidth
          label={t.customValue}
          value={row.value}
          onChange={(e) => updateRow(row.position, { value: e.target.value })}
          slotProps={{ htmlInput: { maxLength: WHATSAPP_MESSAGE_LIMITS.MAX_VALUE_LENGTH } }}
        />
      );
    }
    const options = row.source === WHATSAPP_VARIABLE_SOURCES.FIELD ? fieldNames || [] : placeholders;
    // Keep a saved value that is no longer offered visible, so the admin sees what to fix.
    const choices = row.value && !options.includes(row.value) ? [row.value, ...options] : options;
    return (
      <TextField
        select
        size="small"
        fullWidth
        label={row.source === WHATSAPP_VARIABLE_SOURCES.FIELD ? t.chooseField : t.choosePlaceholder}
        value={row.value}
        onChange={(e) => updateRow(row.position, { value: e.target.value })}
      >
        {choices.map((choice) => (
          <MenuItem key={choice} value={choice}>
            {choice}
          </MenuItem>
        ))}
      </TextField>
    );
  };

  return (
    <Stack spacing={2} dir={dir}>
      <TextField
        size="small"
        label={t.name}
        placeholder={t.namePlaceholder}
        value={message.label}
        onChange={(e) => update({ label: e.target.value })}
        slotProps={{ htmlInput: { maxLength: WHATSAPP_MESSAGE_LIMITS.MAX_LABEL_LENGTH } }}
        required
      />

      {templates.length === 0 ? (
        <Alert severity="info">{t.noTemplates}</Alert>
      ) : (
        <TextField
          select
          size="small"
          label={t.template}
          value={templateIdOf(message.template)}
          onChange={(e) => update({ template: e.target.value, variables: [] })}
          required
        >
          {templates.map((candidate) => (
            <MenuItem key={candidate._id} value={String(candidate._id)}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {templateLabel(candidate)}
                </Typography>
                <Chip
                  size="small"
                  label={candidate.approvalStatus}
                  color={candidate.approvalStatus === WHATSAPP_APPROVED ? "success" : "warning"}
                  variant="outlined"
                />
              </Box>
            </MenuItem>
          ))}
        </TextField>
      )}

      {template && (
        <>
          {template.approvalStatus !== WHATSAPP_APPROVED && <Alert severity="warning">{t.notApproved}</Alert>}

          <Paper variant="outlined" sx={{ p: 1.5 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
              <Typography variant="subtitle2">{t.preview}</Typography>
              {template.hasMedia && <Chip size="small" label={t.media} />}
            </Stack>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", color: "text.secondary" }}>
              {describeTemplateBody(template.body, rows)}
            </Typography>
          </Paper>

          <Typography variant="subtitle2">{t.variables}</Typography>
          {rows.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              {t.noVariables}
            </Typography>
          )}
          {rows.map((row) => (
            <Box
              key={row.position}
              sx={{
                display: "grid",
                gap: 1,
                alignItems: "start",
                gridTemplateColumns: { xs: "1fr", md: "max-content 180px 1fr 1fr" },
              }}
            >
              <Chip
                label={`{{${row.position}}}`}
                sx={{ fontFamily: "monospace", mt: { md: 0.5 }, justifySelf: "start", "& .MuiChip-label": { overflow: "visible" } }}
              />
              <TextField
                select
                size="small"
                label={t.fillWith}
                value={row.source}
                onChange={(e) => updateRow(row.position, { source: e.target.value, value: "" })}
              >
                {sourceOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              {renderValueInput(row)}
              {row.source !== WHATSAPP_VARIABLE_SOURCES.TEXT ? (
                <TextField
                  size="small"
                  label={t.fallback}
                  helperText={t.fallbackHelp}
                  value={row.fallback}
                  onChange={(e) => updateRow(row.position, { fallback: e.target.value })}
                  slotProps={{ htmlInput: { maxLength: WHATSAPP_MESSAGE_LIMITS.MAX_VALUE_LENGTH } }}
                />
              ) : (
                <Box />
              )}
            </Box>
          ))}
        </>
      )}
    </Stack>
  );
}
