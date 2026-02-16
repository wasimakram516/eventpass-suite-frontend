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

import { useAuth } from "@/contexts/AuthContext";
import { useMessage } from "@/contexts/MessageContext";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import BusinessDrawer from "@/components/drawers/BusinessDrawer";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import useI18nLayout from "@/hooks/useI18nLayout";
import RecordMetadata from "@/components/RecordMetadata";
import AppCard from "@/components/cards/AppCard";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import ICONS from "@/utils/iconUtil";

import { getAllBusinesses } from "@/services/businessService";
import { getEventsByBusinessId } from "@/services/eventreg/eventService";
import { listSurveyForms } from "@/services/surveyguru/surveyFormService";

import {
  listRecipients,
  syncRecipientsForEvent,
  deleteRecipient,
  clearRecipientsForForm,
  exportRecipientsCsv,
  sendBulkSurveyEmails,
} from "@/services/surveyguru/surveyRecipientService";
import useSurveyGuruSocket from "@/hooks/modules/surveyguru/useSurveyGuruSocket";

import FilterDialog from "@/components/modals/FilterModal";

const translations = {
  en: {
    title: "Manage Recipients",
    subtitle: "Pick a business, then open Filters to choose event & form.",
    selectBusiness: "Select Business",
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
    noFormSelected: "Use Filters to select a form and load recipients.",
    workflowTitle: "Follow these steps to load and manage recipients",
    stepBusiness: "1. Select business",
    stepEvent: "2. Select event",
    stepForm: "3. Select form",
    readyToLoad:
      "Recipients load automatically after selecting a form. If none appear, click Sync from Event.",
    syncHint:
      "No recipients found yet for this form. Sync from event registrations to populate recipients.",
    syncNow: "Sync Now",
    chooseEvent: "Choose Event",
    chooseForm: "Choose Survey Form",
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
    subtitle: "اختر الشركة، ثم افتح عوامل التصفية لاختيار الفعالية والنموذج.",
    selectBusiness: "اختر الشركة",
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
    noFormSelected: "استخدم عوامل التصفية لاختيار نموذج وتحميل المستلمين.",
    workflowTitle: "اتبع هذه الخطوات لتحميل المستلمين وإدارتهم",
    stepBusiness: "1. اختر الشركة",
    stepEvent: "2. اختر الفعالية",
    stepForm: "3. اختر نموذج الاستبيان",
    readyToLoad:
      "سيتم تحميل المستلمين تلقائيًا بعد اختيار النموذج. إذا لم يظهروا، اضغط مزامنة من الفعالية.",
    syncHint:
      "لا يوجد مستلمون لهذا النموذج حتى الآن. قم بالمزامنة من تسجيلات الفعالية.",
    syncNow: "زامن الآن",
    chooseEvent: "اختر الفعالية",
    chooseForm: "اختر نموذج الاستبيان",
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
  const {
    user,
    selectedBusiness: contextBusinessSlug,
    setSelectedBusiness,
  } = useAuth();
  const { showMessage } = useMessage();
  const { t, dir, language } = useI18nLayout(translations);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [bizDrawerOpen, setBizDrawerOpen] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBizSlug, setSelectedBizSlug] = useState(null);
  const selectedBusiness = useMemo(
    () => businesses.find((b) => b.slug === selectedBizSlug),
    [businesses, selectedBizSlug]
  );

  const [events, setEvents] = useState([]);
  const [forms, setForms] = useState([]);

  // applied filters (live)
  const [eventId, setEventId] = useState("");
  const [formId, setFormId] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  // filter modal (staged)
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mEventId, setMEventId] = useState("");
  const [mFormId, setMFormId] = useState("");
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
  const [confirmEmailDialogOpen, setConfirmEmailDialogOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const syncTimeoutRef = useRef(null);

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
  });

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    (async () => {
      const list = await getAllBusinesses();
      setBusinesses(list || []);
      if (contextBusinessSlug) {
        setSelectedBizSlug(contextBusinessSlug);
      } else if (user?.role === "business" && user.business?.slug) {
        const slug = user.business.slug;
        setSelectedBizSlug(slug);
        setSelectedBusiness(slug);
      }
    })();
  }, [user, contextBusinessSlug, setSelectedBusiness]);

  useEffect(() => {
    (async () => {
      setEvents([]);
      setForms([]);
      setEventId("");
      setFormId("");
      setQ("");
      setStatus("");
      setRows([]);

      if (!selectedBusiness?._id) return;

      const evRes = await getEventsByBusinessId(selectedBusiness._id);
      setEvents(evRes?.events || evRes?.data?.events || evRes || []);

      const fRes = await listSurveyForms({
        businessId: selectedBusiness._id,
        withCounts: 1,
      });
      setForms(fRes?.data || fRes || []);

      setMEventId("");
      setMFormId("");
      setMQ("");
      setMStatus("");
    })();
  }, [selectedBizSlug]);

  useEffect(() => {
    (async () => {
      if (!formId) {
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
  }, [formId, q, status, page, limit]);

  const handleSync = async () => {
    if (!formId) return;
    const fallbackEventId = selectedForm?.eventId?._id || selectedForm?.eventId || "";
    const eventIdForSync = eventId || fallbackEventId;

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

  const handleSendBulkSurveyEmails = async () => {
    setConfirmEmailDialogOpen(false);
    setSendingEmails(true);

    try {
      await sendBulkSurveyEmails(formId);
    } catch (err) {
      console.error("Bulk survey email send failed:", err);
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

  const selectedForm = useMemo(
    () => forms.find((f) => String(f._id) === String(formId)),
    [forms, formId]
  );

  const selectedEvent = useMemo(
    () => events.find((e) => String(e._id) === String(eventId)),
    [events, eventId]
  );

  const filteredForms = useMemo(
    () =>
      forms.filter(
        (f) => !eventId || String(f.eventId?._id || f.eventId) === String(eventId)
      ),
    [forms, eventId]
  );

  const canSync = Boolean(
    formId && (eventId || selectedForm?.eventId?._id || selectedForm?.eventId)
  );
  const isWorkflowComplete = Boolean(selectedBusiness?._id && eventId && formId);

  const onWorkflowEventChange = (nextEventId) => {
    setEventId(nextEventId);
    setPage(1);
    setQ("");
    setStatus("");
    const stillValidForm = forms.find(
      (f) =>
        String(f._id) === String(formId) &&
        (!nextEventId ||
          String(f.eventId?._id || f.eventId) === String(nextEventId))
    );
    if (!stillValidForm) {
      setFormId("");
      setRows([]);
      setTotal(0);
    }
  };

  const onWorkflowFormChange = (nextFormId) => {
    setFormId(nextFormId);
    setPage(1);
    setQ("");
    setStatus("");
  };

  const openFilters = () => {
    setMEventId(eventId || "");
    setMFormId(formId || "");
    setMQ(q || "");
    setMStatus(status || "");
    setFiltersOpen(true);
  };

  const applyFilters = async () => {
    const nextEventId = mEventId || "";
    const nextFormId = mFormId || "";
    const nextQ = (mQ || "").trim();
    const nextStatus = mStatus || "";

    setPage(1);
    setEventId(nextEventId);
    setFormId(nextFormId);
    setQ(nextQ);
    setStatus(nextStatus);
    setFiltersOpen(false);

    if (nextFormId) {
      setLoading(true);
      const res = await listRecipients({
        formId: nextFormId,
        page: 1,
        limit,
        ...(nextQ ? { q: nextQ } : {}),
        ...(nextStatus ? { status: nextStatus } : {}),
      });

      setRows(res.recipients || []);
      setTotal(res.pagination.total || 0);
      setLoading(false);
    } else {
      setRows([]);
    }
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
    const isResponded = Boolean(r?.respondedAt);
    const isNotified =
      !isResponded &&
      (String(r?.status || "").toLowerCase() === "responded" ||
        String(r?.status || "").toLowerCase() === "notified" ||
        r?.emailSent === true ||
        r?.notificationSent === true);

    const chipLabel = isResponded ? t.responded : isNotified ? t.notified : t.queued;
    const chipColor = isResponded ? "success" : isNotified ? "info" : "default";
    const chipIcon = isResponded
      ? <ICONS.verified />
      : isNotified
        ? <ICONS.emailOutline />
        : undefined;

    return (
    <AppCard variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent sx={{ pb: 1.5 }}>
        <Stack
          direction={dir === "rtl" ? "row-reverse" : "row"}
          justifyContent="space-between"
          alignItems="center"
          width="100%"
        >
          <Typography variant="subtitle1" fontWeight={600}>
            {r.fullName || "—"}
          </Typography>
          <Chip
            size="small"
            icon={chipIcon}
            color={chipColor}
            label={chipLabel}
            sx={{
              minWidth: dir === "rtl" ? "120px" : "auto", // Wider in Arabic
              ml: 2,
            }}
          />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {t.email}: {r.email}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t.company}: {r.organization || r.company || "—"}
        </Typography>
      </CardContent>

      <RecordMetadata
        createdByName={r.createdBy}
        updatedByName={r.updatedBy}
        createdAt={r.createdAt}
        updatedAt={r.updatedAt}
        createdByDisplayName={r.fullName}
        updatedByDisplayName={r.fullName}
        locale={language === "ar" ? "ar-SA" : "en-GB"}
      />

      <CardActions sx={{ justifyContent: "flex-end", pt: 0 }}>
        <Tooltip title={t.copyLink}>
          <IconButton
            onClick={() => onCopySurveyLink(r)}
            color="primary"
            disabled={!selectedForm?.slug}
          >
            <ICONS.copy fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title={t.delete}>
          <IconButton
            color="error"
            onClick={() => setConfirmDelete({ open: true, id: r._id })}
          >
            <ICONS.delete fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </AppCard>
    );
  };

  return (
    <Box dir={dir} sx={{ minHeight: "100vh" }}>
      <BusinessDrawer
        open={bizDrawerOpen}
        onClose={() => setBizDrawerOpen(false)}
        businesses={businesses}
        selectedBusinessSlug={selectedBizSlug}
        onSelect={(slug) => {
          setSelectedBizSlug(slug);
          setSelectedBusiness(slug);
          setBizDrawerOpen(false);
        }}
      />

      <Container maxWidth="xl">
        <BreadcrumbsNav />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            rowGap: 12 / 8,
            mt: 2,
          }}
        >
          <Box sx={{ minWidth: 260 }}>
            <Typography variant="h4" fontWeight="bold">
              {t.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {t.subtitle}
            </Typography>
          </Box>

          <Box
            sx={{
              width: "100%",
              mt: 1,
              p: { xs: 0, sm: 0.5 },
            }}
          >
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" fontWeight={700}>
                {t.workflowTitle}
              </Typography>

              <Box sx={{ display: { xs: "none", md: "block" } }}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ overflowX: "auto", pb: 0.5, flexWrap: "nowrap" }}
                >
                  <Stack direction="row" spacing={0.75} alignItems="center" sx={{ whiteSpace: "nowrap" }}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      {selectedBusiness?._id ? (
                        <ICONS.checkCircle sx={{ fontSize: 18, color: "success.main" }} />
                      ) : (
                        <ICONS.checkCircleOutline sx={{ fontSize: 18, color: "text.disabled" }} />
                      )}
                      <Typography
                        variant="body2"
                        fontWeight={selectedBusiness?._id ? 700 : 500}
                        color={selectedBusiness?._id ? "success.main" : "text.secondary"}
                      >
                        {t.stepBusiness}
                      </Typography>
                    </Stack>

                    <ICONS.next sx={{ fontSize: 16, color: "text.disabled" }} />

                    <Stack direction="row" spacing={0.5} alignItems="center">
                      {eventId ? (
                        <ICONS.checkCircle sx={{ fontSize: 18, color: "success.main" }} />
                      ) : (
                        <ICONS.checkCircleOutline sx={{ fontSize: 18, color: "text.disabled" }} />
                      )}
                      <Typography
                        variant="body2"
                        fontWeight={eventId ? 700 : 500}
                        color={eventId ? "success.main" : "text.secondary"}
                      >
                        {t.stepEvent}
                      </Typography>
                    </Stack>

                    <ICONS.next sx={{ fontSize: 16, color: "text.disabled" }} />

                    <Stack direction="row" spacing={0.5} alignItems="center">
                      {formId ? (
                        <ICONS.checkCircle sx={{ fontSize: 18, color: "success.main" }} />
                      ) : (
                        <ICONS.checkCircleOutline sx={{ fontSize: 18, color: "text.disabled" }} />
                      )}
                      <Typography
                        variant="body2"
                        fontWeight={formId ? 700 : 500}
                        color={formId ? "success.main" : "text.secondary"}
                      >
                        {t.stepForm}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>

                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ overflowX: "auto", pb: 0.5, flexWrap: "nowrap", mt: 0.5 }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<ICONS.business fontSize="small" />}
                    onClick={() => setBizDrawerOpen(true)}
                    sx={{ whiteSpace: "nowrap", ...getStartIconSpacing(dir) }}
                  >
                    {t.selectBusiness}
                  </Button>

                  <FormControl size="small" sx={{ minWidth: 210 }} disabled={!selectedBusiness?._id}>
                    <InputLabel>{t.chooseEvent}</InputLabel>
                    <Select
                      label={t.chooseEvent}
                      value={eventId}
                      onChange={(e) => onWorkflowEventChange(e.target.value)}
                    >
                      <MenuItem value="">{t.any}</MenuItem>
                      {events.map((ev) => (
                        <MenuItem key={ev._id} value={ev._id}>
                          {ev.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 240 }} disabled={!selectedBusiness?._id}>
                    <InputLabel>{t.chooseForm}</InputLabel>
                    <Select
                      label={t.chooseForm}
                      value={formId}
                      onChange={(e) => onWorkflowFormChange(e.target.value)}
                    >
                      {filteredForms.map((f) => (
                        <MenuItem key={f._id} value={f._id}>
                          {f.title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Button
                    variant="contained"
                    startIcon={
                      syncLoading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <ICONS.refresh fontSize="small" />
                      )
                    }
                    disabled={!canSync || syncLoading}
                    onClick={handleSync}
                    sx={{ whiteSpace: "nowrap", ...getStartIconSpacing(dir) }}
                  >
                    {syncLoading && syncProgress.total
                      ? `${t.sync} ${syncProgress.synced}/${syncProgress.total}`
                      : syncLoading
                        ? `${t.sync}...`
                        : t.sync}
                  </Button>

                  <Button
                    variant="contained"
                    color="secondary"
                    disabled={sendingEmails || !formId}
                    startIcon={
                      sendingEmails ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <ICONS.email fontSize="small" />
                      )
                    }
                    onClick={() => setConfirmEmailDialogOpen(true)}
                    sx={{ whiteSpace: "nowrap", ...getStartIconSpacing(dir) }}
                  >
                    {sendingEmails && emailProgress.total
                      ? `${t.sendingEmails} ${emailProgress.processed}/${emailProgress.total}`
                      : sendingEmails
                        ? t.sendingEmails
                        : t.bulkEmail}
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<ICONS.filter fontSize="small" />}
                    disabled={!isWorkflowComplete}
                    onClick={openFilters}
                    sx={{ whiteSpace: "nowrap", ...getStartIconSpacing(dir) }}
                  >
                    {t.filtersActions}
                  </Button>
                </Stack>
              </Box>

              <Box sx={{ display: { xs: "block", md: "none" } }}>
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ overflowX: "auto", whiteSpace: "nowrap" }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {selectedBusiness?._id ? (
                      <ICONS.checkCircle sx={{ fontSize: 18, color: "success.main" }} />
                    ) : (
                      <ICONS.checkCircleOutline sx={{ fontSize: 18, color: "text.disabled" }} />
                    )}
                    <Typography
                      variant="body2"
                      fontWeight={selectedBusiness?._id ? 700 : 500}
                      color={selectedBusiness?._id ? "success.main" : "text.secondary"}
                    >
                      {t.stepBusiness}
                    </Typography>
                  </Stack>

                  <ICONS.next sx={{ fontSize: 16, color: "text.disabled" }} />

                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {eventId ? (
                      <ICONS.checkCircle sx={{ fontSize: 18, color: "success.main" }} />
                    ) : (
                      <ICONS.checkCircleOutline sx={{ fontSize: 18, color: "text.disabled" }} />
                    )}
                    <Typography
                      variant="body2"
                      fontWeight={eventId ? 700 : 500}
                      color={eventId ? "success.main" : "text.secondary"}
                    >
                      {t.stepEvent}
                    </Typography>
                  </Stack>

                  <ICONS.next sx={{ fontSize: 16, color: "text.disabled" }} />

                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {formId ? (
                      <ICONS.checkCircle sx={{ fontSize: 18, color: "success.main" }} />
                    ) : (
                      <ICONS.checkCircleOutline sx={{ fontSize: 18, color: "text.disabled" }} />
                    )}
                    <Typography
                      variant="body2"
                      fontWeight={formId ? 700 : 500}
                      color={formId ? "success.main" : "text.secondary"}
                    >
                      {t.stepForm}
                    </Typography>
                  </Stack>
                </Stack>

                <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} mt={1.25}>
                  <Button
                    variant="outlined"
                    startIcon={<ICONS.business fontSize="small" />}
                    onClick={() => setBizDrawerOpen(true)}
                    sx={getStartIconSpacing(dir)}
                  >
                    {t.selectBusiness}
                  </Button>

                  <FormControl size="small" sx={{ minWidth: 220 }} disabled={!selectedBusiness?._id}>
                    <InputLabel>{t.chooseEvent}</InputLabel>
                    <Select
                      label={t.chooseEvent}
                      value={eventId}
                      onChange={(e) => onWorkflowEventChange(e.target.value)}
                    >
                      <MenuItem value="">{t.any}</MenuItem>
                      {events.map((ev) => (
                        <MenuItem key={ev._id} value={ev._id}>
                          {ev.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 260 }} disabled={!selectedBusiness?._id}>
                    <InputLabel>{t.chooseForm}</InputLabel>
                    <Select
                      label={t.chooseForm}
                      value={formId}
                      onChange={(e) => onWorkflowFormChange(e.target.value)}
                    >
                      {filteredForms.map((f) => (
                        <MenuItem key={f._id} value={f._id}>
                          {f.title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} mt={1.25}>
                  <Button
                    variant="contained"
                    startIcon={
                      syncLoading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <ICONS.refresh fontSize="small" />
                      )
                    }
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

                  <Button
                    variant="contained"
                    color="secondary"
                    disabled={sendingEmails || !formId}
                    startIcon={
                      sendingEmails ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <ICONS.email fontSize="small" />
                      )
                    }
                    onClick={() => setConfirmEmailDialogOpen(true)}
                    sx={getStartIconSpacing(dir)}
                  >
                    {sendingEmails && emailProgress.total
                      ? `${t.sendingEmails} ${emailProgress.processed}/${emailProgress.total}`
                      : sendingEmails
                        ? t.sendingEmails
                        : t.bulkEmail}
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<ICONS.filter fontSize="small" />}
                    disabled={!isWorkflowComplete}
                    onClick={openFilters}
                    sx={getStartIconSpacing(dir)}
                  >
                    {t.filtersActions}
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </Box>
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
              {t.showing} {Math.min((page - 1) * limit + 1, total)}–
              {Math.min(page * limit, total)} {t.of} {total} {t.records}
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
                    {value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Recipients responsive list */}
        {!formId ? (
          <Typography variant="body2" color="text.secondary">
            {t.noFormSelected}
          </Typography>
        ) : loading ? (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : !rows.length ? (
          <Stack spacing={1.25} alignItems="center" sx={{ py: 2, textAlign: "center" }}>
            <ICONS.people sx={{ fontSize: 36, color: "text.secondary" }} />
            <Typography variant="h6">{t.noRecipientsYet}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 720 }}>
              {t.syncHint}
            </Typography>
          </Stack>
        ) : isMobile ? (
          <Stack spacing={1.5} id="recipients-list">
            {rows.map((r) => (
              <RecipientCard key={r._id} r={r} />
            ))}
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Pagination
                dir="ltr"
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
              justifyContent="center"
              spacing={1.5}
              id="recipients-list"
            >
              {rows.map((r) => (
                <Grid item xs={12} md={6} lg={4} key={r._id}>
                  <RecipientCard r={r} />
                </Grid>
              ))}
            </Grid>
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Pagination
                dir="ltr"
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

        <ConfirmationDialog
          open={confirmEmailDialogOpen}
          onClose={() => setConfirmEmailDialogOpen(false)}
          onConfirm={handleSendBulkSurveyEmails}
          title={t.bulkEmailConfirmTitle}
          message={t.bulkEmailConfirmMsg}
          confirmButtonText={t.bulkEmail}
          confirmButtonIcon={<ICONS.email fontSize="small" />}
          confirmButtonColor="secondary"
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
              <MenuItem value="responded">{t.responded}</MenuItem>
            </Select>
          </FormControl>

          <Stack direction="row" spacing={1} justifyContent="flex-end" mt={1}>
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
          </Stack>
        </Stack>
      </FilterDialog>
    </Box>
  );
}
