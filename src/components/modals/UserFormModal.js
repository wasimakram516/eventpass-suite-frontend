"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
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
  Divider,
  IconButton,
  Tooltip,
  Avatar,
  Switch,
  useTheme,
} from "@mui/material";

import { useAuth } from "@/contexts/AuthContext";
import { useMessage } from "@/contexts/MessageContext";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { getModuleIcon } from "@/utils/iconMapper";
import slugify from "@/utils/slugify";
import {
  updateUser,
  createStaffUser,
  createBusinessUser,
  createAdminUser,
} from "@/services/userService";
import { updateBusiness } from "@/services/businessService";
import {
  getRoles,
  getRolePermissions,
  getUserPermissionOverrides,
  setUserPermissionOverrides,
  getActions,
} from "@/services/roleService";

// "files" (Manage Downloadable Files) isn't part of the older per-role
// module-tile catalog GET /modules serves — it only exists in the granular
// Permission catalog — so this keeps its override row from showing the raw
// "files" key/a generic icon instead of a proper bilingual label and
// matching icon.
const FALLBACK_MODULE_INFO = {
  files: {
    labels: { en: "Manage Downloadable Files", ar: "إدارة الملفات القابلة للتنزيل" },
    icon: "files",
  },
};

// Memoized per-module — a toggle inside one module's card only re-renders
// that card, not every module card in the Permissions tab. Effective only
// because `overridesForPermission` is a stable reference for every OTHER
// permissionId across an update (toggleOverride's immutable update only
// creates a new object for the permissionId that actually changed).
const PermissionModuleCard = memo(function PermissionModuleCard({
  perm,
  info,
  overridesForPermission,
  actionLabels,
  language,
  theme,
  t,
  ceilingPermissions,
  isSuper,
  onToggle,
}) {
  const actionStates = perm.allowedActions.map((action) => {
    const isInherited = (perm.grantedActions || []).includes(action);
    const overrideEffect = overridesForPermission[action];
    const isChecked = isInherited
      ? overrideEffect !== "deny"
      : overrideEffect === "allow";
    const ceilingOk =
      isSuper || ceilingPermissions?.includes(`${perm.module}:${action}`);
    return { action, isInherited, overrideEffect, isChecked, ceilingOk };
  });
  const toggleableActions = actionStates.filter((s) => s.ceilingOk);
  const allChecked =
    toggleableActions.length > 0 && toggleableActions.every((s) => s.isChecked);

  const handleToggleAll = (checked) => {
    toggleableActions.forEach((s) => {
      if (s.isChecked !== checked) onToggle(perm.permissionId, s.action, s.isInherited);
    });
  };

  return (
    <Box sx={{ py: 2 }}>
      <Box
        sx={{
          display: "flex",
          width: "100%",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          rowGap: 1,
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Avatar sx={{ width: 28, height: 28, bgcolor: "action.hover", color: "primary.main" }}>
            {getModuleIcon(info?.icon, { fontSize: "small" })}
          </Avatar>
          <Typography variant="body2" fontWeight="bold">
            {info?.labels?.[language] || perm.module}
          </Typography>
        </Stack>
        {toggleableActions.length > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: "auto" }}>
            <Typography variant="caption" color="text.secondary">{t.selectAll}</Typography>
            <Switch
              size="small"
              checked={allChecked}
              onChange={(e) => handleToggleAll(e.target.checked)}
            />
          </Box>
        )}
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          columnGap: 3,
          rowGap: 1.5,
        }}
      >
        {actionStates.map(({ action, isInherited, overrideEffect, isChecked, ceilingOk }) => {
          const isOverridden = overrideEffect !== undefined;

          return (
            <Tooltip
              key={action}
              title={!ceilingOk ? "Your business does not have this permission" : ""}
            >
              <Box
                sx={{
                  borderInlineStart: "3px solid",
                  borderColor: isOverridden
                    ? overrideEffect === "allow"
                      ? "success.main"
                      : "error.main"
                    : "transparent",
                  bgcolor: isOverridden
                    ? overrideEffect === "allow"
                      ? theme.palette.users.permAllowBg
                      : theme.palette.users.permDenyBg
                    : "transparent",
                  borderRadius: 1,
                  pl: isOverridden ? 1 : 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <FormControlLabel
                  disabled={!ceilingOk}
                  sx={{ mr: 0, minWidth: 0 }}
                  control={
                    <Checkbox
                      size="small"
                      checked={isChecked}
                      onChange={() =>
                        ceilingOk && onToggle(perm.permissionId, action, isInherited)
                      }
                    />
                  }
                  label={
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{ opacity: overrideEffect === "deny" ? 0.6 : 1 }}
                    >
                      {actionLabels[action]?.[language] || action}
                    </Typography>
                  }
                />
                {isOverridden && (
                  <Chip
                    size="small"
                    label={overrideEffect === "allow" ? t.allow : t.deny}
                    color={overrideEffect === "allow" ? "success" : "error"}
                  />
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
});

const defaultForm = {
  name: "",
  email: "",
  password: "",
  modulePermissions: [],
  roleId: null,
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
  canManageAccessControl: false,
};

function UserFormModal({
  open,
  onClose,
  onSaved,
  isEditMode,
  selectedUser,
  businesses,
  availableModules,
  t,
  dir,
  align,
  language,
}) {
  const { user: currentUser } = useAuth();
  const { showMessage } = useMessage();
  const theme = useTheme();

  const isBusinessUser = currentUser?.role === "business";
  const isSuperAdmin = currentUser?.role === "superadmin";
  const isAdminOrSuperAdmin = ["admin", "superadmin"].includes(currentUser?.role || "");

  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [roles, setRoles] = useState([]);
  const [rolePermissionRows, setRolePermissionRows] = useState([]);
  const [overridesWorking, setOverridesWorking] = useState({});
  const [actionLabels, setActionLabels] = useState({});

  const isEditingSuperAdmin = isEditMode && selectedUser?.role === "superadmin";

  // Per the access-control design: only superadmin may assign dynamic
  // Roles/overrides to admin/business-tier accounts; a business owner may
  // only do so for their own staff, and only once their business has
  // Access Control enabled (Business.canManageAccessControl).
  const canManageDynamicRoles =
    !isEditingSuperAdmin &&
    form.userType !== "superadmin" &&
    (isSuperAdmin ||
      (isBusinessUser &&
        form.userType === "staff" &&
        !!currentUser?.business?.canManageAccessControl));

  // Populate the form whenever the modal opens — mirrors this codebase's
  // existing BusinessFormModal/GameFormModal convention (form population
  // via an effect keyed on `open`, not a synchronous setForm from the
  // parent's click handler).
  useEffect(() => {
    if (!open) return;

    if (isEditMode && selectedUser) {
      const businessContact = selectedUser.business?.contact || {};
      setForm({
        name: selectedUser.name,
        email: selectedUser.email,
        password: "",
        modulePermissions: selectedUser.modulePermissions || [],
        roleId: selectedUser.roleId?._id || selectedUser.roleId || null,
        userType:
          selectedUser.role === "admin"
            ? "admin"
            : selectedUser.role === "business"
              ? "business"
              : "staff",
        attachToExistingBusiness: true,
        businessId: selectedUser.business?._id || "",
        staffType: selectedUser.staffType || "desk",
        businessName: selectedUser.business?.name || "",
        businessSlug: selectedUser.business?.slug || "",
        businessEmail: businessContact.email || "",
        businessPhone: businessContact.phone || "",
        businessAddress: selectedUser.business?.address || "",
        logoPreview: selectedUser.business?.logoUrl || "",
        logoFile: null,
        canManageAccessControl: !!selectedUser.business?.canManageAccessControl,
      });
    } else {
      setForm({
        ...defaultForm,
        userType: isAdminOrSuperAdmin ? "business" : "staff",
        staffType: "desk",
      });
    }
    setErrors({});
    setActiveTab(0);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEditMode, selectedUser]);

  useEffect(() => {
    if (!open || !canManageDynamicRoles) return;
    getRoles().then((res) => {
      if (!res?.error) setRoles(Array.isArray(res) ? res : res?.data || []);
    });
    getActions().then((res) => {
      if (res?.error) return;
      const list = Array.isArray(res) ? res : res?.data || [];
      const labels = {};
      list.forEach((a) => { labels[a.key] = a.labels; });
      setActionLabels(labels);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, canManageDynamicRoles]);

  useEffect(() => {
    if (!form.roleId) {
      setRolePermissionRows([]);
      return;
    }
    getRolePermissions(form.roleId).then((res) => {
      if (!res?.error) setRolePermissionRows(res?.permissions || []);
    });
  }, [form.roleId]);

  useEffect(() => {
    if (!open || !isEditMode || !canManageDynamicRoles || !selectedUser?._id) {
      setOverridesWorking({});
      return;
    }
    getUserPermissionOverrides(selectedUser._id).then((res) => {
      if (res?.error) return;
      const rows = Array.isArray(res) ? res : res?.data || [];
      const working = {};
      rows.forEach((row) => {
        working[row.permissionId] = {};
        (row.overrides || []).forEach((o) => {
          working[row.permissionId][o.action] = o.effect;
        });
      });
      setOverridesWorking(working);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEditMode, canManageDynamicRoles, selectedUser]);

  // Stable identity via useCallback (no external deps — a functional
  // updater never reads `overridesWorking` directly) so it never breaks
  // PermissionModuleCard's memoization.
  const toggleOverride = useCallback((permissionId, action, isInherited) => {
    setOverridesWorking((prev) => {
      const next = { ...prev, [permissionId]: { ...(prev[permissionId] || {}) } };
      const current = next[permissionId][action];
      if (isInherited) {
        if (current === "deny") delete next[permissionId][action];
        else next[permissionId][action] = "deny";
      } else {
        if (current === "allow") delete next[permissionId][action];
        else next[permissionId][action] = "allow";
      }
      if (Object.keys(next[permissionId]).length === 0) delete next[permissionId];
      return next;
    });
  }, []);

  const buildOverridesPayload = () => {
    const payload = [];
    Object.entries(overridesWorking).forEach(([permissionId, actions]) => {
      Object.entries(actions).forEach(([action, effect]) => {
        payload.push({ permissionId, action, effect });
      });
    });
    return payload;
  };

  // Tab list is a small ordered array of keys rather than numeric indices,
  // so content/validation never has to assume which position a tab sits at
  // — Modules/Permissions are just new keys appended at the end.
  const tabsList = useMemo(() => {
    const list = ["details"];
    if (form.userType === "business") list.push("businessProfile");
    if (
      !isEditingSuperAdmin &&
      (form.userType === "staff" ||
        form.userType === "admin" ||
        form.userType === "business")
    ) {
      list.push("modules");
      if (canManageDynamicRoles) list.push("permissions");
    }
    return list;
  }, [form.userType, isEditingSuperAdmin, canManageDynamicRoles]);

  const maxTabIndex = Math.max(tabsList.length - 1, 0);
  const currentTabKey = tabsList[Math.min(activeTab, maxTabIndex)];

  useEffect(() => {
    if (activeTab > maxTabIndex) setActiveTab(maxTabIndex);
  }, [activeTab, maxTabIndex]);

  const validateTabByKey = (key) => {
    const newErrors = {};

    if (key === "details") {
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
    } else if (key === "businessProfile") {
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

  const validateCurrentTab = () => validateTabByKey(currentTabKey);

  const handleModalSave = async () => {
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
      // Only send roleId when this actor is actually allowed to manage it —
      // otherwise every save (even ones that never touched the Role select)
      // would attempt a role reassignment and could be rejected outright.
      if (!canManageDynamicRoles) delete payload.roleId;

      const userRes = await updateUser(selectedUser._id, payload);
      if (userRes?.error) {
        setLoading(false);
        return;
      }

      if (canManageDynamicRoles) {
        const overridesRes = await setUserPermissionOverrides(
          selectedUser._id,
          buildOverridesPayload(),
        );
        if (overridesRes?.error) {
          setLoading(false);
          return;
        }
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

      // Access Control availability is superadmin-only and independent of
      // the business profile fields above — send it regardless of
      // attachToExistingBusiness, and only when it actually changed.
      if (
        isSuperAdmin &&
        form.userType === "business" &&
        selectedUser.business?._id &&
        form.canManageAccessControl !== !!selectedUser.business?.canManageAccessControl
      ) {
        const accessControlPayload = new FormData();
        accessControlPayload.append(
          "canManageAccessControl",
          form.canManageAccessControl ? "true" : "false",
        );

        const accessControlRes = await updateBusiness(
          selectedUser.business._id,
          accessControlPayload,
        );

        if (accessControlRes?.error) {
          setLoading(false);
          return;
        }
      }
    }

    // ===================== CREATE MODE =====================
    else {
      let createdUserId = null;

      if (isSuperAdmin && (form.userType === "admin" || form.userType === "superadmin")) {
        const res = await createAdminUser({
          name: form.name,
          email: form.email,
          password: form.password,
          modulePermissions: form.modulePermissions || [],
          role: form.userType,
        });
        if (res?.error) {
          setLoading(false);
          return;
        }
        createdUserId = res?.user?.id || res?.user?._id || null;
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
              ...(isSuperAdmin
                ? { canManageAccessControl: form.canManageAccessControl }
                : {}),
            },
        });

        if (res?.error) {
          setLoading(false);
          return;
        }
        createdUserId = res?.user?.id || res?.user?._id || null;

        // Access Control availability on an existing business being attached
        // to — superadmin-only, independent of user creation, and only sent
        // when it actually differs from the business's current value.
        if (isSuperAdmin && form.attachToExistingBusiness && form.businessId) {
          const originalBusiness = businesses.find((biz) => biz._id === form.businessId);
          if (form.canManageAccessControl !== !!originalBusiness?.canManageAccessControl) {
            const accessControlPayload = new FormData();
            accessControlPayload.append(
              "canManageAccessControl",
              form.canManageAccessControl ? "true" : "false",
            );
            const accessControlRes = await updateBusiness(form.businessId, accessControlPayload);
            if (accessControlRes?.error) {
              setLoading(false);
              return;
            }
          }
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
        createdUserId = userRes?.user?.id || userRes?.user?._id || null;
      }

      // Role/override assignment is a separate follow-up call, since the
      // register/* endpoints don't accept roleId directly — updateUser does.
      if (canManageDynamicRoles && createdUserId) {
        if (form.roleId) {
          const roleRes = await updateUser(createdUserId, { roleId: form.roleId });
          if (roleRes?.error) {
            setLoading(false);
            return;
          }
        }
        const overridesPayload = buildOverridesPayload();
        if (overridesPayload.length) {
          const overridesRes = await setUserPermissionOverrides(createdUserId, overridesPayload);
          if (overridesRes?.error) {
            setLoading(false);
            return;
          }
        }
      }
    }

    await onSaved();
    setLoading(false);
    onClose();
  };

  // Show a Permissions-tab row if the module is currently selected on the
  // Modules tab, OR it has no entry in the older per-role module catalog at
  // all (e.g. "files") — such a module could never be selected there in the
  // first place, so it must not be silently unreachable here either.
  const filteredPermissionRows = useMemo(() => {
    return rolePermissionRows.filter((perm) => {
      const inAvailableCatalog = availableModules.some((m) => m.key === perm.module);
      if (!inAvailableCatalog) return true;
      return form.modulePermissions.includes(perm.module);
    });
  }, [rolePermissionRows, availableModules, form.modulePermissions]);

  const dialogTitle = isEditMode
    ? selectedUser?.role === "admin" || selectedUser?.role === "superadmin"
      ? t.editAdminUser
      : selectedUser?.role === "business"
        ? t.editBusinessUser
        : t.editStaffUser
    : form.userType === "superadmin"
      ? t.createSuperAdminUser
      : form.userType === "admin"
        ? t.createAdminUser
        : form.userType === "business"
          ? t.createBusinessUser
          : t.createStaffUser;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" dir={dir}>
      <DialogTitle sx={{ pr: 6 }}>
        {dialogTitle}
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            ...(dir === "rtl" ? { left: 8 } : { right: 8 }),
            top: 8,
            color: "text.secondary",
            border: "1px solid",
            borderColor: "primary.main",
            "&:hover": {
              bgcolor: "primary.main",
              color: "primary.contrastText",
            },
          }}
        >
          <ICONS.close />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          "&::-webkit-scrollbar": { width: 8 },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: theme.palette.sharedUI.scrollbarThumb,
            borderRadius: 8,
          },
          "&::-webkit-scrollbar-thumb:hover": {
            backgroundColor: theme.palette.sharedUI.scrollbarThumbHover,
          },
          scrollbarColor: `${theme.palette.sharedUI.scrollbarThumb} transparent`,
        }}
      >
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
              {isSuperAdmin && <MenuItem value="superadmin">{t.superAdminUser}</MenuItem>}
              {isSuperAdmin && <MenuItem value="admin">{t.adminUser}</MenuItem>}
              <MenuItem value="business">{t.businessUser}</MenuItem>
              <MenuItem value="staff">{t.staffUser}</MenuItem>
            </Select>
          </FormControl>
        )}

        {(form.userType === "business" ||
          form.userType === "admin" ||
          !isEditMode ||
          selectedUser?.role !== "admin") && (
            <Box sx={{ borderBottom: 1, borderColor: "divider", mt: 2, mx: -3 }}>
              <Tabs
                value={Math.min(activeTab, maxTabIndex)}
                onChange={(e, newValue) => setActiveTab(newValue)}
                aria-label="user tabs"
                sx={{ px: 3 }}
              >
                {tabsList.map((key) => (
                  <Tab
                    key={key}
                    label={
                      key === "details"
                        ? t.userDetailsTab
                        : key === "businessProfile"
                          ? t.businessProfileTab
                          : key === "modules"
                            ? t.modulesTab
                            : t.permissionsTab
                    }
                  />
                ))}
              </Tabs>
            </Box>
          )}

        {currentTabKey === "details" && (
          <Box sx={{ mt: 2 }}>
            {form.userType === "staff" &&
              isEditMode &&
              selectedUser?.role === "staff" && (
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
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, [field]: e.target.value }));
                  if (errors[field]) {
                    setErrors((prev) => ({ ...prev, [field]: "" }));
                  }
                }}
                fullWidth
                margin="normal"
                type={
                  field === "password" ? (showPassword ? "text" : "password") : "text"
                }
                error={!!errors[field]}
                helperText={errors[field] || ""}
                slotProps={{
                  input: field === "password"
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
                    : {},
                }}
              />
            ))}

            {isAdminOrSuperAdmin && !isEditMode && form.userType === "staff" && (
              <FormControl fullWidth margin="normal" error={!!errors.businessId}>
                <InputLabel id="business-select-label">{t.selectBusinessLabel}</InputLabel>
                <Select
                  labelId="business-select-label"
                  value={form.businessId || ""}
                  label={t.selectBusinessLabel}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, businessId: e.target.value }));
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

            {canManageDynamicRoles && (
              <FormControl fullWidth margin="normal">
                <InputLabel>{t.roleLabel}</InputLabel>
                <Select
                  label={t.roleLabel}
                  value={form.roleId || ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, roleId: e.target.value || null }))
                  }
                >
                  <MenuItem value="">{t.noRole}</MenuItem>
                  {roles.map((role) => (
                    <MenuItem key={role._id} value={role._id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {isBusinessUser &&
              form.userType === "staff" &&
              !currentUser?.business?.canManageAccessControl && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  {t.accessControlDisabled}
                </Typography>
              )}
          </Box>
        )}

        {currentTabKey === "businessProfile" && (
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
                  onChange={(e) => {
                    const selected = businesses.find((biz) => biz._id === e.target.value);
                    setForm((prev) => ({
                      ...prev,
                      businessId: e.target.value,
                      canManageAccessControl: !!selected?.canManageAccessControl,
                    }));
                  }}
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
                    setForm((prev) => ({ ...prev, businessSlug: e.target.value }))
                  }
                  fullWidth
                  margin="normal"
                />

                <TextField
                  label={t.businessEmail}
                  value={form.businessEmail}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, businessEmail: e.target.value }))
                  }
                  fullWidth
                  margin="normal"
                />

                <TextField
                  label={t.businessPhone}
                  value={form.businessPhone}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, businessPhone: e.target.value }))
                  }
                  fullWidth
                  margin="normal"
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
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <Avatar src={form.logoPreview} alt="Preview" sx={{ width: 64, height: 64 }} />
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

        {currentTabKey === "modules" && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ textAlign: align }}>
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
                          .filter((m) => currentUser.modulePermissions?.includes(m.key))
                          .map((m) => m.key)
                        : availableModules.map((m) => m.key);
                      setForm((prev) => ({ ...prev, modulePermissions: allKeys }));
                    } else {
                      setForm((prev) => ({ ...prev, modulePermissions: [] }));
                    }
                  }}
                />
              }
              label={form.modulePermissions.length ? t.unselectAll : t.selectAll}
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

        {currentTabKey === "permissions" && (
          <Box sx={{ mt: 2 }}>
            {isSuperAdmin && form.userType === "business" && (
              <>
                <Box sx={{ pb: 2 }}>
                  <FormControlLabel
                    sx={{ display: "flex", m: 0 }}
                    control={
                      <Switch
                        checked={form.canManageAccessControl}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            canManageAccessControl: e.target.checked,
                          }))
                        }
                      />
                    }
                    label={t.canManageAccessControl}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                    {t.canManageAccessControlHint}
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
              </>
            )}
            <Typography variant="subtitle1" gutterBottom sx={{ textAlign: align }}>
              {t.roleOverridesTitle}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              {t.roleOverridesHint}
            </Typography>

            {!form.roleId ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {t.noRole}
              </Typography>
            ) : (
              <>
                <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
                  <Chip size="small" variant="outlined" label={t.legendInherited} />
                  <Chip size="small" color="success" label={t.legendAllow} />
                  <Chip size="small" color="error" label={t.legendDeny} />
                </Stack>

                {rolePermissionRows.length > 0 && filteredPermissionRows.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    {t.selectModulesFirstHint}
                  </Typography>
                )}

                <Stack divider={<Divider />}>
                  {filteredPermissionRows.map((perm) => (
                    <PermissionModuleCard
                      key={perm.permissionId}
                      perm={perm}
                      info={
                        availableModules.find((m) => m.key === perm.module) ||
                        FALLBACK_MODULE_INFO[perm.module]
                      }
                      overridesForPermission={overridesWorking[perm.permissionId] || {}}
                      actionLabels={actionLabels}
                      language={language}
                      theme={theme}
                      t={t}
                      ceilingPermissions={currentUser?.permissions}
                      isSuper={currentUser?.isSuper}
                      onToggle={toggleOverride}
                    />
                  ))}
                </Stack>
              </>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Stack direction="row" spacing={2} sx={{ width: "100%", justifyContent: "flex-end" }}>
          <Stack
            direction="row"
            spacing={2}
            sx={{ width: { xs: "100%", sm: "auto" }, gap: dir === "rtl" ? "16px" : "" }}
          >
            {activeTab > 0 && (
              <Button
                variant="outlined"
                onClick={() => setActiveTab((prev) => prev - 1)}
                disabled={loading}
                startIcon={dir === "rtl" ? <ICONS.next /> : <ICONS.back />}
                sx={{ ...getStartIconSpacing(dir), flex: { xs: 1, sm: "initial" } }}
              >
                {t.back}
              </Button>
            )}

            {activeTab < maxTabIndex ? (
              <Button
                variant="contained"
                onClick={() => {
                  if (validateCurrentTab()) {
                    setActiveTab((prev) => Math.min(prev + 1, maxTabIndex));
                  }
                }}
                disabled={loading}
                startIcon={dir === "rtl" ? <ICONS.back /> : <ICONS.next />}
                sx={{ ...getStartIconSpacing(dir), flex: { xs: 1, sm: "initial" } }}
              >
                {t.next}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleModalSave}
                disabled={loading}
                startIcon={<ICONS.save />}
                sx={{ ...getStartIconSpacing(dir), flex: { xs: 1, sm: "initial" } }}
              >
                {loading ? (isEditMode ? t.saving : t.creating) : t.save}
              </Button>
            )}
          </Stack>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}

export default memo(UserFormModal);
