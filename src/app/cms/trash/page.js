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
  useMediaQuery,
  useTheme,
} from "@mui/material";

import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import {
  getTrash,
  restoreTrashItem,
  permanentDeleteTrashItem,
  restoreAllTrashItems,
  permanentDeleteAllTrashItems,
} from "@/services/trashService";
import { getAllUsers, getAllStaffUsers } from "@/services/userService";
import { useAuth } from "@/contexts/AuthContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import NoDataAvailable from "@/components/NoDataAvailable";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import { wrapTextBox } from "@/utils/wrapTextStyles";
import { formatDateTimeWithLocale, formatDate } from "@/utils/dateUtils";
import FilterModal from "@/components/modals/FilterModal";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { getModuleCounts } from "@/services/trashService";
import { getModuleIcon } from "@/utils/iconMapper";
import { getModules } from "@/services/moduleService";
import LoadingState from "@/components/LoadingState";
const translations = {
  en: {
    title: "Recycle Bin",
    subtitle: "View, restore or permanently delete trashed items.",
    restore: "Restore",
    delete: "Delete",
    permanentDelete: "Delete Permanently",
    confirmDeleteTitle: "Confirm Permanent Delete",
    confirmDeleteMessage:
      "Are you sure you want to permanently delete this item? This action cannot be undone.",

    deleteMessagePrefix:
      "Are you sure you want to delete this user? This will also delete all their associated businesses and related data, and cannot be undone.",
    deleteStaffMessage:
      "Are you sure you want to delete this user? This will also delete all their related data, and cannot be undone.",
    deleteBusinessMessage:
      "Are you sure you want to delete this business? This will also delete all of its associated data and cannot be undone.",

    confirmDeleteButton: "Delete Permanently",
    confirmRestoreTitle: "Confirm Restore",
    confirmRestoreMessage: "Are you sure you want to restore this item?",
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
    totalItems: "Total Items",
    deletedAt: "Deleted",
    clearFilters: "Clear Filters",
    restoreAll: "Restore All",
    deleteAll: "Delete All",
    confirmBulkRestoreTitle: "Confirm Restore All",

    confirmBulkRestoreMessage:
      "Are you sure you want to restore all items in this module?",
    confirmBulkDeleteTitle: "Confirm Delete All",
    confirmBulkDeleteMessage:
      "Are you sure you want to permanently delete all items in this module? This action cannot be undone.",

    deleteAllPermanently: "Delete Permanently",
    deleteAllMobile: "Delete",
  },
  ar: {
    title: "سلة المحذوفات",
    subtitle: "عرض أو استعادة أو حذف العناصر المحذوفة نهائيًا.",
    restore: "استعادة",
    delete: "حذف",
    permanentDelete: "حذف نهائي",
    confirmDeleteTitle: "تأكيد الحذف النهائي",
    confirmDeleteMessage:
      "هل أنت متأكد أنك تريد حذف هذا العنصر نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.",

    deleteMessagePrefix:
      "هل أنت متأكد أنك تريد حذف هذا المستخدم؟ سيؤدي هذا أيضًا إلى حذف جميع الشركات المرتبطة به والبيانات ذات الصلة، ولا يمكن التراجع عن هذا الإجراء.",
    deleteStaffMessage:
      "هل أنت متأكد أنك تريد حذف هذا المستخدم؟ سيؤدي هذا أيضًا إلى حذف البيانات ذات الصلة، ولا يمكن التراجع عن هذا الإجراء.",
    deleteBusinessMessage:
      "هل أنت متأكد أنك تريد حذف هذا العمل؟ سيؤدي هذا أيضًا إلى حذف جميع البيانات المرتبطة به ولا يمكن التراجع عن هذا الإجراء.",

    confirmDeleteButton: "حذف نهائيًا",
    confirmRestoreTitle: "تأكيد الاستعادة",
    confirmRestoreMessage: "هل أنت متأكد أنك تريد استعادة هذا العنصر؟",
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
    totalItems: "إجمالي العناصر",
    deletedAt: "تم الحذف",
    clearFilters: "مسح المرشحات",
    restoreAll: "استعادة الكل",
    deleteAll: "حذف الكل",
    confirmBulkRestoreTitle: "تأكيد استعادة الكل",

    confirmBulkRestoreMessage:
      "هل أنت متأكد أنك تريد استعادة جميع العناصر في هذه الوحدة؟",
    confirmBulkDeleteTitle: "تأكيد حذف الكل",
    confirmBulkDeleteMessage:
      "هل أنت متأكد أنك تريد حذف جميع العناصر في هذه الوحدة نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.",

    deleteAllPermanently: "حذف نهائيًا",
    deleteAllMobile: "حذف",
  },
};

