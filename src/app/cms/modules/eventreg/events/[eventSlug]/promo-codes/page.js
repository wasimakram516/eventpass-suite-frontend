"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Container,
  Stack,
  Chip,
  Divider,
  CircularProgress,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
} from "@mui/material";
import { useParams } from "next/navigation";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import NoDataAvailable from "@/components/NoDataAvailable";
import AppCard from "@/components/cards/AppCard";
import RecordMetadata from "@/components/RecordMetadata";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import ArabicPagination from "@/components/ArabicPagination";
import { toArabicDigits } from "@/utils/arabicDigits";
import useI18nLayout from "@/hooks/useI18nLayout";
import useEventRegSocket from "@/hooks/modules/eventReg/useEventRegSocket";
import { getPublicEventBySlug } from "@/services/eventreg/eventService";
import {
  createPromoCode,
  createPromoCodeBatch,
  getPromoCodesByEvent,
  updatePromoCode,
  getPromoCodeRedemptions,
  deletePromoCode,
  exportPromoCodes,
} from "@/services/eventreg/promoCodeService";
import { formatDate } from "@/utils/dateUtils";
import ICONS from "@/utils/iconUtil";

const translations = {
  en: {
    title: "Promo Codes",
    description: "Create discount codes for this paid event, and track how many times each has been used.",
    createCode: "Create Code",
    exportCodes: "Export",
    noCodes: "No promo codes yet.",
    recordsPerPage: "Records per page",
    showing: "Showing",
    of: "of",
    records: "records",
    code: "Code",
    copyCode: "Copy Code",
    codeCopied: "Code Copied!",
    discount: "Discount",
    usage: "Used / Max",
    status: "Status",
    batch: "Batch",
    ticketScope: "Ticket Types",
    allTickets: "All ticket types",
    created: "Created",
    active: "Active",
    inactive: "Inactive",
    viewRedemptions: "View redemptions",
    deleteCode: "Delete",
    // Create dialog
    createTitle: "Create Promo Code",
    modeSingle: "Single Code",
    modeBatch: "Batch",
    codeLabel: "Code (leave blank to auto-generate)",
    discountLabel: "Discount %",
    maxUsesLabel: "Max Uses",
    codeLengthLabel: "Code Length (total, prefix included)",
    prefixLabel: "Prefix (optional)",
    ticketTypesLabel: "Applicable Ticket Types (leave empty for all)",
    cancel: "Cancel",
    create: "Create",
    // Batch dialog
    batchTitle: "Generate Promo Code Batch",
    batchSizeLabel: "How many codes?",
    batchLabelLabel: "Batch Label (e.g. institution name)",
    generate: "Generate",
    // Redemptions dialog
    redemptionsTitle: "Redemptions",
    noRedemptions: "This code hasn't been used yet.",
    registrant: "Registrant",
    email: "Email",
    discountGiven: "Discount Given",
    redeemedAt: "Registered At",
    close: "Close",
    statusPaid: "Paid",
    statusPending: "Payment pending",
    // Delete confirm
    deleteConfirmTitle: "Delete this promo code?",
    deleteConfirmMessage: "This code will stop working immediately. Its redemption history is kept.",
    // Errors / validation
    required: "Required",
    invalidDiscount: "Must be between 1 and 100",
    invalidMaxUses: "Must be at least 1",
    invalidBatchSize: "Must be between 1 and 1000",
    invalidCodeLength: "Must be longer than the prefix",
  },
  ar: {
    title: "رموز الخصم",
    description: "أنشئ رموز خصم لهذه الفعالية المدفوعة، وتتبع عدد مرات استخدام كل رمز.",
    createCode: "إنشاء رمز",
    exportCodes: "تصدير",
    noCodes: "لا توجد رموز خصم بعد.",
    recordsPerPage: "عدد السجلات لكل صفحة",
    showing: "عرض",
    of: "من",
    records: "سجلات",
    code: "الرمز",
    copyCode: "نسخ الرمز",
    codeCopied: "تم نسخ الرمز!",
    discount: "الخصم",
    usage: "المستخدم / الحد الأقصى",
    status: "الحالة",
    batch: "الدفعة",
    ticketScope: "أنواع التذاكر",
    allTickets: "جميع أنواع التذاكر",
    created: "تاريخ الإنشاء",
    active: "نشط",
    inactive: "غير نشط",
    viewRedemptions: "عرض الاستخدامات",
    deleteCode: "حذف",
    createTitle: "إنشاء رمز خصم",
    modeSingle: "رمز واحد",
    modeBatch: "دفعة",
    codeLabel: "الرمز (اتركه فارغًا للإنشاء التلقائي)",
    discountLabel: "نسبة الخصم %",
    maxUsesLabel: "الحد الأقصى للاستخدام",
    codeLengthLabel: "طول الرمز (الإجمالي، شامل البادئة)",
    prefixLabel: "البادئة (اختياري)",
    ticketTypesLabel: "أنواع التذاكر المعنية (اتركه فارغًا للكل)",
    cancel: "إلغاء",
    create: "إنشاء",
    batchTitle: "إنشاء دفعة رموز خصم",
    batchSizeLabel: "كم عدد الرموز؟",
    batchLabelLabel: "اسم الدفعة (مثل اسم المؤسسة)",
    generate: "إنشاء",
    redemptionsTitle: "الاستخدامات",
    noRedemptions: "لم يُستخدم هذا الرمز بعد.",
    registrant: "المسجّل",
    email: "البريد الإلكتروني",
    discountGiven: "الخصم الممنوح",
    redeemedAt: "تاريخ التسجيل",
    close: "إغلاق",
    statusPaid: "مدفوع",
    statusPending: "الدفع لم يكتمل",
    deleteConfirmTitle: "حذف رمز الخصم هذا؟",
    deleteConfirmMessage: "سيتوقف هذا الرمز عن العمل فورًا. يتم الاحتفاظ بسجل استخداماته.",
    required: "مطلوب",
    invalidDiscount: "يجب أن يكون بين 1 و 100",
    invalidMaxUses: "يجب أن يكون 1 على الأقل",
    invalidBatchSize: "يجب أن يكون بين 1 و 1000",
    invalidCodeLength: "يجب أن يكون أطول من البادئة",
  },
};

