"use client";

import { useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import RichTextEditor from "@/components/RichTextEditor";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import { useMessage } from "@/contexts/MessageContext";
import { EMAIL_TEMPLATE_REQUIRED_MESSAGES } from "@/utils/emailTemplateMessages";
import {
  EMAIL_TEMPLATE_DEFAULTS,
  EMAIL_TEMPLATE_RESERVED,
  EMAIL_TEMPLATE_WARNINGS,
  clampLogoSize,
  clampQrSize,
  getPlaceholderGroups,
  getTemplateWarnings,
  hasTemplatePlaceholder,
  toPlaceholder,
} from "@/utils/emailTemplatePlaceholders";

const translations = {
  en: {
    legacyNotice:
      "This event uses a legacy template. The header, QR code and token are added automatically around your body. Switch to placeholder mode to place them yourself.",
    switchToPlaceholders: "Switch to placeholder mode",
    intro: "Tick a placeholder, click it to copy, then paste it into the subject or body.",
    placeholdersTitle: "Placeholders",
    eventDetails: "Event details",
    organizerDetails: "Organizer details",
    links: "Links",
    qrToken: "QR and token",
    attendeeDetails: "Attendee details",
    payment: "Payment",
    selectAll: "Select all",
    copy: "Copy placeholder",
    copied: "Placeholder copied",
    copyFailed: "Could not copy. Select and copy the placeholder manually.",
    qrSize: "QR size",
    logoSize: "Logo width (px)",
    accentColor: "Accent color",
    header: "Header",
    headerHint:
      "Shown in a band of the accent color at the top, formatted and aligned like the body. Leave empty for no header. Placeholders such as {Logo} and {Event Name} work here.",
    headerPlaceholder: "Optional header, e.g. {Logo} {Event Name}",
    emailSubject: "Email Subject",
    emailBody: "Email Body",
    placeholderSubject: "Enter email subject",
    placeholderBody: "Enter email body...",
    emailSubjectRequired: EMAIL_TEMPLATE_REQUIRED_MESSAGES.en.subject,
    emailBodyRequired: EMAIL_TEMPLATE_REQUIRED_MESSAGES.en.body,
    warningsTitle: "Review before saving:",
    [EMAIL_TEMPLATE_WARNINGS.MISSING_QR]:
      "The body has no {QR}, so attendees will receive the email without a QR code.",
    [EMAIL_TEMPLATE_WARNINGS.UNKNOWN_PLACEHOLDER]:
      "These placeholders match no field and will be sent as typed:",
    [EMAIL_TEMPLATE_WARNINGS.REMOVED_FIELD]:
      "These ticked fields no longer exist in this event:",
    [EMAIL_TEMPLATE_WARNINGS.SUBJECT_UNSUPPORTED]:
      "These placeholders are not supported in the subject and will be left empty:",
  },
  ar: {
    legacyNotice:
      "تستخدم هذه الفعالية قالبا قديما. تتم إضافة الترويسة ورمز QR والرمز تلقائيا حول النص. انتقل إلى وضع العناصر النائبة لوضعها بنفسك.",
    switchToPlaceholders: "الانتقال إلى وضع العناصر النائبة",
    intro: "حدد عنصرا نائبا، انقر عليه لنسخه، ثم الصقه في الموضوع أو النص.",
    placeholdersTitle: "العناصر النائبة",
    eventDetails: "تفاصيل الفعالية",
    organizerDetails: "تفاصيل المنظم",
    links: "الروابط",
    qrToken: "رمز QR والرمز",
    attendeeDetails: "تفاصيل الحاضر",
    payment: "الدفع",
    selectAll: "تحديد الكل",
    copy: "نسخ العنصر النائب",
    copied: "تم نسخ العنصر النائب",
    copyFailed: "تعذر النسخ. حدد العنصر النائب وانسخه يدويا.",
    qrSize: "حجم رمز QR",
    logoSize: "عرض الشعار (بكسل)",
    accentColor: "لون التمييز",
    header: "الترويسة",
    headerHint:
      "تظهر في شريط بلون التمييز أعلى الرسالة، بتنسيق ومحاذاة مثل النص. اتركها فارغة لعدم استخدام ترويسة. تعمل العناصر النائبة مثل {Logo} و{Event Name} هنا.",
    headerPlaceholder: "ترويسة اختيارية، مثل {Logo} {Event Name}",
    emailSubject: "موضوع البريد الإلكتروني",
    emailBody: "نص البريد الإلكتروني",
    placeholderSubject: "أدخل موضوع البريد الإلكتروني",
    placeholderBody: "أدخل نص البريد الإلكتروني...",
    emailSubjectRequired: EMAIL_TEMPLATE_REQUIRED_MESSAGES.ar.subject,
    emailBodyRequired: EMAIL_TEMPLATE_REQUIRED_MESSAGES.ar.body,
    warningsTitle: "راجع قبل الحفظ:",
    [EMAIL_TEMPLATE_WARNINGS.MISSING_QR]:
      "لا يحتوي النص على {QR}، لذلك سيستلم الحضور البريد بدون رمز QR.",
    [EMAIL_TEMPLATE_WARNINGS.UNKNOWN_PLACEHOLDER]:
      "هذه العناصر النائبة لا تطابق أي حقل وسترسل كما كتبت:",
    [EMAIL_TEMPLATE_WARNINGS.REMOVED_FIELD]:
      "هذه الحقول المحددة لم تعد موجودة في الفعالية:",
    [EMAIL_TEMPLATE_WARNINGS.SUBJECT_UNSUPPORTED]:
      "هذه العناصر النائبة غير مدعومة في الموضوع وستترك فارغة:",
  },
};

// The app theme gives text fields a tall pill shape; this keeps every control in
// the tab at one short, consistent height.
const COMPACT_FIELD_SX = {
  "& .MuiOutlinedInput-root": { height: 36 },
  "& .MuiOutlinedInput-input": { py: 0, fontSize: 14 },
};

/**
 * Small caption shown above a control, so every control in the tab is labelled
 * the same way.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Label text
 * @param {boolean} [props.required] - Show a required asterisk
 * @param {boolean} [props.error] - Color the asterisk as an error
 * @returns {JSX.Element}
 */
const FieldLabel = ({ children, required = false, error = false }) => (
  <Typography variant="caption" sx={{ display: "block", mb: 0.5, fontWeight: 500 }}>
    {children}
    {required && (
      <Typography component="span" variant="caption" sx={{ color: error ? "error.main" : "text.secondary" }}>
        {" *"}
      </Typography>
    )}
  </Typography>
);

/**
 * Size input for one visual placeholder (the QR or the logo). Both use this so
 * they look and behave the same. Position is not set here: the admin aligns the
 * paragraph holding the placeholder with the rich text editor's align buttons.
 *
 * @param {object} props
 * @param {string} props.label - Caption and aria label of the input
 * @param {number|string} props.value - Current size in pixels
 * @param {number} props.min - Smallest allowed size
 * @param {number} props.max - Largest allowed size
 * @param {(value: string) => void} props.onChange - Called as the size is typed
 * @param {() => void} props.onCommit - Called on blur to clamp the size
 * @returns {JSX.Element}
 */
const SizeField = ({ label, value, min, max, onChange, onCommit }) => (
  <Box>
    <FieldLabel>{label}</FieldLabel>
    <TextField
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onCommit}
      slotProps={{
        htmlInput: { min, max, "aria-label": label },
        input: { endAdornment: <InputAdornment position="end">px</InputAdornment> },
      }}
      sx={{ width: 110, ...COMPACT_FIELD_SX }}
    />
  </Box>
);

