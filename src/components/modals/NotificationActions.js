"use client";

import { Button, DialogActions } from "@mui/material";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

const translations = {
  en: { sendEmail: "Send Email", sendWhatsApp: "Send WhatsApp" },
  ar: { sendEmail: "إرسال بريد إلكتروني", sendWhatsApp: "إرسال واتساب" },
};

/**
 * The send buttons of a notification modal. WhatsApp only sends the default or
 * reminder message (a custom message is email only). Shared by the bulk and
 * single notification modals.
 *
 * @param {object} props
 * @param {"default"|"custom"|"reminder"} props.notificationType - The selected message type
 * @param {boolean} props.canSendEmail - Whether the user may send email
 * @param {boolean} props.canSendWhatsapp - Whether the user may send WhatsApp
 * @param {boolean} props.disabled - Disable both buttons while a send is running
 * @param {() => void} props.onSendEmail - Called when Send Email is clicked
 * @param {() => void} props.onSendWhatsApp - Called when Send WhatsApp is clicked
 * @returns {JSX.Element}
 */
const NotificationActions = ({
  notificationType,
  canSendEmail,
  canSendWhatsapp,
  disabled,
  onSendEmail,
  onSendWhatsApp,
}) => {
  const { t, dir } = useI18nLayout(translations);
  const canUseWhatsapp =
    canSendWhatsapp && (notificationType === "default" || notificationType === "reminder");

  return (
    <DialogActions sx={{ justifyContent: "flex-end", gap: 1, px: 2, py: 2 }}>
      {canUseWhatsapp && (
        <Button
          variant="contained"
          color="success"
          startIcon={<ICONS.whatsapp />}
          onClick={onSendWhatsApp}
          disabled={disabled}
          sx={getStartIconSpacing(dir)}
        >
          {t.sendWhatsApp}
        </Button>
      )}
      {canSendEmail && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<ICONS.email />}
          onClick={onSendEmail}
          disabled={disabled}
          sx={getStartIconSpacing(dir)}
        >
          {t.sendEmail}
        </Button>
      )}
    </DialogActions>
  );
};

export default NotificationActions;
