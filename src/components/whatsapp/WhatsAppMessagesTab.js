"use client";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import useI18nLayout from "@/hooks/useI18nLayout";
import WhatsAppMessageEditor from "@/components/whatsapp/WhatsAppMessageEditor";
import { WHATSAPP_MESSAGE_LIMITS, createEmptyMessage } from "@/utils/whatsappMessages";

const translations = {
  en: {
    intro:
      "Add one message for each kind of WhatsApp you send for this event, for example Invitation and Reminder. When sending, you choose which message to send. Each message uses an approved template from the library, and you choose what fills each of its variables.",
    usingDefaults:
      "No messages set up yet, so this event uses the platform default messages. Add one to use your own.",
    add: "Add WhatsApp message",
    remove: "Remove message",
    untitled: "Untitled message",
  },
  ar: {
    intro:
      "أضف رسالة لكل نوع من رسائل واتساب التي ترسلها لهذه الفعالية، مثل الدعوة والتذكير. عند الإرسال، تختار الرسالة التي تريد إرسالها. تستخدم كل رسالة قالبا معتمدا من المكتبة، وتختار ما يملأ كل متغير فيه.",
    usingDefaults:
      "لم يتم إعداد أي رسائل بعد، لذلك تستخدم هذه الفعالية الرسائل الافتراضية للمنصة. أضف رسالة لاستخدام رسائلك.",
    add: "إضافة رسالة واتساب",
    remove: "إزالة الرسالة",
    untitled: "رسالة بدون اسم",
  },
};

/**
 * The event modal's WhatsApp tab: the event's list of WhatsApp messages.
 *
 * @param {object} props
 * @param {Array<object>} props.messages - Editable messages
 * @param {(messages: Array<object>) => void} props.onChange
 * @param {{templates: Array, placeholders: string[], loading: boolean}} props.catalog - From useWhatsAppCatalog
 * @param {string[]} props.fieldNames - The event's registration field names
 * @returns {JSX.Element}
 */
export default function WhatsAppMessagesTab({ messages, onChange, catalog, fieldNames }) {
  const { t, dir } = useI18nLayout(translations);

  if (catalog.loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  const updateAt = (index, message) => onChange(messages.map((current, i) => (i === index ? message : current)));
  const removeAt = (index) => onChange(messages.filter((_, i) => i !== index));

  return (
    <Stack spacing={2} dir={dir} sx={{ mt: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {t.intro}
      </Typography>
      {messages.length === 0 && <Alert severity="info">{t.usingDefaults}</Alert>}

      {messages.map((message, index) => (
        <Paper key={message._id || `new-${index}`} variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" sx={{ alignItems: "center", mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ flex: 1, fontWeight: 600 }}>
              {message.label.trim() || t.untitled}
            </Typography>
            <Tooltip title={t.remove}>
              <IconButton size="small" color="error" onClick={() => removeAt(index)} aria-label={t.remove}>
                <ICONS.delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
          <WhatsAppMessageEditor
            message={message}
            onChange={(updated) => updateAt(index, updated)}
            templates={catalog.templates}
            placeholders={catalog.placeholders}
            fieldNames={fieldNames}
          />
        </Paper>
      ))}

      <Box>
        <Button
          variant="outlined"
          startIcon={<ICONS.add />}
          onClick={() => onChange([...messages, createEmptyMessage()])}
          disabled={messages.length >= WHATSAPP_MESSAGE_LIMITS.MAX_MESSAGES_PER_EVENT}
          sx={getStartIconSpacing(dir)}
        >
          {t.add}
        </Button>
      </Box>
    </Stack>
  );
}
