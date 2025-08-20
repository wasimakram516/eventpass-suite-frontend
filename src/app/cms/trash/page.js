"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardActions,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
  Container,
  CircularProgress,
  Stack,
  TextField,
  MenuItem,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  Button,
} from "@mui/material";

import BreadcrumbsNav from "@/components/BreadcrumbsNav";
import {
  getTrash,
  restoreTrashItem,
  permanentDeleteTrashItem,
} from "@/services/trashService";
import { getAllUsers, getAllStaffUsers } from "@/services/userService";
import { useAuth } from "@/contexts/AuthContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import NoDataAvailable from "@/components/NoDataAvailable";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { wrapTextBox } from "@/utils/wrapTextStyles";
import { formatDateTimeWithLocale } from "@/utils/dateUtils";
import FilterModal from "@/components/FilterModal";

const translations = {
  en: {
    title: "Recycle Bin",
    subtitle: "View, restore or permanently delete trashed items.",
    restore: "Restore",
    permanentDelete: "Delete Permanently",
    confirmDeleteTitle: "Confirm Permanent Delete",
    confirmDeleteMessage: (name) =>
      `Are you sure you want to permanently delete ${name}? This action cannot be undone.`,
    confirmDeleteButton: "Delete",
    confirmRestoreTitle: "Confirm Restore",
    confirmRestoreMessage: (name) => `Do you want to restore ${name}?`,
    confirmRestoreButton: "Restore",
    noTrash: "No trashed items found.",
    searchPlaceholder: "Search…",
    deletedByLabel: "Deleted By",
    moduleLabel: "Module",
    dateFrom: "From Date",
    dateTo: "To Date",
    all: "All",
    deletedBy: "Deleted by",
    showing: "Showing",
    to: "to",
    of: "of",
    records: "records",
    recordsPerPage: "Records per page",
    filters: "Filters",
  },
  ar: {
    title: "سلة المحذوفات",
    subtitle: "عرض أو استعادة أو حذف العناصر المحذوفة نهائيًا.",
    restore: "استعادة",
    permanentDelete: "حذف نهائي",
    confirmDeleteTitle: "تأكيد الحذف النهائي",
    confirmDeleteMessage: (name) =>
      `هل أنت متأكد أنك تريد حذف ${name} نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.`,
    confirmDeleteButton: "حذف",
    confirmRestoreTitle: "تأكيد الاستعادة",
    confirmRestoreMessage: (name) => `هل تريد استعادة ${name}؟`,
    confirmRestoreButton: "استعادة",
    noTrash: "لم يتم العثور على عناصر محذوفة.",
    searchPlaceholder: "ابحث…",
    deletedByLabel: "تم الحذف بواسطة",
    moduleLabel: "الوحدة",
    dateFrom: "من التاريخ",
    dateTo: "إلى التاريخ",
    all: "الكل",
    deletedBy: "تم الحذف بواسطة",
    showing: "عرض",
    to: "إلى",
    of: "من",
    records: "سجلات",
    recordsPerPage: "عدد السجلات في الصفحة",
    filters: "عوامل التصفية",
  },
};

