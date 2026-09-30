"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Box,
    Typography,
    Stack,
    FormControl,
    Select,
    MenuItem,

} from "@mui/material";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import useNotificationDraft from "@/hooks/useNotificationDraft";
import MessageTypeSelector from "@/components/modals/MessageTypeSelector";
import NotificationActions from "@/components/modals/NotificationActions";
import CustomNotificationForm from "@/components/modals/CustomNotificationForm";
import DefaultNotificationInfo from "@/components/modals/DefaultNotificationInfo";
import WhatsAppMessagePicker, { canSendWhatsAppChoice } from "@/components/whatsapp/WhatsAppMessagePicker";
import useWhatsAppMessageChoice from "@/hooks/useWhatsAppMessageChoice";
import {
    DEFAULT_RECIPIENT_FILTER,
    REGISTRATION_RECIPIENT_FILTER_PAYLOADS,
    getNotificationRecipientFilterPayload,
} from "@/utils/notificationRecipientFilters";

const translations = {
    en: {
        title: "Send Notifications",
        messageType: "Message Type",
        confirmed: "Confirmed",
        notConfirmed: "Not Attending",
        approved: "Approved",
        rejected: "Rejected",
        pending: "Pending",
        all: "All",
        filterByStatus: "Filter by Status",
        emailSent: "Email Sent",
        emailNotSent: "Email Not Sent",
        whatsappSent: "WhatsApp Sent",
        whatsappNotSent: "WhatsApp Not Sent",
        close: "Close",
    },
    ar: {
        title: "إرسال الإشعارات",
        messageType: "نوع الرسالة",
        confirmed: "مؤكد",
        notConfirmed: "غير مؤكد",
        approved: "موافق عليه",
        rejected: "مرفوض",
        pending: "قيد الانتظار",
        all: "الكل",
        filterByStatus: "تصفية حسب الحالة",
        emailSent: "تم إرسال البريد",
        emailNotSent: "لم يتم إرسال البريد",
        whatsappSent: "تم إرسال واتساب",
        whatsappNotSent: "لم يتم إرسال واتساب",
    },
};

/**
 * Send Notifications modal for an event's registrations. "Default" sends what is
 * configured for the event (its custom email template if it has one, else the
 * system default). "Custom" composes a one off email with the same options as the
 * event setup Custom Email tab, pre-filled from the event and never saved to it.
 *
 * @param {object} props
 * @param {boolean} props.open - Whether the modal is open
 * @param {Function} props.onClose - Called to close the modal
 * @param {Function} props.onSendEmail - Called with {type, customTemplate, file, ...filters}
 * @param {Function} props.onSendWhatsApp - Called with {type, ...filters}
 * @param {object|null} [props.event] - The event being notified about
 * @param {Array<{value: string, label: string}>} [props.filterOptions] - Module-specific recipient dropdown options
 * @param {Record<string, object>} [props.filterPayloads] - API payload indexed by filter value
 * @returns {JSX.Element}
 */
