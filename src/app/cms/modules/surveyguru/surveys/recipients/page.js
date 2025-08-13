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
  Paper,
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
} from "@mui/material";

import { useAuth } from "@/contexts/AuthContext";
import { useMessage } from "@/contexts/MessageContext";
import BreadcrumbsNav from "@/components/BreadcrumbsNav";
import BusinessDrawer from "@/components/BusinessDrawer";
import NoDataAvailable from "@/components/NoDataAvailable";
import ConfirmationDialog from "@/components/ConfirmationDialog";
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
} from "@/services/surveyguru/surveyRecipientService";
import FilterDialog from "@/components/FilterModal";

const translations = {
  en: {
    title: "Manage Recipients",
    subtitle: "Select a business, then use Filters to choose event & form.",
    selectBusiness: "Select Business",
    filters: "Filters",
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
    sync: "Sync from Event",
    synced: "Recipients synced successfully",
    export: "Export Recipients",
    clearAll: "Clear All Recipients",
    confirmClearTitle: "Clear All Recipients",
    confirmClearMsg:
      "This will remove all recipients for the selected form. Are you sure you want to proceed?",
    confirmDeleteTitle: "Delete Recipient",
    confirmDeleteMsg:
      "This will permanently delete the selected recipient. Are you sure you want to proceed?",
    actions: "Actions",
    delete: "Delete",
    copied: "Link copied!",
    noFormSelected: "Use Filters to select a form and load recipients.",
    selections: "Selections",
    email: "Email",
    name: "Name",
    company: "Company",
  },
  ar: {
    title: "إدارة المستلمين",
    subtitle: "اختر الشركة، ثم استخدم عوامل التصفية لاختيار الفعالية والنموذج.",
    selectBusiness: "اختر الشركة",
    filters: "عوامل التصفية",
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
    sync: "المزامنة من التسجيلات",
    synced: "تمت مزامنة المستلمين بنجاح",
    export: "تصدير المستلمين",
    clearAll: "حذف جميع المستلمين",
    confirmClearTitle: "حذف جميع المستلمين",
    confirmClearMsg: "سيتم حذف جميع المستلمين للنموذج المحدد. هل تريد المتابعة؟",
    confirmDeleteTitle: "حذف مستلم",
    confirmDeleteMsg: "سيتم حذف المستلم المحدد نهائياً. هل تريد المتابعة؟",
    actions: "إجراءات",
    delete: "حذف",
    copied: "تم نسخ الرابط!",
    noFormSelected: "استخدم عوامل التصفية لاختيار نموذج وتحميل المستلمين.",
    selections: "الاختيارات",
    email: "البريد الإلكتروني",
    name: "الاسم",
    company: "الشركة",
  },
};

