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
  ListItemText,
  Chip,
  Divider,
  Card,
  CardContent,
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
  },
  ar: {
    title: "سجل الأنشطة",
    subtitle: "عرض أنشطة الإنشاء والتحديث والحذف وتسجيل الدخول عبر الوحدات.",
    searchHint: "تلميح: ابحث حسب المستخدم أو المؤسسة أو اسم العنصر أو الوحدة لتضييق النتائج.",
    searchPlaceholder: "بحث…",
    noLogs: "لا توجد سجلات لآخر 7 أيام.",
    searchNoResults: "لا توجد سجلات تطابق البحث.",
  },
};

export default function LogsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { dir, align, language, t } = useI18nLayout(translations);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    if (user && user.role !== "superadmin") {
      router.replace("/cms");
    }
  }, [user, router]);

  const [allLogs, setAllLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const { latestLogs, clearLatestLogs } = useLogsSocket();

  const pageSize = 10;
  const fetchPageSize = 200;

  const sevenDaysAgoIso = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString();
  }, []);

  // Load all logs (paginated fetches) so search can filter across everything
  useEffect(() => {
    let mounted = true;

    const fetchAllLogs = async () => {
      setLoading(true);
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

          if (!mounted || res?.error) break;

          const list = res?.logs || [];
          combined.push(...list);

          const total = res?.total ?? 0;
          const fetched = combined.length;
          hasMore = list.length === fetchPageSize && fetched < total;
          pageNum += 1;
        }

        if (mounted) setAllLogs(combined);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAllLogs();

    return () => {
      mounted = false;
    };
  }, [sevenDaysAgoIso]);

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

  const totalFilteredPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = useMemo(
    () =>
      filteredLogs.slice((page - 1) * pageSize, page * pageSize),
    [filteredLogs, page, pageSize]
  );

  const handleChangePage = (_e, value) => {
    setPage(value);
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  const renderCreatedAt = (date) =>
    date ? formatDateTimeWithLocale(date, language === "ar" ? "ar-SA" : "en-GB") : "-";

  const formatLogType = (logType) =>
    logType ? logType.charAt(0).toUpperCase() + logType.slice(1).toLowerCase() : "-";

  const renderRowDesktop = (log) => {
    const userName = log.userId?.name || "-";
    const businessName = log.businessId?.name || "-";
    const itemName = log.itemName || log.itemId || "-";

    return (
      <TableRow
        key={log._id}
        sx={{
          "&:hover": { bgcolor: "action.hover" },
          "&:last-child td": { border: 0 },
        }}
      >
        <TableCell sx={{ py: 1.5 }}>{userName}</TableCell>
        <TableCell sx={{ py: 1.5 }}>
          <Chip label={formatLogType(log.logType)} size="small" variant="outlined" />
        </TableCell>
        <TableCell sx={{ py: 1.5 }}>{log.itemType || "-"}</TableCell>
        <TableCell sx={{ py: 1.5 }}>{itemName}</TableCell>
        <TableCell sx={{ py: 1.5 }}>{businessName}</TableCell>
        <TableCell sx={{ py: 1.5 }}>{log.module || "-"}</TableCell>
        <TableCell sx={{ py: 1.5 }}>{renderCreatedAt(log.createdAt)}</TableCell>
        <TableCell sx={{ py: 1.5 }}>{renderCreatedAt(log.updatedAt)}</TableCell>
      </TableRow>
    );
  };

  const renderRowMobile = (log) => {
    const userName = log.userId?.name || "-";
    const businessName = log.businessId?.name || "-";
    const itemName = log.itemName || log.itemId || "-";
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
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
              <Typography variant="subtitle2" fontWeight="600">
                {userName}
              </Typography>
              <Chip label={formatLogType(log.logType)} size="small" color="primary" variant="outlined" />
            </Stack>
            <Stack spacing={0.75} sx={{ mt: 1.5 }}>
              <Typography variant="body2" color="text.secondary">
                <Box component="span" sx={{ fontWeight: 600, color: "text.primary", mr: 0.5 }}>
                  Item type:
                </Box>
                {itemType}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <Box component="span" sx={{ fontWeight: 600, color: "text.primary", mr: 0.5 }}>
                  Item name:
                </Box>
                {itemName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <Box component="span" sx={{ fontWeight: 600, color: "text.primary", mr: 0.5 }}>
                  Business:
                </Box>
                {businessName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <Box component="span" sx={{ fontWeight: 600, color: "text.primary", mr: 0.5 }}>
                  Module:
                </Box>
                {moduleName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <Box component="span" sx={{ fontWeight: 600, color: "text.primary", mr: 0.5 }}>
                  Created at:
                </Box>
                {renderCreatedAt(log.createdAt)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <Box component="span" sx={{ fontWeight: 600, color: "text.primary", mr: 0.5 }}>
                  Updated at:
                </Box>
                {renderCreatedAt(log.updatedAt)}
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
    <Box dir={dir} sx={{ bgcolor: "background.default", minHeight: "100vh", py: 4 }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 3 } }}>
        <BreadcrumbsNav />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "flex-start" }}
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
          <Box
            sx={{
              width: { xs: "100%", sm: "auto" },
              maxWidth: { sm: 360, md: 420 },
              flexShrink: 0,
            }}
          >
            <TextField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              size="small"
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
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
          </Box>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {filteredLogs.length === 0 && !loading ? (
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
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: "action.hover", py: 1.5 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: "action.hover", py: 1.5 }}>Log Type</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: "action.hover", py: 1.5 }}>Item Type</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: "action.hover", py: 1.5 }}>Item Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: "action.hover", py: 1.5 }}>Business</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: "action.hover", py: 1.5 }}>Module</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: "action.hover", py: 1.5 }}>Created At</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: "action.hover", py: 1.5 }}>Updated At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>{paginatedLogs.map((log) => renderRowDesktop(log))}</TableBody>
            </Table>
          </TableContainer>
        )}

        <Stack direction="row" justifyContent="center" alignItems="center" sx={{ mt: 3 }}>
          <Pagination
            count={totalFilteredPages}
            page={Math.min(page, totalFilteredPages)}
            onChange={handleChangePage}
            shape="rounded"
            color="primary"
            showFirstButton
            showLastButton
          />
        </Stack>
      </Container>
    </Box>
  );
}

