"use client";

import {
  Box,
  Typography,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Stack,
  Container,
  Divider,
} from "@mui/material";
import { useEffect, useState } from "react";
import Link from "next/link";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import LoadingState from "@/components/LoadingState";
import useI18nLayout from "@/hooks/useI18nLayout";
import { useAuth } from "@/contexts/AuthContext";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import AppCard from "@/components/cards/AppCard";
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
} from "@/services/roleService";

const translations = {
  en: {
    title: "Access Control — Roles",
    subtitle: "Define roles, then set their permissions on the matrix page",
    newRole: "New Role",
    editRole: "Edit Role",
    name: "Role Name",
    description: "Description",
    active: "Active",
    cancel: "Cancel",
    save: "Save",
    permissions: "Permissions",
    delete: "Delete",
    edit: "Edit",
    deleteConfirmTitle: "Delete Role",
    deleteConfirmMessage:
      "Are you sure you want to delete this role? This cannot be undone.",
    nameRequired: "Role name is required",
    noRoles: "No roles yet — create one to get started.",
    inactive: "Inactive",
  },
  ar: {
    title: "التحكم بالصلاحيات — الأدوار",
    subtitle: "عرّف الأدوار، ثم حدد صلاحياتها في صفحة المصفوفة",
    newRole: "دور جديد",
    editRole: "تعديل الدور",
    name: "اسم الدور",
    description: "الوصف",
    active: "مفعّل",
    cancel: "إلغاء",
    save: "حفظ",
    permissions: "الصلاحيات",
    delete: "حذف",
    edit: "تعديل",
    deleteConfirmTitle: "حذف الدور",
    deleteConfirmMessage: "هل أنت متأكد من حذف هذا الدور؟ لا يمكن التراجع عن هذا.",
    nameRequired: "اسم الدور مطلوب",
    noRoles: "لا توجد أدوار بعد — أنشئ واحدًا للبدء.",
    inactive: "غير مفعل",
  },
};

const defaultForm = { name: "", description: "", isActive: true };

export default function RolesPage() {
  const { user } = useAuth();
  const { t, dir } = useI18nLayout(translations);
  const isSuperAdmin = user?.role === "superadmin";

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [nameError, setNameError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadRoles = async () => {
    setLoading(true);
    const res = await getRoles();
    if (!res?.error) setRoles(Array.isArray(res) ? res : res?.data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) loadRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const openCreate = () => {
    setEditingRole(null);
    setForm(defaultForm);
    setNameError("");
    setDialogOpen(true);
  };

  const openEdit = (role) => {
    setEditingRole(role);
    setForm({
      name: role.name,
      description: role.description || "",
      isActive: role.isActive,
    });
    setNameError("");
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setNameError(t.nameRequired);
      return;
    }

    if (editingRole) {
      const res = await updateRole(editingRole._id, {
        name: form.name,
        description: form.description,
        isActive: form.isActive,
      });
      if (!res?.error) {
        setDialogOpen(false);
        loadRoles();
      }
    } else {
      const res = await createRole({
        name: form.name,
        description: form.description,
      });
      if (!res?.error) {
        setDialogOpen(false);
        loadRoles();
      }
    }
  };

  const handleDelete = async () => {
    const res = await deleteRole(deleteTarget._id);
    setDeleteTarget(null);
    if (!res?.error) loadRoles();
  };

  if (loading) return <LoadingState />;

  return (
    <Container maxWidth={false} disableGutters sx={{ px: { xs: 2, md: 3 }, py: 3 }} dir={dir}>
      <BreadcrumbsNav />
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">{t.title}</Typography>
          <Typography variant="body2" color="text.secondary">{t.subtitle}</Typography>
        </Box>
        {isSuperAdmin && (
          <Button
            variant="contained"
            startIcon={<ICONS.add />}
            onClick={openCreate}
            sx={getStartIconSpacing(dir)}
          >
            {t.newRole}
          </Button>
        )}
      </Box>
      <Divider sx={{ mb: 2 }} />

      {roles.length === 0 ? (
        <Typography color="text.secondary" sx={{ mt: 4 }}>{t.noRoles}</Typography>
      ) : (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "center", mt: 3 }}>
          {roles.map((role) => (
            <AppCard key={role._id} sx={{ width: { xs: "100%", sm: 320 } }}>
              <CardContent sx={{ px: 2, py: 2, flexGrow: 1 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                  <Typography variant="subtitle1" fontWeight="bold">{role.name}</Typography>
                  {!role.isActive && <Chip size="small" label={t.inactive} color="warning" />}
                </Stack>
                {role.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.7 }}>
                    {role.description}
                  </Typography>
                )}
              </CardContent>

              <CardActions
                sx={{
                  justifyContent: "space-around",
                  borderTop: (theme) => `1px solid ${theme.palette.divider}`,
                  bgcolor: "action.hover",
                  p: 1,
                }}
              >
                <Tooltip title={t.permissions}>
                  <IconButton
                    color="primary"
                    component={Link}
                    href={`/cms/access-control/permissions?roleId=${role._id}`}
                  >
                    <ICONS.adminPanel />
                  </IconButton>
                </Tooltip>
                {isSuperAdmin && (
                  <>
                    <Tooltip title={t.edit}>
                      <IconButton color="warning" onClick={() => openEdit(role)}>
                        <ICONS.edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t.delete}>
                      <IconButton color="error" onClick={() => setDeleteTarget(role)}>
                        <ICONS.delete />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </CardActions>
            </AppCard>
          ))}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} dir={dir} fullWidth maxWidth="sm">
        <DialogTitle>{editingRole ? t.editRole : t.newRole}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t.name}
              value={form.name}
              onChange={(e) => { setForm({ ...form, name: e.target.value }); setNameError(""); }}
              error={!!nameError}
              helperText={nameError}
              fullWidth
            />
            <TextField
              label={t.description}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              fullWidth
              multiline
              minRows={2}
            />
            {editingRole && (
              <FormControlLabel
                control={
                  <Switch
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                }
                label={t.active}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t.cancel}</Button>
          <Button variant="contained" onClick={handleSubmit}>{t.save}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmationDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t.deleteConfirmTitle}
        message={t.deleteConfirmMessage}
        confirmButtonText={t.delete}
        confirmButtonIcon={<ICONS.delete />}
      />
    </Container>
  );
}
