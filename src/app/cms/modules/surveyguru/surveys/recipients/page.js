"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  Divider,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Tooltip,
  TextField,
  CardContent,
  CardActions,
  Grid,
  useMediaQuery,
  useTheme,
  Pagination,
} from "@mui/material";
import ArabicPagination from "@/components/ArabicPagination";

import { useMessage } from "@/contexts/MessageContext";
import { useHasPermission } from "@/hooks/usePermission";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import AuditSearchClearButton from "@/components/AuditSearchClearButton";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import BulkEmailModal from "@/components/modals/BulkEmailModal";
import SingleNotificationModal from "@/components/modals/SingleNotificationModal";
import useI18nLayout from "@/hooks/useI18nLayout";
import RecordMetadata from "@/components/RecordMetadata";
import AppCard from "@/components/cards/AppCard";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import ICONS from "@/utils/iconUtil";
import { toArabicDigits } from "@/utils/arabicDigits";
import {
  SURVEY_DEFAULT_RECIPIENT_FILTER,
  SURVEY_RECIPIENT_FILTER_PAYLOADS,
} from "@/utils/notificationRecipientFilters";
import { getSurveyRecipientNotificationState } from "@/utils/surveyRecipientNotificationState";
import {
  FORMS_PATH,
  getSurveyRecipientBreadcrumbItems,
  getSurveyRecipientFormState,
  SURVEY_RECIPIENT_FORM_STATES,
} from "@/utils/surveyRecipientNavigation";

import { getSurveyFormWithStatus } from "@/services/surveyguru/surveyFormService";
import { getEventsByBusinessId } from "@/services/eventreg/eventService";

import {
  listRecipients,
  syncRecipientsForEvent,
  deleteRecipient,
  clearRecipientsForForm,
  exportRecipientsCsv,
  sendBulkSurveyEmails,
  sendBulkSurveyWhatsApp,
  sendSingleSurveyEmail,
  sendSingleSurveyWhatsApp,
  getSurveyWhatsAppMessages,
  previewSurveyWhatsAppMessage,
} from "@/services/surveyguru/surveyRecipientService";
import useSurveyGuruSocket from "@/hooks/modules/surveyguru/useSurveyGuruSocket";

import FilterDialog from "@/components/modals/FilterModal";
import { useRouter, useSearchParams } from "next/navigation";