export default function RecipientsManagePage() {
  const { user } = useAuth();
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

  const [eventId, setEventId] = useState("");
  const [formId, setFormId] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [mEventId, setMEventId] = useState("");
  const [mFormId, setMFormId] = useState("");
  const [mQ, setMQ] = useState("");
  const [mStatus, setMStatus] = useState("");

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    (async () => {
      const list = await getAllBusinesses();
      setBusinesses(list || []);
      if (user?.role === "business") {
        const mine =
          list.find(
            (b) =>
              b.slug === user.business?.slug || b._id === user.business?._id
          ) || null;
        if (mine) setSelectedBizSlug(mine.slug);
      }
    })();
  }, [user]);

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
      const res = await listRecipients({
        formId,
        ...(q ? { q } : {}),
        ...(status ? { status } : {}),
      });
      setRows(res || []);
      setLoading(false);
    })();
  }, [formId, q, status]);

  const clearFilters = () => {
    setEventId("");
    setFormId("");
    setQ("");
    setStatus("");
    setRows([]);
  };

  const handleSync = async () => {
    if (!formId) return;
    const res = await syncRecipientsForEvent(formId);
    if (!res?.error) {
      if (formId) {
        const refreshed = await listRecipients({ formId });
        const payload = refreshed || {};
        setRows(payload || []);
      }
    }
  };

  const handleExport = () => {
    if (!formId) return;
    exportRecipientsCsv({ formId });
  };

  const handleClearAll = async () => {
    if (!formId) return setConfirmClear(false);
    const res = await clearRecipientsForForm(formId);
    if (!res?.error) setRows([]);
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
    setModalOpen(true);
  };

  const applyFilters = () => {
    setEventId(mEventId || "");
    setFormId(mFormId || "");
    setQ(mQ || "");
    setStatus(mStatus || "");
    setModalOpen(false);
  };

  const RecipientCard = ({ r }) => (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent sx={{ pb: 1.5 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          flexWrap="wrap"
          rowGap={1}
        >
          <Stack spacing={0.5}>
            <Typography variant="subtitle1" fontWeight={600}>
              {r.fullName || "—"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t.email}: {r.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t.company}: {r.company || "—"}
            </Typography>
          </Stack>
          <Chip
            size="small"
            color={r.status === "responded" ? "success" : "default"}
            label={r.status || "queued"}
          />
        </Stack>
      </CardContent>
      <CardActions sx={{ justifyContent: "flex-end", pt: 0 }}>
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
          setBizDrawerOpen(false);
        }}
      />

      <Container maxWidth="lg">
        <BreadcrumbsNav />

        {/* Primary header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            rowGap: 2,
            mt: 2,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {t.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {t.subtitle}
            </Typography>
            {/* Selections summary */}
            <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" rowGap={1}>
              {selectedBusiness && (
                <Chip
                  size="small"
                  icon={<ICONS.business fontSize="small" />}
                  label={`${t.selections}: ${
                    selectedBusiness?.name || selectedBusiness?.slug
                  }`}
                />
              )}
              {selectedEvent && (
                <Chip
                  size="small"
                  icon={<ICONS.event fontSize="small" />}
                  label={selectedEvent?.name}
                />
              )}
              {selectedForm && (
                <Chip
                  size="small"
                  icon={<ICONS.form fontSize="small" />}
                  label={selectedForm?.title}
                />
              )}
            </Stack>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ alignItems: "stretch", width: { xs: "100%", sm: "auto" } }}
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
              variant="text"
              startIcon={<ICONS.clear fontSize="small" />}
              onClick={clearFilters}
              sx={getStartIconSpacing(dir)}
            >
              {t.clearFilters}
            </Button>
          </Stack>
        </Box>

        {/* Secondary actions */}
        {formId && (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            mt={2}
            mb={1}
          >
            <Button
              variant="contained"
              startIcon={<ICONS.refresh fontSize="small" />}
              disabled={!eventId}
              onClick={handleSync}
              sx={getStartIconSpacing(dir)}
            >
              {t.sync}
            </Button>

            <Button
              variant="outlined"
              startIcon={<ICONS.download fontSize="small" />}
              onClick={handleExport}
              sx={getStartIconSpacing(dir)}
            >
              {t.export}
            </Button>

            <Button
              color="error"
              variant="outlined"
              startIcon={<ICONS.delete fontSize="small" />}
              onClick={() => setConfirmClear(true)}
              sx={getStartIconSpacing(dir)}
            >
              {t.clearAll}
            </Button>
          </Stack>
        )}

        <Divider sx={{ my: 2 }} />

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
          // Mobile: cards
          <Stack spacing={1.5} id="recipients-list">
            {rows.map((r) => (
              <RecipientCard key={r._id} r={r} />
            ))}
          </Stack>
        ) : (
          // Desktop/Tablet: compact grid cards (better than wide tables)
          <Grid container justifyContent={"center"} spacing={1.5} id="recipients-list">
            {rows.map((r) => (
              <Grid item xs={12} md={6} lg={4} key={r._id}>
                <RecipientCard r={r} />
              </Grid>
            ))}
          </Grid>
        )}

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
      </Container>

      {/* Filters Modal */}
      <FilterDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
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
                    !val ||
                    String(f.eventId?._id || f.eventId) === String(val)
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
              variant="text"
              startIcon={<ICONS.close fontSize="small" />}
              onClick={() => setModalOpen(false)}
              sx={getStartIconSpacing(dir)}
            >
              {t.cancel}
            </Button>
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
    </Box>
  );
}
