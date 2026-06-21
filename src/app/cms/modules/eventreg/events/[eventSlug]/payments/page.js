"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Container,
  Stack,
  Chip,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Divider,
  Alert,
} from "@mui/material";
import { useParams } from "next/navigation";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import NoDataAvailable from "@/components/NoDataAvailable";
import useI18nLayout from "@/hooks/useI18nLayout";
import { getPaymentsByEvent, getPaymentStats } from "@/services/eventreg/paymentService";
import { getPublicEventBySlug } from "@/services/eventreg/eventService";
import { formatDate } from "@/utils/dateUtils";
import { wrapTextBox } from "@/utils/wrapTextStyles";
import ICONS from "@/utils/iconUtil";

const translations = {
  en: {
    title: "Payments",
    description: "Track all payments for this event — revenue breakdown and individual transaction records.",
    totalRevenue: "Total Revenue",
    paidCount: "Paid",
    pendingCount: "Pending",
    cancelledCount: "Cancelled",
    omr: "OMR",
    filterStatus: "Filter by Status",
    allStatuses: "All",
    customer: "Customer",
    ticket: "Ticket",
    amount: "Amount",
    status: "Status",
    date: "Date",
    noPayments: "No payments found.",
    paid: "Paid",
    pending: "Pending",
    cancelled: "Cancelled",
    failed: "Failed",
    ticketBreakdown: "Ticket Breakdown",
    ticketName: "Ticket",
    ticketPrice: "Price",
    ticketSold: "Sold",
    ticketRevenue: "Revenue",
    noEmail: "—",
    baseRevenue: "Base",
    feesCollected: "Fees",
    vatCollected: "VAT",
    inclVat: "incl. VAT",
  },
  ar: {
    title: "المدفوعات",
    description: "تتبع جميع المدفوعات لهذه الفعالية — تفصيل الإيرادات وسجلات المعاملات الفردية.",
    totalRevenue: "إجمالي الإيرادات",
    paidCount: "مدفوع",
    pendingCount: "معلّق",
    cancelledCount: "ملغى",
    omr: "ر.ع.",
    filterStatus: "تصفية حسب الحالة",
    allStatuses: "الكل",
    customer: "العميل",
    ticket: "التذكرة",
    amount: "المبلغ",
    status: "الحالة",
    date: "التاريخ",
    noPayments: "لا توجد مدفوعات.",
    paid: "مدفوع",
    pending: "معلّق",
    cancelled: "ملغى",
    failed: "فشل",
    ticketBreakdown: "تفصيل التذاكر",
    ticketName: "التذكرة",
    ticketPrice: "السعر",
    ticketSold: "المباع",
    ticketRevenue: "الإيرادات",
    noEmail: "—",
    baseRevenue: "الأساسي",
    feesCollected: "الرسوم",
    vatCollected: "ضريبة القيمة المضافة",
    inclVat: "شامل الضريبة",
  },
};

const STATUS_COLORS = {
  paid: "success",
  pending: "warning",
  cancelled: "default",
  failed: "error",
};

const LIMIT = 20;