/**
 * One row of the placeholder list: a tick box, and once ticked a chip showing
 * the placeholder that copies it when clicked.
 *
 * @param {object} props
 * @param {string} props.name - Field or built in name, shown as {name}
 * @param {boolean} props.checked - Whether the row is ticked
 * @param {(name: string, checked: boolean) => void} props.onToggle - Called when the tick changes
 * @param {(name: string) => void} props.onCopy - Called with the name when the chip is clicked
 * @param {string} props.copyLabel - Tooltip and aria label for the chip
 * @returns {JSX.Element}
 */
const PlaceholderRow = ({ name, checked, onToggle, onCopy, copyLabel }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, minHeight: 34, minWidth: 0 }}>
    <FormControlLabel
      sx={{ m: 0, minWidth: 0, "& .MuiFormControlLabel-label": { fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }}
      control={<Checkbox size="small" checked={checked} onChange={(e) => onToggle(name, e.target.checked)} />}
      label={name}
    />
    {checked && (
      <Tooltip title={copyLabel}>
        <Chip
          clickable
          size="small"
          variant="outlined"
          icon={<ICONS.copy sx={{ fontSize: 14 }} />}
          label={toPlaceholder(name)}
          aria-label={`${copyLabel} ${toPlaceholder(name)}`}
          onClick={() => onCopy(name)}
          sx={{ fontFamily: "monospace", height: 24, flexShrink: 0 }}
        />
      </Tooltip>
    )}
  </Box>
);

