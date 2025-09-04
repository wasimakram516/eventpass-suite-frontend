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

import BreadcrumbsNav from "@/components/BreadcrumbsNav";
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
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { wrapTextBox } from "@/utils/wrapTextStyles";
import { formatDateTimeWithLocale } from "@/utils/dateUtils";
import FilterModal from "@/components/FilterModal";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { getModuleCounts } from "@/services/trashService";
import { getModuleIcon } from "@/utils/iconMapper";
import { getModules } from "@/services/moduleService";
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
    deleteMessagePrefix: "Are you sure you want to delete this user? This will also delete all their associated businesses and related data, and cannot be undone.",
    deleteStaffMessage: "Are you sure you want to delete this user? This will also delete all their related data, and cannot be undone.",
    deleteBusinessMessage: "Are you sure you want to delete this business? This will also delete all of its associated data and cannot be undone.",
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
    confirmBulkRestoreMessage: "Are you sure you want to restore all items in this module?",
    confirmBulkDeleteTitle: "Confirm Delete All",
    confirmBulkDeleteMessage: "Are you sure you want to permanently delete all items in this module? This action cannot be undone.",
    deleteAllPermanently: "Delete Permanently",
    deleteAllMobile: "Delete",
  },
  ar: {
    title: "سلة المحذوفات",
    subtitle: "عرض أو استعادة أو حذف العناصر المحذوفة نهائيًا.",
    restore: "استعادة",
    "delete": "حذف",
    permanentDelete: "حذف نهائي",
    confirmDeleteTitle: "تأكيد الحذف النهائي",
    confirmDeleteMessage:
      "هل أنت متأكد أنك تريد حذف هذا العنصر نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.",
    deleteMessagePrefix: "هل أنت متأكد أنك تريد حذف هذا المستخدم؟ سيؤدي هذا أيضًا إلى حذف جميع الشركات المرتبطة به والبيانات ذات الصلة، ولا يمكن التراجع عن هذا الإجراء.",
    deleteStaffMessage: "هل أنت متأكد أنك تريد حذف هذا المستخدم؟ سيؤدي هذا أيضًا إلى حذف البيانات ذات الصلة، ولا يمكن التراجع عن هذا الإجراء.",
    deleteBusinessMessage: "هل أنت متأكد أنك تريد حذف هذا العمل؟ سيؤدي هذا أيضًا إلى حذف جميع البيانات المرتبطة به ولا يمكن التراجع عن هذا الإجراء.",
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
    confirmBulkRestoreMessage: "هل أنت متأكد أنك تريد استعادة جميع العناصر في هذه الوحدة؟",
    confirmBulkDeleteTitle: "تأكيد حذف الكل",
    confirmBulkDeleteMessage: "هل أنت متأكد أنك تريد حذف جميع العناصر في هذه الوحدة نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.",
    deleteAllPermanently: "حذف نهائيًا",
    deleteAllMobile: "حذف",
  },
};

