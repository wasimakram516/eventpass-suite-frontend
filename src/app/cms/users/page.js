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
} from "@mui/material";
import { useEffect, useState } from "react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BreadcrumbsNav from "@/components/BreadcrumbsNav";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { getAllUsers, updateUser, deleteUser } from "@/services/userService";
import { getModules } from "@/services/moduleService";
import useI18nLayout from "@/hooks/useI18nLayout";

const translations = {
  en: {
    title: "Users",
    subtitle: "View and manage registered users",
    editUser: "Edit User",
    name: "Name",
    email: "Email",
    password: "New Password (optional)",
    permissions: "Module Permissions",
    cancel: "Cancel",
    save: "Save",
    deleteConfirm: "Confirm Deletion",
    deleteMessagePrefix: "Are you sure you want to delete",
    role: "Role",
    edit: "Edit",
    delete: "Delete",
  },
  ar: {
    title: "المستخدمون",
    subtitle: "عرض وإدارة المستخدمين المسجلين",
    editUser: "تعديل المستخدم",
    name: "الاسم",
    email: "البريد الإلكتروني",
    password: "كلمة المرور الجديدة (اختياري)",
    permissions: "صلاحيات الوحدات",
    cancel: "إلغاء",
    save: "حفظ",
    deleteConfirm: "تأكيد الحذف",
    deleteMessagePrefix: "هل أنت متأكد أنك تريد حذف",
    role: "الدور",
    edit: "تعديل",
    delete: "حذف",
  },
};

export default function UsersPage() {
  const { dir, align, language, t } = useI18nLayout(translations);

  const [users, setUsers] = useState([]);
  const [modules, setModules] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    modulePermissions: [],
  });

  useEffect(() => {
    fetchUsers();
    fetchModules();
  }, []);

  const fetchUsers = async () => {
    const data = await getAllUsers();
    setUsers(data);
  };

  const fetchModules = async () => {
    const data = await getModules();
    setModules(data);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      modulePermissions: user.modulePermissions || [],
    });
    setEditOpen(true);
  };

  const handleCloseEdit = () => {
    setSelectedUser(null);
    setEditOpen(false);
  };

  const handleEditSave = async () => {
    const payload = { ...form };
    if (!form.password) delete payload.password;
    await updateUser(selectedUser._id, payload);
    await fetchUsers();
    handleCloseEdit();
  };

  const handleDelete = async () => {
    await deleteUser(selectedUser._id);
    await fetchUsers();
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
      </Box>
      <Divider sx={{ mb: 3 }} />

      {/* User Cards */}
      <Grid container spacing={3}>
        {users.map((user) => (
          <Grid item xs={12} sm={6} md={4} key={user._id}>
            <Card elevation={3} sx={{ p: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ width: 56, height: 56 }}>{user.name?.[0]}</Avatar>
                <Box>
                  <Typography variant="h6">{user.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t.role}: {user.role}
                  </Typography>
                </Box>
              </Stack>
              <Box sx={{ mt: 2, textAlign: "right" }}>
                <Tooltip title={t.edit}>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenEdit(user)}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t.delete}>
                  <IconButton
                    color="error"
                    onClick={() => {
                      setSelectedUser(user);
                      setDeleteConfirm(true);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Edit Modal */}
      <Dialog open={editOpen} onClose={handleCloseEdit} fullWidth dir={dir}>
        <DialogTitle>{t.editUser}</DialogTitle>
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

          {selectedUser?.role === "business" && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom textAlign={align}>
                {t.permissions}
              </Typography>
              <FormGroup>
                {modules.map((mod) => (
                  <FormControlLabel
                    key={mod.key}
                    control={
                      <Checkbox
                        checked={form.modulePermissions.includes(mod.key)}
                        onChange={() => togglePermission(mod.key)}
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
          <Button onClick={handleCloseEdit}>{t.cancel}</Button>
          <Button variant="contained" onClick={handleEditSave}>
            {t.save}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
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
