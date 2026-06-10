"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import ICONS from "@/utils/iconUtil";
import { useAuth } from "@/contexts/AuthContext";
import { getAllPayments, getPaymentLink } from "@/services/eventreg/paymentService";
import usePaymentsSocket from "@/hooks/usePaymentsSocket";
import useI18nLayout from "@/hooks/useI18nLayout";
import { formatDateTimeWithLocale } from "@/utils/dateUtils";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import LoadingState from "@/components/LoadingState";
import { getAllBusinesses } from "@/services/businessService";

dayjs.extend(utc);

const translations = {
  en: {
    title: "Payments",
    subtitle: "Global payment log across all events and modules.",
    searchPlaceholder: "Search by name, email, event…",
    noPayments: "No payments found for the selected filters.",
    recordsPerPage: "Records per page",
    showing: "Showing",
    of: "of",
    records: "records",
    filters: "Filters",
    from: "From",
    to: "To",
    apply: "Apply",
    clear: "Clear",
    clearAll: "Clear All",
    activeFilters: "Active Filters",
    allStatuses: "All Statuses",
    status: "Status",
    dateRange: "Date Range",
    business: "Business",
    allBusinesses: "All businesses",
    revenue: "Total Revenue",
    copyLink: "Copy Payment Link",
    linkCopied: "Link Copied!",
    loadError: "Failed to load payments.",
  },
  ar: {
    title: "المدفوعات",
    subtitle: "سجل المدفوعات الشامل عبر جميع الفعاليات والوحدات.",
    searchPlaceholder: "ابحث بالاسم أو البريد الإلكتروني أو الفعالية…",
    noPayments: "لا توجد مدفوعات للفلاتر المحددة.",
    recordsPerPage: "عدد السجلات لكل صفحة",
    showing: "عرض",
    of: "من",
    records: "سجلات",
    filters: "عوامل التصفية",
    from: "من",
    to: "إلى",
    apply: "تطبيق",
    clear: "مسح",
    clearAll: "مسح الكل",
    activeFilters: "الفلاتر النشطة",
    allStatuses: "جميع الحالات",
    status: "الحالة",
    dateRange: "نطاق التاريخ",
    business: "الشركة",
    allBusinesses: "جميع الشركات",
    revenue: "إجمالي الإيرادات",
    copyLink: "نسخ رابط الدفع",
    linkCopied: "تم النسخ!",
    loadError: "تعذر تحميل المدفوعات.",
  },
};

const STATUS_OPTIONS = ["paid", "pending", "cancelled", "failed"];

const STATUS_CHIP = {
  paid: { label: "Paid", labelAr: "مدفوع", color: "success" },
  pending: { label: "Pending", labelAr: "قيد الانتظار", color: "warning" },
  cancelled: { label: "Cancelled", labelAr: "ملغى", color: "default" },
  failed: { label: "Failed", labelAr: "فاشل", color: "error" },
};

