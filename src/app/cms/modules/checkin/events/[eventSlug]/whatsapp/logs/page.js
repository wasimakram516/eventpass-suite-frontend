"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  Stack,
  Divider,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  TextField,
  Card,
  CardContent,
  useMediaQuery,
} from "@mui/material";
import { useParams } from "next/navigation";

import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";

import { getCheckInEventBySlug } from "@/services/checkin/checkinEventService";
import { getWhatsAppLogs } from "@/services/notifications/whatsAppLogsService";
import useWhatsAppSocket from "@/hooks/modules/notifications/useWhatsAppSocket";
import { formatDateTimeWithLocale } from "@/utils/dateUtils";

/* =========================
   TRANSLATIONS
========================= */
const translations = {
  en: {
    title: "WhatsApp Logs",
    description: "View WhatsApp delivery status and inbound messages.",
    outbound: "Outbound",
    inbound: "Inbound",
    all: "All",
    search: "Search…",
    status: "Status",
    direction: "Direction",
    recordsPerPage: "Rows per page",
    showing: "Showing",
    of: "of",
    sent: "Sent",
    delivered: "Delivered",
    read: "Read",
    failed: "Failed",
    queued: "Queued",
    phone: "Phone",
    message: "Message",
    time: "Time",
  },
  ar: {
    title: "سجلات واتساب",
    description: "عرض حالة رسائل واتساب والرسائل الواردة.",
    outbound: "صادر",
    inbound: "وارد",
    all: "الكل",
    search: "بحث…",
    status: "الحالة",
    direction: "الاتجاه",
    recordsPerPage: "عدد الصفوف",
    showing: "عرض",
    of: "من",
    sent: "تم الإرسال",
    delivered: "تم التسليم",
    read: "تمت القراءة",
    failed: "فشل",
    queued: "قيد الإرسال",
    phone: "الهاتف",
    message: "الرسالة",
    time: "الوقت",
  },
};

/* =========================
   STATUS CHIP
========================= */
const getStatusChipProps = (status, t) => {
  switch ((status || "").toLowerCase()) {
    case "sent":
      return { color: "info", label: t.sent };
    case "delivered":
      return { color: "success", label: t.delivered };
    case "read":
      return { color: "success", label: t.read };
    case "failed":
      return { color: "error", label: t.failed };
    case "queued":
      return { color: "warning", label: t.queued };
    default:
      return { color: "default", label: status || "-" };
  }
};

/* =========================
   DIRECTION CHIP
========================= */
const getDirectionChipProps = (direction, t) => {
  if (direction === "inbound") {
    return {
      color: "info",
      label: t.inbound,
      icon: <ICONS.chat />,
    };
  }
  return {
    color: "success",
    label: t.outbound,
    icon: <ICONS.send />,
  };
};

