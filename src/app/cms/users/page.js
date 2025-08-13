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

const translations = {
  en: {
    title: "Users",
    subtitle: "View and manage registered users",
    createUser: "Create User",
    editUser: "Edit User",
    name: "Name",
    email: "Email",
    password: "New Password (optional)",
    permissions: "Module Permissions",
    cancel: "Cancel",
    save: "Save",
    creating: "Creating...",
    creatingUser: "Creating user...",
    saving: "Saving...",
    deleteConfirm: "Confirm Deletion",
    deleteMessagePrefix:
      "Are you sure you want to delete this user? This will also delete all their associated businesses and related data, and cannot be undone.",
    deleteStaffMessage:
      "Are you sure you want to delete this user? This will also delete all their related data, and cannot be undone.",
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
  },
  ar: {
    title: "المستخدمون",
    subtitle: "عرض وإدارة المستخدمين المسجلين",
    createUser: "إنشاء مستخدم",
    editUser: "تعديل المستخدم",
    name: "الاسم",
    email: "البريد الإلكتروني",
    password: "كلمة المرور الجديدة (اختياري)",
    permissions: "صلاحيات الوحدات",
    cancel: "إلغاء",
    save: "حفظ",
    creating: "جاري الإنشاء...",
    creatingUser: "جاري إنشاء المستخدم...",
    saving: "جاري الحفظ...",
    deleteConfirm: "تأكيد الحذف",
    deleteMessagePrefix:
      "هل أنت متأكد أنك تريد حذف هذا المستخدم؟ سيؤدي هذا أيضًا إلى حذف جميع الشركات المرتبطة به والبيانات ذات الصلة، ولا يمكن التراجع عن هذا الإجراء.",
    deleteStaffMessage:
      "هل أنت متأكد أنك تريد حذف هذا المستخدم؟ سيؤدي هذا أيضًا إلى حذف البيانات ذات الصلة، ولا يمكن التراجع عن هذا الإجراء.",
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

  const defaultForm = {
    name: "",
    email: "",
    password: "",
    modulePermissions: [],
    businessId: "",
    userType: "staff",
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
    const allModules = await getModules();
    setAvailableModules(allModules);
  };

  const getRoleColor = (role) =>
    ({
      admin: "primary",
      business: "success",
      staff: "secondary",
    }[role] || "default");

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      modulePermissions: user.modulePermissions || [],
      // No userType change on edit
      userType: user.role === "business" ? "business" : "staff",
      businessId: user.business?._id || "",
    });
    setErrors({});
    setIsEditMode(true);
    setModalOpen(true);
  };

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setForm({
      ...defaultForm,
      // Admin sees dropdown; business users always create staff under their business
      userType: currentUser?.role === "admin" ? "business" : "staff",
    });
    setErrors({});
    setIsEditMode(false);
    setModalOpen(true);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = t.nameRequired;
    if (!form.email.trim()) newErrors.email = t.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = t.emailInvalid;
    if (!isEditMode && !form.password.trim())
      newErrors.password = t.passwordRequired;

    // Only require businessId when creating a STAFF user as admin
    if (
      !isEditMode &&
      currentUser?.role === "admin" &&
      form.userType === "staff" &&
      !form.businessId
    ) {
      newErrors.businessId = t.businessRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleModalSave = async () => {
    if (!validateForm()) return;
    setLoading(true);
    let res = null;

    if (isEditMode) {
      const payload = { ...form };
      if (!form.password) delete payload.password;
      res = await updateUser(selectedUser._id, payload);
    } else {
      if (currentUser?.role === "admin" && form.userType === "business") {
        // Register a new BUSINESS user via /auth/register
        res = await registerUser(
          form.name,
          form.email,
          form.password,
          "business",
          null,
          form.modulePermissions
        );
      } else {
        // Create STAFF user (admin to any selected business, or business owner to own business)
        res = await createStaffUser(
          form.name,
          form.email,
          form.password,
          "staff",
          currentUser?.role === "admin"
            ? form.businessId
            : currentUser.business._id,
          form.modulePermissions
        );
      }
    }

    if (!res?.error) await fetchUsers();
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
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Avatar sx={{ width: 56, height: 56 }}>{user.name?.[0]}</Avatar>
            <Box sx={{ flexGrow: 1, ...wrapTextBox }}>
              <Typography variant="h6">{user.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
              <Chip
                label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                color={getRoleColor(user.role)}
                size="small"
                sx={{ mt: 0.5 }}
              />
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
          {!isSelf && currentUser?.role !== "staff" && (
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
          sx={getStartIconSpacing(dir)}
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
        dir={dir}
      >
        <DialogTitle>{isEditMode ? t.editUser : t.createUser}</DialogTitle>
        <DialogContent>
          {/* Admin-only: choose user type when creating */}
          {currentUser?.role === "admin" && !isEditMode && (
            <FormControl fullWidth margin="normal">
              <InputLabel id="user-type-label">{t.userTypeLabel}</InputLabel>
              <Select
                labelId="user-type-label"
                value={form.userType}
                label={t.userTypeLabel}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, userType: e.target.value }))
                }
              >
                <MenuItem value="staff">{t.staffUser}</MenuItem>
                <MenuItem value="business">{t.businessUser}</MenuItem>
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

          {/* Only require/select business for STAFF when admin is creating */}
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

          {(selectedUser?.role === "business" ||
            selectedUser?.role === "staff" ||
            !selectedUser) && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom textAlign={align}>
                {t.permissions}
              </Typography>

              {/* Select All / Unselect All */}
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
                          const exists = form.modulePermissions.includes(
                            mod.key
                          );
                          setForm((prev) => ({
                            ...prev,
                            modulePermissions: exists
                              ? prev.modulePermissions.filter(
                                  (k) => k !== mod.key
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
        <DialogActions>
          <Button
            disabled={loading}
            startIcon={<ICONS.cancel />}
            onClick={() => setModalOpen(false)}
            sx={getStartIconSpacing(dir)}
          >
            {t.cancel}
          </Button>
          <Button
            variant="contained"
            onClick={handleModalSave}
            disabled={loading}
            startIcon={<ICONS.save />}
            sx={getStartIconSpacing(dir)}
          >
            {loading ? (isEditMode ? t.saving : t.creating) : t.save}
          </Button>
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
