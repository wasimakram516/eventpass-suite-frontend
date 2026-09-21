"use client";

import { Box } from "@mui/material";
import EmailTemplateTab from "@/components/modals/EmailTemplateTab";
import EmailPreviewPane from "@/components/modals/EmailPreviewPane";

/**
 * The email template form with its live preview beside it (about 70 and 30
 * percent, stacked on small screens). Shared by the event setup Custom Email tab
 * and the Custom option of the notification modals, so both offer the same
 * customization.
 *
 * @param {object} props
 * @param {object} props.formData - Template form state (see buildCustomTemplateForm)
 * @param {Function} props.setFormData - Form state setter
 * @param {boolean} props.isPaid - Whether the event is paid
 * @param {boolean} [props.isCheckIn] - Whether the event is a CheckIn event
 * @param {object} [props.eventInfo] - Event details for the preview (see emailEventDetails)
 * @param {{subject: boolean, body: boolean}} props.errors - Required field errors
 * @param {(field: "subject"|"body") => void} props.onClearError - Clears one required error
 * @param {React.ReactNode} [props.children] - Extra controls shown under the form (for example an attachment picker)
 * @returns {JSX.Element}
 */
const EmailTemplateWorkspace = ({ formData, setFormData, isPaid, isCheckIn = false, eventInfo, errors, onClearError, children }) => (
  <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: "flex-start", gap: 2 }}>
    <Box sx={{ flex: { md: "7 1 0" }, minWidth: 0, width: "100%" }}>
      <EmailTemplateTab
        formData={formData}
        setFormData={setFormData}
        isPaid={isPaid}
        isCheckIn={isCheckIn}
        errors={errors}
        onClearError={onClearError}
      />
      {children}
    </Box>
    <Box
      sx={{
        flex: { md: "3 1 0" },
        minWidth: 0,
        width: "100%",
        mt: 2,
        position: { md: "sticky" },
        top: { md: 0 },
      }}
    >
      <EmailPreviewPane formData={formData} isPaid={isPaid} isCheckIn={isCheckIn} eventInfo={eventInfo} />
    </Box>
  </Box>
);

export default EmailTemplateWorkspace;
