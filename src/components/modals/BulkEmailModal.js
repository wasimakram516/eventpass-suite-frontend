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

const getFilterStates = (selectedFilter) => {
    const defaultFilters = { statusFilter: "all", emailSentFilter: "all", whatsappSentFilter: "all" };

    switch (selectedFilter) {
        case "all":
            return defaultFilters;
        case "approved":
        case "rejected":
        case "confirmed":
        case "notConfirmed":
        case "pending":
            return {
                statusFilter: selectedFilter,
                emailSentFilter: "all",
                whatsappSentFilter: "all",
            };
        case "emailSent":
            return {
                statusFilter: "all",
                emailSentFilter: "sent",
                whatsappSentFilter: "all",
            };
        case "emailNotSent":
            return {
                statusFilter: "all",
                emailSentFilter: "notSent",
                whatsappSentFilter: "all",
            };
        case "whatsappSent":
            return {
                statusFilter: "all",
                emailSentFilter: "all",
                whatsappSentFilter: "sent",
            };
        case "whatsappNotSent":
            return {
                statusFilter: "all",
                emailSentFilter: "all",
                whatsappSentFilter: "notSent",
            };
        default:
            return defaultFilters;
    }
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
}) => {
    const { t, dir } = useI18nLayout(translations);
    const [selectedFilter, setSelectedFilter] = useState("all");
    const draft = useNotificationDraft(event, open);
    const { notificationType, composer } = draft;
    const whatsappChoice = useWhatsAppMessageChoice({
        event,
        enabled: open && canSendWhatsapp,
    });

    useEffect(() => {
        setSelectedFilter("all");
    }, [isApprovalBased]);

    useEffect(() => {
        if (!open) setSelectedFilter("all");
    }, [open]);

    const handleClose = () => {
        draft.reset();
        setSelectedFilter("all");
        onClose();
    };

    const handleSendEmail = () => {
        const isCustom = notificationType === "custom";
        if (isCustom && !composer.validate()) return;

        onSendEmail({
            type: notificationType,
            customTemplate: isCustom ? composer.buildTemplate() : undefined,
            file: isCustom ? draft.attachedFile : undefined,
            ...getFilterStates(selectedFilter),
        });
    };

    const handleSendWhatsApp = () => {
        onSendWhatsApp({
            type: notificationType,
            messageId: whatsappChoice.messageId,
            ...getFilterStates(selectedFilter),
        });
    };

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
                {t.title}
                <IconButton onClick={handleClose} size="small">
                    <ICONS.close />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={3}>
                    {/* Filter Dropdown */}
                    <Box>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                            {t.filterByStatus}:
                        </Typography>
                        <FormControl fullWidth size="small">
                            <Select
                                value={selectedFilter}
                                onChange={(e) => setSelectedFilter(e.target.value)}
                                displayEmpty
                            >
                                <MenuItem value="all">{t.all}</MenuItem>
                                {isApprovalBased ? (
                                    useApprovedRejected ? (
                                        [
                                            <MenuItem key="approved" value="approved">{t.approved}</MenuItem>,
                                            <MenuItem key="rejected" value="rejected">{t.rejected}</MenuItem>,
                                            <MenuItem key="pending" value="pending">{t.pending}</MenuItem>,
                                            <MenuItem key="emailSent" value="emailSent">{t.emailSent}</MenuItem>,
                                            <MenuItem key="emailNotSent" value="emailNotSent">{t.emailNotSent}</MenuItem>,
                                            <MenuItem key="whatsappSent" value="whatsappSent">{t.whatsappSent}</MenuItem>,
                                            <MenuItem key="whatsappNotSent" value="whatsappNotSent">{t.whatsappNotSent}</MenuItem>,
                                        ]
                                    ) : (
                                        [
                                            <MenuItem key="confirmed" value="confirmed">{t.confirmed}</MenuItem>,
                                            <MenuItem key="notConfirmed" value="notConfirmed">{t.notConfirmed}</MenuItem>,
                                            <MenuItem key="pending" value="pending">{t.pending}</MenuItem>,
                                            <MenuItem key="emailSent" value="emailSent">{t.emailSent}</MenuItem>,
                                            <MenuItem key="emailNotSent" value="emailNotSent">{t.emailNotSent}</MenuItem>,
                                            <MenuItem key="whatsappSent" value="whatsappSent">{t.whatsappSent}</MenuItem>,
                                            <MenuItem key="whatsappNotSent" value="whatsappNotSent">{t.whatsappNotSent}</MenuItem>,
                                        ]
                                    )
                                ) : (
                                    [
                                        <MenuItem key="emailSent" value="emailSent">{t.emailSent}</MenuItem>,
                                        <MenuItem key="emailNotSent" value="emailNotSent">{t.emailNotSent}</MenuItem>,
                                        <MenuItem key="whatsappSent" value="whatsappSent">{t.whatsappSent}</MenuItem>,
                                        <MenuItem key="whatsappNotSent" value="whatsappNotSent">{t.whatsappNotSent}</MenuItem>,
                                    ]
                                )}
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
