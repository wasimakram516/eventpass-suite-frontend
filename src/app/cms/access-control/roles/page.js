"use client";

import {
  Box,
  Typography,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Tooltip,
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
  Select,
  MenuItem,
  InputLabel,
  FormControl,
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
      "Are you sure you want to move this item to the Recycle Bin?",
    deleteBlockedMessage:
      "You can't delete this role — it's currently assigned to {count} user(s). Reassign them to a different role first.",
    nameRequired: "Role name is required",
    noRoles: "No roles yet — create one to get started.",
    inactive: "Inactive",
    userType: "User Type",
    userTypeRequired: "User type is required",
    userTypeHint: "Which tier this role is assignable to — controls where it appears in the Role select and staff-role whitelist.",
    userTypeAdmin: "Admin",
    userTypeBusiness: "Business",
    userTypeStaff: "Staff",
    userTypeUntyped: "Untyped (legacy)",
    usersCount: "{count} user",
    usersCountPlural: "{count} users",
    saveRoleConfirmTitle: "Save Role Changes",
    saveRoleConfirmMessage:
      "This role is currently assigned to {count} user(s). Changing it will affect all of them immediately. Continue?",
    saveRoleDeactivateConfirmMessage:
      "Deactivating this role means: {count} user(s) will not be able to log in anymore, and this role can no longer be assigned to any new users. Continue?",
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
    deleteConfirmMessage: "هل أنت متأكد من أنك تريد نقل هذا العنصر إلى سلة المحذوفات؟",
    deleteBlockedMessage:
      "لا يمكنك حذف هذا الدور — إنه مسند حاليًا إلى {count} مستخدم. يرجى إعادة إسنادهم إلى دور آخر أولاً.",
    nameRequired: "اسم الدور مطلوب",
    noRoles: "لا توجد أدوار بعد — أنشئ واحدًا للبدء.",
    inactive: "غير مفعل",
    userType: "نوع المستخدم",
    userTypeRequired: "نوع المستخدم مطلوب",
    userTypeHint: "الفئة التي يمكن إسناد هذا الدور إليها — تتحكم في مكان ظهوره في قائمة اختيار الدور وقائمة أدوار الموظفين المسموح بها.",
    userTypeAdmin: "مسؤول",
    userTypeBusiness: "شركة",
    userTypeStaff: "موظف",
    userTypeUntyped: "غير مصنف (قديم)",
    usersCount: "{count} مستخدم",
    usersCountPlural: "{count} مستخدمين",
    saveRoleConfirmTitle: "حفظ تغييرات الدور",
    saveRoleConfirmMessage:
      "هذا الدور مسند حاليًا إلى {count} مستخدم. تغييره سيؤثر عليهم جميعًا فورًا. هل تريد المتابعة؟",
    saveRoleDeactivateConfirmMessage:
      "إلغاء تفعيل هذا الدور يعني: لن يتمكن {count} مستخدم من تسجيل الدخول بعد الآن، ولن يمكن إسناد هذا الدور لأي مستخدم جديد. هل تريد المتابعة؟",
  },
};

