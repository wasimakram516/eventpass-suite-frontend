"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  Stack,
  useMediaQuery,
  useTheme,
  List,
  ListItem,
  Chip,
  Divider,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import ICONS from "@/utils/iconUtil";
import { useAuth } from "@/contexts/AuthContext";
import { getLogs } from "@/services/logService";
import useI18nLayout from "@/hooks/useI18nLayout";
import { formatDateTimeWithLocale } from "@/utils/dateUtils";
import useLogsSocket from "@/hooks/useLogsSocket";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";

const translations = {
  en: {
    title: "Activity Logs",
    subtitle: "View recent create, update, delete and login activity across modules.",
    searchHint: "Tip: Search by user, business, item name or module to narrow results.",
    searchPlaceholder: "Search…",
    noLogs: "No logs found for the last 7 days.",
    searchNoResults: "No logs match your search.",
    loadError: "Unable to load logs right now. Please check backend database connection.",
    recordsPerPage: "Records per page",
    showing: "Showing",
    of: "of",
    records: "records",
  },
  ar: {
    title: "سجل الأنشطة",
    subtitle: "عرض أنشطة الإنشاء والتحديث والحذف وتسجيل الدخول عبر الوحدات.",
    searchHint: "تلميح: ابحث حسب المستخدم أو المؤسسة أو اسم العنصر أو الوحدة لتضييق النتائج.",
    searchPlaceholder: "بحث…",
    noLogs: "لا توجد سجلات لآخر 7 أيام.",
    searchNoResults: "لا توجد سجلات تطابق البحث.",
    loadError: "تعذر تحميل السجلات الآن. يرجى التحقق من اتصال قاعدة البيانات في الخلفية.",
    recordsPerPage: "عدد السجلات لكل صفحة",
    showing: "عرض",
    of: "من",
    records: "سجلات",
  },
};

