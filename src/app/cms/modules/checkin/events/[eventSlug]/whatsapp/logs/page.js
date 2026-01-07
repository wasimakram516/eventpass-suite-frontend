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
  TextField,
} from "@mui/material";
import { useParams } from "next/navigation";

import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";

import { getCheckInEventBySlug } from "@/services/checkin/checkinEventService";
import { getWhatsAppLogs } from "@/services/notifications/whatsAppLogsService";
import useCheckInSocket from "@/hooks/modules/checkin/useCheckInSocket";
import { formatDateTimeWithLocale } from "@/utils/dateUtils";

const translations = {
  en: {
    title: "WhatsApp Logs",
    description:
      "View WhatsApp delivery status and inbound messages for this event.",
    status: "Status",
    direction: "Direction",
    phone: "Phone",
    token: "Token",
    message: "Message",
    createdAt: "Time",
    outbound: "Outbound",
    inbound: "Inbound",
    all: "All",
    recordsPerPage: "Rows",
  },
  ar: {
    title: "سجلات واتساب",
    description:
      "عرض حالة رسائل واتساب والرسائل الواردة لهذا الحدث.",
    status: "الحالة",
    direction: "الاتجاه",
    phone: "الهاتف",
    token: "الرمز",
    message: "الرسالة",
    createdAt: "الوقت",
    outbound: "صادر",
    inbound: "وارد",
    all: "الكل",
    recordsPerPage: "عدد الصفوف",
  },
};

export default function WhatsAppLogsPage() {
  const { eventSlug } = useParams();
  const { t, dir } = useI18nLayout(translations);

  const [event, setEvent] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState({
    status: "all",
    direction: "all",
    to: "",
    token: "",
  });

  /* ======================
     INITIAL LOAD
  ====================== */
  const fetchLogs = async () => {
    if (!event?._id) return;

    setLoading(true);

    const res = await getWhatsAppLogs({
      eventId: event._id,
      page,
      limit,
      ...(filters.status !== "all" && { status: filters.status }),
      ...(filters.direction !== "all" && { direction: filters.direction }),
      ...(filters.to && { to: filters.to }),
      ...(filters.token && { token: filters.token }),
    });

    if (!res?.error) {
      setLogs(res.data || []);
      setTotal(res.total || 0);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!eventSlug) return;

    (async () => {
      const ev = await getCheckInEventBySlug(eventSlug);
      if (!ev?.error) setEvent(ev);
    })();
  }, [eventSlug]);

  useEffect(() => {
    fetchLogs();
  }, [event?._id, page, limit, filters]);

  /* ======================
     SOCKET UPDATES
  ====================== */
  const handleWhatsAppUpdate = useCallback((payload) => {
    setLogs((prev) =>
      prev.map((l) =>
        l._id === payload.logId ? { ...l, ...payload } : l
      )
    );
  }, []);

  const handleInboundMessage = useCallback((payload) => {
    setLogs((prev) => [payload, ...prev]);
    setTotal((t) => t + 1);
  }, []);

  useCheckInSocket({
    eventId: event?._id,
    onWhatsAppStatusUpdate: handleWhatsAppUpdate,
    onWhatsAppInboundMessage: handleInboundMessage,
  });

  if (loading && !logs.length) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container dir={dir} maxWidth="lg">
      <BreadcrumbsNav />

      <Stack spacing={1} mb={3}>
        <Typography variant="h5" fontWeight="bold">
          {t.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t.description}
        </Typography>
      </Stack>

      {/* Filters */}
      <Stack direction="row" spacing={2} mb={2} flexWrap="wrap">
        <FormControl size="small">
          <Select
            value={filters.direction}
            onChange={(e) =>
              setFilters((f) => ({ ...f, direction: e.target.value }))
            }
          >
            <MenuItem value="all">{t.all}</MenuItem>
            <MenuItem value="outbound">{t.outbound}</MenuItem>
            <MenuItem value="inbound">{t.inbound}</MenuItem>
          </Select>
        </FormControl>

        <TextField
          size="small"
          placeholder={t.phone}
          value={filters.to}
          onChange={(e) =>
            setFilters((f) => ({ ...f, to: e.target.value }))
          }
        />

        <TextField
          size="small"
          placeholder={t.token}
          value={filters.token}
          onChange={(e) =>
            setFilters((f) => ({ ...f, token: e.target.value }))
          }
        />
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {/* Logs Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t.direction}</TableCell>
              <TableCell>{t.phone}</TableCell>
              <TableCell>{t.status}</TableCell>
              <TableCell>{t.message}</TableCell>
              <TableCell>{t.createdAt}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log._id}>
                <TableCell>
                  <Chip
                    size="small"
                    icon={
                      log.direction === "inbound" ? (
                        <ICONS.chat />
                      ) : (
                        <ICONS.send />
                      )
                    }
                    label={
                      log.direction === "inbound"
                        ? t.inbound
                        : t.outbound
                    }
                  />
                </TableCell>
                <TableCell>{log.to}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    color={
                      ["sent", "delivered", "read"].includes(log.status)
                        ? "success"
                        : log.status === "failed"
                        ? "error"
                        : "warning"
                    }
                    label={log.status}
                  />
                </TableCell>
                <TableCell
                  sx={{
                    maxWidth: 280,
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
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {total > limit && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            dir="ltr"
            page={page}
            count={Math.ceil(total / limit)}
            onChange={(_, v) => setPage(v)}
          />
        </Box>
      )}
    </Container>
  );
}