export default function PaymentsPage() {
  const { eventSlug } = useParams();
  const { t, dir } = useI18nLayout(translations);

  const [event, setEvent] = useState(null);
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch event metadata once
  useEffect(() => {
    getPublicEventBySlug(eventSlug).then((res) => {
      if (!res?.error) setEvent(res);
    });
  }, [eventSlug]);

  // Fetch stats once
  useEffect(() => {
    setStatsLoading(true);
    getPaymentStats(eventSlug).then((res) => {
      if (!res?.error) setStats(res);
      setStatsLoading(false);
    });
  }, [eventSlug]);

  // Fetch payments whenever page or filter changes
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const params = { page, limit: LIMIT };
    if (statusFilter) params.status = statusFilter;
    const res = await getPaymentsByEvent(eventSlug, params);
    if (!res?.error) {
      setPayments(res.payments || []);
      setTotal(res.total || 0);
    }
    setLoading(false);
  }, [eventSlug, page, statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const breadcrumbs = [
    { label: "EventReg", href: "/cms/modules/eventreg/events" },
    { label: event?.name || eventSlug, href: `/cms/modules/eventreg/events/${eventSlug}/registrations` },
    { label: t.title },
  ];

  const totalPaid = stats?.summary?.paid?.total ?? 0;
  const paidCount = stats?.summary?.paid?.count ?? 0;
  const pendingCount = stats?.summary?.pending?.count ?? 0;
  const cancelledCount = stats?.summary?.cancelled?.count ?? 0;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }} dir={dir}>
      <BreadcrumbsNav items={breadcrumbs} />

      <Typography variant="h5" fontWeight={700} sx={{ mt: 2, mb: 0.5 }}>
        {t.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t.description}
      </Typography>

      {/* Stats Cards */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">{t.totalRevenue}</Typography>
            {statsLoading ? (
              <CircularProgress size={20} />
            ) : (
              <>
                <Typography variant="h5" fontWeight={700} color="primary.main">
                  {totalPaid.toFixed(3)} {t.omr}
                </Typography>
                {stats?.revenue && (stats.revenue.fees > 0 || stats.revenue.vat > 0) && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                    {t.baseRevenue} {stats.revenue.base.toFixed(3)} · {t.feesCollected} {stats.revenue.fees.toFixed(3)} · {t.vatCollected} {stats.revenue.vat.toFixed(3)}
                  </Typography>
                )}
              </>
            )}
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">{t.paidCount}</Typography>
            <Typography variant="h5" fontWeight={700} color="success.main">{paidCount}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">{t.pendingCount}</Typography>
            <Typography variant="h5" fontWeight={700} color="warning.main">{pendingCount}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">{t.cancelledCount}</Typography>
            <Typography variant="h5" fontWeight={700} color="text.secondary">{cancelledCount}</Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Ticket Breakdown */}
      {stats?.ticketBreakdown?.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              {t.ticketBreakdown}
            </Typography>
            <Box sx={{ overflowX: "auto" }}>
              <Box
                component="table"
                sx={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}
              >
                <Box component="thead">
                  <Box component="tr" sx={{ borderBottom: "2px solid", borderColor: "divider" }}>
                    {[t.ticketName, t.ticketPrice, t.ticketSold, t.ticketRevenue].map((h) => (
                      <Box
                        key={h}
                        component="th"
                        sx={{ p: 1, textAlign: dir === "rtl" ? "right" : "left", fontWeight: 600 }}
                      >
                        {h}
                      </Box>
                    ))}
                  </Box>
                </Box>
                <Box component="tbody">
                  {stats.ticketBreakdown.map((tt, i) => (
                    <Box
                      key={i}
                      component="tr"
                      sx={{ borderBottom: "1px solid", borderColor: "divider" }}
                    >
                      <Box component="td" sx={{ p: 1 }}>{tt.name}</Box>
                      <Box component="td" sx={{ p: 1 }}>{tt.price} {t.omr}</Box>
                      <Box component="td" sx={{ p: 1 }}>{tt.sold}</Box>
                      <Box component="td" sx={{ p: 1 }}>{tt.revenue.toFixed(3)} {t.omr}</Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>{t.filterStatus}</InputLabel>
          <Select
            value={statusFilter}
            label={t.filterStatus}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <MenuItem value="">{t.allStatuses}</MenuItem>
            <MenuItem value="paid">{t.paid}</MenuItem>
            <MenuItem value="pending">{t.pending}</MenuItem>
            <MenuItem value="cancelled">{t.cancelled}</MenuItem>
            <MenuItem value="failed">{t.failed}</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* Payments Table */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : payments.length === 0 ? (
        <NoDataAvailable message={t.noPayments} />
      ) : (
        <>
          <Stack spacing={1.5}>
            {payments.map((p) => (
              <Card key={p._id} variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" } }}
                  >
                    <Box>
                      <Typography fontWeight={600} variant="body2">
                        {p.customerName || t.noEmail}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {p.customerEmail || t.noEmail}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: { sm: "center" } }}>
                      <Typography variant="caption" color="text.secondary">{t.ticket}</Typography>
                      <Typography variant="body2">{p.ticketTypeName || "—"}</Typography>
                    </Box>
                    <Box sx={{ textAlign: { sm: "center" } }}>
                      <Typography variant="caption" color="text.secondary">{t.amount}</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {p.amount?.toFixed(3)} {t.omr}
                      </Typography>
                      {p.priceBreakdown?.vatAmount > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          {t.inclVat} {p.priceBreakdown.vatAmount.toFixed(3)}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ textAlign: { sm: "center" } }}>
                      <Chip
                        label={t[p.status] || p.status}
                        color={STATUS_COLORS[p.status] || "default"}
                        size="small"
                      />
                    </Box>
                    <Box sx={{ textAlign: { sm: "right" } }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(p.createdAt)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>

          {total > LIMIT && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Pagination
                count={Math.ceil(total / LIMIT)}
                page={page}
                onChange={(_, v) => setPage(v)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}