export default function TrashPage() {
  const { dir, align, t } = useI18nLayout(translations);
  const { user: currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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

  const clearAllFilters = () => {
    setSearch("");
    setDeletedByFilter("__ALL__");
    setModuleFilter("__ALL__");
    setDateFrom("");
    setDateTo("");
    setPageState({});
  };

  useEffect(() => {
    const initializeData = async () => {
      await hydrateUsersMap();
      await fetchAllModules();
      await fetchModuleCounts();
      await fetchModuleData();
      await fetchTrash();
    };
    initializeData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);

    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };
    const parts = new Intl.DateTimeFormat("en-US", options).formatToParts(d);
    const datePart = `${parts.find(p => p.type === "month").value} ${parts.find(p => p.type === "day").value} ${parts.find(p => p.type === "year").value}`;
    const timePart = `${parts.find(p => p.type === "hour").value}:${parts.find(p => p.type === "minute").value} ${parts.find(p => p.type === "dayPeriod").value}`;

    return `${datePart} at ${timePart}`;
  };

  // debounced effect to reduce API calls during rapid filter changes
  useEffect(() => {
    if (allAvailableModules.length === 0) return;

    const timeoutId = setTimeout(() => {
      fetchTrash();
    }, 300);

    return () => clearTimeout(timeoutId);
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
    } catch { }
  };
  const fetchModuleData = async () => {
    try {
      const role = currentUser?.role || "staff";
      const modulesPayload = await getModules(role);
      const serverModules = Array.isArray(modulesPayload) ? modulesPayload : [];
      setModuleData(serverModules);
    } catch (error) {
      console.error('Error fetching module data:', error);
    }
  };

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const allResults = {};

      if (moduleFilter !== "__ALL__") {
        const page = pageState[moduleFilter] || 1;
        const params = { limit, page, model: moduleFilter };
        if (deletedByFilter !== "__ALL__") params.deletedBy = deletedByFilter;
        if (dateFrom) params.startDate = dateFrom;
        if (dateTo) params.endDate = dateTo;
        const res = await getTrash(params);
        const moduleResult = res.items?.[moduleFilter] || res[moduleFilter] || { items: [], total: 0 };
        allResults[moduleFilter] = moduleResult;
      } else {
        const freshModules = Object.keys(await getTrash({ limit: 1 }).then(r => r.items || r));
        for (const module of freshModules) {
          const page = pageState[module] || 1;
          const params = { limit, page, model: module };
          if (deletedByFilter !== "__ALL__") params.deletedBy = deletedByFilter;
          if (dateFrom) params.startDate = dateFrom;
          if (dateTo) params.endDate = dateTo;
          const res = await getTrash(params);
          const moduleResult = res.items?.[module] || res[module] || { items: [], total: 0 };
          allResults[module] = moduleResult;
        }
      }

      setTrashData(allResults);
    } catch (error) {
      console.error('Error fetching trash:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAvailableModules = async () => {
    try {
      const res = await getTrash({ limit: 1000 });
      const modules = Object.keys(res.items || res);

      const modulesWithItems = modules.filter(module => {
        const moduleData = res.items?.[module] || res[module];
        return moduleData && moduleData.items && Array.isArray(moduleData.items) && moduleData.items.length > 0;
      });

      setAllAvailableModules(modulesWithItems);

      if (moduleFilter !== "__ALL__" && !modulesWithItems.includes(moduleFilter)) {
        setModuleFilter("__ALL__");
      }
    } catch (error) {
      console.error('Error updating available modules:', error);
    }
  };
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

  const fetchModuleCounts = async () => {
    try {
      const counts = await getModuleCounts();
      setModuleCounts(counts);
    } catch (error) {
      console.error('Error fetching module counts:', error);
    }
  };

  const fetchAllModules = async () => {
    const res = await getTrash({ limit: 10 });
    const modules = Object.keys(res.items || res);

    const modulesWithItems = modules.filter(module => {
      const moduleData = res.items?.[module] || res[module];
      return moduleData && moduleData.items && Array.isArray(moduleData.items) && moduleData.items.length > 0;
    });

    setAllAvailableModules(modulesWithItems);

    const userIds = new Set();
    Object.values(res.items || res).forEach((moduleData) => {
      if (moduleData && moduleData.items && Array.isArray(moduleData.items)) {
        moduleData.items.forEach((item) => {
          const db = item.deletedBy;
          if (typeof db === "string") userIds.add(db);
          else if (db && db._id) userIds.add(db._id);
        });
      }
    });
    setAllDeletedByIds(userIds);
  };

  // Store all user IDs separately from filtered data to prevent dropdown emptying
  const [allDeletedByIds, setAllDeletedByIds] = useState(new Set());

  const deletedByOptions = useMemo(() => {
    const ids = new Set([...allDeletedByIds]);
    if (deletedByFilter !== "__ALL__") {
      ids.add(deletedByFilter);
    }
    if (trashData && typeof trashData === 'object') {
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

  const labelForDeletedBy = (val) => {
    if (!val) return "-";
    if (typeof val === "string") return userMap[val] || val;
    return val.fullName || val.name || val.email || val._id || "-";
  };

  // Function to convert module keys to user-friendly display names
  const getModuleDisplayName = (moduleKey) => {
    const moduleNames = {
      'registration-eventreg': 'Registration (EventReg)',
      'registration-checkin': 'Registration (CheckIn)',
      'event-eventreg': 'Event (EventReg)',
      'event-checkin': 'Event (CheckIn)',
      'game-quiznest': 'Game (QuizNest)',
      'game-eventduel': 'Game (EventDuel)',
      'gamesession-quiznest': 'Game Session (QuizNest)',
      'gamesession-eventduel': 'Game Session (EventDuel)',
      'qnquestion': 'Questions (QuizNest)',
      'pvpquestion': 'Questions (EventDuel)',
    };
    return moduleNames[moduleKey] || moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1);
  };
  // Frontend module to backend controller mapping - matches controllerMap in backend
  const frontendToBackendModuleMap = {
    'business': 'business',
    'event-checkin': 'checkinevent',
    'registration-checkin': 'checkinregistration',
    'event-eventreg': 'eventregevent',
    'registration-eventreg': 'eventregregistration',
    'game-quiznest': 'qngame',
    'game-eventduel': 'pvpgame',
    'gamesession-quiznest': null,
    'gamesession-eventduel': 'pvpgamesession',
    'poll': 'poll',
    'spinwheel': 'spinwheel',
    'spinwheelparticipant': 'spinwheelparticipant',
    'displaymedia': 'displaymedia',
    'wallconfig': 'wallconfig',
    'globalconfig': 'globalconfig',
    'user': 'user',
    'eventquestion': 'question',
    'question': 'question',
    'visitor': 'visitor',
    'surveyform': 'surveyform',
    'surveyresponse': 'surveyresponse',
    'pvpquestion': 'pvpquestion',
    'qnquestion': 'qnquestion',
  };

  const mapToBackendController = (frontendModuleKey) => {
    return frontendToBackendModuleMap[frontendModuleKey] || frontendModuleKey;
  };
  const matchesSearch = (item) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const text = (item.name || item.title || item.slug || "").toLowerCase();
    return text.includes(q);
  };

  const openRestoreConfirm = (module, item) => {
    const backendModule = mapToBackendController(module);
    setPendingAction({ type: "restore", module: backendModule, frontendModule: module, item });
    setRestoreConfirm(true);
  };

  const openDeleteConfirm = (module, item) => {
    const backendModule = mapToBackendController(module);
    setPendingAction({ type: "delete", module: backendModule, frontendModule: module, item });
    setDeleteConfirm(true);
  };
  const handleRestore = async () => {
    if (!pendingAction) return;
    setLoading(true);
      await restoreTrashItem(pendingAction.module, pendingAction.item._id);

      await fetchTrash();
      await fetchModuleCounts();
      await updateAvailableModules();

    setRestoreConfirm(false);
    setPendingAction(null);
    setLoading(false);
  };

  const handlePermanentDelete = async () => {
    if (!pendingAction) return;
    setLoading(true);
      await permanentDeleteTrashItem(pendingAction.module, pendingAction.item._id);

      await fetchTrash();
      await fetchModuleCounts();
      await updateAvailableModules();

    setDeleteConfirm(false);
    setPendingAction(null);
    setLoading(false);
  };

  const handlePageChange = (module, value) => {
    setPageState((prev) => ({ ...prev, [module]: value }));
  };

  // Handle bulk operations
  const openBulkRestoreConfirm = (module) => {
    const backendModule = mapToBackendController(module);
    const filterParams = {
      ...(deletedByFilter !== "__ALL__" && { deletedBy: deletedByFilter }),
      ...(dateFrom && { startDate: dateFrom }),
      ...(dateTo && { endDate: dateTo })
    };
    setPendingBulkAction({ type: "restore", module: backendModule, frontendModule: module, filterParams });
    setBulkRestoreConfirm(true);
  };

  const openBulkDeleteConfirm = (module) => {
    const backendModule = mapToBackendController(module);
    const filterParams = {
      ...(deletedByFilter !== "__ALL__" && { deletedBy: deletedByFilter }),
      ...(dateFrom && { startDate: dateFrom }),
      ...(dateTo && { endDate: dateTo })
    };
    setPendingBulkAction({ type: "delete", module: backendModule, frontendModule: module, filterParams });
    setBulkDeleteConfirm(true);
  };

  const handleBulkRestore = async () => {
    if (!pendingBulkAction) return;
    setLoading(true);
    try {
      await restoreAllTrashItems(pendingBulkAction.frontendModule, pendingBulkAction.filterParams);
      await fetchTrash();
      await fetchModuleCounts();
      await updateAvailableModules();
    } catch (error) {
      console.error('Error in bulk restore:', error);
    }
    setBulkRestoreConfirm(false);
    setPendingBulkAction(null);
    setLoading(false);
  };

  // Enhanced polling that handles complex backend operations with exponential backoff
  const pollForCompletion = async (moduleKey, filterParams = {}, maxAttempts = 30, initialDelay = 300) => {
    let attempts = 0;
    let delay = initialDelay;
    let lastCount = null;
    let stableCount = 0;

    await new Promise(resolve => setTimeout(resolve, 1000));

    while (attempts < maxAttempts) {
      try {
        const response = await getTrash({
          model: moduleKey,
          limit: 1,
          ...filterParams
        });
        const moduleData = response.items?.[moduleKey] || response[moduleKey];
        const currentCount = moduleData?.total || 0;

        if (currentCount === 0) {
          return true;
        }

        if (lastCount === currentCount) {
          stableCount++;
          if (stableCount >= 4 && attempts > 15) {
            return true;
          }
        } else {
          stableCount = 0;
        }

        lastCount = currentCount;

        if (attempts > 8) {
          delay = Math.min(delay * 1.3, 2000); // Increased max delay to 2 seconds
        }

        await new Promise(resolve => setTimeout(resolve, delay));
        attempts++;

      } catch (error) {
        console.error('Error polling for completion:', error);
        await new Promise(resolve => setTimeout(resolve, delay * 2));
        attempts++;
      }
    }

    // if max attempts reached, assume operation completed
    console.warn(`Polling timeout after ${attempts} attempts for ${moduleKey} - proceeding anyway`);
    return false;
  };

  const handleBulkDelete = async () => {
    if (!pendingBulkAction) return;
    setLoading(true);
    try {
      await permanentDeleteAllTrashItems(pendingBulkAction.frontendModule, pendingBulkAction.filterParams);
      await pollForCompletion(pendingBulkAction.frontendModule);

      await fetchTrash();
      await fetchModuleCounts();
      await updateAvailableModules();
    } catch (error) {
      console.error('Error in bulk delete:', error);
    }
    setBulkDeleteConfirm(false);
    setPendingBulkAction(null);
    setLoading(false);
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPageState({});
  };

  // Prevent MUI from locking body overflow and removing scrollbar
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (document.body.style.overflow === 'hidden') {
        document.body.style.overflow = 'auto';
        document.body.style.paddingRight = '0px';
      }
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style']
    });
    return () => observer.disconnect();
  }, []);
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
        <Box sx={{
          mb: 3,
        }}>
          <Grid container spacing={2}>
            {Object.entries(moduleCounts)
              .filter(([, count]) => count > 0)
              .map(([module, count]) => (
                <Grid item xs={6} sm={4} md={3} lg={2} key={module}>
                  <Card
                    elevation={2}
                    sx={{
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
                          const moduleInfo = moduleData.find(m => m.key.toLowerCase() === module.toLowerCase());
                          return getModuleIcon(moduleInfo?.icon);
                        })()}
                      </Avatar>
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                        <Typography variant="h6" fontWeight="bold" color="text.primary">
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
                </Grid>
              ))}
          </Grid>
        </Box>
      )}

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
          sx={{ display: { xs: "flex", sm: "none" }, ...getStartIconSpacing(dir) }}
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
          SelectProps={{ displayEmpty: true }}
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
          {allAvailableModules.map((m) => (
            <MenuItem key={m} value={m}>
              {getModuleDisplayName(m)}
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
              handleLimitChange(Number(e.target.value));
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

      <Box sx={{ display: { xs: "none", sm: "flex" }, justifyContent: "flex-start", mb: 2 }}>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<ICONS.clear />}
          onClick={clearAllFilters}
          disabled={!search && deletedByFilter === "__ALL__" && moduleFilter === "__ALL__" && !dateFrom && !dateTo}
        >
          {t.clearFilters}
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress size={36} />
        </Box>
      ) : !trashData || Object.keys(trashData).length === 0 ? (
        <NoDataAvailable message={t.noTrash} />
      ) : (
        Object.entries(trashData).map(([module, moduleData]) => {
          const { items = [], total = 0 } = moduleData || {};
          const page = pageState[module] || 1;
          const filtered = items.filter((item) => {
            if (!search.trim()) return true;
            const searchTerm = search.trim().toLowerCase();
            const itemText = (item.name || item.title || item.slug || item.text || item.question || item.fullName || item.employeeId || '').toLowerCase();
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
                    mt: { xs: 1, sm: 0 }
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
                      width: { xs: "100%", sm: "auto" }
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
                      width: { xs: "100%", sm: "auto" }
                    }}
                  >
                    {t.deleteAll}
                  </Button>
                </Stack>
              </Stack>
              <Grid container spacing={3} justifyContent="center">
                {filtered.map((item) => (
                  <Grid item xs={12} sm={6} md={4} key={item._id} sx={{
                    width: { xs: '100%', md: "auto" }
                  }}>
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
                        <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 1 }}>
                          <Avatar sx={{ width: 48, height: 48 }}>
                            {item.name?.[0] || item.title?.[0] || "?"}
                          </Avatar>
                          <Box sx={{ flexGrow: 1, ...wrapTextBox }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {item.name || item.title || item.slug || item.text || item.question || item.fullName || item.
                                employeeId || formatDate(item.endTime) ||formatDate(item.createdAt)|| "Unnamed"}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, ml: 1 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <ICONS.event fontSize="small" color="action" />
                            <Typography variant="caption" color="text.secondary">
                              {t.deletedAt}: {item.deletedAt ? formatDateTimeWithLocale(item.deletedAt) : "-"}
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <ICONS.person fontSize="small" color="action" />
                            <Typography variant="caption" color="text.secondary">
                              {t.deletedBy}: {labelForDeletedBy(item.deletedBy)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <CardActions sx={{ mt: 1, justifyContent: "flex-end" }}>
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

              {
                total > limit && (
                  <Box display="flex" justifyContent="center" mt={3}>
                    <Pagination
                      dir="ltr"
                      count={Math.ceil(total / limit)}
                      page={page}
                      onChange={(e, val) => handlePageChange(module, val)}
                    />
                  </Box>
                )
              }
            </Box >
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
            color="primary"
            fullWidth
            startIcon={<ICONS.clear />}
            onClick={() => {
              clearAllFilters();
              setFilterOpen(false);
            }}
            disabled={!search && deletedByFilter === "__ALL__" && moduleFilter === "__ALL__" && !dateFrom && !dateTo}
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
        message={
          (() => {
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
          })()
        }
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
        confirmButtonText={isMobile ? t.deleteAllMobile : t.deleteAllPermanently}
        confirmButtonIcon={<ICONS.delete />}
      />
    </Container >
  );
}