function TicketTypePicker({ ticketTypes, value, onChange, label }) {
  const options = (ticketTypes || []).map((tt) => ({ id: String(tt._id), label: tt.name }));
  const selected = options.filter((o) => value.includes(o.id));
  return (
    <Autocomplete
      multiple
      size="small"
      options={options}
      getOptionLabel={(opt) => opt.label}
      isOptionEqualToValue={(opt, val) => opt.id === val.id}
      value={selected}
      onChange={(e, newVal) => onChange(newVal.map((o) => o.id))}
      renderInput={(params) => <TextField {...params} label={label} />}
      fullWidth
    />
  );
}

export default function PromoCodesPage() {
  const { eventSlug } = useParams();
  const { t, dir, language } = useI18nLayout(translations);

  const [event, setEvent] = useState(null);
  const [promoCodes, setPromoCodes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("single"); // "single" | "batch"
  const [redemptionsOpen, setRedemptionsOpen] = useState(false);
  const [redemptionsData, setRedemptionsData] = useState(null);
  const [copiedCodeId, setCopiedCodeId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const emptyForm = {
    code: "",
    discountPercentage: "",
    maxUses: "",
    batchSize: "",
    batchLabel: "",
    codeLength: 8,
    prefix: "",
    applicableTicketTypeIds: [],
  };
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getPublicEventBySlug(eventSlug).then((res) => {
      if (!res?.error) setEvent(res);
    });
  }, [eventSlug]);

  const fetchPromoCodes = useCallback(async () => {
    setLoading(true);
    const res = await getPromoCodesByEvent(eventSlug, { page, limit });
    if (!res?.error) {
      setPromoCodes(res.promoCodes || []);
      setTotal(res.total || 0);
    }
    setLoading(false);
  }, [eventSlug, page, limit]);

  useEffect(() => {
    fetchPromoCodes();
  }, [fetchPromoCodes]);

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  // Live usedCount/isActive updates (a redemption on confirmed payment, or an
  // admin edit from another tab) — only patches a code already on this page,
  // it never inserts/removes rows, so pagination/filters stay stable.
  // createdBy/updatedBy are kept from the original fetch (populated with
  // {name}) rather than overwritten by the socket payload, which only ever
  // carries the raw, unpopulated PromoCode doc — merging it in as-is would
  // replace the displayed name with a bare ObjectId.
  const handlePromoCodeUpdated = useCallback((updated) => {
    if (!updated?._id) return;
    setPromoCodes((prev) =>
      prev.map((pc) =>
        pc._id === updated._id
          ? { ...pc, ...updated, createdBy: pc.createdBy, updatedBy: pc.updatedBy }
          : pc
      )
    );
  }, []);

  useEventRegSocket({ eventId: event?._id, onPromoCodeUpdated: handlePromoCodeUpdated });

  const breadcrumbs = [
    { label: "EventReg", href: "/cms/modules/eventreg/events" },
    { label: event?.name || eventSlug, href: `/cms/modules/eventreg/events/${eventSlug}/registrations` },
    { label: t.title },
  ];

  const ticketTypeName = (id) => (event?.ticketTypes || []).find((tt) => String(tt._id) === String(id))?.name || "";

  const handleToggleActive = async (promoCode) => {
    const res = await updatePromoCode(promoCode._id, { isActive: !promoCode.isActive });
    if (!res?.error) fetchPromoCodes();
  };

  const handleViewRedemptions = async (promoCode) => {
    const res = await getPromoCodeRedemptions(promoCode._id);
    if (!res?.error) {
      setRedemptionsData(res);
      setRedemptionsOpen(true);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await deletePromoCode(deleteTarget._id);
    setDeleteTarget(null);
    if (!res?.error) fetchPromoCodes();
  };

  const handleExport = async () => {
    const blob = await exportPromoCodes(eventSlug);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventSlug}_promo_codes.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleOpenForm = () => {
    setForm(emptyForm);
    setFormMode("single");
    setFormErrors({});
    setFormOpen(true);
  };

  const validateSharedFields = () => {
    const errors = {};
    const discount = Number(form.discountPercentage);
    if (!Number.isFinite(discount) || discount <= 0 || discount > 100) errors.discountPercentage = t.invalidDiscount;
    if (formMode === "single" && form.code?.trim()) {
      // explicit code — no length/prefix validation needed
    } else {
      const length = Number(form.codeLength);
      const prefixLen = (form.prefix || "").length;
      if (!Number.isFinite(length) || length <= prefixLen) errors.codeLength = t.invalidCodeLength;
    }
    return errors;
  };

  const handleFormSubmit = async () => {
    const errors = validateSharedFields();

    if (formMode === "single") {
      const maxUses = Number(form.maxUses);
      if (!Number.isFinite(maxUses) || maxUses < 1) errors.maxUses = t.invalidMaxUses;
      if (Object.keys(errors).length) {
        setFormErrors(errors);
        return;
      }
      setSubmitting(true);
      const res = await createPromoCode({
        eventSlug,
        code: form.code?.trim() || undefined,
        discountPercentage: Number(form.discountPercentage),
        maxUses,
        codeLength: Number(form.codeLength),
        prefix: form.prefix?.trim() || "",
        applicableTicketTypeIds: form.applicableTicketTypeIds,
      });
      setSubmitting(false);
      if (!res?.error) {
        setFormOpen(false);
        setForm(emptyForm);
        setFormErrors({});
        fetchPromoCodes();
      }
      return;
    }

    const batchSize = Number(form.batchSize);
    if (!Number.isFinite(batchSize) || batchSize < 1 || batchSize > 1000) errors.batchSize = t.invalidBatchSize;
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }
    setSubmitting(true);
    const res = await createPromoCodeBatch({
      eventSlug,
      discountPercentage: Number(form.discountPercentage),
      batchSize,
      codeLength: Number(form.codeLength),
      prefix: form.prefix?.trim() || "",
      batchLabel: form.batchLabel?.trim() || undefined,
      applicableTicketTypeIds: form.applicableTicketTypeIds,
    });
    setSubmitting(false);
    if (!res?.error) {
      setFormOpen(false);
      setForm(emptyForm);
      setFormErrors({});
      fetchPromoCodes();
    }
  };

  return (
    <Container maxWidth={false} disableGutters dir={dir}>
      <BreadcrumbsNav items={breadcrumbs} />

      <Stack direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mt: 2, mb: 3 }} spacing={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>{t.title}</Typography>
          <Typography variant="body2" color="text.secondary">{t.description}</Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
          <Button variant="outlined" startIcon={<ICONS.download />} onClick={handleExport}>
            {t.exportCodes}
          </Button>
          <Button variant="contained" startIcon={<ICONS.add />} onClick={handleOpenForm}>
            {t.createCode}
          </Button>
        </Stack>
      </Stack>

      {!loading && promoCodes.length > 0 && (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 2 }}
        >
          <Typography variant="body2" color="text.secondary">
            {t.showing} {(page - 1) * limit + 1}-
            {Math.min(page * limit, total)} {t.of} {total} {t.records}
          </Typography>
          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 150 } }}>
            <InputLabel>{t.recordsPerPage}</InputLabel>
            <Select value={limit} onChange={handleLimitChange} label={t.recordsPerPage}>
              {[5, 10, 20, 50, 100, 250, 500].map((n) => (
                <MenuItem key={n} value={n}>
                  {toArabicDigits(n, language)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : promoCodes.length === 0 ? (
        <NoDataAvailable message={t.noCodes} />
      ) : (
        <>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "center" }}>
            {promoCodes.map((pc) => (
              <AppCard key={pc._id} sx={{ width: { xs: "100%", sm: 340 } }}>
                <CardContent sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={0.25} sx={{ alignItems: "center" }}>
                        <Typography fontWeight={700} variant="body2" sx={{ fontFamily: "monospace" }}>
                          {pc.code}
                        </Typography>
                        <Tooltip title={copiedCodeId === pc._id ? t.codeCopied : t.copyCode}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              navigator.clipboard.writeText(pc.code);
                              setCopiedCodeId(pc._id);
                              setTimeout(() => setCopiedCodeId((prev) => (prev === pc._id ? null : prev)), 2000);
                            }}
                            sx={{
                              p: 0.4,
                              color: copiedCodeId === pc._id ? "success.main" : "secondary.main",
                              "&:hover": { backgroundColor: "transparent", opacity: 0.8 },
                            }}
                          >
                            {copiedCodeId === pc._id ? <ICONS.checkCircle sx={{ fontSize: "0.9rem" }} /> : <ICONS.copy sx={{ fontSize: "0.9rem" }} />}
                          </IconButton>
                        </Tooltip>
                      </Stack>
                      {pc.batchLabel && (
                        <Typography variant="caption" color="text.secondary">{pc.batchLabel}</Typography>
                      )}
                    </Box>
                    <FormControlLabel
                      control={<Switch size="small" checked={pc.isActive} onChange={() => handleToggleActive(pc)} />}
                      label={<Chip label={pc.isActive ? t.active : t.inactive} color={pc.isActive ? "success" : "default"} size="small" />}
                      labelPlacement="start"
                      sx={{ ml: 0, mr: -0.5 }}
                    />
                  </Stack>

                  <Divider sx={{ my: 1.5 }} />

                  <Stack spacing={1}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="caption" color="text.secondary">{t.discount}</Typography>
                      <Typography variant="body2">{pc.discountPercentage}%</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="caption" color="text.secondary">{t.usage}</Typography>
                      <Typography variant="body2">{pc.usedCount} / {pc.maxUses}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>{t.ticketScope}</Typography>
                      <Typography variant="body2" sx={{ textAlign: "right" }}>
                        {pc.applicableTicketTypeIds?.length
                          ? pc.applicableTicketTypeIds.map(ticketTypeName).filter(Boolean).join(", ")
                          : t.allTickets}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>

                <RecordMetadata
                  createdByName={pc.createdBy}
                  updatedByName={pc.updatedBy}
                  createdAt={pc.createdAt}
                  updatedAt={pc.updatedAt}
                  locale={language === "ar" ? "ar-SA" : "en-GB"}
                />

                <CardActions sx={{ justifyContent: "flex-end", px: 2, pb: 1.5, pt: 0 }}>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title={t.viewRedemptions}>
                      <IconButton size="small" color="primary" onClick={() => handleViewRedemptions(pc)}>
                        <ICONS.view fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t.deleteCode}>
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget(pc)}>
                        <ICONS.delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </CardActions>
              </AppCard>
            ))}
          </Box>

          {total > limit && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <ArabicPagination count={Math.ceil(total / limit)} page={page} onChange={(_, v) => setPage(v)} />
            </Box>
          )}
        </>
      )}

      {/* Create promo code dialog — single code or batch, toggled in one form */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth dir={dir}>
        <DialogTitle>{formMode === "single" ? t.createTitle : t.batchTitle}</DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: "divider", mt: -1, mx: -3 }}>
            <Tabs
              value={formMode}
              onChange={(e, next) => { setFormMode(next); setFormErrors({}); }}
              variant="fullWidth"
              sx={{ px: 3 }}
            >
              <Tab value="single" label={t.modeSingle} />
              <Tab value="batch" label={t.modeBatch} />
            </Tabs>
          </Box>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {formMode === "single" ? (
              <TextField
                label={t.codeLabel}
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                fullWidth
              />
            ) : (
              <TextField
                label={t.batchLabelLabel}
                value={form.batchLabel}
                onChange={(e) => setForm((p) => ({ ...p, batchLabel: e.target.value }))}
                fullWidth
              />
            )}

            <Stack direction="row" spacing={2}>
              <TextField
                label={t.discountLabel}
                type="number"
                value={form.discountPercentage}
                onChange={(e) => setForm((p) => ({ ...p, discountPercentage: e.target.value }))}
                error={!!formErrors.discountPercentage}
                helperText={formErrors.discountPercentage}
                fullWidth
              />
              {formMode === "single" ? (
                <TextField
                  label={t.maxUsesLabel}
                  type="number"
                  value={form.maxUses}
                  onChange={(e) => setForm((p) => ({ ...p, maxUses: e.target.value }))}
                  error={!!formErrors.maxUses}
                  helperText={formErrors.maxUses}
                  fullWidth
                />
              ) : (
                <TextField
                  label={t.batchSizeLabel}
                  type="number"
                  value={form.batchSize}
                  onChange={(e) => setForm((p) => ({ ...p, batchSize: e.target.value }))}
                  error={!!formErrors.batchSize}
                  helperText={formErrors.batchSize}
                  fullWidth
                />
              )}
            </Stack>

            {(formMode === "batch" || !form.code?.trim()) && (
              <Stack direction="row" spacing={2}>
                <TextField
                  label={t.codeLengthLabel}
                  type="number"
                  value={form.codeLength}
                  onChange={(e) => setForm((p) => ({ ...p, codeLength: e.target.value }))}
                  error={!!formErrors.codeLength}
                  helperText={formErrors.codeLength}
                  fullWidth
                />
                <TextField
                  label={t.prefixLabel}
                  value={form.prefix}
                  onChange={(e) => setForm((p) => ({ ...p, prefix: e.target.value }))}
                  fullWidth
                />
              </Stack>
            )}

            <TicketTypePicker
              ticketTypes={event?.ticketTypes}
              value={form.applicableTicketTypeIds}
              onChange={(ids) => setForm((p) => ({ ...p, applicableTicketTypeIds: ids }))}
              label={t.ticketTypesLabel}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>{t.cancel}</Button>
          <Button variant="contained" onClick={handleFormSubmit} disabled={submitting}>
            {submitting ? <CircularProgress size={20} /> : (formMode === "single" ? t.create : t.generate)}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Redemptions dialog */}
      <Dialog open={redemptionsOpen} onClose={() => setRedemptionsOpen(false)} maxWidth="sm" fullWidth dir={dir}>
        <DialogTitle>
          {t.redemptionsTitle} — <Box component="span" sx={{ fontFamily: "monospace" }}>{redemptionsData?.promoCode?.code}</Box>
        </DialogTitle>
        <DialogContent>
          {!redemptionsData?.redemptions?.length ? (
            <NoDataAvailable message={t.noRedemptions} />
          ) : (
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              {redemptionsData.redemptions.map((r) => (
                <Card key={r._id} variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                    <Stack direction="row" sx={{ justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                      <Box>
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                          <Typography variant="body2" fontWeight={600}>{r.fullName || r.email || "—"}</Typography>
                          <Chip
                            label={r.paymentStatus === "paid" ? t.statusPaid : t.statusPending}
                            color={r.paymentStatus === "paid" ? "success" : "warning"}
                            size="small"
                          />
                        </Stack>
                        <Typography variant="caption" color="text.secondary">{r.email || "—"}</Typography>
                      </Box>
                      <Box sx={{ textAlign: "right" }}>
                        <Typography variant="body2">
                          -{r.priceBreakdown?.discountAmount ?? 0} OMR
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(r.createdAt)}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRedemptionsOpen(false)}>{t.close}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmationDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t.deleteConfirmTitle}
        message={t.deleteConfirmMessage}
        confirmButtonText={t.deleteCode}
        confirmButtonColor="error"
      />
    </Container>
  );
}