const translations = {
  en: {
    title: "Manage Recipients",
    surveyGuru: "SurveyGuru",
    surveyForms: "Survey Forms",
    subtitle: "Manage recipients for the selected survey form.",
    linkedEvent: "Linked event",
    loadingForm: "Loading survey form…",
    accessDenied: "You do not have access to this survey form.",
    formDeleted: "This survey form has been deleted.",
    formNotFound: "Survey form not found or no longer available.",
    filters: "Filters",
    filtersActions: "Filters & Actions",
    actions: "Actions",
    clearFilters: "Clear Filters",
    event: "Event",
    form: "Form",
    search: "Search (name/email/organization)",
    status: "Status",
    any: "Any",
    queued: "Queued",
    responded: "Responded",
    notified: "Notified",
    emailSent: "Email sent",
    whatsappSent: "WhatsApp sent",
    apply: "Apply",
    cancel: "Cancel",

    // actions modal buttons
    sync: "Sync from Event",
    synced: "Recipients synced successfully",
    export: "Export Recipients",
    clearAll: "Clear All Recipients",

    confirmClearTitle: "Clear All Recipients",
    confirmClearMsg:
      "This will remove all recipients for the selected form. Don't worry, you can always sync them again from registrations. Are you sure you want to proceed?",
    confirmDeleteTitle: "Delete Recipient",
    confirmDeleteMsg:
      "This will permanently remove this recipient. Don't worry, you can sync them again from registrations. Are you sure you want to proceed?",
    delete: "Delete",

    copied: "Link copied!",
    syncHint:
      "No recipients found yet for this form. Sync from event registrations to populate recipients.",
    syncNow: "Sync Now",
    noRecipientsYet: "No recipients available for this form yet.",
    selections: "Selections",
    email: "Email",
    name: "Name",
    company: "Organization",
    copyLink: "Copy survey link",
    bulkEmail: "Send Bulk Notifications",
    bulkEmailConfirmTitle: "Send Bulk Survey Notifications",
    bulkEmailConfirmMsg:
      "This will send survey invitation emails to all queued recipients for the selected form. Do you want to proceed?",
    sendingEmails: "Sending Emails...",
    bulkEmailSuccess:
      "Bulk notification completed — {sent} sent, {failed} failed, out of {total} total.",
    notificationTitle: "Send survey notifications",
    notificationRecipients: "Recipients",
    allRecipients: "All recipients",
    recipientsNotResponded: "Recipients who have not responded",
    recipientsNeverEmailed: "Recipients never emailed",
    recipientsNeverWhatsapp: "Recipients never sent WhatsApp",
    showing: "Showing",
    of: "of",
    records: "records",
    recordsPerPage: "Records per page",
    createdBy: "Created:",
    createdAt: "Created At:",
    updatedBy: "Updated:",
    updatedAt: "Updated At:",
  },
  ar: {
    title: "إدارة المستلمين",
    surveyGuru: "سيرفي جورو",
    surveyForms: "نماذج الاستبيان",
    subtitle: "إدارة مستلمي نموذج الاستبيان المحدد.",
    linkedEvent: "الفعالية المرتبطة",
    loadingForm: "جارٍ تحميل نموذج الاستبيان…",
    accessDenied: "ليس لديك صلاحية الوصول إلى نموذج الاستبيان هذا.",
    formDeleted: "تم حذف نموذج الاستبيان هذا.",
    formNotFound: "نموذج الاستبيان غير موجود أو لم يعد متاحًا.",
    filters: "عوامل التصفية",
    filtersActions: "عوامل التصفية والإجراءات",
    actions: "إجراءات",
    clearFilters: "مسح عوامل التصفية",
    event: "الفعالية",
    form: "النموذج",
    search: "بحث (الاسم/البريد/المؤسسة)",
    status: "الحالة",
    any: "أي",
    queued: "قيد الانتظار",
    responded: "تم الرد",
    notified: "تم الإشعار",
    emailSent: "تم إرسال البريد الإلكتروني",
    whatsappSent: "تم إرسال واتساب",
    apply: "تطبيق",
    cancel: "إلغاء",

    sync: "مزامنة من التسجيلات",
    synced: "تمت مزامنة المستلمين بنجاح",
    export: "تصدير المستلمين",
    clearAll: "حذف جميع المستلمين",

    confirmClearTitle: "حذف جميع المستلمين",
    confirmClearMsg:
      "سيتم حذف جميع المستلمين للنموذج المحدد. هل تريد المتابعة؟",
    confirmDeleteTitle: "حذف مستلم",
    confirmDeleteMsg: "هل أنت متأكد أنك تريد نقل هذا العنصر إلى سلة المحذوفات؟",
    delete: "حذف",

    copied: "تم نسخ الرابط!",
    syncHint:
      "لا يوجد مستلمون لهذا النموذج حتى الآن. قم بالمزامنة من تسجيلات الفعالية.",
    syncNow: "زامن الآن",
    noRecipientsYet: "لا يوجد مستلمون لهذا النموذج حتى الآن.",
    selections: "الاختيارات",
    email: "البريد الإلكتروني",
    name: "الاسم",
    company: "المؤسسة",
    copyLink: "نسخ رابط الاستبيان",
    bulkEmail: "إرسال الإشعارات الجماعية",
    bulkEmailConfirmTitle: "إرسال إشعارات الاستبيان الجماعية",
    bulkEmailConfirmMsg:
      "سيتم إرسال دعوات الاستبيان إلى جميع المستلمين قيد الانتظار للنموذج المحدد. هل تريد المتابعة؟",
    sendingEmails: "جاري إرسال البريد...",
    bulkEmailSuccess:
      "اكتمل إرسال الإشعارات الجماعية — {sent} تم الإرسال، {failed} فشل، من أصل {total}.",
    notificationTitle: "إرسال إشعارات الاستبيان",
    notificationRecipients: "المستلمون",
    allRecipients: "جميع المستلمين",
    recipientsNotResponded: "المستلمون الذين لم يجيبوا",
    recipientsNeverEmailed: "المستلمون الذين لم يُرسل إليهم بريد إلكتروني",
    recipientsNeverWhatsapp: "المستلمون الذين لم تُرسل إليهم رسالة واتساب",
    showing: "عرض",
    of: "من",
    records: "السجلات",
    recordsPerPage: "السجلات في كل صفحة",
    createdBy: "أنشئ:",
    createdAt: "تاريخ الإنشاء:",
    updatedBy: "حدث:",
    updatedAt: "تاريخ التحديث:",
  },
};