export default function PaymentsPage() {
  const { user } = useAuth();
  const { dir, align, language, t } = useI18nLayout(translations);
  const isAr = language === "ar";
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Applied filters — drive the fetch
  const [filterStatus, setFilterStatus] = useState("");
  const [filterBusinessId, setFilterBusinessId] = useState("");
  const [fromMs, setFromMs] = useState(null);
  const [toMs, setToMs] = useState(null);
  const [dateRangePreset, setDateRangePreset] = useState("all");

  // Draft filters — only committed on Apply
  const [draftStatus, setDraftStatus] = useState("");
  const [draftBusinessId, setDraftBusinessId] = useState("");
  const [draftFromMs, setDraftFromMs] = useState(null);
  const [draftToMs, setDraftToMs] = useState(null);

  const [businessesList, setBusinessesList] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [copiedId, setCopiedId] = useState(null);

  const isSuperAdmin = user?.role === "superadmin";

  const { latestPayments, clearLatestPayments } = usePaymentsSocket();

  // Merge socket-pushed payments into the list (update-in-place or prepend)
  useEffect(() => {
    if (!latestPayments?.length) return;
    setPayments((prev) => {
      let updated = [...prev];
      let newCount = 0;
      latestPayments.forEach((incoming) => {
        const idx = updated.findIndex((p) => p._id === incoming._id);
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], ...incoming };
        } else {
          updated = [incoming, ...updated];
          newCount += 1;
        }
      });
      if (newCount > 0) setTotal((t) => t + newCount);
      return updated;
    });
    clearLatestPayments();
  }, [latestPayments, clearLatestPayments]);

  // Load businesses for superadmin filter
  useEffect(() => {
    if (!isSuperAdmin) return;
    getAllBusinesses().then((res) => {
      const list = Array.isArray(res) ? res : res?.data ?? res?.businesses ?? [];
      setBusinessesList(Array.isArray(list) ? list : []);
    }).catch(() => setBusinessesList([]));
  }, [isSuperAdmin]);

  // Debounce search
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, filterStatus, filterBusinessId, fromMs, toMs]);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    const params = { page, limit };
    if (debouncedSearch) params.search = debouncedSearch;
    if (filterStatus) params.status = filterStatus;
    if (filterBusinessId) params.businessId = filterBusinessId;
    if (fromMs) params.from = new Date(fromMs).toISOString();
    if (toMs) params.to = new Date(toMs).toISOString();

    const res = await getAllPayments(params);
    if (res?.error) {
      setLoadError(res?.message || t.loadError);
      setPayments([]);
      setTotal(0);
    } else {
      setPayments(res?.payments ?? []);
      setTotal(res?.total ?? 0);
    }
    setLoading(false);
  }, [page, limit, debouncedSearch, filterStatus, filterBusinessId, fromMs, toMs, t.loadError]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Revenue: sum of paid amounts in current result set
  const revenue = useMemo(
    () => payments.filter((p) => p.status === "paid").reduce((acc, p) => acc + (p.amount || 0), 0),
    [payments]
  );

  const handleCopyLink = async (payment) => {
    const res = await getPaymentLink(payment.registrationId);
    if (!res?.error && res?.paymentUrl) {
      await navigator.clipboard.writeText(res.paymentUrl);
      setCopiedId(payment._id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const openFilters = () => {
    // Sync draft from currently applied state when opening
    setDraftStatus(filterStatus);
    setDraftBusinessId(filterBusinessId);
    setDraftFromMs(fromMs);
    setDraftToMs(toMs);
    setFiltersOpen(true);
  };

  const handleApplyFilters = () => {
    setFilterStatus(draftStatus);
    setFilterBusinessId(draftBusinessId);
    setFromMs(draftFromMs);
    setToMs(draftToMs);
    if (draftFromMs || draftToMs) setDateRangePreset("custom");
    setFiltersOpen(false);
  };

  // Clear inside dialog — resets draft only, does not apply yet
  const handleClearDraft = () => {
    setDraftStatus("");
    setDraftBusinessId("");
    setDraftFromMs(null);
    setDraftToMs(null);
  };

  // Clear All (outside dialog, on active filter chips) — immediately clears applied state
  const handleClearAllFilters = () => {
    setFilterStatus("");
    setFilterBusinessId("");
    setDateRangePreset("all");
    setFromMs(null);
    setToMs(null);
  };

  const formatDate = (d) =>
    d ? formatDateTimeWithLocale(d, isAr ? "ar-SA" : "en-GB") : "—";

  const getStatusChip = (status) => {
    const cfg = STATUS_CHIP[status] || { label: status, color: "default" };
    return (
      <Chip
        label={isAr ? (cfg.labelAr || cfg.label) : cfg.label}
        color={cfg.color}
        size="small"
        sx={{ fontWeight: 700, minWidth: 80 }}
      />
    );
  };

  const labels = isAr
    ? { customer: "العميل", event: "الفعالية", item: "العنصر", amount: "المبلغ", status: "الحالة", date: "التاريخ", business: "الشركة", actions: "إجراءات" }
    : { customer: "Customer", event: "Event", item: "Item", amount: "Amount (OMR)", status: "Status", date: "Date", business: "Business", actions: "Actions" };

  // Returns the item label and value based on module — extend as new modules are added
  const getItemLabel = (p) => {
    const module = p.module || "EventReg";
    if (module === "EventReg") return { prefix: isAr ? "تذكرة" : "Ticket", value: p.ticketTypeName };
    return { prefix: module, value: p.ticketTypeName };
  };

  const hasDateFilter = !!fromMs || !!toMs;

  const activeFilterEntries = useMemo(() => {
    const entries = [];
    if (filterStatus) entries.push({ key: "status", label: t.status, value: STATUS_CHIP[filterStatus]?.label || filterStatus });
    if (filterBusinessId) {
      const biz = businessesList.find((b) => String(b._id) === String(filterBusinessId));
      entries.push({ key: "business", label: t.business, value: biz?.name || filterBusinessId });
    }
    if (hasDateFilter) {
      entries.push({ key: "dateRange", label: t.dateRange, value: `${formatDate(fromMs)} → ${formatDate(toMs)}` });
    }
    return entries;
  }, [filterStatus, filterBusinessId, hasDateFilter, fromMs, toMs, businessesList, t]);

  const renderMobileCard = (p) => (
    <ListItem key={p._id} sx={{ px: 0, py: 0.75 }}>
      <Card
        elevation={0}
        sx={{
          width: "100%",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2.5,
          overflow: "hidden",
          boxShadow: "0 4px 14px rgba(15,23,42,0.05)",
        }}
      >
        <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1, mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={700}>{p.customerName || "—"}</Typography>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
              {getStatusChip(p.status)}
              {p.status === "pending" && (
                <Tooltip title={copiedId === p._id ? t.linkCopied : t.copyLink}>
                  <IconButton size="small" onClick={() => handleCopyLink(p)}
                    sx={{ p: 0.4, color: copiedId === p._id ? "success.main" : "warning.main" }}>
                    {copiedId === p._id ? <ICONS.checkCircle sx={{ fontSize: 16 }} /> : <ICONS.copy sx={{ fontSize: 16 }} />}
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Stack>
          <Stack spacing={0.5}>
            {p.customerEmail && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: align }}>
                <Box component="span" fontWeight={600} color="text.primary" sx={{ marginInlineEnd: 0.5 }}>{labels.customer}:</Box>
                {p.customerEmail}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: align }}>
              <Box component="span" fontWeight={600} color="text.primary" sx={{ marginInlineEnd: 0.5 }}>{labels.event}:</Box>
              {p.eventName || "—"}
            </Typography>
            {isSuperAdmin && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: align }}>
                <Box component="span" fontWeight={600} color="text.primary" sx={{ marginInlineEnd: 0.5 }}>{labels.business}:</Box>
                {p.businessName || "—"}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: align }}>
              <Box component="span" fontWeight={600} color="text.primary" sx={{ marginInlineEnd: 0.5 }}>{getItemLabel(p).prefix}:</Box>
              {getItemLabel(p).value || "—"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: align }}>
              <Box component="span" fontWeight={600} color="text.primary" sx={{ marginInlineEnd: 0.5 }}>{labels.amount}:</Box>
              {p.amount != null ? `${p.amount} OMR` : "—"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: align }}>
              <Box component="span" fontWeight={600} color="text.primary" sx={{ marginInlineEnd: 0.5 }}>{labels.date}:</Box>
              {formatDate(p.createdAt)}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </ListItem>
  );

  const renderDesktopRow = (p) => (
    <TableRow
      key={p._id}
      sx={{ "&:nth-of-type(odd)": { bgcolor: "action.selected" }, "&:last-child td": { border: 0 } }}
    >
      <TableCell sx={{ py: 1.5, textAlign: align }}>
        <Typography variant="body2" fontWeight={600}>{p.customerName || "—"}</Typography>
        {p.customerEmail && <Typography variant="caption" color="text.secondary">{p.customerEmail}</Typography>}
      </TableCell>
      <TableCell sx={{ py: 1.5, textAlign: align }}>{p.eventName || "—"}</TableCell>
      {isSuperAdmin && <TableCell sx={{ py: 1.5, textAlign: align }}>{p.businessName || "—"}</TableCell>}
      <TableCell sx={{ py: 1.5, textAlign: align }}>
        {(() => {
          const { prefix, value } = getItemLabel(p);
          return (
            <>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.3 }}>{prefix}</Typography>
              <Typography variant="body2" fontWeight={600}>{value || "—"}</Typography>
            </>
          );
        })()}
      </TableCell>
      <TableCell sx={{ py: 1.5, textAlign: align }}>
        {p.amount != null ? `${p.amount} OMR` : "—"}
      </TableCell>
      <TableCell sx={{ py: 1.5 }}>{getStatusChip(p.status)}</TableCell>
      <TableCell sx={{ py: 1.5, textAlign: align }}>{formatDate(p.createdAt)}</TableCell>
      <TableCell sx={{ py: 1.5 }}>
        {p.status === "pending" && (
          <Tooltip title={copiedId === p._id ? t.linkCopied : t.copyLink}>
            <IconButton size="small" onClick={() => handleCopyLink(p)}
              sx={{ color: copiedId === p._id ? "success.main" : "warning.main" }}>
              {copiedId === p._id ? <ICONS.checkCircle fontSize="small" /> : <ICONS.copy fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <Container dir={dir} maxWidth={false} sx={{ px: { xs: 2, md: 3 } }}>
        <BreadcrumbsNav />

        {/* ── Filters dialog ── */}
        <Dialog open={filtersOpen} onClose={() => setFiltersOpen(false)} fullWidth maxWidth="sm" dir={dir}>
          <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 4 }}>
            {t.filters}
            <IconButton size="small" onClick={() => setFiltersOpen(false)}>
              <ICONS.close fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>{t.status}</InputLabel>
                <Select value={draftStatus} label={t.status} onChange={(e) => setDraftStatus(e.target.value)}>
                  <MenuItem value="">{t.allStatuses}</MenuItem>
                  {STATUS_OPTIONS.map((s) => (
                    <MenuItem key={s} value={s}>{STATUS_CHIP[s]?.label || s}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {isSuperAdmin && (
                <FormControl size="small" fullWidth>
                  <InputLabel>{t.business}</InputLabel>
                  <Select value={draftBusinessId} label={t.business} onChange={(e) => setDraftBusinessId(e.target.value)}>
                    <MenuItem value="">{t.allBusinesses}</MenuItem>
                    {businessesList.map((b) => (
                      <MenuItem key={b._id} value={b._id}>{b.name || b.slug}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <Stack direction="row" spacing={2}>
                <DateTimePicker
                  label={t.from}
                  value={draftFromMs ? dayjs(draftFromMs) : null}
                  onChange={(val) => setDraftFromMs(val ? dayjs(val).utc().valueOf() : null)}
                  slotProps={{ textField: { size: "small", fullWidth: true } }}
                />
                <DateTimePicker
                  label={t.to}
                  value={draftToMs ? dayjs(draftToMs) : null}
                  onChange={(val) => setDraftToMs(val ? dayjs(val).utc().valueOf() : null)}
                  slotProps={{ textField: { size: "small", fullWidth: true } }}
                />
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button startIcon={<ICONS.clear />} onClick={handleClearDraft}>{t.clear}</Button>
            <Button variant="contained" startIcon={<ICONS.check />} onClick={handleApplyFilters}>{t.apply}</Button>
          </DialogActions>
        </Dialog>

        {/* ── Header ── */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, gap: 2, mb: 2 }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h4" fontWeight="bold" sx={{ textAlign: align }}>{t.title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: align, mt: 0.5 }}>{t.subtitle}</Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { xs: "stretch", sm: "center" } }}>
            {/* Revenue stat */}
            <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.4, textTransform: "uppercase", letterSpacing: 0.5, fontSize: "0.68rem" }}>
                {t.revenue}
              </Typography>
              <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                {Math.round(revenue)}{" "}
                <Typography component="span" variant="body2" fontWeight={600} color="text.secondary">OMR</Typography>
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={<ICONS.filter />}
              onClick={openFilters}
              sx={{ borderRadius: 999, px: 2.5, textTransform: "none", fontWeight: 600 }}
            >
              {t.filters}
            </Button>
          </Stack>
        </Stack>

        {/* ── Date preset chips ── */}
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
          {["all", "30", "7"].map((preset) => {
            const presetLabel = preset === "all" ? "All Time" : preset === "30" ? "Last 30 days" : "Last 7 days";
            return (
              <Chip
                key={preset}
                label={presetLabel}
                color={dateRangePreset === preset ? "primary" : "default"}
                variant={dateRangePreset === preset ? "filled" : "outlined"}
                onClick={() => {
                  setDateRangePreset(preset);
                  if (preset === "all") {
                    setFromMs(null);
                    setToMs(null);
                  } else {
                    const now = new Date();
                    const from = new Date(now);
                    from.setDate(from.getDate() - Number(preset));
                    setFromMs(from.getTime());
                    setToMs(now.getTime());
                  }
                }}
                sx={{ fontWeight: 500 }}
              />
            );
          })}
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {/* ── Controls row ── */}
        <Box sx={{ mb: 2 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, gap: 2 }}
          >
            <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ textAlign: align }}>
              {t.showing} {total === 0 ? 0 : (page - 1) * limit + 1}–{Math.min(page * limit, total)} {t.of} {total} {t.records}
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ width: "100%", alignItems: { xs: "stretch", sm: "center" }, justifyContent: "flex-end" }}>
              <TextField
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchPlaceholder}
                size="small"
                sx={{ width: { xs: "100%", sm: 280, md: 320 }, "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start"><ICONS.search fontSize="small" sx={{ opacity: 0.7 }} /></InputAdornment>,
                    endAdornment: search ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearch("")}><ICONS.clear fontSize="small" /></IconButton>
                      </InputAdornment>
                    ) : null,
                  },
                }}
              />
              <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 170 } }}>
                <InputLabel>{t.recordsPerPage}</InputLabel>
                <Select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} label={t.recordsPerPage} sx={{ borderRadius: 2.5 }}>
                  {[5, 10, 20, 50, 100].map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        </Box>

        {/* ── Active filter chips ── */}
        {activeFilterEntries.length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center", mb: 2 }}>
            <Typography variant="body2" fontWeight={500} color="text.secondary">{t.activeFilters}:</Typography>
            {activeFilterEntries.map(({ key, label, value }) => (
              <Chip
                key={key}
                label={`${label}: ${value}`}
                onDelete={() => {
                  if (key === "status") setFilterStatus("");
                  else if (key === "business") setFilterBusinessId("");
                  else if (key === "dateRange") { setDateRangePreset("all"); setFromMs(null); setToMs(null); }
                }}
                color="primary"
                variant="outlined"
                size="small"
                sx={{ fontWeight: 500 }}
              />
            ))}
            <Button size="small" color="secondary" startIcon={<ICONS.close />} onClick={handleClearAllFilters} sx={{ textTransform: "none", fontWeight: 600 }}>
              {t.clearAll}
            </Button>
          </Box>
        )}

        {/* ── Content ── */}
        {loading ? (
          <LoadingState />
        ) : loadError ? (
          <Box sx={{ mt: 6, textAlign: "center" }}>
            <Typography variant="body1" color="error.main">{loadError}</Typography>
          </Box>
        ) : payments.length === 0 ? (
          <Box sx={{ mt: 6, textAlign: "center" }}>
            <Typography variant="body1" color="text.secondary">{t.noPayments}</Typography>
          </Box>
        ) : isMobile ? (
          <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {payments.map(renderMobileCard)}
          </List>
        ) : (
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2.5, overflow: "hidden", bgcolor: "background.paper" }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "background.default", py: 1.5, textAlign: align }}>{labels.customer}</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "background.default", py: 1.5, textAlign: align }}>{labels.event}</TableCell>
                  {isSuperAdmin && <TableCell sx={{ fontWeight: 700, bgcolor: "background.default", py: 1.5, textAlign: align }}>{labels.business}</TableCell>}
                  <TableCell sx={{ fontWeight: 700, bgcolor: "background.default", py: 1.5, textAlign: align }}>{labels.item}</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "background.default", py: 1.5, textAlign: align }}>{labels.amount}</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "background.default", py: 1.5 }}>{labels.status}</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "background.default", py: 1.5, textAlign: align }}>{labels.date}</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "background.default", py: 1.5 }}>{labels.actions}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>{payments.map(renderDesktopRow)}</TableBody>
            </Table>
          </TableContainer>
        )}

        {/* ── Pagination ── */}
        {total > limit && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <Pagination
              dir="ltr"
              count={totalPages}
              page={Math.min(page, totalPages)}
              onChange={(_, v) => setPage(v)}
              shape="rounded"
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </Container>
    </Box>
  );
}
