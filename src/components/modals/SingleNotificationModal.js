import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, IconButton, Stack } from "@mui/material";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import useNotificationDraft from "@/hooks/useNotificationDraft";
import MessageTypeSelector from "@/components/modals/MessageTypeSelector";
import NotificationActions from "@/components/modals/NotificationActions";
import CustomNotificationForm from "@/components/modals/CustomNotificationForm";
import DefaultNotificationInfo from "@/components/modals/DefaultNotificationInfo";
import { sendCheckInSingleNotification } from "@/services/checkin/checkinRegistrationService";

const translations = {
  en: { notifyTitle: "Notify" },
  ar: { notifyTitle: "إشعار" },
};

/**
 * Notify a single registration. "Default" sends what is configured for the event
 * (its custom email template if it has one, else the system default). "Custom"
 * composes a one off email with the same options as the event setup Custom Email
 * tab, pre-filled from the event and never saved to it.
 *
 * @param {object} props
 * @param {boolean} props.open - Whether the modal is open
 * @param {Function} props.onClose - Called to close the modal
 * @param {(channel: string) => void} props.onSent - Called after a notification was sent
 * @param {object} props.registration - The registration being notified
 * @param {object|null} [props.event] - The registration's event
 * @returns {JSX.Element}
 */
const SingleNotificationModal = ({
  open,
  onClose,
  onSent,
  registration,
  event = null,
  showReminderOption = false,
  canSendEmail = true,
  canSendWhatsapp = true,
}) => {
  const { t, dir } = useI18nLayout(translations);
  const [sending, setSending] = useState(false);
  const draft = useNotificationDraft(event, open);
  const { notificationType, composer } = draft;

  const handleClose = () => {
    draft.reset();
    onClose();
  };

  const handleSend = async (channel) => {
    const isCustom = notificationType === "custom";
    if (channel === "email" && isCustom && !composer.validate()) return;

    // Email has no separate reminder template; emailProcessor infers
    // "is this a reminder" from the recipient's own emailSent flag.
    // WhatsApp has a real, distinct reminder template.
    const type =
      channel === "email"
        ? notificationType === "reminder" ? "default" : notificationType
        : notificationType;

    const customFields =
      channel === "email" && isCustom
        ? { customTemplate: JSON.stringify(composer.buildTemplate()) }
        : {};

    setSending(true);
    try {
      await sendCheckInSingleNotification(
        registration._id,
        { channel, type, ...customFields },
        isCustom ? draft.attachedFile : undefined
      );
      onSent?.(channel);
      handleClose();
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={notificationType === "custom" ? "lg" : "sm"}
      fullWidth
      dir={dir}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {t.notifyTitle} {registration?.fullName || registration?.email}
        <IconButton size="small" onClick={handleClose}><ICONS.close /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <MessageTypeSelector
            value={notificationType}
            onChange={draft.setNotificationType}
            showReminderOption={showReminderOption}
          />

          {notificationType === "default" && <DefaultNotificationInfo event={event} />}

          {notificationType === "custom" && (
            <CustomNotificationForm
              composer={composer}
              event={event}
              attachedFile={draft.attachedFile}
              onFileChange={draft.setAttachedFile}
            />
          )}
        </Stack>
      </DialogContent>
      <NotificationActions
        notificationType={notificationType}
        canSendEmail={canSendEmail}
        canSendWhatsapp={canSendWhatsapp}
        disabled={sending}
        onSendEmail={() => handleSend("email")}
        onSendWhatsApp={() => handleSend("whatsapp")}
      />
    </Dialog>
  );
};

export default SingleNotificationModal;