export default function RecipientsManagePage() {
  const router = useRouter();
  const { showMessage } = useMessage();
  const { t, dir, language } = useI18nLayout(translations);

  const searchParams = useSearchParams();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [formId, setFormId] = useState("");
  const [selectedForm, setSelectedForm] = useState(null);
  const [linkedEvent, setLinkedEvent] = useState(null);
  const [formState, setFormState] = useState("loading");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  // filter modal (staged)
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mQ, setMQ] = useState("");
  const [mStatus, setMStatus] = useState("");

  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [rows, setRows] = useState([]);

  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [confirmClear, setConfirmClear] = useState(false);

  const [sendingEmails, setSendingEmails] = useState(false);
  const [bulkEmailModalOpen, setBulkEmailModalOpen] = useState(false);
  const [notifyRecipient, setNotifyRecipient] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const syncTimeoutRef = useRef(null);
  const recipientStatusTimeoutRef = useRef(null);

  const refreshRecipients = async ({
    targetFormId = formId,
    targetPage = page,
    targetLimit = limit,
    targetQ = q,
    targetStatus = status,
  } = {}) => {
    if (!targetFormId) {
      setRows([]);
      setTotal(0);
      return;
    }

    const qTrim = (targetQ || "").trim();
    const res = await listRecipients({
      formId: targetFormId,
      page: targetPage,
      limit: targetLimit,
      ...(qTrim ? { q: qTrim } : {}),
      ...(targetStatus ? { status: targetStatus } : {}),
    });

    if (!res?.error) {
      setRows(res?.recipients || []);
      setTotal(res?.pagination?.total || 0);
    }
  };

  const { emailProgress, syncProgress } = useSurveyGuruSocket({
    formId,
    onEmailProgress: (data) => {
      const { sent, total, failed, processed } = data;

      // if finished
      if (processed === total) {
        setSendingEmails(false);

        showMessage(
          t.bulkEmailSuccess
            .replace("{sent}", sent)
            .replace("{failed}", failed)
            .replace("{total}", total),
          "success"
        );

        refreshRecipients({ targetFormId: formId, targetPage: page, targetLimit: limit });
      }
    },
    onSyncProgress: (data) => {
      const { formId: incomingForm, synced, total } = data;
      if (String(incomingForm) !== String(formId)) return;

      setSyncLoading(true);

      if (synced === total) {
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
          syncTimeoutRef.current = null;
        }
        setSyncLoading(false);

        refreshRecipients({ targetFormId: formId, targetPage: page, targetLimit: limit });

        showMessage(t.synced, "success");
        setFiltersOpen(false);
      }
    },
    onRecipientStatus: (data) => {
      const incomingRecipientId = String(data?.recipientId || "");
      const incomingStatus = String(data?.status || "").toLowerCase();

      if (incomingRecipientId && incomingStatus) {
        setRows((prev) =>
          prev.map((row) =>
            String(row?._id) === incomingRecipientId
              ? {
                ...row,
                status: incomingStatus,
                respondedAt: data?.respondedAt || row.respondedAt,
              }
              : row
          )
        );
      }

      // Debounced refresh keeps pagination/filter totals accurate in real time.
      if (recipientStatusTimeoutRef.current) {
        clearTimeout(recipientStatusTimeoutRef.current);
      }
      recipientStatusTimeoutRef.current = setTimeout(() => {
        refreshRecipients({
          targetFormId: formId,
          targetPage: page,
          targetLimit: limit,
          targetQ: q,
          targetStatus: status,
        });
      }, 500);
    },
  });

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
      if (recipientStatusTimeoutRef.current) {
        clearTimeout(recipientStatusTimeoutRef.current);
        recipientStatusTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const requestedFormId = searchParams.get("formId");
    if (!requestedFormId) {
      router.replace(FORMS_PATH);
      return;
    }

    let active = true;
    setFormState("loading");
    setRows([]);
    setTotal(0);
    setFormId(requestedFormId);
    setQ(searchParams.get("search") || "");
    setStatus("");
    setPage(1);

    getSurveyFormWithStatus(requestedFormId).then((result) => {
      if (!active) return;
      const form = result?.data || result;
      const nextFormState = getSurveyRecipientFormState(result);
      if (nextFormState !== SURVEY_RECIPIENT_FORM_STATES.READY) {
        setSelectedForm(null);
        setLinkedEvent(null);
        setFormState(nextFormState);
        return;
      }
      setSelectedForm(form);
      setLinkedEvent(
        form.eventId && typeof form.eventId === "object" ? form.eventId : null,
      );
      setFormState("ready");
    });

    return () => {
      active = false;
    };
  }, [router, searchParams]);

  useEffect(() => {
    const linkedEventId = selectedForm?.eventId?._id || selectedForm?.eventId;
    const businessId = selectedForm?.businessId?._id || selectedForm?.businessId;

    if (!linkedEventId || !businessId || linkedEvent?.name) return;

    let active = true;
    getEventsByBusinessId(businessId).then((result) => {
      if (!active || result?.error) return;
      const events = result?.events || result?.data?.events || [];
      setLinkedEvent(
        events.find((event) => String(event._id) === String(linkedEventId)) || null,
      );
    });

    return () => {
      active = false;
    };
  }, [linkedEvent?.name, selectedForm]);

  useEffect(() => {
    (async () => {
      if (!formId || formState !== "ready") {
        setRows([]);
        return;
      }
      setLoading(true);
      const qTrim = (q || "").trim();
      const res = await listRecipients({
        formId,
        page,
        limit,
        ...(qTrim ? { q: qTrim } : {}),
        ...(status ? { status } : {}),
      });

      setRows(res?.recipients || []);
      setTotal(res?.pagination?.total || 0);

      setLoading(false);
    })();
  }, [formId, formState, q, status, page, limit]);

  const handleSync = async () => {
    if (!formId) return;
    const eventIdForSync = selectedForm?.eventId?._id || selectedForm?.eventId || "";

    setSyncLoading(true);

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      setSyncLoading(false);
      await refreshRecipients({ targetFormId: formId, targetPage: page, targetLimit: limit });
      setFiltersOpen(false);
    }, 15000);

    const res = await syncRecipientsForEvent(formId, {
      ...(eventIdForSync ? { eventId: eventIdForSync } : {}),
    });

    if (res?.error) {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
      setSyncLoading(false);
    }
  };

  const handleSendBulkSurveyEmails = async (payload = {}) => {
    if (!formId) return;
    setBulkEmailModalOpen(false);
    setSendingEmails(true);

    try {
      const result = await sendBulkSurveyEmails(formId, {
        recipientScope: payload.recipientScope || "not_responded",
        ...(payload.customTemplate ? { customTemplate: payload.customTemplate } : {}),
      });

      if (result?.error) {
        setSendingEmails(false);
      }
    } catch (err) {
      console.error("Bulk survey email send failed:", err);
      setSendingEmails(false);
    }
  };

  const handleSendBulkSurveyWhatsApp = async (payload = {}) => {
    if (!formId) return;
    setBulkEmailModalOpen(false);
    setSendingEmails(true);
    try {
      const result = await sendBulkSurveyWhatsApp(formId, payload);
      if (result?.error) setSendingEmails(false);
    } catch (error) {
      console.error("Bulk survey WhatsApp send failed:", error);
      setSendingEmails(false);
    }
  };

  const handleExport = async () => {
    if (!formId) return;
    setExportLoading(true);
    await exportRecipientsCsv({ formId });
    setExportLoading(false);
  };

  const handleClearAll = async () => {
    if (!formId) return setConfirmClear(false);
    setClearLoading(true);
    const res = await clearRecipientsForForm(formId);
    if (!res?.error) setRows([]);
    setClearLoading(false);
    setConfirmClear(false);
  };

  const handleDelete = async () => {
    const id = confirmDelete.id;
    if (!id) return setConfirmDelete({ open: false, id: null });
    const res = await deleteRecipient(id);
    if (!res?.error) {
      setRows((prev) => prev.filter((r) => r._id !== id));
    }
    setConfirmDelete({ open: false, id: null });
  };

  const selectedEvent = useMemo(
    () =>
      linkedEvent ||
      (selectedForm?.eventId && typeof selectedForm.eventId === "object"
        ? selectedForm.eventId
        : null),
    [linkedEvent, selectedForm],
  );

  const eventId = selectedForm?.eventId?._id || selectedForm?.eventId || "";

  const surveyNotificationEvent = useMemo(
    () => ({
      ...selectedEvent,
      useCustomEmailTemplate: selectedForm?.useCustomEmailTemplate,
      emailTemplate: selectedForm?.emailTemplate,
      defaultLanguage: selectedForm?.defaultLanguage || selectedEvent?.defaultLanguage,
    }),
    [selectedEvent, selectedForm],
  );

  const canSync = Boolean(
    formId && (selectedForm?.eventId?._id || selectedForm?.eventId)
  );
  const canBulkImport = useHasPermission("surveyguru", "bulk_import");
  const canSendEmail = useHasPermission("surveyguru", "send_email");
  const canSendWhatsapp = useHasPermission("surveyguru", "send_whatsapp");
  const canExport = useHasPermission("surveyguru", "export");
  const canDelete = useHasPermission("surveyguru", "delete");
  const canShare = useHasPermission("surveyguru", "share");

  const surveyRecipientFilterOptions = useMemo(
    () => [
      { value: "all", label: t.allRecipients },
      { value: "not_responded", label: t.recipientsNotResponded },
      { value: "never_notified", label: t.recipientsNeverEmailed },
      ...(canSendWhatsapp
        ? [{ value: "never_whatsapp", label: t.recipientsNeverWhatsapp }]
        : []),
    ],
    [canSendWhatsapp, t],
  );

  const openFilters = () => {
    setMQ(q || "");
    setMStatus(status || "");
    setFiltersOpen(true);
  };

  const applyFilters = () => {
    const nextQ = (mQ || "").trim();
    const nextStatus = mStatus || "";

    setPage(1);
    setQ(nextQ);
    setStatus(nextStatus);
    setFiltersOpen(false);
  };

  const onCopySurveyLink = (r) => {
    if (!selectedForm?.slug) return;

    const base = typeof window !== "undefined" ? window.location.origin : "";
    const slug = selectedForm.slug;
    const lang = selectedForm.defaultLanguage || "en";

    // Anonymous → no token
    const url = selectedForm.isAnonymous
      ? `${base}/surveyguru/${lang}/${slug}`
      : `${base}/surveyguru/${lang}/${slug}?token=${encodeURIComponent(
        r.token || ""
      )}`;

    navigator.clipboard.writeText(url);
    showMessage(t.copied, "info");
  };

  const RecipientCard = ({ r }) => {
    const notificationState = getSurveyRecipientNotificationState(r);
    const hasDelivery = notificationState.emailSent || notificationState.whatsappSent;

    return (
      <AppCard variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent sx={{ pb: 1.5 }}>
          <Stack
            direction={dir === "rtl" ? "row-reverse" : "row"}
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%"
            }}>
            <Typography variant="subtitle1" sx={{
              fontWeight: 600
            }}>
              {r.fullName || "—"}
            </Typography>
            <Stack
              direction="row"
              spacing={0.75}
              useFlexGap
              sx={{ ml: 2, flexWrap: "wrap", justifyContent: "flex-end" }}
            >
              {notificationState.responded && (
                <Chip
                  size="small"
                  icon={<ICONS.verified />}
                  color="success"
                  label={t.responded}
                />
              )}
              {notificationState.emailSent && (
                <Chip
                  size="small"
                  icon={<ICONS.emailOutline />}
                  color="info"
                  variant="outlined"
                  label={t.emailSent}
                />
              )}
              {notificationState.whatsappSent && (
                <Chip
                  size="small"
                  icon={<ICONS.whatsapp />}
                  color="success"
                  variant="outlined"
                  label={t.whatsappSent}
                />
              )}
              {!notificationState.responded && !hasDelivery && (
                <Chip size="small" color="default" label={t.queued} />
              )}
            </Stack>
          </Stack>
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            {t.email}: {r.email}
          </Typography>
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            {t.company}: {r.organization || r.company || "—"}
          </Typography>
        </CardContent>
        <RecordMetadata
          createdByName={r.createdBy}
          updatedByName={r.updatedBy}
          createdAt={r.createdAt}
          updatedAt={r.updatedAt}
          locale={language === "ar" ? "ar-SA" : "en-GB"}
        />
        <CardActions sx={{ justifyContent: "flex-end", pt: 0 }}>
          {(canSendEmail || canSendWhatsapp) && (
            <Tooltip title="Notify">
              <IconButton color="secondary" onClick={() => setNotifyRecipient(r)} aria-label="Notify recipient">
                <ICONS.email fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canShare && (
          <Tooltip title={t.copyLink}>
            <IconButton
              onClick={() => onCopySurveyLink(r)}
              color="primary"
              disabled={!selectedForm?.slug}
            >
              <ICONS.copy fontSize="small" />
            </IconButton>
          </Tooltip>
          )}

          {canDelete && (
            <Tooltip title={t.delete}>
              <IconButton
                color="error"
                onClick={() => setConfirmDelete({ open: true, id: r._id })}
              >
                <ICONS.delete fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </CardActions>
      </AppCard>
    );
  };

  if (formState !== "ready") {
    return (
      <Box dir={dir} sx={{ minHeight: "100vh" }}>
        <Container maxWidth={false} disableGutters>
          <BreadcrumbsNav />
          <Box sx={{ mt: 4, textAlign: "center" }}>
            {formState === "loading" ? (
              <>
                <CircularProgress size={28} />
                <Typography sx={{ mt: 1 }}>{t.loadingForm}</Typography>
              </>
            ) : (
              <Typography color="error">
                {formState === "denied"
                  ? t.accessDenied
                  : formState === "deleted"
                    ? t.formDeleted
                    : t.formNotFound}
              </Typography>
            )}
          </Box>
        </Container>
      </Box>
    );
  }

  const breadcrumbItems = getSurveyRecipientBreadcrumbItems({
    surveyGuruLabel: t.surveyGuru,
    surveyFormsLabel: t.surveyForms,
    formTitle: selectedForm?.title,
    recipientsLabel: t.title,
  });

  return (
    <Box dir={dir} sx={{ minHeight: "100vh" }}>
      <Container maxWidth={false} disableGutters>
        <BreadcrumbsNav items={breadcrumbItems} />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 2,
            mt: 2,
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: "bold" }}>
              {selectedForm?.title || t.title}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
              {t.linkedEvent}: {selectedEvent?.name || "—"}
            </Typography>
          </Box>
          <AuditSearchClearButton />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            {canBulkImport && (
              <Button
                variant="contained"
                startIcon={syncLoading ? <CircularProgress size={20} color="inherit" /> : <ICONS.refresh fontSize="small" />}
                disabled={!canSync || syncLoading}
                onClick={handleSync}
                sx={getStartIconSpacing(dir)}
              >
                {syncLoading && syncProgress.total
                  ? `${t.sync} ${syncProgress.synced}/${syncProgress.total}`
                  : syncLoading
                    ? `${t.sync}...`
                    : t.sync}
              </Button>
            )}
            {(canSendEmail || canSendWhatsapp) && (
              <Button
                variant="contained"
                color="secondary"
                disabled={sendingEmails}
                startIcon={<ICONS.email fontSize="small" />}
                onClick={() => setBulkEmailModalOpen(true)}
                sx={getStartIconSpacing(dir)}
              >
                {t.bulkEmail}
              </Button>
            )}
            <Button variant="outlined" startIcon={<ICONS.filter fontSize="small" />} onClick={openFilters} sx={getStartIconSpacing(dir)}>
              {t.filtersActions}
            </Button>
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        {rows.length > 0 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
              px: 2,
            }}
          >
            <Typography variant="body1">
              {t.showing} {toArabicDigits(Math.min((page - 1) * limit + 1, total), language)}–
              {toArabicDigits(Math.min(page * limit, total), language)} {t.of} {toArabicDigits(total, language)} {t.records}
            </Typography>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="limit-select-label">
                {t.recordsPerPage}
              </InputLabel>
              <Select
                labelId="limit-select-label"
                value={limit}
                onChange={(e) => {
                  setLimit(e.target.value);
                  setPage(1);
                }}
                label={t.recordsPerPage}
              >
                {[5, 10, 20, 50, 100].map((value) => (
                  <MenuItem key={value} value={value}>
                    {toArabicDigits(value, language)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Recipients responsive list */}
        {!formId ? (
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            {t.noFormSelected}
          </Typography>
        ) : loading ? (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : !rows.length ? (
          <Stack
            spacing={1.25}
            sx={{
              alignItems: "center",
              py: 2,
              textAlign: "center"
            }}>
            <ICONS.people sx={{ fontSize: 36, color: "text.secondary" }} />
            <Typography variant="h6">{t.noRecipientsYet}</Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                maxWidth: 720
              }}>
              {t.syncHint}
            </Typography>
          </Stack>
        ) : isMobile ? (
          <Stack spacing={1.5} id="recipients-list">
            {rows.map((r) => (
              <RecipientCard key={r._id} r={r} />
            ))}
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <ArabicPagination
                count={Math.ceil(total / limit)}
                page={page}
                onChange={(_, value) => setPage(value)}
              />
            </Box>
          </Stack>
        ) : (
          <>
            <Grid
              container
              spacing={1.5}
              id="recipients-list"
              sx={{
                justifyContent: "center"
              }}
            >
              {rows.map((r) => (
                <Grid
                  key={r._id}
                  size={{
                    xs: 12,
                    md: 6,
                    lg: 4
                  }}>
                  <RecipientCard r={r} />
                </Grid>
              ))}
            </Grid>
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <ArabicPagination
                count={Math.ceil(total / limit)}
                page={page}
                onChange={(_, value) => setPage(value)}
              />
            </Box>
          </>
        )}

        {/* Delete & Clear confirmations */}
        <ConfirmationDialog
          open={confirmDelete.open}
          onClose={() => setConfirmDelete({ open: false, id: null })}
          onConfirm={handleDelete}
          title={t.confirmDeleteTitle}
          message={t.confirmDeleteMsg}
          confirmButtonText={t.delete}
          confirmButtonIcon={<ICONS.delete fontSize="small" />}
        />

        <ConfirmationDialog
          open={confirmClear}
          onClose={() => setConfirmClear(false)}
          onConfirm={handleClearAll}
          title={t.confirmClearTitle}
          message={t.confirmClearMsg}
          confirmButtonText={t.clearAll}
          confirmButtonIcon={<ICONS.delete fontSize="small" />}
        />

        <BulkEmailModal
          open={bulkEmailModalOpen}
          onClose={() => {
            if (!sendingEmails) setBulkEmailModalOpen(false);
          }}
          onSendEmail={handleSendBulkSurveyEmails}
          onSendWhatsApp={handleSendBulkSurveyWhatsApp}
          sendingEmails={sendingEmails}
          event={surveyNotificationEvent}
          canSendEmail={canSendEmail}
          canSendWhatsapp={canSendWhatsapp}
          title={t.notificationTitle}
          filterLabel={t.notificationRecipients}
          filterOptions={surveyRecipientFilterOptions}
          filterPayloads={SURVEY_RECIPIENT_FILTER_PAYLOADS}
          initialFilter={SURVEY_DEFAULT_RECIPIENT_FILTER}
          whatsappResourceId={selectedForm?._id}
          loadWhatsAppMessages={getSurveyWhatsAppMessages}
          loadWhatsAppPreview={previewSurveyWhatsAppMessage}
          showAttachment={false}
          isSurvey
        />
        <SingleNotificationModal
          open={Boolean(notifyRecipient)}
          onClose={() => setNotifyRecipient(null)}
          onSent={() => refreshRecipients()}
          registration={notifyRecipient}
          event={surveyNotificationEvent}
          canSendEmail={canSendEmail}
          canSendWhatsapp={canSendWhatsapp}
          sendEmailNotification={sendSingleSurveyEmail}
          sendWhatsAppNotification={sendSingleSurveyWhatsApp}
          whatsappResourceId={selectedForm?._id}
          loadWhatsAppMessages={getSurveyWhatsAppMessages}
          loadWhatsAppPreview={previewSurveyWhatsAppMessage}
          isSurvey
        />
      </Container>
      {/* Filters Modal */}
      <FilterDialog
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title={t.filtersActions}
      >
        <Stack spacing={2}>
          <TextField
            size="small"
            label={t.search}
            value={mQ}
            onChange={(e) => setMQ(e.target.value)}
            fullWidth
          />

          <FormControl size="small" fullWidth>
            <InputLabel>{t.status}</InputLabel>
            <Select
              label={t.status}
              value={mStatus}
              onChange={(e) => setMStatus(e.target.value)}
            >
              <MenuItem value="">{t.any}</MenuItem>
              <MenuItem value="queued">{t.queued}</MenuItem>
              <MenuItem value="notified">{t.notified}</MenuItem>
              <MenuItem value="responded">{t.responded}</MenuItem>
            </Select>
          </FormControl>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              justifyContent: "flex-end",
              mt: 1
            }}>
            <Button
              variant="contained"
              startIcon={<ICONS.check fontSize="small" />}
              onClick={applyFilters}
              sx={getStartIconSpacing(dir)}
            >
              {t.apply}
            </Button>
          </Stack>
          <Divider />
          <Stack spacing={1.5}>
          {canExport && (
            <Button
              fullWidth
              variant="outlined"
              startIcon={
                exportLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <ICONS.download fontSize="small" />
                )
              }
              disabled={!formId || exportLoading}
              onClick={handleExport}
              sx={getStartIconSpacing(dir)}
            >
              {t.export}
            </Button>
          )}

          {canDelete && (
          <Button
            fullWidth
            color="error"
            variant="outlined"
            startIcon={
              clearLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <ICONS.delete fontSize="small" />
              )
            }
            disabled={!formId || clearLoading}
            onClick={() => {
              setFiltersOpen(false);
              setConfirmClear(true);
            }}
            sx={getStartIconSpacing(dir)}
          >
            {t.clearAll}
          </Button>
          )}
          </Stack>
        </Stack>
      </FilterDialog>
    </Box>
  );
}