export default function LogsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { dir, align, language, t } = useI18nLayout(translations);
  const labels =
    language === "ar"
      ? {
          user: "المستخدم",
          logType: "نوع السجل",
          itemType: "نوع العنصر",
          itemName: "اسم العنصر",
          business: "الشركة",
          module: "الوحدة",
          time: "الوقت",
        }
      : {
          user: "User",
          logType: "Log Type",
          itemType: "Item Type",
          itemName: "Item Name",
          business: "Business",
          module: "Module",
          time: "Time",
        };
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    if (user && user.role !== "superadmin") {
      router.replace("/cms");
    }
  }, [user, router]);

  const [allLogs, setAllLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const { latestLogs, clearLatestLogs } = useLogsSocket();

  const fetchPageSize = 200;

  const sevenDaysAgoIso = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString();
  }, []);

  // Load all logs (paginated fetches) so search can filter across everything
  useEffect(() => {
    if (!user || user.role !== "superadmin") return;

    let mounted = true;

    const fetchAllLogs = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const combined = [];
        let pageNum = 1;
        let hasMore = true;

        while (hasMore && mounted) {
          const res = await getLogs({
            page: pageNum,
            limit: fetchPageSize,
            from: sevenDaysAgoIso,
          });

          if (!mounted) break;
          if (res?.error) {
            setLoadError(res?.message || t.loadError);
            break;
          }

          const list = res?.logs || [];
          combined.push(...list);

          const total = res?.total ?? 0;
          const fetched = combined.length;
          hasMore = list.length === fetchPageSize && fetched < total;
          pageNum += 1;
        }

        if (mounted) setAllLogs(combined);
      } catch (_err) {
        if (mounted) {
          setAllLogs([]);
          setLoadError(t.loadError);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAllLogs();

    return () => {
      mounted = false;
    };
  }, [sevenDaysAgoIso, user, t]);

  useEffect(() => {
    if (!latestLogs?.length) return;
    setAllLogs((prev) =>
      [...latestLogs, ...prev].filter(
        (log, i, arr) => arr.findIndex((l) => l._id === log._id) === i
      )
    );
    clearLatestLogs();
  }, [latestLogs, clearLatestLogs]);

  const filteredLogs = useMemo(() => {
    if (!search.trim()) return allLogs;
    const term = search.trim().toLowerCase();

    return allLogs.filter((log) => {
      const userName = log.userId?.name || "";
      const businessName = log.businessId?.name || "";
      const itemType = log.itemType || "";
      const module = log.module || "";
      const itemId = log.itemId || "";
      const itemName = log.itemName || "";

      return (
        userName.toLowerCase().includes(term) ||
        businessName.toLowerCase().includes(term) ||
        itemType.toLowerCase().includes(term) ||
        module.toLowerCase().includes(term) ||
        String(itemId).toLowerCase().includes(term) ||
        String(itemName).toLowerCase().includes(term)
      );
    });
  }, [allLogs, search]);

  const totalFilteredPages = Math.max(1, Math.ceil(filteredLogs.length / limit));
  const paginatedLogs = useMemo(
    () =>
      filteredLogs.slice((page - 1) * limit, page * limit),
    [filteredLogs, page, limit]
  );

  const handleChangePage = (_e, value) => {
    setPage(value);
  };

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalFilteredPages) {
      setPage(totalFilteredPages);
    }
  }, [page, totalFilteredPages]);

  const renderCreatedAt = (date) =>
    date ? formatDateTimeWithLocale(date, language === "ar" ? "ar-SA" : "en-GB") : "-";

  const formatLogType = (logType) =>
    logType ? logType.charAt(0).toUpperCase() + logType.slice(1).toLowerCase() : "-";

  const getLogTypeChipProps = (logType) => {
    const type = (logType || "").toLowerCase();
    const base = {
      label: formatLogType(logType),
      size: "small",
      sx: {
        fontWeight: 700,
        minWidth: 86,
        textTransform: "capitalize",
      },
    };

    if (type === "create") return { ...base, color: "success", variant: "outlined" };
    if (type === "update") return { ...base, color: "info", variant: "outlined" };
    if (type === "restore") return { ...base, color: "success", variant: "filled" };
    if (type === "delete") return { ...base, color: "error", variant: "filled" };
    if (type === "login") return { ...base, color: "secondary", variant: "filled" };
    return { ...base, color: "default", variant: "outlined" };
  };

  const getDisplayItemName = (log) => {
    if (log?.itemName) return log.itemName;
    if (log?.itemType === "SurveyRecipient" && log?.itemNameSnapshot) return log.itemNameSnapshot;
    if (log?.itemType === "User") {
      return language === "ar" ? "مستخدم محذوف" : "Deleted user";
    }
    const rawId = String(log?.itemId || "");
    if (/^[a-fA-F0-9]{24}$/.test(rawId)) return "-";
    return rawId || "-";
  };

  const getUserDisplay = (log) => log.userId?.name ?? "—";

  const renderRowDesktop = (log) => {
    const userName = getUserDisplay(log);
    const businessName = log.businessId?.name || "-";
    const itemName = getDisplayItemName(log);

    return (
      <TableRow
        key={log._id}
        sx={{
          "&:hover": { bgcolor: "action.hover" },
          "&:nth-of-type(odd)": { bgcolor: "action.selected" },
          "&:last-child td": { border: 0 },
        }}
      >
        <TableCell sx={{ py: 1.5, textAlign: align }}>{userName}</TableCell>
        <TableCell sx={{ py: 1.5 }}>
          <Chip {...getLogTypeChipProps(log.logType)} />
        </TableCell>
        <TableCell sx={{ py: 1.5, textAlign: align }}>{log.itemType || "-"}</TableCell>
        <TableCell sx={{ py: 1.5, textAlign: align }}>{itemName}</TableCell>
        <TableCell sx={{ py: 1.5, textAlign: align }}>{businessName}</TableCell>
        <TableCell sx={{ py: 1.5, textAlign: align }}>{log.module || "-"}</TableCell>
        <TableCell sx={{ py: 1.5, textAlign: align }}>{renderCreatedAt(log.createdAt)}</TableCell>
      </TableRow>
    );
  };

  const renderRowMobile = (log) => {
    const userName = getUserDisplay(log);
    const businessName = log.businessId?.name || "-";
    const itemName = getDisplayItemName(log);
    const itemType = log.itemType || "-";
    const moduleName = log.module || "-";

    return (
      <ListItem key={log._id} sx={{ px: 0, py: 1.5 }}>
        <Card
          elevation={0}
          sx={{
            width: "100%",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2.5,
            overflow: "hidden",
            boxShadow: "0 6px 18px rgba(15,23,42,0.05)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            "&:hover": {
              transform: "translateY(-1px)",
              boxShadow: "0 10px 24px rgba(15,23,42,0.1)",
            },
          }}
        >
          <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
              <Typography variant="subtitle2" fontWeight="600" textAlign={align}>
                {userName}
              </Typography>
              <Chip {...getLogTypeChipProps(log.logType)} />
            </Stack>
            <Stack spacing={0.75} sx={{ mt: 1.5 }}>
              <Typography variant="body2" color="text.secondary" textAlign={align}>
                <Box component="span" sx={{ fontWeight: 600, color: "text.primary", marginInlineEnd: 0.5 }}>
                  {labels.itemType}:
                </Box>
                {itemType}
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign={align}>
                <Box component="span" sx={{ fontWeight: 600, color: "text.primary", marginInlineEnd: 0.5 }}>
                  {labels.itemName}:
                </Box>
                {itemName}
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign={align}>
                <Box component="span" sx={{ fontWeight: 600, color: "text.primary", marginInlineEnd: 0.5 }}>
                  {labels.business}:
                </Box>
                {businessName}
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign={align}>
                <Box component="span" sx={{ fontWeight: 600, color: "text.primary", marginInlineEnd: 0.5 }}>
                  {labels.module}:
                </Box>
                {moduleName}
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign={align}>
                <Box component="span" sx={{ fontWeight: 600, color: "text.primary", marginInlineEnd: 0.5 }}>
                  {labels.time}:
                </Box>
                {renderCreatedAt(log.createdAt)}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </ListItem>
    );
  };

  if (user && user.role !== "superadmin") {
    return null;
  }

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <Container
        dir={dir}
        maxWidth={false}
        sx={{ maxWidth: "1500px", px: { xs: 2, md: 3 } }}
      >
        <BreadcrumbsNav />

        <Stack
          direction="column"
          justifyContent="flex-start"
          alignItems="stretch"
          gap={2}
          sx={{ mb: 2 }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h4" fontWeight="bold" textAlign={align}>
              {t.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }} textAlign={align}>
              {t.subtitle}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75 }} textAlign={align}>
              {t.searchHint}
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        <Box
          sx={{
            mb: 3,
          }}
        >
          <Box
            display="flex"
            flexDirection={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            gap={2}
          >
            <Typography variant="body2" color="text.secondary" fontWeight={500} textAlign={align}>
              {t.showing} {filteredLogs.length === 0 ? 0 : (page - 1) * limit + 1}-
              {filteredLogs.length === 0 ? 0 : Math.min(page * limit, filteredLogs.length)} {t.of}{" "}
              {filteredLogs.length} {t.records}
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="flex-end"
              width="100%"
            >
              <TextField
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchPlaceholder}
                size="small"
                sx={{
                  width: { xs: "100%", sm: 280, md: 320 },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2.5,
                    bgcolor: "background.paper",
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ICONS.search fontSize="small" sx={{ opacity: 0.7 }} />
                    </InputAdornment>
                  ),
                  endAdornment: search ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearch("")} aria-label="Clear search">
                        <ICONS.clear fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />

              <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 170 } }}>
                <InputLabel>{t.recordsPerPage}</InputLabel>
                <Select
                  value={limit}
                  onChange={handleLimitChange}
                  label={t.recordsPerPage}
                  sx={{ borderRadius: 2.5 }}
                >
                  {[5, 10, 20, 50, 100, 250, 500].map((n) => (
                    <MenuItem key={n} value={n}>
                      {n}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ mt: 6, textAlign: "center" }}>
            <CircularProgress size={24} />
          </Box>
        ) : loadError ? (
          <Box sx={{ mt: 6, textAlign: "center" }}>
            <Typography variant="body1" color="error.main">
              {loadError}
            </Typography>
          </Box>
        ) : filteredLogs.length === 0 ? (
          <Box sx={{ mt: 6, textAlign: "center" }}>
            <Typography variant="body1" color="text.secondary">
              {search.trim() ? t.searchNoResults : t.noLogs}
            </Typography>
          </Box>
        ) : isMobile ? (
          <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {paginatedLogs.map((log) => renderRowMobile(log))}
          </List>
        ) : (
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2.5,
              overflow: "hidden",
              bgcolor: "background.paper",
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "background.default", py: 1.5, textAlign: align }}>{labels.user}</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "background.default", py: 1.5 }}>{labels.logType}</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "background.default", py: 1.5, textAlign: align }}>{labels.itemType}</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "background.default", py: 1.5, textAlign: align }}>{labels.itemName}</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "background.default", py: 1.5, textAlign: align }}>{labels.business}</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "background.default", py: 1.5, textAlign: align }}>{labels.module}</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "background.default", py: 1.5, textAlign: align }}>{labels.time}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>{paginatedLogs.map((log) => renderRowDesktop(log))}</TableBody>
            </Table>
          </TableContainer>
        )}

        {filteredLogs.length > limit && (
          <Box display="flex" justifyContent="center" mt={4}>
            <Pagination
              dir="ltr"
              count={totalFilteredPages}
              page={Math.min(page, totalFilteredPages)}
              onChange={handleChangePage}
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