const defaultForm = { name: "", description: "", isActive: true, userType: "" };

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
  const [userTypeError, setUserTypeError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);

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
    setUserTypeError("");
    setDialogOpen(true);
  };

  const openEdit = (role) => {
    setEditingRole(role);
    setForm({
      name: role.name,
      description: role.description || "",
      isActive: role.isActive,
      userType: role.userType || "",
    });
    setNameError("");
    setUserTypeError("");
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    let hasError = false;
    if (!form.name.trim()) {
      setNameError(t.nameRequired);
      hasError = true;
    }
    // Required going forward for new roles — existing untyped roles (userType
    // "") are grandfathered in and can be left as-is, or typed here to
    // complete the backfill (see the 20260819 migration).
    if (!editingRole && !form.userType) {
      setUserTypeError(t.userTypeRequired);
      hasError = true;
    }
    if (hasError) return;

    if (editingRole) {
      // A role is a single shared bundle assignable across every business
      // (see Role.js) — editing one changes access for everyone currently
      // holding it, immediately. Confirm before applying rather than saving
      // straight away; the actual save happens in handleConfirmedSave.
      setSaveConfirmOpen(true);
    } else {
      // A brand-new role has zero holders yet — nothing to warn about.
      const res = await createRole({
        name: form.name,
        description: form.description,
        userType: form.userType,
      });
      if (!res?.error) {
        setDialogOpen(false);
        loadRoles();
      }
    }
  };

  const handleConfirmedSave = async () => {
    const res = await updateRole(editingRole._id, {
      name: form.name,
      description: form.description,
      isActive: form.isActive,
      userType: form.userType || null,
    });
    setSaveConfirmOpen(false);
    if (!res?.error) {
      setDialogOpen(false);
      loadRoles();
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
                <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                  <Tooltip title={role.name}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        minWidth: 0,
                      }}
                    >
                      {role.name}
                    </Typography>
                  </Tooltip>
                  <Stack
                    direction="row"
                    spacing={0.5}
                    sx={{ flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end", rowGap: 0.5 }}
                  >
                    <Tooltip
                      title={
                        role.userType === "admin"
                          ? t.userTypeAdmin
                          : role.userType === "business"
                            ? t.userTypeBusiness
                            : role.userType === "staff"
                              ? t.userTypeStaff
                              : t.userTypeUntyped
                      }
                    >
                      {role.userType === "business" ? (
                        <ICONS.business fontSize="small" sx={{ color: "primary.main", cursor: "default" }} />
                      ) : role.userType === "admin" ? (
                        <ICONS.adminPanel fontSize="small" sx={{ color: "primary.main", cursor: "default" }} />
                      ) : role.userType === "staff" ? (
                        <ICONS.badge fontSize="small" sx={{ color: "primary.main", cursor: "default" }} />
                      ) : (
                        <ICONS.badge fontSize="small" sx={{ color: "text.disabled", cursor: "default" }} />
                      )}
                    </Tooltip>
                    <Tooltip
                      title={(role.userCount === 1 ? t.usersCount : t.usersCountPlural).replace(
                        "{count}",
                        role.userCount ?? 0,
                      )}
                    >
                      <ICONS.people
                        fontSize="small"
                        sx={{ color: "text.secondary", cursor: "default", alignSelf: "center" }}
                      />
                    </Tooltip>
                    <Tooltip title={role.isActive ? t.active : t.inactive}>
                      {role.isActive ? (
                        <ICONS.checkCircle fontSize="small" sx={{ color: "success.main", cursor: "default" }} />
                      ) : (
                        <ICONS.cancel fontSize="small" sx={{ color: "warning.main", cursor: "default" }} />
                      )}
                    </Tooltip>
                  </Stack>
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
            <FormControl fullWidth error={!!userTypeError}>
              <InputLabel>{t.userType}</InputLabel>
              <Select
                label={t.userType}
                value={form.userType}
                onChange={(e) => {
                  setForm({ ...form, userType: e.target.value });
                  setUserTypeError("");
                }}
              >
                {editingRole && <MenuItem value=""><em>{t.userTypeUntyped}</em></MenuItem>}
                <MenuItem value="admin">{t.userTypeAdmin}</MenuItem>
                <MenuItem value="business">{t.userTypeBusiness}</MenuItem>
                <MenuItem value="staff">{t.userTypeStaff}</MenuItem>
              </Select>
              <Typography variant="caption" color={userTypeError ? "error" : "text.secondary"} sx={{ mt: 0.5, display: "block" }}>
                {userTypeError || t.userTypeHint}
              </Typography>
            </FormControl>
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
        message={
          deleteTarget?.userCount > 0
            ? t.deleteBlockedMessage.replace("{count}", deleteTarget.userCount)
            : t.deleteConfirmMessage
        }
        confirmButtonText={t.delete}
        confirmButtonIcon={<ICONS.delete />}
        confirmButtonDisabled={deleteTarget?.userCount > 0}
      />

      <ConfirmationDialog
        open={saveConfirmOpen}
        onClose={() => setSaveConfirmOpen(false)}
        onConfirm={handleConfirmedSave}
        title={t.saveRoleConfirmTitle}
        message={(
          editingRole?.isActive && !form.isActive
            ? t.saveRoleDeactivateConfirmMessage
            : t.saveRoleConfirmMessage
        ).replace("{count}", editingRole?.userCount ?? 0)}
        confirmButtonText={t.save}
        confirmButtonIcon={<ICONS.save />}
        confirmButtonColor="warning"
      />
    </Container>
  );
}