export default function WhatsAppLogsPage() {
  const { eventSlug } = useParams();
  const { t, dir } = useI18nLayout(translations);
  const isMobile = useMediaQuery("(max-width:900px)");

  const [event, setEvent] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  /* pagination */
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);

  /* filters */
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    direction: "all",
  });

  /* =========================
     FETCH EVENT
  ========================= */
  useEffect(() => {
    (async () => {
      const ev = await getCheckInEventBySlug(eventSlug);
      if (!ev?.error) setEvent(ev);
    })();
  }, [eventSlug]);

  /* =========================
     FETCH LOGS
  ========================= */
  const fetchLogs = async () => {
    if (!event?._id) return;

    setLoading(true);

    const res = await getWhatsAppLogs({
      eventId: event._id,
      page,
      limit,
      ...(filters.search && { search: filters.search }),
      ...(filters.status !== "all" && { status: filters.status }),
      ...(filters.direction !== "all" && { direction: filters.direction }),
    });

    if (!res?.error) {
      setLogs(res?.data || []);
      setTotal(Number(res?.pagination?.total) || 0);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [event?._id, page, limit, filters]);

  /* =========================
     SOCKET UPDATES
  ========================= */
  const handleInbound = useCallback(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleStatus = useCallback(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleOutbound = useCallback(() => {
    fetchLogs();
  }, [fetchLogs]);

  useWhatsAppSocket({
    eventId: event?._id,
    onInboundMessage: handleInbound,
    onStatusUpdate: handleStatus,
    onOutboundMessage: handleOutbound,
  });

  if (loading && !logs.length) {
    return (
      <Box
        sx={{ minHeight: "60vh", display: "flex", justifyContent: "center" }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <Container dir={dir} maxWidth="lg">
      <BreadcrumbsNav />

      {/* HEADER */}
      <Stack spacing={0.5} mb={2}>
        <Typography variant="h5" fontWeight={600}>
          {t.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t.description}
        </Typography>
      </Stack>

      {/* META ROW */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        flexWrap="wrap"
        gap={2}
      >
        <Typography variant="body2" color="text.secondary">
          {t.showing} {from}–{to} {t.of} {total}
        </Typography>

        {/* ROWS PER PAGE */}
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="rows-label">{t.recordsPerPage}</InputLabel>
          <Select
            labelId="rows-label"
            label={t.recordsPerPage}
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
          >
            {[10, 20, 50, 100].map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {/* FILTER BAR */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems="stretch"
        mb={2}
      >
        {/* SEARCH */}
        <TextField
          size="small"
          placeholder={t.search}
          value={filters.search}
          onChange={(e) => {
            setFilters((f) => ({ ...f, search: e.target.value }));
            setPage(1);
          }}
          sx={{ minWidth: 260, maxWidth: 420, flex: 1 }}
        />

        {/* DIRECTION */}
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="direction-label">{t.direction}</InputLabel>
          <Select
            labelId="direction-label"
            label={t.direction}
            value={filters.direction}
            onChange={(e) => {
              setFilters((f) => ({ ...f, direction: e.target.value }));
              setPage(1);
            }}
          >
            <MenuItem value="all">{t.all}</MenuItem>
            <MenuItem value="outbound">{t.outbound}</MenuItem>
            <MenuItem value="inbound">{t.inbound}</MenuItem>
          </Select>
        </FormControl>

        {/* STATUS */}
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="status-label">{t.status}</InputLabel>
          <Select
            labelId="status-label"
            label={t.status}
            value={filters.status}
            onChange={(e) => {
              setFilters((f) => ({ ...f, status: e.target.value }));
              setPage(1);
            }}
          >
            <MenuItem value="all">{t.all}</MenuItem>
            <MenuItem value="sent">{t.sent}</MenuItem>
            <MenuItem value="delivered">{t.delivered}</MenuItem>
            <MenuItem value="read">{t.read}</MenuItem>
            <MenuItem value="failed">{t.failed}</MenuItem>
            <MenuItem value="queued">{t.queued}</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* TABLE / CARDS */}
      {isMobile ? (
        <Stack spacing={2}>
          {logs.map((log) => {
            const status = getStatusChipProps(log.status, t);
            const direction = getDirectionChipProps(log.direction, t);

            return (
              <Card key={log._id} variant="outlined">
                <CardContent>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Chip size="small" {...direction} />
                      <Chip size="small" {...status} />
                    </Stack>

                    <Typography
                      variant="body2"
                      sx={{ wordBreak: "break-word" }}
                    >
                      {log.body || "—"}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      {log.to} • {formatDateTimeWithLocale(log.createdAt)}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t.direction}</TableCell>
                <TableCell>{t.phone}</TableCell>
                <TableCell>{t.status}</TableCell>
                <TableCell>{t.message}</TableCell>
                <TableCell>{t.time}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => {
                const status = getStatusChipProps(log.status, t);
                const direction = getDirectionChipProps(log.direction, t);

                return (
                  <TableRow key={log._id}>
                    <TableCell>
                      <Chip size="small" {...direction} />
                    </TableCell>
                    <TableCell>{log.to}</TableCell>
                    <TableCell>
                      <Chip size="small" {...status} />
                    </TableCell>
                    <TableCell
                      sx={{
                        maxWidth: 320,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {log.body || "—"}
                    </TableCell>
                    <TableCell>
                      {formatDateTimeWithLocale(log.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* PAGINATION */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Pagination
          dir="ltr"
          page={page}
          count={Math.max(1, Math.ceil(total / limit))}
          onChange={(_, v) => setPage(v)}
        />
      </Box>
    </Container>
  );
}