export default function TrashPage() {
  const { dir, align, t } = useI18nLayout(translations);
  const { user: currentUser } = useAuth();
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const isBusiness = currentUser?.role === "business";
  const [loading, setLoading] = useState(true);
  const [trashData, setTrashData] = useState({});
  const [moduleCounts, setModuleCounts] = useState({});
  const [allAvailableModules, setAllAvailableModules] = useState([]);
  const [moduleData, setModuleData] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [restoreConfirm, setRestoreConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkRestoreConfirm, setBulkRestoreConfirm] = useState(false);
  const [pendingBulkAction, setPendingBulkAction] = useState(null);
  const [allDeletedByIds, setAllDeletedByIds] = useState(new Set());
  const [userMap, setUserMap] = useState({});

  // pagination state PER MODULE
  const [pageState, setPageState] = useState({});
  const [limit, setLimit] = useState(5);

  // Filters
  const [search, setSearch] = useState("");
  const [deletedByFilter, setDeletedByFilter] = useState("__ALL__");
  const [moduleFilter, setModuleFilter] = useState("__ALL__");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  //Effect to update available modules whenever trashData changes
  useEffect(() => {
    if (trashData) {
      const newIds = new Set(allDeletedByIds);
      Object.values(trashData).forEach((moduleData) => {
        if (moduleData && moduleData.items && Array.isArray(moduleData.items)) {
          moduleData.items.forEach((it) => {
            const db = it.deletedBy;
            if (typeof db === "string") newIds.add(db);
            else if (db && db._id) newIds.add(db._id);
          });
        }
      });
      setAllDeletedByIds(newIds);
    }
  }, [trashData]);

  // Handle page change for a specific module
  useEffect(() => {
    const initializeData = async () => {
      await hydrateUsersMap();
      await fetchAllModules();
      await fetchModuleCounts();
      await fetchModuleData();
    };
    initializeData();
  }, []);

  // Fetch trash data when filters, pagination, or limit change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTrash(moduleFilter);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [limit, deletedByFilter, moduleFilter, dateFrom, dateTo, pageState]);

  const safeFormatDate = (val) => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d) ? null : formatDate(val);
  };

  // Clear filters
  const handleClearAllFilters = () => {
    setSearch("");
    setDeletedByFilter("__ALL__");
    setDateFrom("");
    setDateTo("");
    setLimit(5);
    setPageState({});
  };

  // handler for module name based on key
  const getModuleDisplayName = (moduleKey) => {
    const moduleNames = {
      "registration-eventreg": "Registration (EventReg)",
      "registration-checkin": "Registration (CheckIn)",
      "event-eventreg": "Event (EventReg)",
      "event-checkin": "Event (CheckIn)",
      "game-quiznest": "Game (QuizNest)",
      "game-eventduel": "Game (EventDuel)",
      "gamesession-quiznest": "Game Session (QuizNest)",
      "gamesession-eventduel": "Game Session (EventDuel)",
      qnquestion: "Questions (QuizNest)",
      pvpquestion: "Questions (EventDuel)",
      user: "User",
      business: "Business",
      poll: "Poll",
      spinwheel: "SpinWheel",
      spinwheelparticipant: "SpinWheel Participant",
      displaymedia: "Display Media",
      wallconfig: "Wall Config",
      globalconfig: "Global Config",
      surveyform: "Survey Form",
      walkin: "Walk-In",
    };
    return (
      moduleNames[moduleKey] ||
      moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1)
    );
  };

  const getLabelForDeletedBy = (val) => {
    if (!val) return "-";
    if (typeof val === "string") return userMap[val] || val;
    return val.fullName || val.name || val.email || val._id || "-";
  };

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

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPageState({}); // reset pagination when limit changes
  };

  const fetchModuleData = async () => {
    try {
      const role = currentUser?.role || "staff";
      const modulesPayload = await getModules(role);
      const serverModules = Array.isArray(modulesPayload) ? modulesPayload : [];
      setModuleData(serverModules);
    } catch (error) {
      console.error("Error fetching module data:", error);
    }
  };

  const fetchTrash = async (targetModule = moduleFilter) => {
    setLoading(true);
    try {
      if (!targetModule || targetModule === "__ALL__") {
        const res = await getTrash({ limit, page: 1 });
        setTrashData(res.items || {});
      } else {
        const res = await getTrash({
          model: targetModule,
          limit,
          page: pageState[targetModule] || 1,
          ...(deletedByFilter !== "__ALL__" && { deletedBy: deletedByFilter }),
          ...(dateFrom && { startDate: dateFrom }),
          ...(dateTo && { endDate: dateTo }),
        });
        setTrashData(res.items || {});
      }
    } catch (err) {
      setTrashData({});
    } finally {
      setLoading(false);
    }
  };

  const updateAvailableModules = async () => {
    try {
      const res = await getTrash({ limit: 1000 });
      const modules = Object.keys(res.items || res);

      const modulesWithItems = modules.filter((module) => {
        const moduleData = res.items?.[module] || res[module];
        return (
          moduleData &&
          moduleData.items &&
          Array.isArray(moduleData.items) &&
          moduleData.items.length > 0
        );
      });

      setAllAvailableModules(modulesWithItems);

      if (
        moduleFilter !== "__ALL__" &&
        !modulesWithItems.includes(moduleFilter)
      ) {
        setModuleFilter("__ALL__");
      }
    } catch (error) {
      console.error("Error updating available modules:", error);
    }
  };

  const fetchModuleCounts = async () => {
    try {
      const counts = await getModuleCounts();
      setModuleCounts(counts);
    } catch (error) {
      console.error("Error fetching module counts:", error);
    }
  };

  const fetchAllModules = async () => {
    try {
      const res = await getModuleCounts(); // ✅ use counts API
      const modules = Object.keys(res || {}).filter((m) => res[m] > 0);

      setAllAvailableModules(modules);

      // Auto-select first module if none selected
      if (modules.length > 0 && moduleFilter === "__ALL__") {
        setModuleFilter(modules[0]);
      }
    } catch (err) {
      console.error("Error fetching modules:", err);
    }
  };

  const openRestoreConfirm = (module, item) => {
    setPendingAction({ type: "restore", module, frontendModule: module, item });

    setRestoreConfirm(true);
  };

  const openDeleteConfirm = (module, item) => {
    setPendingAction({ type: "delete", module, frontendModule: module, item });

    setDeleteConfirm(true);
  };

  const handleRestore = async () => {
    if (!pendingAction) return;
    setLoading(true);

    try {
      await restoreTrashItem(pendingAction.module, pendingAction.item._id);
      await fetchTrash();
      await fetchModuleCounts();
      await updateAvailableModules();
    } catch (err) {
      console.error("Error restoring item:", err);
    } finally {
      setRestoreConfirm(false);
      setPendingAction(null);
      setLoading(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!pendingAction) return;
    setLoading(true);

    try {
      await permanentDeleteTrashItem(
        pendingAction.module,
        pendingAction.item._id
      );
      await fetchTrash();
      await fetchModuleCounts();
      await updateAvailableModules();
    } catch (err) {
      console.error("Error permanently deleting item:", err);
    } finally {
      setDeleteConfirm(false);
      setPendingAction(null);
      setLoading(false);
    }
  };
  // Handle bulk operations
  const openBulkRestoreConfirm = (module) => {
    const filterParams = {
      ...(deletedByFilter !== "__ALL__" && { deletedBy: deletedByFilter }),
      ...(dateFrom && { startDate: dateFrom }),
      ...(dateTo && { endDate: dateTo }),
    };
    setPendingBulkAction({
      type: "restore",
      module,
      frontendModule: module,
      filterParams,
    });

    setBulkRestoreConfirm(true);
  };

  const openBulkDeleteConfirm = (module) => {
    const filterParams = {
      ...(deletedByFilter !== "__ALL__" && { deletedBy: deletedByFilter }),
      ...(dateFrom && { startDate: dateFrom }),
      ...(dateTo && { endDate: dateTo }),
    };
    setPendingBulkAction({
      type: "delete",
      module,
      frontendModule: module,
      filterParams,
    });

    setBulkDeleteConfirm(true);
  };

  const handleBulkRestore = async () => {
    if (!pendingBulkAction) return;
    setLoading(true);
    try {
      await restoreAllTrashItems(
        pendingBulkAction.frontendModule,
        pendingBulkAction.filterParams
      );
      await fetchTrash();
      await fetchModuleCounts();
      await updateAvailableModules();
    } catch (error) {
      console.error("Error in bulk restore:", error);
    } finally {
      setBulkRestoreConfirm(false);
      setPendingBulkAction(null);
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!pendingBulkAction) return;
    setLoading(true);
    try {
      await permanentDeleteAllTrashItems(
        pendingBulkAction.frontendModule,
        pendingBulkAction.filterParams
      );
      await fetchTrash();
      await fetchModuleCounts();
      await updateAvailableModules();
    } catch (error) {
      console.error("Error in bulk delete:", error);
    } finally {
      setBulkDeleteConfirm(false);
      setPendingBulkAction(null);
      setLoading(false);
    }
  };

  const deletedByOptions = useMemo(() => {
    const ids = new Set([...allDeletedByIds]);
    if (deletedByFilter !== "__ALL__") {
      ids.add(deletedByFilter);
    }
    if (trashData && typeof trashData === "object") {
      Object.values(trashData).forEach((moduleData) => {
        if (moduleData && moduleData.items && Array.isArray(moduleData.items)) {
          moduleData.items.forEach((it) => {
            const db = it.deletedBy;
            if (typeof db === "string") ids.add(db);
            else if (db && db._id) ids.add(db._id);
          });
        }
      });
    }
    const options = ["__ALL__", ...Array.from(ids)];
    return options;
  }, [trashData, allDeletedByIds, deletedByFilter]);

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

      {/* Module Count Cards */}
      {Object.keys(moduleCounts).length > 0 && (
        <Box
          sx={{
            mb: 2,
            overflowX: "auto",
            whiteSpace: "nowrap",
            pb: 1,
            "&::-webkit-scrollbar": {
              height: 6,
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(0,0,0,0.2)",
              borderRadius: 3,
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              gap: 2,
            }}
          >
            {Object.entries(moduleCounts)
              .filter(([, count]) => count > 0)
              .map(([module, count]) => (
                <Card
                  key={module}
                  elevation={2}
                  sx={{
                    flex: "0 0 auto",
                    minWidth: 160,
                    p: 2,
                    textAlign: "center",
                    borderRadius: 2,
                    backgroundColor: "background.paper",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      elevation: 4,
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: "primary.main",
                        fontSize: "0.875rem",
                      }}
                    >
                      {(() => {
                        const moduleInfo = moduleData.find(
                          (m) => m.key.toLowerCase() === module.toLowerCase()
                        );
                        return getModuleIcon(moduleInfo?.icon);
                      })()}
                    </Avatar>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                      }}
                    >
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        color="text.primary"
                      >
                        {count}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ textTransform: "capitalize", lineHeight: 1 }}
                      >
                        {module}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              ))}
          </Box>
        </Box>
      )}

      {/* Filters Bar */}
      <Box
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 2,
          backgroundColor: "background.paper",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
        }}
      >
        {/* Search */}
        <TextField
          placeholder={t.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ flex: 1, minWidth: 220 }}
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
          sx={{
            display: { xs: "flex", sm: "none" },
            ...getStartIconSpacing(dir),
          }}
          onClick={() => setFilterOpen(true)}
        >
          {t.filters}
        </Button>

        {/* Deleted By */}
        <FormControl
          size="small"
          sx={{ minWidth: 180, display: { xs: "none", sm: "flex" } }}
        >
          <InputLabel>{t.deletedByLabel}</InputLabel>
          <Select
            value={deletedByFilter}
            label={t.deletedByLabel}
            onChange={(e) => setDeletedByFilter(e.target.value)}
          >
            <MenuItem value="__ALL__">{t.all}</MenuItem>
            {deletedByOptions.map(
              (id) =>
                id !== "__ALL__" && (
                  <MenuItem key={id} value={id}>
                    {userMap[id] || id}
                  </MenuItem>
                )
            )}
          </Select>
        </FormControl>

        {/* Module */}
        <FormControl
          size="small"
          sx={{ minWidth: 180, display: { xs: "none", sm: "flex" } }}
        >
          <InputLabel>{t.moduleLabel}</InputLabel>
          <Select
            value={moduleFilter}
            label={t.moduleLabel}
            onChange={(e) => setModuleFilter(e.target.value)}
          >
            <MenuItem value="__ALL__">{t.all}</MenuItem>
            {allAvailableModules.map((m) => (
              <MenuItem key={m} value={m}>
                {getModuleDisplayName(m)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Date Range (single control with 2 inputs side by side) */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            px: 1,
            py: 0.5,
            minWidth: 250,
            display: { xs: "none", sm: "flex" },
          }}
        >
          <TextField
            type="date"
            size="small"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>
            —
          </Typography>
          <TextField
            type="date"
            size="small"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1 }}
          />
        </Box>

        {/* Records per page */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>{t.recordsPerPage}</InputLabel>
          <Select
            value={limit}
            label={t.recordsPerPage}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
          >
            {[5, 10, 20, 50].map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Clear Filters Button */}
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<ICONS.clear />}
          onClick={handleClearAllFilters}
          sx={{ display: { xs: "none", sm: "flex" } }}
          disabled={
            !search &&
            deletedByFilter === "__ALL__" &&
            moduleFilter === "__ALL__" &&
            !dateFrom &&
            !dateTo
          }
        >
          {t.clearFilters}
        </Button>
      </Box>

      {loading ? (
        <LoadingState />
      ) : !trashData || Object.keys(trashData).length === 0 ? (
        <NoDataAvailable message={t.noTrash} />
      ) : (
        (() => {
          const renderedModules = Object.entries(trashData).map(
            ([module, moduleData]) => {
              const { items = [], total = 0 } = moduleData || {};
              const page = pageState[module] || 1;

              const filtered = items.filter((item) => {
                if (!search.trim()) return true;
                const searchTerm = search.trim().toLowerCase();
                const itemText = (
                  item.name ||
                  item.title ||
                  item.slug ||
                  item.text ||
                  item.question ||
                  item.fullName ||
                  item.employeeId ||
                  ""
                ).toLowerCase();
                return itemText.includes(searchTerm);
              });

              if (!filtered.length) return null;
              return (
                <Box key={module} sx={{ mb: 4 }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="h6">
                      {getModuleDisplayName(module)} - {total}
                    </Typography>
                    <Stack
                      direction={{ xs: "row", sm: "row" }}
                      spacing={1}
                      sx={{
                        width: { xs: "100%", sm: "auto" },

                        mt: { xs: 1, sm: 0 },
                      }}
                    >
                      <Button
                        variant="text"
                        color="success"
                        size="small"
                        startIcon={<ICONS.restore />}
                        onClick={() => openBulkRestoreConfirm(module)}
                        disabled={filtered.length === 0}
                        sx={{
                          ...getStartIconSpacing(dir),

                          width: { xs: "100%", sm: "auto" },
                        }}
                      >
                        {t.restoreAll}
                      </Button>
                      <Button
                        variant="text"
                        color="error"
                        size="small"
                        startIcon={<ICONS.delete />}
                        onClick={() => openBulkDeleteConfirm(module)}
                        disabled={filtered.length === 0}
                        sx={{
                          ...getStartIconSpacing(dir),

                          width: { xs: "100%", sm: "auto" },
                        }}
                      >
                        {t.deleteAll}
                      </Button>
                    </Stack>
                  </Stack>
                  <Grid container spacing={3} justifyContent="center">
                    {filtered.map((item) => (
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={4}
                        key={item._id}
                        sx={{
                          width: { xs: "100%", md: "auto" },
                        }}
                      >
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
                          <Box>
                            <Box
                              sx={{
                                display: "flex",
                                gap: 2,
                                alignItems: "center",
                                mb: 1,
                              }}
                            >
                              <Avatar sx={{ width: 48, height: 48 }}>
                                {item.name?.[0] || item.title?.[0] || "?"}
                              </Avatar>
                              <Box sx={{ flexGrow: 1, ...wrapTextBox }}>
                                <Typography
                                  variant="subtitle1"
                                  fontWeight="bold"
                                >
                                  {item.name ||
                                    item.title ||
                                    item.slug ||
                                    item.text ||
                                    item.question ||
                                    item.fullName ||
                                    item.employeeId ||
                                    safeFormatDate(item.endTime) ||
                                    safeFormatDate(item.createdAt) ||
                                    "Unnamed"}
                                </Typography>
                              </Box>
                            </Box>

                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 0.5,
                                ml: 1,
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <ICONS.event fontSize="small" color="action" />

                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {t.deletedAt}:{" "}
                                  {item.deletedAt
                                    ? formatDateTimeWithLocale(item.deletedAt)
                                    : "-"}
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <ICONS.person fontSize="small" color="action" />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {t.deletedBy}:{" "}
                                  {getLabelForDeletedBy(item.deletedBy)}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                          <CardActions
                            sx={{ mt: 1, justifyContent: "flex-end" }}
                          >
                            <Tooltip title={t.restore}>
                              <IconButton
                                color="success"
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
            }
          );

          // if all entries are null, show fallback
          if (renderedModules.every((el) => el === null)) {
            return <NoDataAvailable message={t.noTrash} />;
          }
          return renderedModules;
        })()
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
            {allAvailableModules.map((m) => (
              <MenuItem key={m} value={m}>
                {getModuleDisplayName(m)}
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

          {/* Clear Filters Button - Mobile */}
          <Button
            variant="outlined"
            color="secondary"
            fullWidth
            startIcon={<ICONS.clear />}
            onClick={() => {
              handleClearAllFilters();
              setFilterOpen(false);
            }}
            disabled={
              !search &&
              deletedByFilter === "__ALL__" &&
              moduleFilter === "__ALL__" &&
              !dateFrom &&
              !dateTo
            }
          >
            {t.clearFilters}
          </Button>
        </Stack>
      </FilterModal>

      <ConfirmationDialog
        open={restoreConfirm}
        onClose={() => setRestoreConfirm(false)}
        onConfirm={handleRestore}
        title={t.confirmRestoreTitle}
        message={t.confirmRestoreMessage}
        confirmButtonText={t.confirmRestoreButton}
        confirmButtonIcon={<ICONS.restore />}
        confirmButtonColor="success"
      />
      <ConfirmationDialog
        open={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handlePermanentDelete}
        title={t.confirmDeleteTitle}
        message={(() => {
          const frontendModule = pendingAction?.frontendModule;
          const itemRole = pendingAction?.item?.role;

          if (frontendModule === "business") {
            return t.deleteBusinessMessage;
          }

          if (itemRole === "staff") {
            return t.deleteStaffMessage;
          }

          if (frontendModule === "user") {
            return t.deleteMessagePrefix;
          }

          return t.confirmDeleteMessage;
        })()}
        confirmButtonText={isMobile ? t.delete : t.confirmDeleteButton}
        confirmButtonIcon={<ICONS.delete />}
      />
      <ConfirmationDialog
        open={bulkRestoreConfirm}
        onClose={() => setBulkRestoreConfirm(false)}
        onConfirm={handleBulkRestore}
        title={t.confirmBulkRestoreTitle}
        message={t.confirmBulkRestoreMessage}
        confirmButtonText={t.restore}
        confirmButtonIcon={<ICONS.restore />}
        confirmButtonColor="success"
      />
      <ConfirmationDialog
        open={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title={t.confirmBulkDeleteTitle}
        message={t.confirmBulkDeleteMessage}
        confirmButtonText={
          isMobile ? t.deleteAllMobile : t.deleteAllPermanently
        }
        confirmButtonIcon={<ICONS.delete />}
      />
    </Container>
  );
}
