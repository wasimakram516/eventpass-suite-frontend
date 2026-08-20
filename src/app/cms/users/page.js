"use client";

import {
  Box,
  Typography,
  CardContent,
  CardActions,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
  Button,
  Stack,
  Container,
  Chip,
  InputAdornment,
  TextField,
  Autocomplete,
  CircularProgress,
  useTheme,
} from "@mui/material";

import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import UserFormModal from "@/components/modals/UserFormModal";
import {
  getAllUsers,
  deleteUser,
  getAllStaffUsers,
} from "@/services/userService";
import { getAllBusinesses } from "@/services/businessService";
import { getRoles } from "@/services/roleService";
import useI18nLayout from "@/hooks/useI18nLayout";
import { useAuth } from "@/contexts/AuthContext";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { wrapTextBox } from "@/utils/wrapTextStyles";
import LoadingState from "@/components/LoadingState";
import AppCard from "@/components/cards/AppCard";
import RecordMetadata from "@/components/RecordMetadata";

const translations = {
  en: {
    title: "Users",
    subtitle: "View and manage registered users",
    createUser: "Create User",
    editUser: "Edit User",
    editAdminUser: "Edit Admin User",
    createBusinessUser: "Create Business User",
    editBusinessUser: "Edit Business User",
    createAdminUser: "Create Admin User",
    createSuperAdminUser: "Create Super Admin User",
    createStaffUser: "Create Staff User",
    editStaffUser: "Edit Staff User",
    name: "Name",
    email: "Email",
    password: "New Password ",
    permissions: "Module Permissions",
    cancel: "Cancel",
    save: "Save",
    creating: "Creating...",
    creatingUser: "Creating user...",
    saving: "Saving...",
    deleteConfirm: "Confirm Deletion",
    deleteMessagePrefix:
      "Are you sure you want to move this item to the Recycle Bin?",
    deleteStaffMessage:
      "Are you sure you want to move this item to the Recycle Bin?",
    role: "Role",
    edit: "Edit",
    editDisabledAccessControlOff: "Access Control is not enabled for this business owner. Ask a superadmin to enable it — only a superadmin can.",
    editDisabledOwnAccessControlOff: "Your Access Control is not enabled, so you can't edit your own profile or your staff. Ask a superadmin to enable it — only a superadmin can.",
    editDisabledOtherBusinessUser: "You can't edit other business users.",
    delete: "Delete",
    userTypeLabel: "User Type",
    superAdminUser: "Super Admin",
    adminUser: "Admin",
    businessUser: "Business user",
    staffUser: "Staff user",
    selectBusinessLabel: "Select Business",
    selectPlaceholder: "-- Select --",
    nameRequired: "Name is required",
    emailRequired: "Email is required",
    emailInvalid: "Invalid email format",
    passwordRequired: "Password is required",
    businessRequired: "Please select a business",
    selectAll: "Select All",
    unselectAll: "Unselect All",
    createdBy: "Created:",
    updatedBy: "Updated:",
    createdAt: "Created At:",
    updatedAt: "Updated At:",
    businessDetails: "Business Details",
    businessName: "Business Name",
    businessSlug: "Business Slug",
    businessEmail: "Business Email",
    businessPhone: "Business Phone",
    businessAddress: "Business Address",
    businessLogo: "Business Logo",
    uploadLogo: "Upload Logo",
    businessNameRequired: "Business name is required",
    businessSlugRequired: "Business slug is required",
    businessEmailRequired: "Business email is required",
    userDetailsTab: "User Details",
    businessProfileTab: "Business Profile",
    modulesTab: "Modules",
    staffRolesTab: "Staff Roles",
    restrictStaffRoles: "Restrict which staff roles this business can use",
    restrictStaffRolesHint:
      "When off, this business owner can assign any staff role within their own permission ceiling. When on, they can only assign the roles checked below.",
    noStaffRolesAvailable: "No staff-typed roles exist yet.",
    next: "Next",
    back: "Back",
    permissionsTab: "Permissions",
    legendInherited: "Inherited from role",
    legendAllow: "Allow override",
    legendDeny: "Deny override",
    selectModulesFirstHint: "Select at least one module on the Modules tab first.",
    searchUsers: "Search users...",
    filterByBusinessLabel: "Filter by Business",
    allBusinesses: "All businesses",
    noBusinessesFound: "No businesses found",
    filterByRoleLabel: "Filter by Role",
    noRolesFound: "No roles found",
    superAdmins: "Super Admins",
    admins: "Admins",
    businesses: "Businesses",
    unassigned: "Unassigned",
    desk: "Desk",
    door: "Door",
    businessLabel: "Business",
    roleLabel: "Role",
    noRole: "No role assigned",
    roleRequired: "Please select a role for this user",
    roleInactiveShort: "inactive",
    active: "Active",
    inactive: "Inactive",
    accountActiveHint:
      "When off, this user cannot log in at all until reactivated. Doesn't affect their data or history.",
    notAuthorizedToCreateUser:
      "You are not authorized to create users. Access Control is not enabled for your account.",
    roleOverridesTitle: "Permission Overrides",
    roleOverridesHint:
      "Checked = currently granted. Click a cell to override the role's default for that action.",
    inherited: "inherited",
    allow: "Allow",
    deny: "Deny",
    accessControlDisabled:
      "Access Control is not enabled for your account, so you cannot assign a role or manage module/permission access for this user. Contact your administrator to have it enabled.",
    canManageAccessControl: "Enable Access Control management for this user",
    canManageAccessControlHint:
      "When enabled, this business owner can assign roles and permission overrides to their own staff members from this same screen. When disabled, only a superadmin can manage this business's staff permissions.",
    canManageAccessControlHintAdmin:
      "When enabled, this admin can assign roles and permission overrides to business and staff users from this same screen. When disabled, only a superadmin can manage those users' permissions.",
  },
  ar: {
    title: "المستخدمون",
    subtitle: "عرض وإدارة المستخدمين المسجلين",
    createUser: "إنشاء مستخدم",
    editUser: "تعديل المستخدم",
    editAdminUser: "تعديل مستخدم مسؤول",
    createBusinessUser: "إنشاء مستخدم شركة",
    editBusinessUser: "تعديل مستخدم شركة",
    createAdminUser: "إنشاء مستخدم مسؤول",
    createSuperAdminUser: "إنشاء مستخدم مشرف عام",
    createStaffUser: "إنشاء مستخدم موظف",
    editStaffUser: "تعديل مستخدم موظف",
    name: "الاسم",
    email: "البريد الإلكتروني",
    password: "كلمة المرور الجديدة ",
    permissions: "صلاحيات الوحدات",
    cancel: "إلغاء",
    save: "حفظ",
    creating: "جاري الإنشاء...",
    creatingUser: "جاري إنشاء المستخدم...",
    saving: "جاري الحفظ...",
    deleteConfirm: "تأكيد الحذف",
    deleteMessagePrefix:
      "هل أنت متأكد أنك تريد نقل هذا العنصر إلى سلة المحذوفات؟",
    deleteStaffMessage:
      "هل أنت متأكد أنك تريد نقل هذا العنصر إلى سلة المحذوفات؟",
    role: "الدور",
    edit: "تعديل",
    editDisabledAccessControlOff: "التحكم بالصلاحيات غير مفعّل لصاحب هذه الشركة. يرجى طلب تفعيله من مشرف عام — فقط المشرف العام يمكنه ذلك.",
    editDisabledOwnAccessControlOff: "التحكم بالصلاحيات غير مفعّل لحسابك، لذلك لا يمكنك تعديل ملفك الشخصي أو موظفيك. يرجى طلب تفعيله من مشرف عام — فقط المشرف العام يمكنه ذلك.",
    editDisabledOtherBusinessUser: "لا يمكنك تعديل مستخدمي شركات آخرين.",
    delete: "حذف",
    userTypeLabel: "نوع المستخدم",
    superAdminUser: "مشرف عام",
    adminUser: "مسؤول",
    businessUser: "مستخدم شركة",
    staffUser: "مستخدم موظف",
    selectBusinessLabel: "اختر الشركة",
    selectPlaceholder: "-- اختر --",
    nameRequired: "الاسم مطلوب",
    emailRequired: "البريد الإلكتروني مطلوب",
    emailInvalid: "صيغة البريد الإلكتروني غير صحيحة",
    passwordRequired: "كلمة المرور مطلوبة",
    businessRequired: "يرجى اختيار الشركة",
    selectAll: "تحديد الكل",
    unselectAll: "إلغاء تحديد الكل",
    businessDetails: "تفاصيل الشركة",
    businessName: "اسم الشركة",
    businessSlug: "معرف الشركة",
    businessEmail: "البريد الإلكتروني للشركة",
    businessPhone: "هاتف الشركة",
    businessAddress: "عنوان الشركة",
    businessLogo: "شعار الشركة",
    uploadLogo: "تحميل الشعار",
    businessNameRequired: "اسم الشركة مطلوب",
    businessSlugRequired: "معرف الشركة مطلوب",
    businessEmailRequired: "البريد الإلكتروني للشركة مطلوب",
    createdBy: "أنشئ:",
    updatedBy: "حدث:",
    createdAt: "تاريخ الإنشاء:",
    updatedAt: "تاريخ التحديث:",
    userDetailsTab: "تفاصيل المستخدم",
    businessProfileTab: "ملف الشركة",
    modulesTab: "الوحدات",
    staffRolesTab: "أدوار الموظفين",
    restrictStaffRoles: "تقييد أدوار الموظفين التي يمكن لهذه الشركة استخدامها",
    restrictStaffRolesHint:
      "عند الإيقاف، يمكن لصاحب هذه الشركة تعيين أي دور موظف ضمن سقف صلاحياته الخاص. عند التفعيل، يمكنه فقط تعيين الأدوار المحددة أدناه.",
    noStaffRolesAvailable: "لا توجد أدوار موظفين معرّفة بعد.",
    next: "التالي",
    back: "رجوع",
    permissionsTab: "الصلاحيات",
    legendInherited: "موروث من الدور",
    legendAllow: "استثناء بالسماح",
    legendDeny: "استثناء بالرفض",
    selectModulesFirstHint: "يرجى اختيار وحدة واحدة على الأقل من تبويب الوحدات أولاً.",
    searchUsers: "ابحث عن المستخدمين...",
    filterByBusinessLabel: "تصفية حسب الشركة",
    allBusinesses: "كل الشركات",
    noBusinessesFound: "لم يتم العثور على شركات",
    filterByRoleLabel: "تصفية حسب الدور",
    noRolesFound: "لم يتم العثور على أدوار",
    superAdmins: "المشرفون العامون",
    admins: "المسؤولون",
    businesses: "الشركات",
    unassigned: "غير مُعيّن",
    desk: "مكتب",
    door: "باب",
    businessLabel: "شركة",
    roleLabel: "الدور",
    noRole: "لم يتم تعيين دور",
    roleRequired: "يرجى اختيار دور لهذا المستخدم",
    roleInactiveShort: "غير مفعل",
    active: "مفعّل",
    inactive: "غير مفعل",
    accountActiveHint:
      "عند الإيقاف، لن يتمكن هذا المستخدم من تسجيل الدخول إطلاقًا حتى يُعاد تفعيله. لا يؤثر هذا على بياناته أو سجله.",
    notAuthorizedToCreateUser:
      "غير مصرح لك بإنشاء مستخدمين. لم يتم تفعيل التحكم بالصلاحيات لحسابك.",
    roleOverridesTitle: "استثناءات الصلاحيات",
    roleOverridesHint:
      "محدد = ممنوح حاليًا. انقر على الخلية لتجاوز الإعداد الافتراضي للدور لهذا الإجراء.",
    inherited: "موروث",
    allow: "سماح",
    deny: "رفض",
    accessControlDisabled:
      "التحكم بالصلاحيات غير مفعل لحسابك، لذا لا يمكنك تعيين دور أو إدارة الوحدات/الصلاحيات لهذا المستخدم. تواصل مع المشرف لتفعيله.",
    canManageAccessControl: "تفعيل إدارة التحكم بالصلاحيات لهذا المستخدم",
    canManageAccessControlHint:
      "عند التفعيل، يمكن لمالك هذا العمل تعيين الأدوار وتجاوزات الصلاحيات لموظفيه من هذه الشاشة نفسها. عند التعطيل، يمكن فقط للمشرف العام إدارة صلاحيات موظفي هذا العمل.",
    canManageAccessControlHintAdmin:
      "عند التفعيل، يمكن لهذا المشرف تعيين الأدوار وتجاوزات الصلاحيات لمستخدمي الأعمال والموظفين من هذه الشاشة نفسها. عند التعطيل، يمكن فقط للمشرف العام إدارة صلاحيات هؤلاء المستخدمين.",
  },
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const searchParams = useSearchParams();
  const urlSearchApplied = useRef(false);
  const isBusinessUser = currentUser?.role === "business";
  const isSuperAdmin = currentUser?.role === "superadmin";
  const isAdminOrSuperAdmin = ["admin", "superadmin"].includes(
    currentUser?.role || ""
  );
  // Whether this actor may create ANY user at all — a business/admin actor
  // without canManageAccessControl is blocked from creating users entirely
  // now that role selection is mandatory (see UserFormModal.js's
  // isAuthorizedToCreate, which applies the same rule once a specific
  // userType is chosen inside the modal).
  const canCreateAnyUser =
    isSuperAdmin ||
    (["business", "admin"].includes(currentUser?.role || "") &&
      !!currentUser?.canManageAccessControl);
  const { dir, align, language, t } = useI18nLayout(translations);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [groupedUsers, setGroupedUsers] = useState({});
  const [businesses, setBusinesses] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  useEffect(() => {
    if (urlSearchApplied.current) return;
    const q = searchParams.get("search");
    if (q != null && String(q).trim() !== "") {
      setSearchQuery(String(q).trim());
    }
    urlSearchApplied.current = true;
  }, [searchParams]);

  const handleModalClose = useCallback(() => setModalOpen(false), []);

  useEffect(() => {
    fetchUsers();

    if (isAdminOrSuperAdmin) {
      getAllBusinesses().then((res) => {
        if (Array.isArray(res)) {
          setBusinesses(res);
        } else if (Array.isArray(res?.data)) {
          setBusinesses(res.data);
        } else if (Array.isArray(res?.businesses)) {
          setBusinesses(res.businesses);
        } else {
          setBusinesses([]); // fail-safe
        }
      });
      // Unfiltered by userType — this filter spans every group on the page
      // (super admins, admins, and every business's staff/owners), not one
      // specific create/edit target's role select.
      getRoles().then((res) => {
        if (Array.isArray(res)) setRoles(res);
        else if (Array.isArray(res?.data)) setRoles(res.data);
        else setRoles([]);
      });
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsPageLoading(true);

    const rawUsers = isBusinessUser
      ? await getAllStaffUsers(currentUser?.business?._id)
      : await getAllUsers({ scope: "admins" });

    if (isBusinessUser) {
      setGroupedUsers({ [currentUser.business.name]: rawUsers });
      setIsPageLoading(false);
      return;
    }

    const groups = {
      "Super Admins": [],
      Admins: [],
      Unassigned: [],
    };

    for (const user of rawUsers) {
      if (user.role === "superadmin") {
        groups["Super Admins"].push(user);
        continue;
      }
      if (user.role === "admin") {
        groups["Admins"].push(user);
      } else if (!user.business) {
        groups["Unassigned"].push(user);
      } else {
        const businessName = user.business.name;
        if (!groups[businessName]) groups[businessName] = [];
        groups[businessName].push(user);
      }
    }

    const orderedGroups = {};
    if (currentUser?.role === "superadmin" || currentUser?.role === "admin") {
      if (groups["Super Admins"].length) {
        orderedGroups["Super Admins"] = groups["Super Admins"];
      }
      if (groups["Admins"].length) {
        orderedGroups["Admins"] = groups["Admins"];
      }
    }
    for (const [key, val] of Object.entries(groups)) {
      if (
        key !== "Super Admins" &&
        key !== "Admins" &&
        key !== "Unassigned"
      ) {
        orderedGroups[key] = val;
      }
    }
    if (groups["Unassigned"].length)
      orderedGroups["Unassigned"] = groups["Unassigned"];

    setGroupedUsers(orderedGroups);
    setIsPageLoading(false);
  }, [isBusinessUser, currentUser]);

  // Loads one business's users on demand instead of eagerly loading every
  // business up front — the previously-loaded business (if any) is dropped
  // from groupedUsers when the selection changes so stale data never lingers.
  const loadedBusinessNameRef = useRef(null);
  // Tracks the most recently *requested* businessId so a slower, older
  // in-flight fetch can detect it's been superseded and discard its own
  // result instead of clobbering whatever the latest selection already
  // loaded (two fetches racing when the filter is changed quickly).
  const requestedBusinessIdRef = useRef(null);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [businessUsersLoading, setBusinessUsersLoading] = useState(false);

  // Shared by the filter dropdown itself and by refreshUsers() below (so a
  // save/delete while a business is selected re-loads that business's users
  // instead of losing them — fetchUsers() alone only ever returns the
  // lightweight admins/superadmins scope and would otherwise wipe this
  // group out of groupedUsers entirely).
  const loadBusinessUsers = useCallback(async (business) => {
    setBusinessUsersLoading(true);
    const res = await getAllUsers({ businessId: business._id });

    // A newer selection may have started (and possibly already resolved)
    // while this request was in flight — discard this stale response.
    if (requestedBusinessIdRef.current !== business._id) return;

    const users = Array.isArray(res) ? res : res?.data || [];
    setGroupedUsers((prev) => {
      const next = { ...prev };
      if (loadedBusinessNameRef.current && loadedBusinessNameRef.current !== business.name) {
        delete next[loadedBusinessNameRef.current];
      }
      next[business.name] = users;
      return next;
    });
    loadedBusinessNameRef.current = business.name;
    setBusinessUsersLoading(false);
  }, []);

  const handleBusinessFilterChange = useCallback(async (_event, business) => {
    setSelectedBusiness(business);
    requestedBusinessIdRef.current = business?._id || null;

    if (!business) {
      // Mutate the ref outside the updater — React (Strict Mode, dev only)
      // can invoke a state updater twice to detect impurity, and mutating
      // loadedBusinessNameRef *inside* it meant the second invocation saw
      // the ref already cleared and bailed out, silently keeping the
      // stale business group.
      const previouslyLoadedName = loadedBusinessNameRef.current;
      loadedBusinessNameRef.current = null;
      if (previouslyLoadedName) {
        setGroupedUsers((prev) => {
          const next = { ...prev };
          delete next[previouslyLoadedName];
          return next;
        });
      }
      return;
    }

    await loadBusinessUsers(business);
  }, [loadBusinessUsers]);

  // fetchUsers() only ever returns the lightweight admins/superadmins scope,
  // so calling it alone after a save/delete would silently wipe out whatever
  // business group the filter dropdown had loaded. This re-applies that
  // group afterwards so the currently-filtered business's users don't vanish.
  const refreshUsers = useCallback(async () => {
    await fetchUsers();
    if (selectedBusiness) await loadBusinessUsers(selectedBusiness);
  }, [fetchUsers, selectedBusiness, loadBusinessUsers]);

  const getRoleColor = (role) =>
    ({
      superadmin: "error",
      admin: "primary",
      business: "success",
      staff: "secondary",
    })[role] || "default";

  // Desk/Door is now derived from the user's current Role name rather than
  // the removed staffType field — a live lookup (reflects the role they
  // hold right now), same semantics as before since staffType was never a
  // per-scan snapshot either.
  const getStaffScannerType = (user) => {
    const roleName = user.roleId?.name;
    if (roleName === "Desk Staff") return "desk";
    if (roleName === "Door Staff") return "door";
    return null;
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setIsEditMode(true);
    setModalOpen(true);
  };

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setIsEditMode(false);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    const res = await deleteUser(selectedUser._id);
    if (!res.error) await refreshUsers();
    setDeleteConfirm(false);
  };

  const renderUserCard = (user, isSelf = false) => {
    const canEditUser =
      currentUser?.role === "superadmin" ||
      // A business owner can't edit anything — including their own card —
      // while their own canManageAccessControl is off. Superadmin stays
      // unrestricted (they're the only one who can toggle the flag at all).
      (isSelf && (currentUser?.role !== "business" || !!currentUser?.canManageAccessControl)) ||
      (currentUser?.role === "admin" &&
        ((user.role === "business" && !!user.canManageAccessControl) ||
          user.role === "staff")) ||
      (currentUser?.role === "business" &&
        user.role === "staff" &&
        user.business?._id === currentUser?.business?._id &&
        !!currentUser?.canManageAccessControl);
    const canDeleteUser =
      currentUser?.role === "superadmin" &&
      !isSelf &&
      user.role !== "superadmin";

    return (
      <Box
        key={user._id || "self"}
        sx={{ width: { xs: "100%", sm: 360 }, maxWidth: 360, flexShrink: 0 }}
      >
        <AppCard
          elevation={3}
          sx={{
            p: 0,
            display: "flex",
            flexDirection: "column",
            borderRadius: 2,
            height: "100%",
          }}
        >
          <CardContent sx={{ p: 2, flexGrow: 1 }}>
            <Stack
              direction="row"
              spacing={2}
              sx={{
                alignItems: "flex-start",
                gap: dir === "rtl" ? "16px" : ""
              }}>
              <Avatar sx={{ width: 56, height: 56 }}>{user.name?.[0]}</Avatar>
              <Box sx={{ flexGrow: 1, ...wrapTextBox }}>
                <Typography variant="h6">{user.name}</Typography>
                <Typography variant="body2" sx={{
                  color: "text.secondary"
                }}>
                  {user.email}
                </Typography>
                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{ mt: 0.5, flexWrap: "wrap", gap: 0.5 }}
                >
                  <Chip
                    icon={
                      user.role === "admin" || user.role === "superadmin" ? (
                        <ICONS.person />
                      ) : user.role === "business" ? (
                        <ICONS.business />
                      ) : (
                        <ICONS.people />
                      )
                    }
                    label={
                      user.role === "superadmin"
                        ? "Super Admin"
                        : user.role.charAt(0).toUpperCase() + user.role.slice(1)
                    }
                    color={getRoleColor(user.role)}
                    size="small"
                    sx={{
                      ...(dir === "rtl" && {
                        "& .MuiChip-icon": {
                          marginLeft: "5px",
                          marginRight: "3px",
                        },
                      }),
                    }}
                  />
                  {user.role === "staff" && getStaffScannerType(user) && (
                    <Chip
                      icon={
                        getStaffScannerType(user) === "door" ? (
                          <ICONS.door />
                        ) : (
                          <ICONS.desk />
                        )
                      }
                      label={
                        getStaffScannerType(user).charAt(0).toUpperCase() +
                        getStaffScannerType(user).slice(1)
                      }
                      sx={{
                        bgcolor:
                          getStaffScannerType(user) === "door"
                            ? theme.palette.users.staffDoorBg
                            : theme.palette.users.staffDeskBg,
                        color: isDark ? "common.white" : "common.black",
                        "& .MuiChip-icon": {
                          color: isDark ? "common.white" : "common.black",
                          ...(dir === "rtl" && {
                            marginRight: "5px",
                            marginLeft: "8px",
                          }),
                        },
                      }}
                      size="small"
                    />
                  )}
                  <Tooltip title={user.isActive === false ? t.inactive : t.active}>
                    {user.isActive === false ? (
                      <ICONS.cancel fontSize="small" sx={{ color: "warning.main", cursor: "default", alignSelf: "center" }} />
                    ) : (
                      <ICONS.checkCircle fontSize="small" sx={{ color: "success.main", cursor: "default", alignSelf: "center" }} />
                    )}
                  </Tooltip>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
          <RecordMetadata
            createdByName={user.createdBy}
            updatedByName={user.updatedBy}
            createdAt={user.createdAt}
            updatedAt={user.updatedAt}
            locale={language === "ar" ? "ar-SA" : "en-GB"}
          />
          <CardActions
            sx={{ px: 2, pb: 2, pt: 0, justifyContent: "flex-end", mt: "auto" }}
          >
            <Tooltip
              title={
                // Ownership-absolute: a business actor can never edit ANOTHER
                // business user (co-owner) regardless of anyone's
                // canManageAccessControl flag — assertCanManageTargetOwnership
                // only ever lets a business actor manage staff. Checked first
                // so this never gets shadowed by a flag-related message that
                // isn't actually why the button is disabled here.
                !canEditUser && currentUser?.role === "business" && user.role === "business" && !isSelf
                  ? t.editDisabledOtherBusinessUser
                  : !canEditUser &&
                    currentUser?.role === "business" &&
                    !currentUser?.canManageAccessControl &&
                    (isSelf || user.role === "staff")
                    ? t.editDisabledOwnAccessControlOff
                    : !canEditUser && user.role === "business" && !isSelf && !user.canManageAccessControl
                      ? t.editDisabledAccessControlOff
                      : t.edit
              }
            >
              <span>
                <IconButton
                  color="primary"
                  onClick={() => handleOpenEdit(user)}
                  disabled={!canEditUser}
                >
                  <ICONS.edit />
                </IconButton>
              </span>
            </Tooltip>
            {canDeleteUser && (
              <Tooltip title={t.delete}>
                <IconButton
                  color="error"
                  onClick={() => {
                    setSelectedUser(user);
                    setDeleteConfirm(true);
                  }}
                >
                  <ICONS.delete />
                </IconButton>
              </Tooltip>
            )}
          </CardActions>
        </AppCard>
      </Box>
    );
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredGroupedUsers = useMemo(() => {
    if (!normalizedSearch && !selectedRoleFilter) return groupedUsers;
    return Object.fromEntries(
      Object.entries(groupedUsers)
        .map(([group, users]) => {
          const filteredUsers = users.filter((user) => {
            if (
              selectedRoleFilter &&
              String(user.roleId?._id || user.roleId || "") !== String(selectedRoleFilter._id)
            ) {
              return false;
            }
            if (!normalizedSearch) return true;
            const fields = [
              user.name,
              user.email,
              user.role,
              getStaffScannerType(user),
              user.business?.name,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();
            return fields.includes(normalizedSearch);
          });
          return [group, filteredUsers];
        })
        .filter(([, users]) => users.length > 0),
    );
  }, [groupedUsers, normalizedSearch, selectedRoleFilter]);

  const getGroupCount = (name) => filteredGroupedUsers?.[name]?.length || 0;
  // Total businesses in the system (always loaded, lightweight) — not
  // "how many business groups happen to be loaded right now", since only
  // the one selected via the business filter is ever fetched.
  const businessGroupsCount = businesses.length;
  const getGroupLabel = (group) => {
    if (group === "Super Admins") return t.superAdmins;
    if (group === "Admins") return t.admins;
    if (group === "Unassigned") return t.unassigned;
    return group;
  };

  return (
    <Container
      dir={dir}
      maxWidth={false}
      sx={{ px: { xs: 2, md: 3 } }}
    >
      <BreadcrumbsNav />
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          flexWrap: "wrap",
          alignItems: { xs: "stretch", md: "center" },
          justifyContent: "space-between",
          gap: 2,
          mb: 1,
          width: "100%",
          maxWidth: "100%",
        }}
      >
        <Box>
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: "bold",
              textAlign: align
            }}>
            {t.title}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "text.secondary",
              textAlign: align
            }}>
            {t.subtitle}
          </Typography>
        </Box>
        <Stack
          spacing={1.5}
          sx={{
            width: { xs: "100%", md: "auto" },
            maxWidth: "100%",
            flexShrink: 0,
            alignItems: { xs: "stretch", md: "flex-end" },
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{
              flexWrap: "wrap",
              gap: 1,
              width: "100%",
              justifyContent: { xs: "flex-start", md: "flex-end" }
            }}>
            {getGroupCount("Super Admins") > 0 && (
              <Chip
                label={`${t.superAdmins}: ${getGroupCount("Super Admins")}`}
                color="error"
                size="small"
                variant="outlined"
                sx={{ ml: dir === "rtl" ? 0.5 : 0, mr: dir === "rtl" ? 0 : 0.5 }}
              />
            )}
            {getGroupCount("Admins") > 0 && (
              <Chip
                label={`${t.admins}: ${getGroupCount("Admins")}`}
                color="primary"
                size="small"
                variant="outlined"
                sx={{ ml: dir === "rtl" ? 0.5 : 0, mr: dir === "rtl" ? 0 : 0.5 }}
              />
            )}
            {businessGroupsCount > 0 && (
              <Chip
                label={`${t.businesses}: ${businessGroupsCount}`}
                color="success"
                size="small"
                variant="outlined"
                sx={{ ml: dir === "rtl" ? 0.5 : 0, mr: dir === "rtl" ? 0 : 0.5 }}
              />
            )}
            {getGroupCount("Unassigned") > 0 && (
              <Chip
                label={`${t.unassigned}: ${getGroupCount("Unassigned")}`}
                color="default"
                size="small"
                variant="outlined"
                sx={{ ml: dir === "rtl" ? 0.5 : 0, mr: dir === "rtl" ? 0 : 0.5 }}
              />
            )}
          </Stack>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              flexWrap: "wrap",
              rowGap: 1,
              justifyContent: { xs: "flex-start", md: "flex-end" },
              alignItems: { xs: "stretch", sm: "center" },
            }}
          >
            <TextField
              size="small"
              placeholder={t.searchUsers}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              sx={{
                flex: { xs: "1 1 100%", sm: "1 1 auto" },
                width: { xs: "100%", sm: "auto" },
                maxWidth: "100%",
                minWidth: { sm: 220, md: 280 },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <ICONS.search sx={{ opacity: 0.7 }} />
                    </InputAdornment>
                  ),
                  sx: { width: "100%", maxWidth: "100%" },
                }
              }}
            />
            {!isBusinessUser && (
              <Autocomplete
                size="small"
                options={businesses}
                getOptionLabel={(biz) => biz.name || ""}
                isOptionEqualToValue={(opt, val) => opt._id === val._id}
                value={selectedBusiness}
                onChange={handleBusinessFilterChange}
                loading={businessUsersLoading}
                noOptionsText={t.noBusinessesFound}
                sx={{
                  width: { xs: "100%", sm: "auto" },
                  maxWidth: "100%",
                  minWidth: { sm: 220, md: 260 },
                  flexShrink: 0,
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={t.filterByBusinessLabel}
                    slotProps={{
                      ...params.slotProps,
                      input: {
                        ...params.slotProps?.input,
                        startAdornment: (
                          <InputAdornment position="start">
                            <ICONS.business sx={{ opacity: 0.7 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <>
                            {businessUsersLoading && (
                              <CircularProgress color="inherit" size={16} />
                            )}
                            {params.slotProps?.input?.endAdornment}
                          </>
                        ),
                      },
                    }}
                  />
                )}
              />
            )}
            {!isBusinessUser && (
              <Autocomplete
                size="small"
                options={roles}
                getOptionLabel={(role) => role.name || ""}
                isOptionEqualToValue={(opt, val) => opt._id === val._id}
                value={selectedRoleFilter}
                onChange={(_event, role) => setSelectedRoleFilter(role)}
                noOptionsText={t.noRolesFound}
                sx={{
                  width: { xs: "100%", sm: "auto" },
                  maxWidth: "100%",
                  minWidth: { sm: 220, md: 260 },
                  flexShrink: 0,
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={t.filterByRoleLabel}
                    slotProps={{
                      ...params.slotProps,
                      input: {
                        ...params.slotProps?.input,
                        startAdornment: (
                          <InputAdornment position="start">
                            <ICONS.adminPanel sx={{ opacity: 0.7 }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                )}
              />
            )}
            <Tooltip title={canCreateAnyUser ? "" : t.notAuthorizedToCreateUser}>
              <Box
                component="span"
                sx={{
                  display: "inline-block",
                  width: { xs: "100%", sm: "auto" },
                  flexShrink: 0,
                }}
              >
                <Button
                  variant="contained"
                  fullWidth
                  disabled={!canCreateAnyUser}
                  sx={{
                    ...getStartIconSpacing(dir),
                    whiteSpace: "nowrap",
                  }}
                  startIcon={<ICONS.add />}
                  onClick={handleOpenCreate}
                >
                  {t.createUser}
                </Button>
              </Box>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>
      <Divider sx={{ mb: 3 }} />
      {isPageLoading ? (
        <LoadingState />
      ) : (
        Object.entries(filteredGroupedUsers).map(([group, users]) => {
          const isBusinessGroup =
            !["Super Admins", "Admins", "Unassigned"].includes(group);

          const groupContent = (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "center" }}>
              {isBusinessUser &&
                group === currentUser.business.name &&
                // /auth/me (authController.js) returns the current user
                // shaped with `id`, not `_id` — every other user record in
                // this app (from getAllUsers/getAllStaffUsers) uses
                // Mongoose's native `_id`. renderUserCard and everything
                // downstream of it (handleOpenEdit, updateUser(selectedUser._id, ...))
                // assumes `_id`, so without this normalization the self-card's
                // edit save hit PUT /api/users/undefined.
                renderUserCard({ ...currentUser, _id: currentUser._id || currentUser.id }, true)}
              {users.map((user) => renderUserCard(user))}
            </Box>
          );

          if (isBusinessGroup) {
            const deskCount = users.filter(
              (u) => u.role === "staff" && getStaffScannerType(u) === "desk",
            ).length;
            const doorCount = users.filter(
              (u) => u.role === "staff" && getStaffScannerType(u) === "door",
            ).length;
            const businessCount = users.filter((u) => u.role === "business")
              .length;
            return (
              <Box key={group} sx={{ mb: 4 }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  sx={{
                    alignItems: { xs: "flex-start", sm: "center" },
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    rowGap: 0.5,
                    mb: 1,
                  }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 0.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, wordBreak: "break-word" }}>
                      {group}
                    </Typography>
                    <Chip label={`${users.length}`} size="small" variant="outlined" />
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 0.5 }}>
                    <Chip label={`${t.desk}: ${deskCount}`} size="small" variant="outlined" color="info" />
                    <Chip label={`${t.door}: ${doorCount}`} size="small" variant="outlined" color="warning" />
                    <Chip label={`${t.businessLabel}: ${businessCount}`} size="small" variant="outlined" color="success" />
                  </Stack>
                </Stack>
                {groupContent}
              </Box>
            );
          }

          return (
            <Box key={group} sx={{ mb: 4 }}>
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: "center",
                  mb: 1
                }}>
                <Typography variant="h6">{getGroupLabel(group)}</Typography>
                <Chip
                  label={`${users.length}`}
                  size="small"
                  variant="outlined"
                />
              </Stack>
              {groupContent}
            </Box>
          );
        })
      )}
      <UserFormModal
        open={modalOpen}
        onClose={handleModalClose}
        onSaved={refreshUsers}
        isEditMode={isEditMode}
        selectedUser={selectedUser}
        businesses={businesses}
        t={t}
        dir={dir}
        align={align}
        language={language}
      />
      <ConfirmationDialog
        open={deleteConfirm}
        title={t.deleteConfirm}
        message={
          selectedUser?.role === "staff"
            ? t.deleteStaffMessage
            : t.deleteMessagePrefix
        }
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
        confirmButtonText={t.delete}
        confirmButtonIcon={<ICONS.delete />}
      />
    </Container>
  );
}
