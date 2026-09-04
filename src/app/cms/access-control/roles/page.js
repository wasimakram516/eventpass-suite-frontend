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
  Tabs,
  Tab,
  Checkbox,
  Avatar,
  CircularProgress,
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
import RecordMetadata from "@/components/RecordMetadata";
import { getModuleIcon } from "@/utils/iconMapper";
import { getModules } from "@/services/moduleService";
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions,
  setRolePermissions,
} from "@/services/roleService";

// "files" isn't part of the module-tile catalog GET /modules serves (that
// catalog also drives the CMS home grid + legacy modulePermissions) — it
// only exists in the granular Permission catalog. Same gap/fix as the
// Permissions page's own FALLBACK_MODULE_INFO.
const FALLBACK_MODULE_INFO = {
  files: {
    labels: { en: "Manage Downloadable Files", ar: "إدارة الملفات القابلة للتنزيل" },
    icon: "files",
  },
};

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
    detailsTab: "Details",
    modulesTab: "Modules",
    selfRegistrationDefault: "Use for self-registration",
    selfRegistrationDefaultHint:
      "Whoever publicly self-registers as a business owner is assigned this role. Only one business role can be the default at a time — turning this on removes it from whichever role currently has it.",
    roleAccessControl: "Allow this role to create users and manage permissions",
    roleAccessControlHintBusiness: "Business users assigned this role can create staff and manage permissions by default.",
    roleAccessControlHintAdmin: "Admins assigned this role can create users and manage permissions by default.",
    selfRegDefaultBadge: "Self-registration default",
    modulesHint: "Pick which modules this role covers. Each checked module is granted in full — narrow it down to specific actions on the Permissions page afterward.",
    selectAllModules: "Select all",
    unselectAllModules: "Unselect all",
    selectUserTypeFirstForModules: "Pick a User Type on the Details tab first to see its module list.",
    next: "Next",
    back: "Back",
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
    detailsTab: "التفاصيل",
    modulesTab: "الوحدات",
    selfRegistrationDefault: "استخدام للتسجيل الذاتي",
    selfRegistrationDefaultHint:
      "أي شخص يسجل نفسه علنًا كصاحب شركة يُسند إليه هذا الدور. يمكن أن يكون دور شركة واحد فقط هو الافتراضي في كل مرة — تفعيل هذا سيزيله من الدور الذي يحمله حاليًا.",
    roleAccessControl: "السماح لهذا الدور بإنشاء المستخدمين وإدارة الصلاحيات",
    roleAccessControlHintBusiness: "يمكن لمستخدمي العمل المسند إليهم هذا الدور إنشاء الموظفين وإدارة الصلاحيات بشكل افتراضي.",
    roleAccessControlHintAdmin: "يمكن للمشرفين المسند إليهم هذا الدور إنشاء المستخدمين وإدارة الصلاحيات بشكل افتراضي.",
    selfRegDefaultBadge: "افتراضي للتسجيل الذاتي",
    modulesHint: "اختر الوحدات التي يغطيها هذا الدور. كل وحدة محددة تُمنح بالكامل — يمكن تضييقها إلى إجراءات محددة من صفحة الصلاحيات لاحقًا.",
    selectAllModules: "تحديد الكل",
    unselectAllModules: "إلغاء تحديد الكل",
    selectUserTypeFirstForModules: "اختر نوع المستخدم من علامة تبويب التفاصيل أولاً لرؤية قائمة الوحدات.",
    next: "التالي",
    back: "رجوع",
  },
};

const defaultForm = {
  name: "",
  description: "",
  isActive: true,
  userType: "",
  isSelfRegistrationDefault: false,
  canManageAccessControl: false,
};

