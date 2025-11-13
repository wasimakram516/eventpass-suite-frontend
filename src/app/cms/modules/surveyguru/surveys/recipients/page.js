"use client";

import { useEffect, useMemo, useState } from "react";
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
  Card,
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
import NoDataAvailable from "@/components/NoDataAvailable";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import useI18nLayout from "@/hooks/useI18nLayout";
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
    actions: "Actions",
    clearFilters: "Clear Filters",
    event: "Event",
    form: "Form",
    search: "Search (name/email/company)",
    status: "Status",
    any: "Any",
    queued: "Queued",
    responded: "Responded",
    apply: "Apply",
    cancel: "Cancel",

    // actions modal buttons
    sync: "Sync from Event",
    synced: "Recipients synced successfully",
    export: "Export Recipients",
    clearAll: "Clear All Recipients",

    confirmClearTitle: "Clear All Recipients",
    confirmClearMsg:
      "This will remove all recipients for the selected form. Are you sure you want to proceed?",
    confirmDeleteTitle: "Delete Recipient",
    confirmDeleteMsg:
      "Are you sure you want to move this item to the Recycle Bin?",
    delete: "Delete",

    copied: "Link copied!",
    noFormSelected: "Use Filters to select a form and load recipients.",
    selections: "Selections",
    email: "Email",
    name: "Name",
    company: "Company",
    copyLink: "Copy survey link",
    bulkEmail: "Send Bulk Emails",
    bulkEmailConfirmTitle: "Send Bulk Survey Emails",
    bulkEmailConfirmMsg:
      "This will send survey invitation emails to all queued recipients for the selected form. Do you want to proceed?",
    sendingEmails: "Sending Emails...",
    bulkEmailSuccess:
      "Bulk emails completed — {sent} sent, {failed} failed, out of {total} total.",
    showing: "Showing",
    of: "of",
    records: "records",
    recordsPerPage: "Records per page",
  },
  ar: {
    title: "إدارة المستلمين",
    subtitle: "اختر الشركة، ثم افتح عوامل التصفية لاختيار الفعالية والنموذج.",
    selectBusiness: "اختر الشركة",
    filters: "عوامل التصفية",
    actions: "إجراءات",
    clearFilters: "مسح عوامل التصفية",
    event: "الفعالية",
    form: "النموذج",
    search: "بحث (الاسم/البريد/الشركة)",
    status: "الحالة",
    any: "أي",
    queued: "قيد الانتظار",
    responded: "تم الرد",
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
    selections: "الاختيارات",
    email: "البريد الإلكتروني",
    name: "الاسم",
    company: "الشركة",
    copyLink: "نسخ رابط الاستبيان",
    bulkEmail: "إرسال البريد الجماعي",
    bulkEmailConfirmTitle: "إرسال بريد الاستبيان الجماعي",
    bulkEmailConfirmMsg:
      "سيتم إرسال دعوات الاستبيان إلى جميع المستلمين قيد الانتظار للنموذج المحدد. هل تريد المتابعة؟",
    sendingEmails: "جاري إرسال البريد...",
    bulkEmailSuccess:
      "اكتمل إرسال البريد الجماعي — {sent} تم الإرسال، {failed} فشل، من أصل {total}.",
    showing: "عرض",
    of: "من",
    records: "السجلات",
    recordsPerPage: "السجلات في كل صفحة",
  },
};

