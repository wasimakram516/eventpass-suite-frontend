"use client";

import {
  Box,
  Typography,
  Grid,
  Card,
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
import { getModules } from "@/services/moduleService";
import useI18nLayout from "@/hooks/useI18nLayout";
import { useAuth } from "@/contexts/AuthContext";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

const translations = {
  en: {
    title: "Users",
    subtitle: "View and manage registered users",
    createStaffUser: "Create Staff User",
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
    deleteMessagePrefix: "Are you sure you want to delete",
    role: "Role",
    edit: "Edit",
    delete: "Delete",
  },
  ar: {
    title: "المستخدمون",
    subtitle: "عرض وإدارة المستخدمين المسجلين",
    createStaffUser: "إنشاء مستخدم موظف",
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
    deleteMessagePrefix: "هل أنت متأكد أنك تريد حذف",
    role: "الدور",
    edit: "تعديل",
    delete: "حذف",
  },
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const isBusinessUser = currentUser?.role === "business";

  const [availableModules, setAvailableModules] = useState([]);
  const [businessUserModules, setBusinessUserModules] = useState([]);
  const { dir, align, language, t } = useI18nLayout(translations);

  const [users, setUsers] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    modulePermissions: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchModules();
  }, []);

  const fetchUsers = async () => {
    const data =
      isBusinessUser && currentUser?.business?._id
        ? await getAllStaffUsers(currentUser.business._id)
        : await getAllUsers();
    setUsers(data || []);
  };

  const fetchModules = async () => {
    const allModules = await getModules();
    setAvailableModules(allModules);
    if (isBusinessUser) {
      const filteredModules = allModules.filter((module) =>
        currentUser.modulePermissions?.includes(module.key)
      );
      setBusinessUserModules(filteredModules);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "primary";
      case "business":
        return "secondary";
      case "staff":
        return "success";
      default:
        return "default";
    }
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      modulePermissions: user.modulePermissions || [],
    });
    setIsEditMode(true);
    setModalOpen(true);
  };

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setForm({ name: "", email: "", password: "", modulePermissions: [] });
    setIsEditMode(false);
    setModalOpen(true);
  };

  const handleModalSave = async () => {
    setLoading(true);
    let res = null;
    if (isEditMode) {
      const payload = { ...form };
      if (!form.password) delete payload.password;
      res = await updateUser(selectedUser._id, payload);
    } else {
      res = await createStaffUser(
        form.name,
        form.email,
        form.password,
        "staff",
        currentUser.business._id
      );
    }
    if (!res.error) {
      await fetchUsers();
    }

    setModalOpen(false);

    setLoading(false);
  };

  const handleDelete = async () => {
    const res = await deleteUser(selectedUser._id);
    if (!res.error) {
      await fetchUsers();
    }
    setDeleteConfirm(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const togglePermission = (key) => {
    setForm((prev) => {
      const exists = prev.modulePermissions.includes(key);
      return {
        ...prev,
        modulePermissions: exists
          ? prev.modulePermissions.filter((k) => k !== key)
          : [...prev.modulePermissions, key],
      };
    });
  };

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
        {isBusinessUser && (
          <Button
            variant="contained"
            sx={getStartIconSpacing(dir)}
            startIcon={<ICONS.add />}
            onClick={handleOpenCreate}
          >
            {t.createStaffUser}
          </Button>
        )}
      </Box>
      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        {users?.map((user) => (
          <Grid item xs={12} sm={6} md={4} key={user._id}>
            <Card elevation={3} sx={{ p: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ width: 56, height: 56 }}>{user.name?.[0]}</Avatar>
                <Box>
                  <Typography variant="h6">{user.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={
                        user.role.charAt(0).toUpperCase() + user.role.slice(1)
                      }
                      color={getRoleColor(user.role)}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </Stack>
              <Box sx={{ mt: 2, textAlign: "right" }}>
                <Tooltip title={t.edit}>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenEdit(user)}
                  >
                    <ICONS.edit />
                  </IconButton>
                </Tooltip>
                {((currentUser?.role === "admin" &&
                  (user.role === "business" || user.role === "staff")) ||
                  (currentUser?.role === "business" &&
                    user.role === "staff")) && (
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
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        fullWidth
        dir={dir}
      >
        <DialogTitle>{isEditMode ? t.editUser : t.createStaffUser}</DialogTitle>
        <DialogContent>
          <TextField
            label={t.name}
            name="name"
            value={form.name}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label={t.email}
            name="email"
            value={form.email}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label={t.password}
            name="password"
            value={form.password}
            onChange={handleChange}
            fullWidth
            margin="normal"
            type="password"
          />

          {(selectedUser?.role === "business" ||
            selectedUser?.role === "staff" ||
            !selectedUser) && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom textAlign={align}>
                {t.permissions}
              </Typography>
              <FormGroup>
                {(isBusinessUser ? businessUserModules : availableModules).map(
                  (mod) => (
                    <FormControlLabel
                      key={mod.key}
                      control={
                        <Checkbox
                          checked={form.modulePermissions.includes(mod.key)}
                          onChange={() => togglePermission(mod.key)}
                          disabled={
                            isBusinessUser &&
                            !currentUser.modulePermissions?.includes(mod.key)
                          }
                        />
                      }
                      label={mod.labels?.[language] || mod.key}
                    />
                  )
                )}
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
        message={`${t.deleteMessagePrefix} ${selectedUser?.name}?`}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
        confirmButtonText={t.delete}
      />
    </Container>
  );
}