export default function RolesPage() {
  const { user } = useAuth();
  const { t, dir, language } = useI18nLayout(translations);
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
  const [activeTab, setActiveTab] = useState(0);

  // Modules tab state — a module counts as "assigned" once it has any
  // granted action at all (see the Permissions page, which now only offers
  // modules assigned here). Checking one here grants its full/ceiling action
  // set; the Permissions page is where that gets narrowed to specific
  // actions. `moduleRows` carries permissionId + allowedActions ONLY once
  // known (edit mode, or right after a new role is created) — until then
  // (create mode, before Save) it's just module/label/icon for display.
  const [moduleRows, setModuleRows] = useState([]);
  const [checkedModules, setCheckedModules] = useState(new Set());
  const [modulesLoading, setModulesLoading] = useState(false);

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

  const mergeModuleLabels = (rows, catalogList) => {
    const info = {};
    catalogList.forEach((m) => { info[m.key] = { labels: m.labels, icon: m.icon }; });
    return rows.map((r) => ({
      ...r,
      labels: info[r.module]?.labels || FALLBACK_MODULE_INFO[r.module]?.labels || { en: r.module, ar: r.module },
      icon: info[r.module]?.icon || FALLBACK_MODULE_INFO[r.module]?.icon,
    }));
  };

  // CREATE mode has no roleId yet, so there's nothing to call
  // getRolePermissions against — show the module catalog for this userType
  // (scoped server-side the same way a real role's Modules tab would be,
  // e.g. staff only ever sees eventreg/checkin/digipass) with everything
  // checked by default, per the "narrow down from full access" convention
  // already used for Admin/Business. The real per-role allowedActions are
  // resolved right after creation, once a roleId actually exists.
  const loadCreateModuleCatalog = async (userType) => {
    if (!userType) {
      setModuleRows([]);
      setCheckedModules(new Set());
      return;
    }
    setModulesLoading(true);
    const res = await getModules(userType);
    const list = Array.isArray(res) ? res : res?.data || [];
    const rows = list.map((m) => ({ module: m.key, labels: m.labels, icon: m.icon, permissionId: null }));
    if (userType !== "staff") {
      rows.push({ module: "files", ...FALLBACK_MODULE_INFO.files, permissionId: null });
    }
    setModuleRows(rows);
    setCheckedModules(new Set(rows.map((r) => r.module)));
    setModulesLoading(false);
  };

  // EDIT mode: real per-role grants already exist — check = has any granted
  // action (same "assigned" definition the Permissions page now uses).
  const loadEditModuleCatalog = async (role) => {
    setModulesLoading(true);
    const [permsRes, modulesRes] = await Promise.all([
      getRolePermissions(role._id),
      getModules(role.userType || "admin"),
    ]);
    const catalogList = Array.isArray(modulesRes) ? modulesRes : modulesRes?.data || [];
    const rawRows = permsRes?.permissions || [];
    const rows = mergeModuleLabels(rawRows, catalogList);
    setModuleRows(rows);
    setCheckedModules(new Set(rows.filter((r) => (r.grantedActions || []).length > 0).map((r) => r.module)));
    setModulesLoading(false);
  };

  const openCreate = () => {
    setEditingRole(null);
    setForm(defaultForm);
    setNameError("");
    setUserTypeError("");
    setActiveTab(0);
    setModuleRows([]);
    setCheckedModules(new Set());
    setDialogOpen(true);
  };

  const openEdit = (role) => {
    setEditingRole(role);
    setForm({
      name: role.name,
      description: role.description || "",
      isActive: role.isActive,
      userType: role.userType || "",
      isSelfRegistrationDefault: !!role.isSelfRegistrationDefault,
      canManageAccessControl: !!role.canManageAccessControl,
    });
    setNameError("");
    setUserTypeError("");
    setActiveTab(0);
    loadEditModuleCatalog(role);
    setDialogOpen(true);
  };

  // Create mode's Modules tab tracks the currently chosen userType (there's
  // no role yet to re-fetch from) — re-scope the catalog whenever it changes.
  useEffect(() => {
    if (!dialogOpen || editingRole) return;
    loadCreateModuleCatalog(form.userType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogOpen, editingRole, form.userType]);

  const toggleModule = (moduleKey) => {
    setCheckedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleKey)) next.delete(moduleKey);
      else next.add(moduleKey);
      return next;
    });
  };

  // Writes the Modules tab's checkbox state as real RolePermission grants —
  // a checked module gets its full/ceiling action set (allowedActions, which
  // getRolePermissions already caps correctly per userType, e.g. staff), an
  // unchecked one gets cleared entirely. Only ever called with rows that
  // carry a real permissionId (i.e. after the role actually exists).
  const saveModuleSelections = async (roleId, rows, checked) => {
    const payload = rows
      .filter((r) => r.permissionId)
      .map((r) => ({ permissionId: r.permissionId, actions: checked.has(r.module) ? r.allowedActions : [] }));
    if (!payload.length) return { error: false };
    return setRolePermissions(roleId, payload);
  };

  // Details tab's own validation, run before advancing to Modules — same
  // fields handleSubmit used to check inline before Save existed only on
  // the last tab (matching UserFormModal's per-tab Next validation).
  const validateDetailsTab = () => {
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
    return !hasError;
  };

  const handleNext = () => {
    if (validateDetailsTab()) setActiveTab(1);
  };

  const handleSubmit = async () => {
    if (!validateDetailsTab()) {
      setActiveTab(0);
      return;
    }

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
        isSelfRegistrationDefault: form.isSelfRegistrationDefault,
        canManageAccessControl: form.canManageAccessControl,
      });
      if (!res?.error) {
        // The role didn't exist a moment ago, so moduleRows had no
        // permissionId yet — resolve the real (correctly-capped) grants now
        // that a roleId exists, then write the checkbox selections.
        const newRoleId = res?._id;
        if (newRoleId) {
          const permsRes = await getRolePermissions(newRoleId);
          await saveModuleSelections(newRoleId, permsRes?.permissions || [], checkedModules);
        }
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
      isSelfRegistrationDefault: form.isSelfRegistrationDefault,
      canManageAccessControl: form.canManageAccessControl,
    });
    if (!res?.error) {
      await saveModuleSelections(editingRole._id, moduleRows, checkedModules);
    }
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
                    {role.isSelfRegistrationDefault && (
                      <Tooltip title={t.selfRegDefaultBadge}>
                        <ICONS.star fontSize="small" sx={{ color: "warning.main", cursor: "default" }} />
                      </Tooltip>
                    )}
                  </Stack>
                </Stack>
                {role.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.7 }}>
                    {role.description}
                  </Typography>
                )}
              </CardContent>
              <RecordMetadata
                createdByName={role.createdBy}
                updatedByName={role.updatedBy}
                createdAt={role.createdAt}
                updatedAt={role.updatedAt}
                locale={language === "ar" ? "ar-SA" : "en-GB"}
              />

              <CardActions
                sx={{ px: 2, pb: 2, pt: 0, justifyContent: "flex-end", mt: "auto" }}
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
        <Tabs value={activeTab} onChange={(_e, v) => setActiveTab(v)} sx={{ px: 3, borderBottom: 1, borderColor: "divider" }}>
          <Tab label={t.detailsTab} />
          <Tab label={t.modulesTab} />
        </Tabs>
        <DialogContent>
          {activeTab === 0 && (
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
                    const nextUserType = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      userType: nextUserType,
                      // Self-registration only ever creates a business
                      // owner (see authController.registerUser) — clear this
                      // rather than silently carrying a stale value when
                      // switching away from business.
                      isSelfRegistrationDefault:
                        nextUserType === "business" ? prev.isSelfRegistrationDefault : false,
                      // Access Control is meaningful for both admin and
                      // business tiers (see User.js) — only clear it when
                      // switching to staff, which never uses this flag.
                      canManageAccessControl:
                        nextUserType === "staff" ? false : prev.canManageAccessControl,
                    }));
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
              {["business", "admin"].includes(form.userType) && (
                <>
                  <Divider />
                  {form.userType === "business" && (
                    <Box>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={form.isSelfRegistrationDefault}
                            onChange={(e) => setForm({ ...form, isSelfRegistrationDefault: e.target.checked })}
                          />
                        }
                        label={t.selfRegistrationDefault}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        {t.selfRegistrationDefaultHint}
                      </Typography>
                    </Box>
                  )}
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={form.canManageAccessControl}
                          onChange={(e) => setForm({ ...form, canManageAccessControl: e.target.checked })}
                        />
                      }
                      label={t.roleAccessControl}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {form.userType === "admin" ? t.roleAccessControlHintAdmin : t.roleAccessControlHintBusiness}
                    </Typography>
                  </Box>
                </>
              )}
            </Stack>
          )}

          {activeTab === 1 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                {t.modulesHint}
              </Typography>
              {modulesLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : moduleRows.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 2 }}>{t.selectUserTypeFirstForModules}</Typography>
              ) : (
                <Stack spacing={1}>
                  <FormControlLabel
                    sx={{ mx: 0 }}
                    control={
                      <Checkbox
                        checked={checkedModules.size === moduleRows.length}
                        indeterminate={checkedModules.size > 0 && checkedModules.size !== moduleRows.length}
                        onChange={(e) => {
                          setCheckedModules(e.target.checked ? new Set(moduleRows.map((r) => r.module)) : new Set());
                        }}
                      />
                    }
                    label={checkedModules.size > 0 ? t.unselectAllModules : t.selectAllModules}
                  />
                  <Divider />
                  {moduleRows.map((row) => (
                    <FormControlLabel
                      key={row.module}
                      sx={{ mx: 0 }}
                      control={
                        <Checkbox
                          checked={checkedModules.has(row.module)}
                          onChange={() => toggleModule(row.module)}
                        />
                      }
                      label={
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                          <Avatar sx={{ width: 28, height: 28, bgcolor: "action.hover", color: "primary.main" }}>
                            {getModuleIcon(row.icon, { fontSize: "small" })}
                          </Avatar>
                          <Typography variant="body2">{row.labels?.[language] || row.module}</Typography>
                        </Stack>
                      }
                    />
                  ))}
                </Stack>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t.cancel}</Button>
          {activeTab === 0 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              startIcon={dir === "rtl" ? <ICONS.back /> : <ICONS.next />}
              sx={getStartIconSpacing(dir)}
            >
              {t.next}
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                onClick={() => setActiveTab(0)}
                startIcon={dir === "rtl" ? <ICONS.next /> : <ICONS.back />}
                sx={getStartIconSpacing(dir)}
              >
                {t.back}
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                startIcon={<ICONS.save />}
                sx={getStartIconSpacing(dir)}
              >
                {t.save}
              </Button>
            </>
          )}
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