export default function TrashPage() {
  const { dir, align, t } = useI18nLayout(translations);
  const { user: currentUser } = useAuth();
  const isBusiness = currentUser?.role === "business";

  const [loading, setLoading] = useState(false);
  const [trashData, setTrashData] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [restoreConfirm, setRestoreConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // pagination state PER MODULE
  const [pageState, setPageState] = useState({});
  const [limit, setLimit] = useState(5);

  // Users map
  const [userMap, setUserMap] = useState({});

  // Filters
  const [search, setSearch] = useState("");
  const [deletedByFilter, setDeletedByFilter] = useState("__ALL__");
  const [moduleFilter, setModuleFilter] = useState("__ALL__");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    hydrateUsersMap();
  }, []);

  useEffect(() => {
    fetchTrash();
  }, [limit, deletedByFilter, moduleFilter, dateFrom, dateTo, pageState]);

  const hydrateUsersMap = async () => {
    try {
      let users = [];
      if (isBusiness) {
        users = await getAllStaffUsers(currentUser?.business?._id);
      } else {
        users = await getAllUsers();
      }
      const map = {};
      users.forEach((u) => {
        map[u._id] = u.name || u.fullName || u.email || u._id;
      });
      setUserMap(map);
    } catch {}
  };

  const fetchTrash = async () => {
    setLoading(true);
    const params = { limit };
    if (deletedByFilter !== "__ALL__") params.deletedBy = deletedByFilter;
    if (moduleFilter !== "__ALL__") params.model = moduleFilter;
    if (dateFrom) params.startDate = dateFrom;
    if (dateTo) params.endDate = dateTo;

    const res = await getTrash(params);
    setTrashData(res);
    setLoading(false);
  };

  const deletedByOptions = useMemo(() => {
    const ids = new Set();
    Object.values(trashData).forEach(({ items = [] }) => {
      items.forEach((it) => {
        const db = it.deletedBy;
        if (typeof db === "string") ids.add(db);
        else if (db && db._id) ids.add(db._id);
      });
    });
    return ["__ALL__", ...Array.from(ids)];
  }, [trashData]);

  const labelForDeletedBy = (val) => {
    if (!val) return "-";
    if (typeof val === "string") return userMap[val] || val;
    return val.fullName || val.name || val.email || val._id || "-";
  };

  const matchesSearch = (item) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const text = (item.name || item.title || item.slug || "").toLowerCase();
    return text.includes(q);
  };

  const openRestoreConfirm = (module, item) => {
    setPendingAction({ type: "restore", module, item });
    setRestoreConfirm(true);
  };

  const openDeleteConfirm = (module, item) => {
    setPendingAction({ type: "delete", module, item });
    setDeleteConfirm(true);
  };

  const handleRestore = async () => {
    if (!pendingAction) return;
    setLoading(true);
    await restoreTrashItem(pendingAction.module, pendingAction.item._id);
    await fetchTrash();
    setRestoreConfirm(false);
    setPendingAction(null);
    setLoading(false);
  };

  const handlePermanentDelete = async () => {
    if (!pendingAction) return;
    setLoading(true);
    await permanentDeleteTrashItem(pendingAction.module, pendingAction.item._id);
    await fetchTrash();
    setDeleteConfirm(false);
    setPendingAction(null);
    setLoading(false);
  };

  const handlePageChange = (module, value) => {
    setPageState((prev) => ({ ...prev, [module]: value }));
  };

  return (
    <Container dir={dir}>
      <BreadcrumbsNav />
      <Stack direction="row" justifyContent="space-between" mb={2}>
        <Box>
          <Typography variant="h4" fontWeight="bold" textAlign={align}>
            {t.title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            mt={0.5}
            textAlign={align}
          >
            {t.subtitle}
          </Typography>
        </Box>
        
      </Stack>
      <Divider sx={{ mb: 2 }} />

      {/* Filters inline (search + records/page only) */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder={t.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <ICONS.search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          startIcon={<ICONS.filter />}
          sx={{ display: { xs: "flex", sm: "none" } }}
          onClick={() => setFilterOpen(true)}
        >
          {t.filters}
        </Button>
        <TextField
            select
            label={t.deletedByLabel}
            fullWidth
            value={deletedByFilter}
            onChange={(e) => setDeletedByFilter(e.target.value)}
            sx={{ display: { xs: "none", sm: "flex" } }}
          >
            <MenuItem value="__ALL__">{t.all}</MenuItem>
            {deletedByOptions.map((id) =>
              id === "__ALL__" ? null : (
                <MenuItem key={id} value={id}>
                  {userMap[id] || id}
                </MenuItem>
              )
            )}
          </TextField>

          <TextField
            select
            fullWidth
            label={t.moduleLabel}
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
             sx={{ display: { xs: "none", sm: "flex" } }}
          >
            <MenuItem value="__ALL__">{t.all}</MenuItem>
            {Object.keys(trashData).map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label={t.dateFrom}
            fullWidth
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
             sx={{ display: { xs: "none", sm: "flex" } }}
          />
          <TextField
            label={t.dateTo}
            fullWidth
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
             sx={{ display: { xs: "none", sm: "flex" } }}
          />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>{t.recordsPerPage}</InputLabel>
          <Select
            value={limit}
            size="large"
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPageState({});
            }}
          >
            {[5, 10, 20, 50].map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress size={36} />
        </Box>
      ) : Object.keys(trashData).length === 0 ? (
        <NoDataAvailable message={t.noTrash} />
      ) : (
        Object.entries(trashData).map(([module, { items = [], total = 0 }]) => {
          const page = pageState[module] || 1;
          const filtered = items.filter(matchesSearch);
          if (!filtered.length) return null;
          return (
            <Box key={module} sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {module} ({total})
              </Typography>
              <Grid container spacing={3}>
                {filtered.map((item) => (
                  <Grid item xs={12} sm={6} md={4} key={item._id}>
                    <Card
                      elevation={3}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", gap: 2, alignItems: "center" }}
                      >
                        <Avatar sx={{ width: 48, height: 48 }}>
                          {item.name?.[0] || item.title?.[0] || "?"}
                        </Avatar>
                        <Box sx={{ flexGrow: 1, ...wrapTextBox }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {item.name || item.title || item.slug || "Unnamed"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {`Deleted: ${
                              item.deletedAt
                                ? formatDateTimeWithLocale(item.deletedAt)
                                : "-"
                            } • ${t.deletedBy}: ${labelForDeletedBy(
                              item.deletedBy
                            )}`}
                          </Typography>
                        </Box>
                      </Box>
                      <CardActions sx={{ mt: 1, justifyContent: "flex-end" }}>
                        <Tooltip title={t.restore}>
                          <IconButton
                            color="primary"
                            onClick={() => openRestoreConfirm(module, item)}
                            size="small"
                          >
                            <ICONS.restore fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t.permanentDelete}>
                          <IconButton
                            color="error"
                            onClick={() => openDeleteConfirm(module, item)}
                            size="small"
                          >
                            <ICONS.delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {total > limit && (
                <Box display="flex" justifyContent="center" mt={3}>
                  <Pagination
                    dir="ltr"
                    count={Math.ceil(total / limit)}
                    page={page}
                    onChange={(e, val) => handlePageChange(module, val)}
                  />
                </Box>
              )}
            </Box>
          );
        })
      )}

      {/* Filter Modal for mobile */}
      <FilterModal open={filterOpen} onClose={() => setFilterOpen(false)}>
        <Stack spacing={2}>
          <TextField
            select
            label={t.deletedByLabel}
            value={deletedByFilter}
            onChange={(e) => setDeletedByFilter(e.target.value)}
          >
            <MenuItem value="__ALL__">{t.all}</MenuItem>
            {deletedByOptions.map((id) =>
              id === "__ALL__" ? null : (
                <MenuItem key={id} value={id}>
                  {userMap[id] || id}
                </MenuItem>
              )
            )}
          </TextField>

          <TextField
            select
            label={t.moduleLabel}
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
          >
            <MenuItem value="__ALL__">{t.all}</MenuItem>
            {Object.keys(trashData).map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label={t.dateFrom}
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label={t.dateTo}
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      </FilterModal>

      <ConfirmationDialog
        open={restoreConfirm}
        onClose={() => setRestoreConfirm(false)}
        onConfirm={handleRestore}
        title={t.confirmRestoreTitle}
        message={t.confirmRestoreMessage(
          pendingAction?.item?.name || pendingAction?.item?.title
        )}
        confirmButtonText={t.confirmRestoreButton}
        confirmButtonIcon={<ICONS.restore />}
      />
      <ConfirmationDialog
        open={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handlePermanentDelete}
        title={t.confirmDeleteTitle}
        message={t.confirmDeleteMessage(
          pendingAction?.item?.name || pendingAction?.item?.title
        )}
        confirmButtonText={t.confirmDeleteButton}
        confirmButtonIcon={<ICONS.delete />}
      />
    </Container>
  );
}
