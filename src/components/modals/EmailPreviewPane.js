"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Box, Typography } from "@mui/material";
import useI18nLayout from "@/hooks/useI18nLayout";
import { buildEmailPreview } from "@/utils/emailTemplatePreview";

const SAMPLE_QR_VALUE = "A1B2C3D4E5";
const PREVIEW_DEBOUNCE_MS = 250;
const PREVIEW_HEIGHT = 560;

const translations = {
  en: {
    title: "Live preview",
    note: "Shown with sample attendee data.",
    subjectLabel: "Subject",
    noSubject: "(no subject yet)",
    frameTitle: "Email preview",
    legacyOnly: "Live preview is available in placeholder mode. Switch to placeholder mode to see it.",
  },
  ar: {
    title: "معاينة مباشرة",
    note: "تظهر ببيانات حضور تجريبية.",
    subjectLabel: "الموضوع",
    noSubject: "(لا يوجد موضوع بعد)",
    frameTitle: "معاينة البريد الإلكتروني",
    legacyOnly: "المعاينة المباشرة متاحة في وضع العناصر النائبة. انتقل إليه لمشاهدتها.",
  },
};

/**
 * Debounce a fast changing value so the preview frame does not reload on every
 * keystroke.
 *
 * @param {*} value - Latest value
 * @param {number} delayMs - Quiet time before the debounced value updates
 * @returns {*} The value, updated only after it has stopped changing
 */
function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

/**
 * Live, client side preview of the event's custom email, rendered from the
 * form values as they change. Uses sample attendee data and a sample QR; nothing
 * is sent or saved.
 *
 * @param {object} props
 * @param {object} props.formData - Event modal form state
 * @param {boolean} props.isPaid - Whether the event is paid (adds a sample payment summary)
 * @returns {JSX.Element}
 */
const EmailPreviewPane = ({ formData, isPaid }) => {
  const { t } = useI18nLayout(translations);
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(SAMPLE_QR_VALUE, { margin: 1, width: 400 })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch((error) => console.error("[EmailPreviewPane] Sample QR failed:", error.message));
    return () => {
      cancelled = true;
    };
  }, []);

  const usePlaceholders = formData.emailTemplateUsePlaceholders;
  const preview = useMemo(
    () =>
      buildEmailPreview({
        template: {
          subject: formData.emailTemplateSubject,
          body: formData.emailTemplateBody,
          header: formData.emailTemplateHeader,
          accentColor: formData.emailTemplateAccentColor,
          qrSize: formData.emailTemplateQrSize,
          logoSize: formData.emailTemplateLogoSize,
        },
        useCustomFields: formData.useCustomFields,
        formFields: formData.formFields,
        eventName: formData.name,
        logoUrl: formData.logoPreview || formData.organizerLogoPreview || "",
        qrDataUrl,
        isPaid,
        language: formData.defaultLanguage,
      }),
    [
      formData.emailTemplateSubject,
      formData.emailTemplateBody,
      formData.emailTemplateHeader,
      formData.emailTemplateAccentColor,
      formData.emailTemplateQrSize,
      formData.emailTemplateLogoSize,
      formData.useCustomFields,
      formData.formFields,
      formData.name,
      formData.logoPreview,
      formData.organizerLogoPreview,
      formData.defaultLanguage,
      qrDataUrl,
      isPaid,
    ],
  );
  const shown = useDebouncedValue(preview, PREVIEW_DEBOUNCE_MS);

  return (
    <Box
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        p: 1.5,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        minWidth: 0,
      }}
    >
      <Box>
        <Typography variant="subtitle2">{t.title}</Typography>
        <Typography variant="caption" color="text.secondary">
          {t.note}
        </Typography>
      </Box>

      {usePlaceholders ? (
        <>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              {t.subjectLabel}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: "break-word" }}>
              {shown.subject || t.noSubject}
            </Typography>
          </Box>
          <Box
            component="iframe"
            title={t.frameTitle}
            srcDoc={shown.html}
            sandbox="allow-same-origin"
            sx={{ width: "100%", height: PREVIEW_HEIGHT, border: 1, borderColor: "divider", borderRadius: 1, bgcolor: "#f6f8fa" }}
          />
        </>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {t.legacyOnly}
        </Typography>
      )}
    </Box>
  );
};

export default EmailPreviewPane;
