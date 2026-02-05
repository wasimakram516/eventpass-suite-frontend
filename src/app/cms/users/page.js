"use client";

import {
  Box,
  Typography,
  Grid,
  CardContent,
  CardActions,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Container,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Chip,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
} from "@mui/material";

import { useEffect, useState } from "react";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import {
  getAllUsers,
  updateUser,
  deleteUser,
  createStaffUser,
  getAllStaffUsers,
  createBusinessUser,
  createAdminUser,
} from "@/services/userService";
import { getAllBusinesses } from "@/services/businessService";
import { getModules } from "@/services/moduleService";
import useI18nLayout from "@/hooks/useI18nLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useMessage } from "@/contexts/MessageContext";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { wrapTextBox } from "@/utils/wrapTextStyles";
import LoadingState from "@/components/LoadingState";
import { updateBusiness } from "@/services/businessService";
import slugify from "@/utils/slugify";
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
    delete: "Delete",
    userTypeLabel: "User Type",
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
    staffTypeLabel: "Staff Type",
    deskStaff: "Desk",
    doorStaff: "Door",
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
    next: "Next",
    back: "Back",
    permissionsTab: "Permissions",
    searchUsers: "Search users...",
    superAdmins: "Super Admins",
    admins: "Admins",
    businesses: "Businesses",
    unassigned: "Unassigned",
    desk: "Desk",
    door: "Door",
    businessLabel: "Business",
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
    delete: "حذف",
    userTypeLabel: "نوع المستخدم",
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
    staffTypeLabel: "نوع الموظف",
    deskStaff: " مكتب",
    doorStaff: " باب",
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
    next: "التالي",
    back: "رجوع",
    permissionsTab: "الصلاحيات",
    searchUsers: "ابحث عن المستخدمين...",
    superAdmins: "المشرفون العامون",
    admins: "المسؤولون",
    businesses: "الشركات",
    unassigned: "غير مُعيّن",
    desk: "مكتب",
    door: "باب",
    businessLabel: "شركة",
  },
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const isBusinessUser = currentUser?.role === "business";
  const isSuperAdmin = currentUser?.role === "superadmin";
  const isAdminOrSuperAdmin = ["admin", "superadmin"].includes(
    currentUser?.role || ""
  );
  const { dir, align, language, t } = useI18nLayout(translations);
  const { showMessage } = useMessage();
  const [groupedUsers, setGroupedUsers] = useState({});
  const [businesses, setBusinesses] = useState([]);
  const [availableModules, setAvailableModules] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const isEditingSuperAdmin =
    isEditMode && selectedUser?.role === "superadmin";

  const defaultForm = {
    name: "",
    email: "",
    password: "",
    modulePermissions: [],
    businessId: "",
    userType: "staff",
    staffType: "desk",
    attachToExistingBusiness: false,
    businessName: "",
    businessSlug: "",
    businessEmail: "",
    businessPhone: "",
    businessAddress: "",
    logoPreview: "",
    logoFile: null,
  };

  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchUsers();
    fetchModules();

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
    }
  }, []);

  const fetchUsers = async () => {
    setIsPageLoading(true);

    const rawUsers = isBusinessUser
      ? await getAllStaffUsers(currentUser?.business?._id)
      : await getAllUsers();

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
  };

  const fetchModules = async () => {
    const allModules = await getModules(currentUser?.role);
    setAvailableModules(allModules || []);
  };

  const getRoleColor = (role) =>
    ({
      superadmin: "error",
      admin: "primary",
      business: "success",
      staff: "secondary",
    })[role] || "default";

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    const businessContact = user.business?.contact || {};

    setForm({
      name: user.name,
      email: user.email,
      password: "",
      modulePermissions: user.modulePermissions || [],
      userType:
        user.role === "admin"
          ? "admin"
          : user.role === "business"
            ? "business"
            : "staff",
      attachToExistingBusiness: true,
      businessId: user.business?._id || "",
      staffType: user.staffType || "desk",
      businessName: user.business?.name || "",
      businessSlug: user.business?.slug || "",
      businessEmail: businessContact.email || "",
      businessPhone: businessContact.phone || "",
      businessAddress: user.business?.address || "",
      logoPreview: user.business?.logoUrl || "",
      logoFile: null,
    });
    setErrors({});
    setActiveTab(0);
    setIsEditMode(true);
    setModalOpen(true);
  };

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setForm({
      ...defaultForm,
      userType: isAdminOrSuperAdmin ? "business" : "staff",
      staffType: "desk",
    });
    setErrors({});
    setActiveTab(0);
    setIsEditMode(false);
    setModalOpen(true);
  };
  const validateTabByIndex = (tabIndex) => {
    const newErrors = {};

    if (tabIndex === 0) {
      // User Details validation
      if (!form.name.trim()) newErrors.name = t.nameRequired;
      if (!form.email.trim()) newErrors.email = t.emailRequired;
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        newErrors.email = t.emailInvalid;
      if (!isEditMode && !form.password.trim())
        newErrors.password = t.passwordRequired;

      if (
        !isEditMode &&
        isAdminOrSuperAdmin &&
        form.userType === "staff" &&
        !form.businessId
      ) {
        newErrors.businessId = t.businessRequired;
      }
    } else if (tabIndex === 1 && form.userType === "business") {
      // Business Profile validation
      if (!form.businessName.trim())
        newErrors.businessName = t.businessNameRequired;
      if (!form.businessSlug.trim())
        newErrors.businessSlug = t.businessSlugRequired;
      if (!form.businessEmail.trim()) {
        newErrors.businessEmail = t.businessEmailRequired;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.businessEmail)) {
        newErrors.businessEmail = t.emailInvalid;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const validateCurrentTab = () => {
    return validateTabByIndex(activeTab);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = t.nameRequired;
    if (!form.email.trim()) newErrors.email = t.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = t.emailInvalid;
    if (!isEditMode && !form.password.trim())
      newErrors.password = t.passwordRequired;

    if (
      !isEditMode &&
      isAdminOrSuperAdmin &&
      form.userType === "staff" &&
      !form.businessId
    ) {
      newErrors.businessId = t.businessRequired;
    }

    // Business validations
    if (form.userType === "business") {
      if (form.attachToExistingBusiness) {
        if (!form.businessId) {
          newErrors.businessId = t.businessRequired;
        }
      } else {
        if (!form.businessName.trim())
          newErrors.businessName = t.businessNameRequired;
        if (!form.businessSlug.trim())
          newErrors.businessSlug = t.businessSlugRequired;
        if (!form.businessEmail.trim()) {
          newErrors.businessEmail = t.businessEmailRequired;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.businessEmail)) {
          newErrors.businessEmail = t.emailInvalid;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleModalSave = async () => {
    const newErrors = {};

    // ---------- User validation ----------
    if (!form.name.trim()) newErrors.name = t.nameRequired;
    if (!form.email.trim()) newErrors.email = t.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = t.emailInvalid;

    if (!isEditMode && !form.password.trim())
      newErrors.password = t.passwordRequired;

    // ---------- Staff validation ----------
    if (
      !isEditMode &&
      isAdminOrSuperAdmin &&
      form.userType === "staff" &&
      !form.businessId
    ) {
      newErrors.businessId = t.businessRequired;
    }

    // ---------- Business validation (IMPORTANT FIX) ----------
    if (form.userType === "business") {
      if (form.attachToExistingBusiness) {
        if (!form.businessId) {
          newErrors.businessId = t.businessRequired;
        }
      } else {
        if (!form.businessName.trim())
          newErrors.businessName = t.businessNameRequired;
        if (!form.businessSlug.trim())
          newErrors.businessSlug = t.businessSlugRequired;
        if (!form.businessEmail.trim()) {
          newErrors.businessEmail = t.businessEmailRequired;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.businessEmail)) {
          newErrors.businessEmail = t.emailInvalid;
        }
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      showMessage(Object.values(newErrors).join(", "), "error");
      return;
    }

    setLoading(true);

    // ===================== EDIT MODE =====================
    if (isEditMode) {
      const payload = { ...form };
      if (!form.password) delete payload.password;

      const userRes = await updateUser(selectedUser._id, payload);
      if (userRes?.error) {
        setLoading(false);
        return;
      }

      // ONLY update business if NOT attaching
      if (
        form.userType === "business" &&
        !form.attachToExistingBusiness &&
        selectedUser.business?._id
      ) {
        const businessPayload = new FormData();
        businessPayload.append("name", form.businessName);
        businessPayload.append("slug", form.businessSlug);
        businessPayload.append("email", form.businessEmail);
        businessPayload.append("phone", form.businessPhone);
        businessPayload.append("address", form.businessAddress);
        if (form.logoFile) businessPayload.append("file", form.logoFile);

        const businessRes = await updateBusiness(
          selectedUser.business._id,
          businessPayload,
        );

        if (businessRes?.error) {
          setLoading(false);
          return;
        }
      }
    }

    // ===================== CREATE MODE =====================
    else {
      if (isSuperAdmin && form.userType === "admin") {
        const res = await createAdminUser({
          name: form.name,
          email: form.email,
          password: form.password,
          modulePermissions: form.modulePermissions || [],
        });
        if (res?.error) {
          setLoading(false);
          return;
        }
      } else if (isAdminOrSuperAdmin && form.userType === "business") {
        const res = await createBusinessUser({
          name: form.name,
          email: form.email,
          password: form.password,
          modulePermissions: form.modulePermissions,

          attachToExistingBusiness: form.attachToExistingBusiness,
          businessId: form.attachToExistingBusiness
            ? form.businessId
            : undefined,

          business: form.attachToExistingBusiness
            ? undefined
            : {
              name: form.businessName,
              slug: form.businessSlug,
              email: form.businessEmail,
              phone: form.businessPhone,
              address: form.businessAddress,
            },
        });

        if (res?.error) {
          setLoading(false);
          return;
        }
      } else {
        // Staff creation
        const userRes = await createStaffUser(
          form.name,
          form.email,
          form.password,
          "staff",
          isAdminOrSuperAdmin ? form.businessId : currentUser.business._id,
          form.modulePermissions,
          form.staffType,
        );

        if (userRes?.error) {
          setLoading(false);
          return;
        }
      }
    }

    await fetchUsers();
    setModalOpen(false);
    setLoading(false);
  };

  const handleDelete = async () => {
    const res = await deleteUser(selectedUser._id);
    if (!res.error) await fetchUsers();
    setDeleteConfirm(false);
  };

  const renderUserCard = (user, isSelf = false) => {
    const canEditUser =
      currentUser?.role === "superadmin" ||
      isSelf ||
      (currentUser?.role === "admin" &&
        (user.role === "business" || user.role === "staff"));
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
              alignItems="flex-start"
              sx={{ gap: dir === "rtl" ? "16px" : "" }}
            >
              <Avatar sx={{ width: 56, height: 56 }}>{user.name?.[0]}</Avatar>
              <Box sx={{ flexGrow: 1, ...wrapTextBox }}>
                <Typography variant="h6">{user.name}</Typography>
                <Typography variant="body2" color="text.secondary">
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
                  {user.role === "staff" && user.staffType && (
                    <Chip
                      icon={
                        user.staffType === "door" ? (
                          <ICONS.door />
                        ) : (
                          <ICONS.desk />
                        )
                      }
                      label={
                        user.staffType.charAt(0).toUpperCase() +
                        user.staffType.slice(1)
                      }
                      sx={{
                        bgcolor:
                          user.staffType === "door" ? "#e1bee7" : "#4fc3f7",
                        color: "#000000",
                        "& .MuiChip-icon": {
                          color: "#000000",
                          ...(dir === "rtl" && {
                            marginRight: "5px",
                            marginLeft: "8px",
                          }),
                        },
                      }}
                      size="small"
                    />
                  )}
                </Stack>
              </Box>
            </Stack>
          </CardContent>
          <RecordMetadata
            createdBy={user.createdBy}
            updatedBy={user.updatedBy}
            createdAt={user.createdAt}
            updatedAt={user.updatedAt}
            locale={language === "ar" ? "ar-SA" : "en-GB"}
            createdByLabel={t.createdBy}
            createdAtLabel={t.createdAt}
            updatedByLabel={t.updatedBy}
            updatedAtLabel={t.updatedAt}
          />
          <CardActions
            sx={{ px: 2, pb: 2, pt: 0, justifyContent: "flex-end", mt: "auto" }}
          >
            <Tooltip title={t.edit}>
              <IconButton
                color="primary"
                onClick={() => handleOpenEdit(user)}
                disabled={!canEditUser}
              >
                <ICONS.edit />
              </IconButton>
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
  const filteredGroupedUsers = normalizedSearch
    ? Object.fromEntries(
      Object.entries(groupedUsers)
        .map(([group, users]) => {
          const filteredUsers = users.filter((user) => {
            const fields = [
              user.name,
              user.email,
              user.role,
              user.staffType,
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
    )
    : groupedUsers;

  const getGroupCount = (name) => filteredGroupedUsers?.[name]?.length || 0;
  const businessGroupNames = Object.keys(filteredGroupedUsers || {}).filter(
    (group) => !["Super Admins", "Admins", "Unassigned"].includes(group),
  );
  const businessGroupsCount = businessGroupNames.length;
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
      sx={{ maxWidth: "1500px", px: { xs: 2, md: 3 } }}
    >
      <BreadcrumbsNav />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr auto" },
          alignItems: "center",
          gap: 2,
          mb: 1,
          width: "100%",
          maxWidth: "100%",
        }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight="bold"
            gutterBottom
            textAlign={align}
          >
            {t.title}
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign={align}>
            {t.subtitle}
          </Typography>
        </Box>
        <Stack
          spacing={1.5}
          sx={{
            width: "100%",
            maxWidth: "100%",
            alignItems: { xs: "stretch", md: "flex-end" },
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            sx={{
              gap: 1,
              width: "100%",
              justifyContent: { xs: "flex-start", md: "flex-end" },
            }}
          >
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
                flex: 1,
                width: "100%",
                maxWidth: "100%",
                minWidth: { sm: 220, md: 280 },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ICONS.search sx={{ opacity: 0.7 }} />
                  </InputAdornment>
                ),
                sx: { width: "100%", maxWidth: "100%" },
              }}
            />
            <Button
              variant="contained"
              fullWidth
              sx={{
                ...getStartIconSpacing(dir),
                width: { xs: "100%", sm: "auto" },
                maxWidth: "100%",
                minWidth: 0,
              }}
              startIcon={<ICONS.add />}
              onClick={handleOpenCreate}
            >
              {t.createUser}
            </Button>
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
            <Grid container spacing={3} justifyContent="center">
              {isBusinessUser &&
                group === currentUser.business.name &&
                renderUserCard(currentUser, true)}
              {users.map((user) => renderUserCard(user))}
            </Grid>
          );

          if (isBusinessGroup) {
            const staffCount = users.filter((u) => u.role === "staff").length;
            const deskCount = users.filter(
              (u) => u.role === "staff" && u.staffType === "desk",
            ).length;
            const doorCount = users.filter(
              (u) => u.role === "staff" && u.staffType === "door",
            ).length;
            const businessCount = users.filter((u) => u.role === "business")
              .length;
            return (
              <Accordion
                key={group}
                disableGutters
                elevation={0}
                sx={{
                  mb: 2,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  overflow: "hidden",
                  bgcolor: "background.paper",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                  "&:before": { display: "none" },
                  "&.Mui-expanded": {
                    boxShadow: "0 10px 26px rgba(0,0,0,0.10)",
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ICONS.down />}
                  sx={{
                    px: 2.5,
                    py: 0.75,
                    bgcolor: "rgba(0, 119, 182, 0.06)",
                    "&.Mui-expanded": { minHeight: 52 },
                    "& .MuiAccordionSummary-content": {
                      my: 1,
                      gap: 0.75,
                      justifyContent: { xs: "flex-start", sm: "space-between" },
                      width: "100%",
                      flexDirection: { xs: "column", sm: "row" },
                      alignItems: { xs: "flex-start", sm: "center" },
                    },
                    "& .MuiAccordionSummary-expandIconWrapper": {
                      alignSelf: { xs: "flex-start", sm: "center" },
                      mt: { xs: 0.5, sm: 0 },
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ minWidth: 0, flexWrap: "wrap", rowGap: 0.5 }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, wordBreak: "break-word" }}
                    >
                      {group}
                    </Typography>
                    <Chip
                      label={`${users.length}`}
                      size="small"
                      variant="outlined"
                      sx={{
                        ml: dir === "rtl" ? 0.75 : 0,
                        mr: dir === "rtl" ? 0 : 0.75,
                      }}
                    />
                  </Stack>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{
                      width: { xs: "100%", sm: "auto" },
                      flexWrap: "wrap",
                      rowGap: 0.5,
                    }}
                  >
                    <Chip
                      label={`${t.desk}: ${deskCount}`}
                      size="small"
                      variant="outlined"
                      color="info"
                      sx={{
                        ml: dir === "rtl" ? 0.75 : 0,
                        mr: dir === "rtl" ? 0 : 0.75,
                      }}
                    />
                    <Chip
                      label={`${t.door}: ${doorCount}`}
                      size="small"
                      variant="outlined"
                      color="warning"
                      sx={{
                        ml: dir === "rtl" ? 0.75 : 0,
                        mr: dir === "rtl" ? 0 : 0.75,
                      }}
                    />
                    <Chip
                      label={`${t.businessLabel}: ${businessCount}`}
                      size="small"
                      variant="outlined"
                      color="success"
                      sx={{
                        ml: dir === "rtl" ? 0.75 : 0,
                        mr: dir === "rtl" ? 0 : 0.75,
                      }}
                    />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 2.5, pb: 2.5, pt: 1.5 }}>
                  {groupContent}
                </AccordionDetails>
              </Accordion>
            );
          }

          return (
            <Box key={group} sx={{ mb: 4 }}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 1 }}
              >
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

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        fullWidth
        maxWidth="md"
        dir={dir}
      >
        <DialogTitle sx={{ pr: 6 }}>
          {isEditMode
            ? selectedUser?.role === "admin" || selectedUser?.role === "superadmin"
              ? t.editAdminUser
              : selectedUser?.role === "business"
                ? t.editBusinessUser
                : t.editStaffUser
            : form.userType === "admin"
              ? t.createAdminUser
              : form.userType === "business"
                ? t.createBusinessUser
                : t.createStaffUser}
          <IconButton
            onClick={() => setModalOpen(false)}
            sx={{
              position: "absolute",
              ...(dir === "rtl" ? { left: 8 } : { right: 8 }),
              top: 8,
              color: "text.secondary",
              border: "1px solid",
              borderColor: "#0077b6",
              "&:hover": {
                bgcolor: "#0077b6",
                color: "primary.contrastText",
              },
            }}
          >
            <ICONS.close />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {isAdminOrSuperAdmin && !isEditMode && (
            <FormControl fullWidth margin="normal">
              <InputLabel id="user-type-label">{t.userTypeLabel}</InputLabel>
              <Select
                labelId="user-type-label"
                value={form.userType}
                label={t.userTypeLabel}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, userType: e.target.value }));
                  setActiveTab(0);
                }}
                sx={{
                  ...(dir === "rtl" && {
                    "& .MuiSelect-select": {
                      textAlign: "left",
                      paddingRight: "32px",
                    },
                  }),
                }}
              >
                {isSuperAdmin && (
                  <MenuItem value="admin">{t.adminUser}</MenuItem>
                )}
                <MenuItem value="staff">{t.staffUser}</MenuItem>
                <MenuItem value="business">{t.businessUser}</MenuItem>
              </Select>
            </FormControl>
          )}

          {(form.userType === "business" ||
            form.userType === "admin" ||
            !isEditMode ||
            selectedUser?.role !== "admin") && (
              <Box
                sx={{ borderBottom: 1, borderColor: "divider", mt: 2, mx: -3 }}
              >
                <Tabs
                  value={activeTab}
                  onChange={(e, newValue) => setActiveTab(newValue)}
                  aria-label="user tabs"
                  sx={{ px: 3 }}
                >
                  <Tab label={t.userDetailsTab} />
                  {form.userType === "business" && (
                    <Tab label={t.businessProfileTab} />
                  )}
                  {(form.userType === "staff" ||
                    form.userType === "admin" ||
                    form.userType === "business") &&
                    !isEditingSuperAdmin && (
                      <Tab label={t.permissionsTab} />
                    )}
                </Tabs>
              </Box>
            )}

          {activeTab === 0 && (
            <Box sx={{ mt: 2 }}>
              {(form.userType === "staff" &&
                (!isEditMode || selectedUser?.role === "staff")) && (
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="staff-type-label">
                      {t.staffTypeLabel}
                    </InputLabel>
                    <Select
                      labelId="staff-type-label"
                      value={form.staffType || "desk"}
                      label={t.staffTypeLabel}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          staffType: e.target.value,
                        }))
                      }
                    >
                      <MenuItem value="desk">{t.deskStaff}</MenuItem>
                      <MenuItem value="door">{t.doorStaff}</MenuItem>
                    </Select>
                  </FormControl>
                )}

              {["name", "email", "password"].map((field) => (
                <TextField
                  key={field}
                  label={t[field]}
                  name={field}
                  value={form[field]}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, [field]: e.target.value }));
                    if (errors[field]) {
                      setErrors((prev) => ({ ...prev, [field]: "" }));
                    }
                  }}
                  fullWidth
                  margin="normal"
                  type={
                    field === "password"
                      ? showPassword
                        ? "text"
                        : "password"
                      : "text"
                  }
                  error={!!errors[field]}
                  helperText={errors[field] || ""}
                  InputProps={
                    field === "password"
                      ? {
                        endAdornment: (
                          <IconButton
                            onClick={() => setShowPassword((prev) => !prev)}
                            edge="end"
                          >
                            {showPassword ? <ICONS.hide /> : <ICONS.view />}
                          </IconButton>
                        ),
                      }
                      : {}
                  }
                />
              ))}

              {isAdminOrSuperAdmin &&
                !isEditMode &&
                form.userType === "staff" && (
                  <FormControl
                    fullWidth
                    margin="normal"
                    error={!!errors.businessId}
                  >
                    <InputLabel id="business-select-label">
                      {t.selectBusinessLabel}
                    </InputLabel>
                    <Select
                      labelId="business-select-label"
                      value={form.businessId || ""}
                      label={t.selectBusinessLabel}
                      onChange={(e) => {
                        setForm((prev) => ({
                          ...prev,
                          businessId: e.target.value,
                        }));
                        if (errors.businessId) {
                          setErrors((prev) => ({ ...prev, businessId: "" }));
                        }
                      }}
                    >
                      <MenuItem value="">
                        <em>{t.selectPlaceholder}</em>
                      </MenuItem>
                      {businesses.map((biz) => (
                        <MenuItem key={biz._id} value={biz._id}>
                          {biz.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.businessId && (
                      <Typography variant="caption" color="error">
                        {errors.businessId}
                      </Typography>
                    )}
                  </FormControl>
                )}
            </Box>
          )}

          {form.userType === "business" && activeTab === 1 && (
            <Box sx={{ mt: 2 }}>
              {isAdminOrSuperAdmin && (
                <FormControlLabel
                  sx={{ mb: 2 }}
                  control={
                    <Checkbox
                      checked={form.attachToExistingBusiness}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          attachToExistingBusiness: e.target.checked,
                          businessId: "",
                        }))
                      }
                    />
                  }
                  label="Attach to existing business"
                />
              )}
              {form.attachToExistingBusiness && (
                <FormControl fullWidth margin="normal">
                  <InputLabel>Select Business</InputLabel>
                  <Select
                    value={form.businessId}
                    label="Select Business"
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        businessId: e.target.value,
                      }))
                    }
                  >
                    {businesses.map((biz) => (
                      <MenuItem key={biz._id} value={biz._id}>
                        {biz.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              {!form.attachToExistingBusiness && (
                <>
                  <TextField
                    label={t.businessName}
                    value={form.businessName}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        businessName: value,
                        businessSlug: !isEditMode
                          ? slugify(value, { lower: true })
                          : prev.businessSlug,
                      }));
                    }}
                    fullWidth
                    margin="normal"
                  />

                  <TextField
                    label={t.businessSlug}
                    value={form.businessSlug}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        businessSlug: e.target.value,
                      }))
                    }
                    fullWidth
                    margin="normal"
                  />

                  <TextField
                    label={t.businessEmail}
                    value={form.businessEmail}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        businessEmail: e.target.value,
                      }))
                    }
                    fullWidth
                    margin="normal"
                  />

                  <TextField
                    label={t.businessPhone}
                    value={form.businessPhone}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        businessPhone: e.target.value,
                      }))
                    }
                    fullWidth
                    margin="normal"
                  />

                  <TextField
                    label={t.businessAddress}
                    value={form.businessAddress}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        businessAddress: e.target.value,
                      }))
                    }
                    multiline
                    rows={2}
                    fullWidth
                    margin="normal"
                  />
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {t.businessLogo}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      sx={{ gap: dir === "rtl" ? "16px" : "" }}
                    >
                      <Avatar
                        src={form.logoPreview}
                        alt="Preview"
                        sx={{ width: 64, height: 64 }}
                      />
                      <Button variant="outlined" component="label" size="small">
                        {t.uploadLogo}
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setForm((prev) => ({
                                ...prev,
                                logoPreview: reader.result,
                                logoFile: file,
                              }));
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </Button>
                    </Stack>
                  </Box>
                </>
              )}
            </Box>
          )}

          {!isEditingSuperAdmin &&
            ((form.userType === "staff" && activeTab === 1) ||
              (form.userType === "admin" && activeTab === 1) ||
              (form.userType === "business" && activeTab === 2)) && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom textAlign={align}>
                  {t.permissions}
                </Typography>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={
                        form.modulePermissions.length ===
                        (isBusinessUser
                          ? availableModules.filter((m) =>
                            currentUser.modulePermissions?.includes(m.key),
                          ).length
                          : availableModules.length)
                      }
                      indeterminate={
                        form.modulePermissions.length > 0 &&
                        form.modulePermissions.length !==
                        (isBusinessUser
                          ? availableModules.filter((m) =>
                            currentUser.modulePermissions?.includes(m.key),
                          ).length
                          : availableModules.length)
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          const allKeys = isBusinessUser
                            ? availableModules
                              .filter((m) =>
                                currentUser.modulePermissions?.includes(m.key),
                              )
                              .map((m) => m.key)
                            : availableModules.map((m) => m.key);
                          setForm((prev) => ({
                            ...prev,
                            modulePermissions: allKeys,
                          }));
                        } else {
                          setForm((prev) => ({
                            ...prev,
                            modulePermissions: [],
                          }));
                        }
                      }}
                    />
                  }
                  label={
                    form.modulePermissions.length ? t.unselectAll : t.selectAll
                  }
                />

                <FormGroup>
                  {(isBusinessUser
                    ? availableModules.filter((m) =>
                      currentUser.modulePermissions?.includes(m.key),
                    )
                    : availableModules
                  ).map((mod) => (
                    <FormControlLabel
                      key={mod.key}
                      control={
                        <Checkbox
                          checked={form.modulePermissions.includes(mod.key)}
                          onChange={() => {
                            const exists = form.modulePermissions.includes(
                              mod.key,
                            );
                            setForm((prev) => ({
                              ...prev,
                              modulePermissions: exists
                                ? prev.modulePermissions.filter(
                                  (k) => k !== mod.key,
                                )
                                : [...prev.modulePermissions, mod.key],
                            }));
                          }}
                        />
                      }
                      label={mod.labels?.[language] || mod.key}
                    />
                  ))}
                </FormGroup>
              </Box>
            )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Stack
            direction="row"
            spacing={2}
            sx={{ width: "100%", justifyContent: "flex-end" }}
          >
            <Stack
              direction="row"
              spacing={2}
              sx={{
                width: { xs: "100%", sm: "auto" },
                gap: dir === "rtl" ? "16px" : "",
              }}
            >
              {activeTab > 0 && (
                <Button
                  variant="outlined"
                  onClick={() => setActiveTab((prev) => prev - 1)}
                  disabled={loading}
                  startIcon={dir === "rtl" ? <ICONS.next /> : <ICONS.back />}
                  sx={{
                    ...getStartIconSpacing(dir),
                    flex: { xs: 1, sm: "initial" },
                  }}
                >
                  {t.back}
                </Button>
              )}

              {((form.userType === "staff" || form.userType === "admin") &&
                activeTab < 1) ||
                (form.userType === "business" && activeTab < 2) ? (
                <Button
                  variant="contained"
                  onClick={() => {
                    if (validateCurrentTab()) {
                      setActiveTab((prev) => prev + 1);
                    }
                  }}
                  disabled={loading}
                  startIcon={dir === "rtl" ? <ICONS.back /> : <ICONS.next />}
                  sx={{
                    ...getStartIconSpacing(dir),
                    flex: { xs: 1, sm: "initial" },
                  }}
                >
                  {t.next}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleModalSave}
                  disabled={loading}
                  startIcon={<ICONS.save />}
                  sx={{
                    ...getStartIconSpacing(dir),
                    flex: { xs: 1, sm: "initial" },
                  }}
                >
                  {loading ? (isEditMode ? t.saving : t.creating) : t.save}
                </Button>
              )}
            </Stack>
          </Stack>
        </DialogActions>
      </Dialog>

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