/**
 * The "Custom Email Template" tab of the event modal: a placeholder list,
 * QR size and position, header color, and the subject and body.
 *
 * @param {object} props
 * @param {object} props.formData - Event modal form state
 * @param {Function} props.setFormData - Event modal form state setter
 * @param {boolean} props.isPaid - Whether the event is paid (offers {Payment Summary})
 * @param {boolean} [props.isCheckIn] - Whether the event is a CheckIn event (offers times and {Confirmation Button})
 * @param {{subject: boolean, body: boolean}} props.errors - Required field errors
 * @param {(field: "subject"|"body") => void} props.onClearError - Clears one required error
 * @returns {JSX.Element}
 */
const EmailTemplateTab = ({ formData, setFormData, isPaid, isCheckIn = false, errors, onClearError }) => {
  const { t, dir } = useI18nLayout(translations);
  const { showMessage } = useMessage();

  const usePlaceholders = formData.emailTemplateUsePlaceholders;
  const selectedFields = formData.emailTemplateSelectedFields || [];
  const placeholderGroups = useMemo(
    () => getPlaceholderGroups({ useCustomFields: formData.useCustomFields, formFields: formData.formFields, isPaid, isCheckIn }),
    [formData.useCustomFields, formData.formFields, isPaid, isCheckIn],
  );
  const placeholderNames = useMemo(() => placeholderGroups.flatMap((group) => group.names), [placeholderGroups]);
  const warnings = useMemo(
    () =>
      usePlaceholders
        ? getTemplateWarnings({
            subject: formData.emailTemplateSubject,
            body: formData.emailTemplateBody,
            header: formData.emailTemplateHeader,
            useCustomFields: formData.useCustomFields,
            formFields: formData.formFields,
            selectedFields,
            isPaid,
            isCheckIn,
          })
        : [],
    [usePlaceholders, formData.emailTemplateSubject, formData.emailTemplateBody, formData.emailTemplateHeader, formData.useCustomFields, formData.formFields, selectedFields, isPaid, isCheckIn],
  );

  // QR and logo sizing matter once the placeholder is ticked or already used in the header or body.
  const isPlaceholderInUse = (name) =>
    selectedFields.includes(name) ||
    hasTemplatePlaceholder(formData.emailTemplateBody, name) ||
    hasTemplatePlaceholder(formData.emailTemplateHeader, name);
  const showQrSettings = isPlaceholderInUse(EMAIL_TEMPLATE_RESERVED.QR);
  const showLogoSettings = isPlaceholderInUse(EMAIL_TEMPLATE_RESERVED.LOGO);

  const update = (patch) => setFormData((prev) => ({ ...prev, ...patch }));

  const copyPlaceholder = async (name) => {
    try {
      await navigator.clipboard.writeText(toPlaceholder(name));
      showMessage(t.copied, "success");
    } catch {
      showMessage(t.copyFailed, "error");
    }
  };

  const togglePlaceholder = (name, checked) =>
    update({
      emailTemplateSelectedFields: checked
        ? [...new Set([...selectedFields, name])]
        : selectedFields.filter((selected) => selected !== name),
    });

  const commitQrSize = () => update({ emailTemplateQrSize: clampQrSize(formData.emailTemplateQrSize) });
  const commitLogoSize = () => update({ emailTemplateLogoSize: clampLogoSize(formData.emailTemplateLogoSize) });

  const allSelected = placeholderNames.every((name) => selectedFields.includes(name));

  return (
    <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      {!usePlaceholders ? (
        <Alert
          severity="info"
          action={
            <Button color="inherit" size="small" onClick={() => update({ emailTemplateUsePlaceholders: true })}>
              {t.switchToPlaceholders}
            </Button>
          }
        >
          {t.legacyNotice}
        </Alert>
      ) : (
        <>
          <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, px: 2, py: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
              <Box>
                <Typography variant="subtitle2">{t.placeholdersTitle}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t.intro}
                </Typography>
              </Box>
              <FormControlLabel
                sx={{ m: 0, flexShrink: 0, "& .MuiFormControlLabel-label": { fontSize: 13 } }}
                control={
                  <Checkbox
                    size="small"
                    checked={allSelected}
                    onChange={(e) => update({ emailTemplateSelectedFields: e.target.checked ? placeholderNames : [] })}
                  />
                }
                label={t.selectAll}
              />
            </Box>
            {placeholderGroups.map((group) => (
              <Box key={group.id} sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 600 }}>
                  {t[group.id]}
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, columnGap: 3 }}>
                  {group.names.map((name) => (
                    <PlaceholderRow
                      key={name}
                      name={name}
                      checked={selectedFields.includes(name)}
                      onToggle={togglePlaceholder}
                      onCopy={copyPlaceholder}
                      copyLabel={t.copy}
                    />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 3 }}>
            {showQrSettings && (
              <SizeField
                label={t.qrSize}
                value={formData.emailTemplateQrSize}
                min={EMAIL_TEMPLATE_DEFAULTS.QR_MIN_SIZE}
                max={EMAIL_TEMPLATE_DEFAULTS.QR_MAX_SIZE}
                onChange={(value) => update({ emailTemplateQrSize: value })}
                onCommit={commitQrSize}
              />
            )}
            {showLogoSettings && (
              <SizeField
                label={t.logoSize}
                value={formData.emailTemplateLogoSize}
                min={EMAIL_TEMPLATE_DEFAULTS.LOGO_MIN_SIZE}
                max={EMAIL_TEMPLATE_DEFAULTS.LOGO_MAX_SIZE}
                onChange={(value) => update({ emailTemplateLogoSize: value })}
                onCommit={commitLogoSize}
              />
            )}
            <Box>
              <FieldLabel>{t.accentColor}</FieldLabel>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, height: 36 }}>
                <input
                  type="color"
                  aria-label={t.accentColor}
                  value={formData.emailTemplateAccentColor}
                  onChange={(e) => update({ emailTemplateAccentColor: e.target.value })}
                  style={{ width: 36, height: 30, padding: 0, border: "none", background: "none", cursor: "pointer" }}
                />
                <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                  {formData.emailTemplateAccentColor}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box>
            <FieldLabel>{t.header}</FieldLabel>
            <RichTextEditor
              value={formData.emailTemplateHeader}
              onChange={(html) => update({ emailTemplateHeader: html })}
              placeholder={t.headerPlaceholder}
              dir={dir}
              minHeight="56px"
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
              {t.headerHint}
            </Typography>
          </Box>
        </>
      )}

      <Box>
        <FieldLabel required error={errors.subject}>
          {t.emailSubject}
        </FieldLabel>
        <TextField
          fullWidth
          value={formData.emailTemplateSubject}
          onChange={(e) => {
            update({ emailTemplateSubject: e.target.value });
            if (errors.subject) onClearError("subject");
          }}
          placeholder={t.placeholderSubject}
          error={errors.subject}
          helperText={errors.subject ? t.emailSubjectRequired : ""}
          slotProps={{ htmlInput: { "aria-label": t.emailSubject } }}
          sx={COMPACT_FIELD_SX}
        />
      </Box>

      <Box>
        <FieldLabel required error={errors.body}>
          {t.emailBody}
        </FieldLabel>
        <Box
          sx={{
            border: (theme) => (errors.body ? `1px solid ${theme.palette.error.main}` : "1px solid transparent"),
            borderRadius: 1,
          }}
        >
          <RichTextEditor
            value={formData.emailTemplateBody}
            onChange={(html) => {
              update({ emailTemplateBody: html });
              if (errors.body) onClearError("body");
            }}
            placeholder={t.placeholderBody}
            dir={dir}
          />
        </Box>
        {errors.body && (
          <Typography variant="caption" sx={{ color: "error.main", mt: 0.5, display: "block" }}>
            {t.emailBodyRequired}
          </Typography>
        )}
      </Box>

      {warnings.length > 0 && (
        <Alert severity="warning" variant="outlined" sx={{ py: 0, "& .MuiAlert-message": { py: 0.75 } }}>
          <Typography variant="caption" sx={{ display: "block", fontWeight: 600 }}>
            {t.warningsTitle}
          </Typography>
          {warnings.map((warning) => (
            <Typography key={warning.code} variant="caption" sx={{ display: "block" }}>
              {t[warning.code]} {warning.placeholders?.map(toPlaceholder).join(", ")}
            </Typography>
          ))}
        </Alert>
      )}
    </Box>
  );
};

export default EmailTemplateTab;
