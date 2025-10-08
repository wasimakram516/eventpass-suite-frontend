"use client";

import {
  Box,
  Typography,
  Grid,
  Card,
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
} from "@mui/material";

import { useEffect, useState } from "react";
import BreadcrumbsNav from "@/components/BreadcrumbsNav";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import {
  getAllUsers,
  updateUser,
  deleteUser,
  createStaffUser,
  getAllStaffUsers,
} from "@/services/userService";
import { getAllBusinesses } from "@/services/businessService";
import { getModules } from "@/services/moduleService";
import useI18nLayout from "@/hooks/useI18nLayout";
import { useAuth } from "@/contexts/AuthContext";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { wrapTextBox } from "@/utils/wrapTextStyles";
import LoadingState from "@/components/LoadingState";
import { registerUser } from "@/services/authService"; // <-- NEW
import { createBusiness, updateBusiness } from "@/services/businessService";
import slugify from "@/utils/slugify";

const translations = {
  en: {
    title: "Users",
    subtitle: "View and manage registered users",
    createUser: "Create User",
    editUser: "Edit User",
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
  },
  ar: {
    title: "المستخدمون",
    subtitle: "عرض وإدارة المستخدمين المسجلين",
    createUser: "إنشاء مستخدم",
    editUser: "تعديل المستخدم",
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
    userDetailsTab: "تفاصيل المستخدم",
    businessProfileTab: "ملف الشركة",
    next: "التالي",
    back: "رجوع",
    permissionsTab: "الصلاحيات",
  },
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const isBusinessUser = currentUser?.role === "business";
  const { dir, align, language, t } = useI18nLayout(translations);

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

  const defaultForm = {
    name: "",
    email: "",
    password: "",
    modulePermissions: [],
    businessId: "",
    userType: "staff",
    staffType: "desk",
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
    if (currentUser?.role === "admin") getAllBusinesses().then(setBusinesses);
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
      Admins: [],
      Unassigned: [],
    };

    for (const user of rawUsers) {
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
    if (groups["Admins"].length) orderedGroups["Admins"] = groups["Admins"];
    for (const [key, val] of Object.entries(groups)) {
      if (key !== "Admins" && key !== "Unassigned") {
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
    admin: "primary",
    business: "success",
    staff: "secondary",
  }[role] || "default");

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    const businessContact = user.business?.contact || {};

    setForm({
      name: user.name,
      email: user.email,
      password: "",
      modulePermissions: user.modulePermissions || [],
      userType: user.role === "business" ? "business" : "staff",
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
      userType: currentUser?.role === "admin" ? "business" : "staff",
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
        currentUser?.role === "admin" &&
        form.userType === "staff" &&
        !form.businessId
      ) {
        newErrors.businessId = t.businessRequired;
      }
    } else if (tabIndex === 1 && form.userType === "business") {
      // Business Profile validation
      if (!form.businessName.trim()) newErrors.businessName = t.businessNameRequired;
      if (!form.businessSlug.trim()) newErrors.businessSlug = t.businessSlugRequired;
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
      currentUser?.role === "admin" &&
      form.userType === "staff" &&
      !form.businessId
    ) {
      newErrors.businessId = t.businessRequired;
    }

    // Business validations
    if (form.userType === "business") {
      if (!form.businessName.trim()) newErrors.businessName = t.businessNameRequired;
      if (!form.businessSlug.trim()) newErrors.businessSlug = t.businessSlugRequired;
      if (!form.businessEmail.trim()) {
        newErrors.businessEmail = t.businessEmailRequired;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.businessEmail)) {
        newErrors.businessEmail = t.emailInvalid;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleModalSave = async () => {
    if (!validateForm()) return;
    setLoading(true);
    let userRes = null;
    let businessRes = null;

    if (isEditMode) {
      const payload = { ...form };
      if (!form.password) delete payload.password;
      userRes = await updateUser(selectedUser._id, payload);

      if (userRes?.error) {
        setLoading(false);
        return;
      }
      if (form.userType === "business" && selectedUser.business?._id) {
        const businessPayload = new FormData();
        businessPayload.append("name", form.businessName);
        businessPayload.append("slug", form.businessSlug);
        businessPayload.append("email", form.businessEmail);
        businessPayload.append("phone", form.businessPhone);
        businessPayload.append("address", form.businessAddress);
        businessPayload.append("ownerId", selectedUser._id);
        if (form.logoFile) businessPayload.append("file", form.logoFile);

        businessRes = await updateBusiness(selectedUser.business._id, businessPayload);

        if (businessRes?.error) {
          setLoading(false);
          return;
        }
      }
    } else {
      if (currentUser?.role === "admin" && form.userType === "business") {
        userRes = await registerUser(
          form.name,
          form.email,
          form.password,
          "business",
          null,
          form.modulePermissions
        );

        if (userRes?.error) {
          setLoading(false);
          return;
        }

        if (userRes && !userRes.error) {
          const businessPayload = new FormData();
          businessPayload.append("name", form.businessName);
          businessPayload.append("slug", form.businessSlug);
          businessPayload.append("email", form.businessEmail);
          businessPayload.append("phone", form.businessPhone);
          businessPayload.append("address", form.businessAddress);
          businessPayload.append("ownerId", userRes.user.id);
          if (form.logoFile) businessPayload.append("file", form.logoFile);

          businessRes = await createBusiness(businessPayload);

          if (businessRes?.error) {
            setLoading(false);
            return;
          }
        }
      } else {
        userRes = await createStaffUser(
          form.name,
          form.email,
          form.password,
          "staff",
          currentUser?.role === "admin" ? form.businessId : currentUser.business._id,
          form.modulePermissions,
          form.staffType
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

  const renderUserCard = (user, isSelf = false) => (
    <Box
      key={user._id || "self"}
      sx={{ width: { xs: "100%", sm: 300 }, flexShrink: 0 }}
    >
      <Card
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
            sx={{ gap: dir === 'rtl' ? '16px' : '' }}
          >
            <Avatar sx={{ width: 56, height: 56 }}>{user.name?.[0]}</Avatar>
            <Box sx={{ flexGrow: 1, ...wrapTextBox }}>
              <Typography variant="h6">{user.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                <Chip
                  label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  color={getRoleColor(user.role)}
                  size="small"
                />
                {user.role === "staff" && user.staffType && (
                  <Chip
                    label={user.staffType.charAt(0).toUpperCase() + user.staffType.slice(1)}
                    sx={{
                      bgcolor: '#9c27b0',
                      color: '#ffffff',
                    }}
                    size="small"
                  />
                )}
              </Stack>
            </Box>
          </Stack>
        </CardContent>
        <CardActions
          sx={{ px: 2, pb: 2, pt: 0, justifyContent: "flex-end", mt: "auto" }}
        >
          <Tooltip title={t.edit}>
            <IconButton color="primary" onClick={() => handleOpenEdit(user)}>
              <ICONS.edit />
            </IconButton>
          </Tooltip>
          {!isSelf &&
            currentUser?.role !== "staff" &&
            user.role !== "admin" && (
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
      </Card>
    </Box>
  );

  return (
    <Container dir={dir}>
      <BreadcrumbsNav />
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          mb: 1,
          gap: 1,
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
        <Button
          variant="contained"
          sx={{
            ...getStartIconSpacing(dir),
            width: { xs: '100%', sm: 'auto' }
          }}
          startIcon={<ICONS.add />}
          onClick={handleOpenCreate}
        >
          {t.createUser}
        </Button>
      </Box>
      <Divider sx={{ mb: 3 }} />
      {isPageLoading ? (
        <LoadingState />
      ) : (
        Object.entries(groupedUsers).map(([group, users]) => (
          <Box key={group} sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              {group}
            </Typography>
            <Grid container spacing={3} justifyContent="center">
              {isBusinessUser &&
                group === currentUser.business.name &&
                renderUserCard(currentUser, true)}
              {users.map((user) => renderUserCard(user))}
            </Grid>
          </Box>
        ))
      )}

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        fullWidth
        maxWidth="md"
        dir={dir}
      >
        <DialogTitle>{isEditMode ? t.editUser : t.createUser}</DialogTitle>

        <DialogContent>
          {currentUser?.role === "admin" && !isEditMode && (
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
              >
                <MenuItem value="staff">{t.staffUser}</MenuItem>
                <MenuItem value="business">{t.businessUser}</MenuItem>
              </Select>
            </FormControl>
          )}

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2, mx: -3 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => {
                if (newValue > activeTab) {
                  // Moving forward - validate all tabs between current and target
                  let canProceed = true;
                  for (let i = activeTab; i < newValue; i++) {
                    if (!validateTabByIndex(i)) {
                      canProceed = false;
                      setActiveTab(i);
                      break;
                    }
                  }
                  if (canProceed) setActiveTab(newValue);
                } else {
                  // Moving backward - always allow
                  setActiveTab(newValue);
                }
              }}
              aria-label="user tabs"
              sx={{ px: 3 }}
            >
              <Tab label={t.userDetailsTab} />
              {form.userType === "business" && <Tab label={t.businessProfileTab} />}
              <Tab label={t.permissionsTab} />
            </Tabs>
          </Box>

          {activeTab === 0 && (
            <Box sx={{ mt: 2 }}>
              {form.userType === "staff" && (
                <FormControl fullWidth margin="normal">
                  <InputLabel id="staff-type-label">{t.staffTypeLabel}</InputLabel>
                  <Select
                    labelId="staff-type-label"
                    value={form.staffType || "desk"}
                    label={t.staffTypeLabel}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, staffType: e.target.value }))
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
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, [field]: e.target.value }))
                  }
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

              {currentUser?.role === "admin" &&
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
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, businessId: e.target.value }))
                      }
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
              <TextField
                label={t.businessName}
                value={form.businessName}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    businessName: value,
                    businessSlug: !isEditMode ? slugify(value, { lower: true }) : prev.businessSlug,
                  }));
                }}
                fullWidth
                margin="normal"
                error={!!errors.businessName}
                helperText={errors.businessName}
              />

              <TextField
                label={t.businessSlug}
                value={form.businessSlug}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, businessSlug: e.target.value }))
                }
                fullWidth
                margin="normal"
                error={!!errors.businessSlug}
                helperText={errors.businessSlug}
              />

              <TextField
                label={t.businessEmail}
                value={form.businessEmail}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, businessEmail: e.target.value }))
                }
                fullWidth
                margin="normal"
                error={!!errors.businessEmail}
                helperText={errors.businessEmail}
              />

              <TextField
                label={t.businessPhone}
                value={form.businessPhone}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, businessPhone: e.target.value }))
                }
                fullWidth
                margin="normal"
                type="tel"
              />

              <TextField
                label={t.businessAddress}
                value={form.businessAddress}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, businessAddress: e.target.value }))
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
                <Stack direction="row" spacing={2} alignItems="center">
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
            </Box>
          )}

          {((form.userType === "staff" && activeTab === 1) ||
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
                            currentUser.modulePermissions?.includes(m.key)
                          ).length
                          : availableModules.length)
                      }
                      indeterminate={
                        form.modulePermissions.length > 0 &&
                        form.modulePermissions.length !==
                        (isBusinessUser
                          ? availableModules.filter((m) =>
                            currentUser.modulePermissions?.includes(m.key)
                          ).length
                          : availableModules.length)
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          const allKeys = isBusinessUser
                            ? availableModules
                              .filter((m) =>
                                currentUser.modulePermissions?.includes(m.key)
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
                      currentUser.modulePermissions?.includes(m.key)
                    )
                    : availableModules
                  ).map((mod) => (
                    <FormControlLabel
                      key={mod.key}
                      control={
                        <Checkbox
                          checked={form.modulePermissions.includes(mod.key)}
                          onChange={() => {
                            const exists = form.modulePermissions.includes(mod.key);
                            setForm((prev) => ({
                              ...prev,
                              modulePermissions: exists
                                ? prev.modulePermissions.filter((k) => k !== mod.key)
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
            direction={{ xs: 'column-reverse', sm: 'row' }}
            spacing={2}
            sx={{ width: '100%', justifyContent: { sm: 'space-between' } }}
          >
            <Button
              variant="outlined"
              disabled={loading}
              startIcon={<ICONS.cancel />}
              onClick={() => setModalOpen(false)}
              sx={{
                ...getStartIconSpacing(dir),
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              {t.cancel}
            </Button>

            <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              {activeTab > 0 && (
                <Button
                  variant="outlined"
                  onClick={() => setActiveTab((prev) => prev - 1)}
                  disabled={loading}
                  startIcon={<ICONS.back />}
                  sx={{
                    ...getStartIconSpacing(dir),
                    flex: { xs: 1, sm: 'initial' }
                  }}
                >
                  {t.back}
                </Button>
              )}

              {((form.userType === "staff" && activeTab < 1) ||
                (form.userType === "business" && activeTab < 2)) ? (
                <Button
                  variant="contained"
                  onClick={() => {
                    if (validateCurrentTab()) {
                      setActiveTab((prev) => prev + 1);
                    }
                  }}
                  disabled={loading}
                  endIcon={<ICONS.next />}
                  sx={{ flex: { xs: 1, sm: 'initial' } }}
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
                    flex: { xs: 1, sm: 'initial' }
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
