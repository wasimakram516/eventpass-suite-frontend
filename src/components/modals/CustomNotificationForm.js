"use client";

import { Box } from "@mui/material";
import EmailTemplateWorkspace from "@/components/modals/EmailTemplateWorkspace";
import AttachmentPicker from "@/components/modals/AttachmentPicker";
import { isEventPaid } from "@/utils/notificationEmail";

/**
 * The "Custom" part of a notification modal: the email template form with its
 * live preview, plus an optional attachment. Shared by the bulk and single
 * notification modals.
 *
 * @param {object} props
 * @param {object} props.composer - From useCustomEmailComposer
 * @param {object|null} props.event - The event being notified about
 * @param {File|null} props.attachedFile - The attached file, or null
 * @param {(file: File|null) => void} props.onFileChange - Called when the file changes or is removed
 * @returns {JSX.Element}
 */
const CustomNotificationForm = ({ composer, event, attachedFile, onFileChange }) => (
  <EmailTemplateWorkspace
    formData={composer.form}
    setFormData={composer.setForm}
    isPaid={isEventPaid(event)}
    errors={composer.errors}
    onClearError={composer.clearError}
  >
    <Box sx={{ mt: 2 }}>
      <AttachmentPicker file={attachedFile} onChange={onFileChange} />
    </Box>
  </EmailTemplateWorkspace>
);

export default CustomNotificationForm;