export default function RecipientsManagePage() {
  const {
    user,
    selectedBusiness: contextBusinessSlug,
    setSelectedBusiness,
  } = useAuth();
  const { showMessage } = useMessage();
  const { t, dir } = useI18nLayout(translations);

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

  // actions modal
  const [actionsOpen, setActionsOpen] = useState(false);

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

  const { emailProgress, syncProgress } = useSurveyGuruSocket({
    formId,
    onEmailProgress: (data) => console.log("Survey email progress:", data),
    onSyncProgress: (data) => {
      const { formId: incomingForm, synced, total } = data;
      if (String(incomingForm) !== String(formId)) return;

      setSyncLoading(true);
      syncProgress.synced = synced;
      syncProgress.total = total;

      // SYNC COMPLETED — now reload REAL data from DB
      if (synced === total) {
        setSyncLoading(false);

        listRecipients({ formId, page, limit }).then((res) => {
          setRows(res.recipients || []);
          setTotal(res.pagination.total);
        });

        showMessage(t.synced, "success");
        setActionsOpen(false);
      }
    },
  });

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

    setSyncLoading(true);
    await syncRecipientsForEvent(formId);
  };

  const handleSendBulkSurveyEmails = async () => {
    setConfirmEmailDialogOpen(false);
    setSendingEmails(true);
    try {
      await sendBulkSurveyEmails(formId);
    } catch (err) {
      console.error("Bulk survey email send failed:", err);
    } finally {
      handleSync();
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

  const selectedForm = useMemo(
    () => forms.find((f) => String(f._id) === String(formId)),
    [forms, formId]
  );

  const selectedEvent = useMemo(
    () => events.find((e) => String(e._id) === String(eventId)),
    [events, eventId]
  );

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
        ...(nextQ ? { q: nextQ } : {}),
        ...(nextStatus ? { status: nextStatus } : {}),
      });
      setRows(res || []);
      setLoading(false);
    } else {
      setRows([]);
    }
  };

  const onCopySurveyLink = (r) => {
    if (!selectedForm?.slug) return;

    const base = typeof window !== "undefined" ? window.location.origin : "";
    const slug = selectedForm.slug;

    // Anonymous → no token
    const url = selectedForm.isAnonymous
      ? `${base}/surveyguru/${slug}`
      : `${base}/surveyguru/${slug}?token=${encodeURIComponent(r.token || "")}`;

    navigator.clipboard.writeText(url);
    showMessage(t.copied, "info");
  };

  const RecipientCard = ({ r }) => (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
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
            icon={<ICONS.verified />}
            color={r.status === "responded" ? "success" : "default"}
            label={r.status || "queued"}
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
          {t.company}: {r.company || "—"}
        </Typography>
      </CardContent>

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
    </Card>
  );

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

      <Container maxWidth="lg">
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
            {/* Selections summary (chips) */}
            <Stack
              direction="row"
              spacing={dir === "rtl" ? 2 : 1.5}
              mt={1}
              flexWrap="wrap"
              rowGap={1.5}
            >
              {selectedBusiness && (
                <Chip
                  size="small"
                  icon={<ICONS.business fontSize="small" />}
                  label={`${t.selections}: ${
                    selectedBusiness?.name || selectedBusiness?.slug
                  }`}
                  sx={{ minWidth: 140, px: 1.5 }}
                />
              )}
              {selectedEvent && (
                <Box sx={{ display: "inline-flex", alignItems: "center" }}>
                  <Chip
                    size="small"
                    icon={<ICONS.event fontSize="small" />}
                    label={selectedEvent?.name}
                    sx={{
                      minWidth: 120,
                      px: 1.5,
                      ...(dir === "rtl" ? { mr: 2 } : {}),
                    }}
                  />
                </Box>
              )}
              {selectedForm && (
                <Chip
                  size="small"
                  icon={<ICONS.form fontSize="small" />}
                  label={selectedForm?.title}
                  sx={{ minWidth: 120, px: 1.5 }}
                />
              )}
            </Stack>
          </Box>

          {/* Right side: 3 buttons only */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{
              alignItems: "stretch",
              width: { xs: "100%", sm: "auto" },
              gap: dir === "rtl" ? 2 : 1,
            }}
          >
            <Button
              variant="outlined"
              startIcon={<ICONS.business fontSize="small" />}
              onClick={() => setBizDrawerOpen(true)}
              sx={getStartIconSpacing(dir)}
            >
              {t.selectBusiness}
            </Button>

            <Button
              variant="contained"
              startIcon={<ICONS.filter fontSize="small" />}
              disabled={!selectedBusiness?._id}
              onClick={openFilters}
              sx={getStartIconSpacing(dir)}
            >
              {t.filters}
            </Button>

            <Button
              variant="outlined"
              startIcon={<ICONS.flash fontSize="small" />}
              disabled={!formId}
              onClick={() => setActionsOpen(true)}
              sx={getStartIconSpacing(dir)}
            >
              {t.actions}
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
                ? `${t.sendingEmails} ${emailProgress.sent}/${emailProgress.total}`
                : sendingEmails
                ? t.sendingEmails
                : t.bulkEmail}
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
          <NoDataAvailable />
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
        title={t.filters}
      >
        <Stack spacing={2}>
          <FormControl size="small" fullWidth>
            <InputLabel>{t.event}</InputLabel>
            <Select
              label={t.event}
              value={mEventId}
              onChange={(e) => {
                const val = e.target.value;
                setMEventId(val);
                const filtered = forms.filter(
                  (f) =>
                    !val || String(f.eventId?._id || f.eventId) === String(val)
                );
                if (!filtered.find((f) => String(f._id) === String(mFormId))) {
                  setMFormId("");
                }
              }}
            >
              <MenuItem value="">{t.any}</MenuItem>
              {events.map((ev) => (
                <MenuItem key={ev._id} value={ev._id}>
                  {ev.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth disabled={!selectedBusiness?._id}>
            <InputLabel>{t.form}</InputLabel>
            <Select
              label={t.form}
              value={mFormId}
              onChange={(e) => setMFormId(e.target.value)}
            >
              {forms
                .filter(
                  (f) =>
                    !mEventId ||
                    String(f.eventId?._id || f.eventId) === String(mEventId)
                )
                .map((f) => (
                  <MenuItem key={f._id} value={f._id}>
                    {f.title}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

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
        </Stack>
      </FilterDialog>

      {/* Actions Modal (API call buttons) */}
      <FilterDialog
        open={actionsOpen}
        onClose={() => setActionsOpen(false)}
        title={t.actions}
      >
        <Stack spacing={1.5}>
          <Button
            fullWidth
            variant="contained"
            startIcon={
              syncLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <ICONS.refresh fontSize="small" />
              )
            }
            disabled={!formId || !eventId || syncLoading}
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
              setActionsOpen(false);
              setConfirmClear(true);
            }}
            sx={getStartIconSpacing(dir)}
          >
            {t.clearAll}
          </Button>
        </Stack>
      </FilterDialog>
    </Box>
  );
}