const BulkEmailModal = ({
    open,
    onClose,
    onSendEmail,
    onSendWhatsApp,
    event = null,
    sendingEmails = false,
    isApprovalBased = true,
    useApprovedRejected = false,
    canSendEmail = true,
    canSendWhatsapp = true,
    title,
    filterLabel,
    filterOptions,
    filterPayloads = REGISTRATION_RECIPIENT_FILTER_PAYLOADS,
    initialFilter = DEFAULT_RECIPIENT_FILTER,
    whatsappResourceId,
    loadWhatsAppMessages,
    loadWhatsAppPreview,
    showAttachment = true,
    isSurvey = false,
}) => {
    const { t, dir } = useI18nLayout(translations);
    const [selectedFilter, setSelectedFilter] = useState(initialFilter);
    const draft = useNotificationDraft(event, open);
    const { notificationType, composer } = draft;
    const whatsappChoice = useWhatsAppMessageChoice({
        event,
        enabled: open && canSendWhatsapp,
        resourceId: whatsappResourceId,
        loadMessages: loadWhatsAppMessages,
        loadPreview: loadWhatsAppPreview,
    });

    useEffect(() => {
        setSelectedFilter(initialFilter);
    }, [initialFilter, isApprovalBased, useApprovedRejected, open]);

    const handleClose = () => {
        draft.reset();
        setSelectedFilter(initialFilter);
        onClose();
    };

    const handleSendEmail = () => {
        const isCustom = notificationType === "custom";
        if (isCustom && !composer.validate()) return;

        onSendEmail({
            type: notificationType,
            customTemplate: isCustom ? composer.buildTemplate() : undefined,
            file: isCustom ? draft.attachedFile : undefined,
            ...getNotificationRecipientFilterPayload(selectedFilter, filterPayloads, initialFilter),
        });
    };

    const handleSendWhatsApp = () => {
        onSendWhatsApp({
            type: notificationType,
            messageId: whatsappChoice.messageId,
            ...getNotificationRecipientFilterPayload(selectedFilter, filterPayloads, initialFilter),
        });
    };

    const defaultFilterOptions = [
        { value: "all", label: t.all },
        ...(isApprovalBased
            ? useApprovedRejected
                ? [
                    { value: "approved", label: t.approved },
                    { value: "rejected", label: t.rejected },
                    { value: "pending", label: t.pending },
                ]
                : [
                    { value: "confirmed", label: t.confirmed },
                    { value: "notConfirmed", label: t.notConfirmed },
                    { value: "pending", label: t.pending },
                ]
            : []),
        { value: "emailSent", label: t.emailSent },
        { value: "emailNotSent", label: t.emailNotSent },
        { value: "whatsappSent", label: t.whatsappSent },
        { value: "whatsappNotSent", label: t.whatsappNotSent },
    ];
    const availableFilterOptions = filterOptions ?? defaultFilterOptions;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            dir={dir}
            maxWidth={notificationType === "custom" ? "lg" : "md"}
            fullWidth
            slotProps={{
                paper: {}
            }}
        >
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    pb: 1,
                }}
            >
                {title || t.title}
                <IconButton onClick={handleClose} size="small" aria-label={t.close || "Close"}>
                    <ICONS.close />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={3}>
                    {/* Filter Dropdown */}
                    <Box>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                            {filterLabel || t.filterByStatus}:
                        </Typography>
                        <FormControl fullWidth size="small">
                            <Select
                                value={selectedFilter}
                                onChange={(e) => setSelectedFilter(e.target.value)}
                                inputProps={{ "aria-label": filterLabel || t.filterByStatus }}
                                displayEmpty
                            >
                                {availableFilterOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    <Box>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                            {t.messageType}:
                        </Typography>
                        <MessageTypeSelector
                            value={notificationType}
                            onChange={draft.setNotificationType}
                        />
                    </Box>

                    {notificationType === "default" && <DefaultNotificationInfo event={event} />}

                    {canSendWhatsapp && notificationType !== "custom" && (
                        <WhatsAppMessagePicker choice={whatsappChoice} />
                    )}

                    {notificationType === "custom" && (
                        <CustomNotificationForm
                            composer={composer}
                            event={event}
                            attachedFile={draft.attachedFile}
                            onFileChange={draft.setAttachedFile}
                            showAttachment={showAttachment}
                            isSurvey={isSurvey}
                        />
                    )}
                </Stack>
            </DialogContent>
            <NotificationActions
                notificationType={notificationType}
                canSendEmail={canSendEmail}
                canSendWhatsapp={canSendWhatsapp}
                disabled={sendingEmails}
                whatsappDisabled={!canSendWhatsAppChoice(whatsappChoice)}
                onSendEmail={handleSendEmail}
                onSendWhatsApp={handleSendWhatsApp}
            />
        </Dialog>
    );
};

export default BulkEmailModal;
