"use client";

import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import useI18nLayout from "@/hooks/useI18nLayout";
import { WHATSAPP_APPROVED } from "@/utils/whatsappMessages";

const translations = {
  en: {
    label: "WhatsApp message",
    none: "No WhatsApp messages are set up for this event and there are no platform defaults.",
    defaultTag: "Platform default",
    notApproved: "This template is not approved in Twilio yet, so it cannot be sent.",
    preview: "Preview",
    previewFor: "Shown for the first matching registration.",
    noRecipient: "No registration to preview yet; variables show their fallbacks.",
    media: "Includes media",
  },
  ar: {
    label: "رسالة واتساب",
    none: "لا توجد رسائل واتساب لهذه الفعالية ولا توجد رسائل افتراضية للمنصة.",
    defaultTag: "افتراضية",
    notApproved: "هذا القالب غير معتمد في Twilio بعد، لذلك لا يمكن إرساله.",
    preview: "معاينة",
    previewFor: "معروضة لأول تسجيل مطابق.",
    noRecipient: "لا يوجد تسجيل للمعاينة بعد؛ تظهر المتغيرات بقيمها الاحتياطية.",
    media: "يتضمن وسائط",
  },
};

/**
 * The WhatsApp message choice and preview in a send dialog. Shared by the bulk
 * and single notification modals.
 *
 * @param {object} props
 * @param {ReturnType<import("@/hooks/useWhatsAppMessageChoice").default>} props.choice
 * @param {boolean} [props.forSingleRecipient] - Preview text refers to the one recipient
 * @returns {JSX.Element}
 */
export default function WhatsAppMessagePicker({ choice, forSingleRecipient = false }) {
  const { t, dir } = useI18nLayout(translations);
  const { messages, messageId, setMessageId, loading, preview, previewLoading } = choice;

  if (loading) return <CircularProgress size={22} />;
  if (!messages.length) return <Alert severity="warning">{t.none}</Alert>;

  const selected = messages.find((message) => String(message._id) === messageId);
  const approved = selected?.template?.approvalStatus === WHATSAPP_APPROVED;

  return (
    <Stack spacing={1.5} dir={dir}>
      <TextField
        select
        size="small"
        label={t.label}
        value={messageId}
        onChange={(e) => setMessageId(e.target.value)}
      >
        {messages.map((message) => (
          <MenuItem key={message._id} value={String(message._id)}>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              {message.label}
              {message.isDefault && <Chip size="small" variant="outlined" label={t.defaultTag} />}
            </Box>
          </MenuItem>
        ))}
      </TextField>

      {selected && !approved && <Alert severity="warning">{t.notApproved}</Alert>}

      {selected && (
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
            <Typography variant="subtitle2">{t.preview}</Typography>
            {selected.template?.hasMedia && <Chip size="small" label={t.media} />}
            {previewLoading && <CircularProgress size={14} />}
          </Stack>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
            {preview?.text || selected.template?.body || ""}
          </Typography>
          {preview && !forSingleRecipient && (
            <Typography variant="caption" color="text.secondary">
              {preview.recipientFound ? t.previewFor : t.noRecipient}
            </Typography>
          )}
        </Paper>
      )}
    </Stack>
  );
}

/**
 * Whether the chosen message can be sent (chosen and approved).
 *
 * @param {ReturnType<import("@/hooks/useWhatsAppMessageChoice").default>} choice
 * @returns {boolean}
 */
export function canSendWhatsAppChoice(choice) {
  const selected = choice.messages.find((message) => String(message._id) === choice.messageId);
  return !!selected && selected.template?.approvalStatus === WHATSAPP_APPROVED;
}
