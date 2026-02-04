"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Grid,
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
import { pickFullName, pickEmail } from "@/utils/customFieldUtils";
import AppCard from "@/components/cards/AppCard";
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
  const [allModulesTrashData, setAllModulesTrashData] = useState({});

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
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (
      (currentUser?.role === "admin" || currentUser?.role === "superadmin")
        ? deletedByFilter !== "__ALL__"
        : false
    ) {
      count += 1;
    }
    if (moduleFilter !== "__ALL__") count += 1;
    if (dateFrom) count += 1;
    if (dateTo) count += 1;
    if (limit !== 5) count += 1;
    return count;
  }, [deletedByFilter, moduleFilter, dateFrom, dateTo, limit, currentUser]);

  const filteredTrashData = useMemo(() => {
    if (!trashData || !currentUser) return trashData;

    if ((currentUser.role === "admin" || currentUser.role === "superadmin")) {
      return trashData;
    }

    const userId = currentUser.id || currentUser._id;
    if (!userId) return {};

    const filtered = {};
    Object.entries(trashData).forEach(([module, moduleData]) => {
      if (moduleData && moduleData.items && Array.isArray(moduleData.items)) {
        const filteredItems = moduleData.items.filter((item) => {
          const deletedBy = item.deletedBy;
          if (typeof deletedBy === "string") {
            return deletedBy === userId;
          } else if (deletedBy && deletedBy._id) {
            return deletedBy._id === userId;
          }
          return false;
        });

        if (filteredItems.length > 0) {
          filtered[module] = {
            ...moduleData,
            items: filteredItems,
            total: filteredItems.length,
          };
        }
      }
    });

    return filtered;
  }, [trashData, currentUser]);


  useEffect(() => {
    if (filteredTrashData) {
      const newIds = new Set(allDeletedByIds);
      Object.values(filteredTrashData).forEach((moduleData) => {
        if (moduleData && moduleData.items && Array.isArray(moduleData.items)) {
          moduleData.items.forEach((it) => {
            const db = it.deletedBy;
            if (typeof db === "string") newIds.add(db);
            else if (db && db._id) newIds.add(db._id);
          });
        }
      });
      setAllDeletedByIds(newIds);

      hydrateUsersMap();
    }
  }, [filteredTrashData]);

  const fetchAllModulesTrashData = async () => {
    try {
      const params = { limit: 1000, page: 1 };

      // For non-admin users, only fetch their own items
      if (currentUser && currentUser.role !== "admin" && currentUser.role !== "superadmin") {
        const userId = currentUser.id || currentUser._id;
        if (userId) {
          params.deletedBy = userId;
        }
      }

      const res = await getTrash(params);
      setAllModulesTrashData(res.items || {});
    } catch (error) {
      console.error("Error fetching all modules trash data:", error);
      setAllModulesTrashData({});
    }
  };

  const filteredModuleCounts = useMemo(() => {
    if ((currentUser?.role === "admin" || currentUser?.role === "superadmin")) {
      return moduleCounts;
    }

    if (!allModulesTrashData || Object.keys(allModulesTrashData).length === 0) {
      return {};
    }

    const counts = {};
    Object.entries(allModulesTrashData).forEach(([module, moduleData]) => {
      if (moduleData) {
        if (moduleData.items && Array.isArray(moduleData.items)) {
          const userId = currentUser?.id || currentUser?._id;
          if (userId) {
            const filteredItems = moduleData.items.filter((item) => {
              const deletedBy = item.deletedBy;
              if (typeof deletedBy === "string") {
                return deletedBy === userId;
              } else if (deletedBy && deletedBy._id) {
                return deletedBy._id === userId;
              }
              return false;
            });
            counts[module] = filteredItems.length;
          } else {
            counts[module] = 0;
          }
        } else if (moduleData.total !== undefined) {
          counts[module] = moduleData.total;
        }
      }
    });

    return counts;
  }, [allModulesTrashData, moduleCounts, currentUser]);

  // Handle page change for a specific module
  useEffect(() => {
    const initializeData = async () => {
      await hydrateUsersMap();
      await fetchModuleCounts();
      await fetchAllModulesTrashData();
      await fetchModuleData();
    };
    initializeData();
  }, [currentUser]);

  useEffect(() => {
    const counts = (currentUser?.role === "admin" || currentUser?.role === "superadmin") ? moduleCounts : filteredModuleCounts;
    if (counts && Object.keys(counts).length > 0) {
      const modules = Object.keys(counts).filter((m) => counts[m] > 0);
      if (modules.length > 0 && moduleFilter === "__ALL__" && allAvailableModules.length === 0) {
        setModuleFilter(modules[0]);
      }
    }
  }, [filteredModuleCounts, moduleCounts, currentUser]);

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin" && currentUser.role !== "superadmin") {
      const userId = currentUser.id || currentUser._id;
      if (userId && deletedByFilter === "__ALL__") {
        setDeletedByFilter(userId);
      }
    }
  }, [currentUser]);

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
    if ((currentUser?.role === "admin" || currentUser?.role === "superadmin")) {
      setDeletedByFilter("__ALL__");
    } else {
      const userId = currentUser?.id || currentUser?._id;
      if (userId) {
        setDeletedByFilter(userId);
      }
    }
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
      "game-tapmatch": "Game (TapMatch)",
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

    if (typeof val === "string") {
      const name = userMap[val];
      if (name) return name;
      return val;
    }

    if (val && typeof val === "object") {
      const name = val.fullName || val.name || val.email;
      if (name) return name;

      const userId = val._id || val.id;
      if (userId && userMap[userId]) {
        return userMap[userId];
      }

      return userId || "-";
    }

    return "-";
  };

  const getRecordDisplayInfo = (item, module) => {

    let name = item.name || item.title || item.fullName || item.slug || item.text || item.question || null;
    let email = item.email || null;

    if ((module === "registration-eventreg" || module === "registration-checkin") && item.customFields) {
      const extractedName = pickFullName(item.customFields);
      const extractedEmail = pickEmail(item.customFields);

      if (!name && extractedName) {
        name = extractedName;
      }
      if (!email && extractedEmail) {
        email = extractedEmail;
      }
    }

    const phone = item.phone || item.phoneNumber || item.mobile || null;

    if (!name && !email && !phone) {
      return { primary: "Unnamed", secondary: null };
    }

    const primary = name || email || phone || "Unnamed";
    const secondaryParts = [];

    if (name && email) {
      secondaryParts.push(email);
    } else if (name && phone) {
      secondaryParts.push(phone);
    } else if (!name && email && phone) {
      secondaryParts.push(phone);
    }

    return {
      primary,
      secondary: secondaryParts.length > 0 ? secondaryParts.join(" • ") : null,
    };
  };

  const hydrateUsersMap = async () => {
    try {
      const users = await getAllUsers();
      const map = {};
      users.forEach((u) => {
        const userId = u._id || u.id;
        if (userId) {
          map[userId] = u.name || u.fullName || u.email || userId;
        }
      });
      if (currentUser) {
        const userId = currentUser.id || currentUser._id;
        if (userId && !map[userId]) {
          map[userId] = currentUser.name || currentUser.fullName || currentUser.email || userId;
        }
      }
      setUserMap(map);
    } catch { }
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPageState({}); // reset pagination when limit changes
  };

  const handlePageChange = (module, page) => {
    setPageState((prev) => ({
      ...prev,
      [module]: page,
    }));
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
      const params = {
        limit,
        page: targetModule && targetModule !== "__ALL__" ? (pageState[targetModule] || 1) : 1,
        ...(deletedByFilter !== "__ALL__" && { deletedBy: deletedByFilter }),
        ...(dateFrom && { startDate: dateFrom }),
        ...(dateTo && { endDate: dateTo }),
      };

      if (!targetModule || targetModule === "__ALL__") {
        const res = await getTrash(params);
        setTrashData(res.items || {});
      } else {
        const res = await getTrash({
          ...params,
          model: targetModule,
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
      const params = { limit: 1000 };
      if (currentUser && currentUser.role !== "admin" && currentUser.role !== "superadmin") {
        const userId = currentUser.id || currentUser._id;
        if (userId) {
          params.deletedBy = userId;
        }
      }

      const res = await getTrash(params);
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

  useEffect(() => {
    const counts = (currentUser?.role === "admin" || currentUser?.role === "superadmin") ? moduleCounts : filteredModuleCounts;
    if (counts && Object.keys(counts).length > 0) {
      const modules = Object.keys(counts).filter((m) => counts[m] > 0);
      setAllAvailableModules(modules);

      if (modules.length > 0 && moduleFilter !== "__ALL__" && !modules.includes(moduleFilter)) {
        setModuleFilter(modules[0]);
      }
    }
  }, [filteredModuleCounts, moduleCounts, currentUser]);

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
      await fetchAllModulesTrashData();
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
      await fetchAllModulesTrashData();
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
      await fetchAllModulesTrashData();
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
      await fetchAllModulesTrashData();
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
    if (filteredTrashData && typeof filteredTrashData === "object") {
      Object.values(filteredTrashData).forEach((moduleData) => {
        if (moduleData && moduleData.items && Array.isArray(moduleData.items)) {
          moduleData.items.forEach((it) => {
            const db = it.deletedBy;
            if (typeof db === "string") ids.add(db);
            else if (db && db._id) ids.add(db._id);
          });
        }
      });
    }

    if (currentUser && currentUser.role !== "admin" && currentUser.role !== "superadmin") {
      const userId = currentUser.id || currentUser._id;
      if (userId) {
        return [userId];
      }
      return [];
    }

    const options = ["__ALL__", ...Array.from(ids)];
    return options;
  }, [filteredTrashData, allDeletedByIds, deletedByFilter, currentUser]);

  return (
    <Container
      dir={dir}
      maxWidth={false}
      sx={{ maxWidth: "1500px", px: { xs: 2, md: 3 } }}
    >
      <BreadcrumbsNav />
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        mb={2}
        gap={2}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
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
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: { xs: "flex-start", sm: "flex-end" },
            gap: 2,
            width: { xs: "100%", sm: "auto" },
          }}
        >
          {/* Search */}
          <TextField
            placeholder={t.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            fullWidth
            sx={{
              flex: 1,
              minWidth: 0,
              width: "100%",
              maxWidth: { xs: "100%", sm: 360, md: 420 },
            }}
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
            endIcon={
              activeFilterCount > 0 ? (
                <Box
                  component="span"
                  sx={{
                    ml: dir === "rtl" ? 0 : 1,
                    mr: dir === "rtl" ? 1 : 0,
                    px: 0.75,
                    py: 0.15,
                    borderRadius: 999,
                    fontSize: "0.75rem",
                    bgcolor: "rgba(255,255,255,0.2)",
                  }}
                >
                  {activeFilterCount}
                </Box>
              ) : null
            }
            sx={{
              ...getStartIconSpacing(dir, { includeEnd: true, endSpacing: "0.35rem" }),
              width: { xs: "100%", sm: "auto" },
              whiteSpace: "nowrap",
            }}
            onClick={() => setFilterOpen(true)}
          >
            {t.filters}
          </Button>
        </Box>
      </Stack>
      <Divider sx={{ mb: 2 }} />

      {/* Module Count Cards */}
      {Object.keys(filteredModuleCounts).length > 0 && (
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
            {Object.entries(filteredModuleCounts)
              .filter(([, count]) => count > 0)
              .map(([module, count]) => (
                <AppCard
                  key={module}
                  sx={{
                    flex: "0 0 auto",
                    minWidth: 180,
                    p: 1.5,
                    borderRadius: 2.5,
                    border: "1px solid",
                    borderColor: "divider",
                    backgroundColor: "background.paper",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: "rgba(0, 119, 182, 0.12)",
                        color: "#0077b6",
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
                      <Typography variant="h6" sx={{ lineHeight: 1 }}>
                        {count}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getModuleDisplayName(module)}
                      </Typography>
                    </Box>
                  </Box>
                </AppCard>
              ))}
          </Box>
        </Box>
      )}

      {loading ? (
        <LoadingState />
      ) : !filteredTrashData || Object.keys(filteredTrashData).length === 0 ? (
        <NoDataAvailable message={t.noTrash} />
      ) : (
        (() => {
          const renderedModules = Object.entries(filteredTrashData).map(
            ([module, moduleData]) => {
              const { items = [], total = 0 } = moduleData || {};
              const page = pageState[module] || 1;

              const filtered = items.filter((item) => {
                if (!search.trim()) return true;
                const searchTerm = search.trim().toLowerCase();

                let itemText = (
                  item.name ||
                  item.title ||
                  item.slug ||
                  item.text ||
                  item.question ||
                  item.fullName ||
                  item.email ||
                  item.phone ||
                  item.phoneNumber ||
                  item.mobile ||
                  ""
                ).toLowerCase();

                if ((module === "registration-eventreg" || module === "registration-checkin") && item.customFields) {
                  const extractedName = pickFullName(item.customFields);
                  const extractedEmail = pickEmail(item.customFields);
                  if (extractedName) itemText += " " + String(extractedName).toLowerCase();
                  if (extractedEmail) itemText += " " + String(extractedEmail).toLowerCase();
                  Object.values(item.customFields || {}).forEach((val) => {
                    if (val) itemText += " " + String(val).toLowerCase();
                  });
                }

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
                      direction={{ xs: "column", sm: "row" }}
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
                  <Grid
                    container
                    rowSpacing={{ xs: 2, md: 3 }}
                    columnSpacing={{ xs: 0, md: 3 }}
                    justifyContent="center"
                  >
                    {filtered.map((item) => (
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={4}
                        key={item._id}
                        sx={{
                          width: { xs: "100%", md: "auto" },
                          px: { xs: 0 },
                        }}
                      >
                        <AppCard
                          sx={{
                            p: 2,
                            width: "100%",
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
                                {(() => {
                                  const displayInfo = getRecordDisplayInfo(item, module);
                                  return displayInfo.primary?.[0]?.toUpperCase() || "?";
                                })()}
                              </Avatar>
                              <Box sx={{ flexGrow: 1, ...wrapTextBox }}>
                                <Typography
                                  variant="subtitle1"
                                  fontWeight="bold"
                                >
                                  {(() => {
                                    const displayInfo = getRecordDisplayInfo(item, module);
                                    return displayInfo.primary;
                                  })()}
                                </Typography>
                                {(() => {
                                  const displayInfo = getRecordDisplayInfo(item, module);
                                  return displayInfo.secondary ? (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ display: "block", mt: 0.5 }}
                                    >
                                      {displayInfo.secondary}
                                    </Typography>
                                  ) : null;
                                })()}
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
                        </AppCard>
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
          {(currentUser?.role === "admin" || currentUser?.role === "superadmin") && (
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
          )}

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

          <FormControl size="small">
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
              ((currentUser?.role === "admin" || currentUser?.role === "superadmin") ? deletedByFilter === "__ALL__" : true) &&
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
