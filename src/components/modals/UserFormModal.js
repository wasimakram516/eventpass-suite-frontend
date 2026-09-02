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
import { fetchMe } from "@/services/authService";
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
import { getModules } from "@/services/moduleService";
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
  attachToExistingBusiness: false,
  businessName: "",
  businessSlug: "",
  businessEmail: "",
  businessPhone: "",
  businessAddress: "",
  logoPreview: "",
  logoFile: null,
  canManageAccessControl: false,
  // undefined = unrestricted (unset, the backward-compatible default — see
  // User.js). An explicit array (even []) means "exactly these staff roles
  // and nothing else." Only ever set by the restrictStaffRoles toggle below.
  allowedStaffRoleIds: undefined,
  isActive: true,
};

function UserFormModal({
  open,
  onClose,
  onSaved,
  isEditMode,
  selectedUser,
  businesses,
  t,
  dir,
  align,
  language,
}) {
  const { user: currentUser, setUser: setCurrentUser } = useAuth();
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
  const [staffRoleCatalog, setStaffRoleCatalog] = useState([]);
  // Local UI-only toggle, not itself sent to the backend — mirrors
  // attachToExistingBusiness's pattern. OFF keeps form.allowedStaffRoleIds
  // undefined (unrestricted); ON reveals the checklist and turns it into an
  // explicit array. Distinguishes "never configured" from "explicitly
  // restricted to nothing," which an empty checklist alone can't.
  const [restrictStaffRoles, setRestrictStaffRoles] = useState(false);
  const [availableModules, setAvailableModules] = useState([]);
  const [rolePermissionRows, setRolePermissionRows] = useState([]);
  const [overridesWorking, setOverridesWorking] = useState({});
  const [actionLabels, setActionLabels] = useState({});

  // Tracks the CURRENT tier selection, not selectedUser's original role — a
  // superadmin stepping a target down to admin via the tier Select below
  // must immediately regain the Roles/Modules tabs (canManageDynamicRoles)
  // so a roleId can be picked in the same save, matching the backend's
  // requirement that a non-superadmin never end up role-less (see
  // usersController.updateUser's role-change block).
  const isEditingSuperAdmin = isEditMode && form.userType === "superadmin";
  // Same currentUser id-shape caveat as users/page.js's self-card
  // normalization — AuthContext's currentUser carries `.id` (from
  // authController's hand-built /auth/me response), not `._id` like every
  // other user record.
  const isEditingSelf =
    isEditMode &&
    selectedUser &&
    String(selectedUser._id) === String(currentUser?._id || currentUser?.id);

  // Only a superadmin may re-tier an existing admin/superadmin account, and
  // only between those two tiers — re-tiering a business/staff user is a
  // much bigger structural change (business assignment, roleId, etc.) and
  // is out of scope here. Matches the backend's superadmin-only role-change
  // guard in usersController.updateUser.
  const canEditTier =
    isSuperAdmin && isEditMode && ["admin", "superadmin"].includes(selectedUser?.role);

  // Per the access-control design: only superadmin may assign dynamic
  // Roles/overrides to admin/business-tier accounts by default; a business
  // owner may only do so for their own staff, and an admin may only do so
  // for business/staff users (never another admin/superadmin) — both only
  // once THEIR OWN canManageAccessControl is enabled (User.js — a per-user
  // flag, not per-business, so one business owner or admin can be trusted
  // with this without automatically extending it to a co-owner/peer admin).
  const currentUserRole = (currentUser?.role || "").toLowerCase();
  const canManageDynamicRoles =
    !isEditingSuperAdmin &&
    form.userType !== "superadmin" &&
    (isSuperAdmin ||
      (currentUserRole === "business" &&
        form.userType === "staff" &&
        !!currentUser?.canManageAccessControl) ||
      (currentUserRole === "admin" &&
        ["business", "staff"].includes(form.userType) &&
        !!currentUser?.canManageAccessControl));

  // Whether this actor may create a user of the selected type AT ALL — same
  // shape as canManageDynamicRoles but without the superadmin-target-type
  // carve-out (creating a superadmin doesn't need a role picked, but the
  // actor still needs to BE a superadmin to reach that option — see the
  // userType Select's own isSuperAdmin gate). A business/admin actor
  // without canManageAccessControl is blocked from creating users
  // entirely, not silently given a default role.
  const isAuthorizedToCreate =
    isSuperAdmin ||
    (currentUserRole === "business" &&
      form.userType === "staff" &&
      !!currentUser?.canManageAccessControl) ||
    (currentUserRole === "admin" &&
      ["business", "staff"].includes(form.userType) &&
      !!currentUser?.canManageAccessControl);

  // Neither a business nor an admin actor may grant a module they don't
  // hold themselves — same ceiling rule the granular Role/override system
  // already enforces (see roleAssignmentAuthz.js's
  // assertModulePermissionsWithinCeiling, the backend authority here; this
  // is UX only). Superadmin is unrestricted.
  const moduleCeilingActive = !isSuperAdmin && ["business", "admin"].includes(currentUserRole);
  const ceilingFilteredModules = moduleCeilingActive
    ? availableModules.filter((m) => currentUser?.modulePermissions?.includes(m.key))
    : availableModules;

  // The Role select was only ever scoped to userType (staff/business/admin),
  // never to a business actor's OWN allowedStaffRoleIds whitelist — so a
  // business owner restricted to just "Desk Staff" still saw "Door Staff" as
  // a pickable option in Create/Edit, even though assertCanAssignRole would
  // reject it server-side. Mirrors the backend check: only applies when the
  // actor is business, the target is staff, and a whitelist is actually set
  // (unset means unrestricted, per User.js).
  const roleOptions =
    currentUserRole === "business" &&
      form.userType === "staff" &&
      Array.isArray(currentUser?.allowedStaffRoleIds)
      ? roles.filter((r) =>
        currentUser.allowedStaffRoleIds.some((id) => String(id?._id || id) === String(r._id)),
      )
      : roles;

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
          selectedUser.role === "superadmin"
            ? "superadmin"
            : selectedUser.role === "admin"
              ? "admin"
              : selectedUser.role === "business"
                ? "business"
                : "staff",
        attachToExistingBusiness: true,
        businessId: selectedUser.business?._id || "",
        businessName: selectedUser.business?.name || "",
        businessSlug: selectedUser.business?.slug || "",
        businessEmail: businessContact.email || "",
        businessPhone: businessContact.phone || "",
        businessAddress: selectedUser.business?.address || "",
        logoPreview: selectedUser.business?.logoUrl || "",
        logoFile: null,
        canManageAccessControl: !!selectedUser.canManageAccessControl,
        allowedStaffRoleIds: Array.isArray(selectedUser.allowedStaffRoleIds)
          ? selectedUser.allowedStaffRoleIds.map((r) => r?._id || r)
          : undefined,
        isActive: selectedUser.isActive !== false,
      });
      setRestrictStaffRoles(Array.isArray(selectedUser.allowedStaffRoleIds));
    } else {
      setForm({
        ...defaultForm,
        userType: isAdminOrSuperAdmin ? "business" : "staff",
      });
      setRestrictStaffRoles(false);
    }
    setErrors({});
    setActiveTab(0);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEditMode, selectedUser]);

  useEffect(() => {
    if (!open || !canManageDynamicRoles) return;
    // Scoped to the TARGET being created/edited (form.userType), not the
    // current actor's own role — a staff target can only ever use
    // eventreg/checkin/digipass (see getModulesForRole("staff") on the
    // backend), so offering the actor's own full module set here (e.g. all
    // 13, if the actor is a business owner) let a business owner create
    // staff with access to modules staff can never actually route into.
    getRoles(form.userType).then((res) => {
      if (!res?.error) setRoles(Array.isArray(res) ? res : res?.data || []);
    });
    getModules(form.userType).then((res) => {
      if (!res?.error) setAvailableModules(Array.isArray(res) ? res : res?.data || []);
    });
    // The new "Roles" tab (business target only) whitelists which STAFF
    // roles this business owner may hand to their own staff later — always
    // the staff catalog, regardless of form.userType (which is "business"
    // whenever this tab is even visible).
    if (form.userType === "business") {
      getRoles("staff").then((res) => {
        if (!res?.error) setStaffRoleCatalog(Array.isArray(res) ? res : res?.data || []);
      });
    }
    getActions().then((res) => {
      if (res?.error) return;
      const list = Array.isArray(res) ? res : res?.data || [];
      const labels = {};
      list.forEach((a) => { labels[a.key] = a.labels; });
      setActionLabels(labels);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, canManageDynamicRoles, form.userType]);

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
    // A business owner can never edit their own business info (see
    // businessController.updateBusiness / Settings being hidden for them
    // entirely) — this tab is admin/superadmin-only for the same reason,
    // not just the "select business" dropdown inside it.
    if (form.userType === "business" && isAdminOrSuperAdmin) list.push("businessProfile");
    if (
      !isEditingSuperAdmin &&
      canManageDynamicRoles &&
      (form.userType === "staff" ||
        form.userType === "admin" ||
        form.userType === "business")
    ) {
      list.push("modules");
      // Only meaningful for a business target — restricts which staff-typed
      // roles THAT owner may later hand to their own staff (see
      // allowedStaffRoleIds on User.js). Staff/admin targets don't create
      // staff of their own, so there's nothing to whitelist for them.
      if (form.userType === "business") list.push("staffRoles");
      list.push("permissions");
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
      // Mirrors handleModalSave's own branching below — attaching to an
      // existing business only needs businessId; the name/slug/email
      // fields are for the "create a new business" path and stay empty
      // when attaching, so requiring them here blocked Next from ever
      // advancing past this tab while attached.
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

    // Creation requires an authorized actor — no such check applies to
    // editing an existing user (canEditUser upstream already gated whether
    // this modal could even open).
    if (!isEditMode && !isAuthorizedToCreate) {
      showMessage(t.notAuthorizedToCreateUser, "error");
      return;
    }

    // A role can be CHANGED but never REMOVED, in both create and edit —
    // every non-superadmin user needs a roleId to have any effective
    // permission at all (see permissionResolver.js). Only checked when the
    // Role select is actually visible (canManageDynamicRoles) — if it's
    // hidden, roleId is stripped from the payload entirely below and the
    // user's existing role is left untouched, not cleared.
    if (
      (canManageDynamicRoles || !isEditMode) &&
      form.userType !== "superadmin" &&
      !form.roleId
    ) {
      showMessage(t.roleRequired, "error");
      return;
    }

    if (canManageDynamicRoles && roleCeilingViolation) {
      showMessage(
        `Cannot assign this role: it grants ${roleCeilingViolation}, which you do not have.`,
        "error",
      );
      return;
    }

    setLoading(true);

    // ===================== EDIT MODE =====================
    if (isEditMode) {
      const payload = { ...form };
      if (!form.password) delete payload.password;
      // Only ever send `role` (the account tier) when the tier Select was
      // actually rendered for this edit (canEditTier) — the backend now
      // rejects the WHOLE save for any non-superadmin actor whose payload
      // carries `role` at all, even a no-op resave of the current value
      // (see usersController.updateUser). Every other edit flow must never
      // include this key, since form.userType always mirrors the target's
      // current tier for those.
      if (canEditTier) payload.role = form.userType;
      // Only send roleId when this actor is actually allowed to manage it —
      // otherwise every save (even ones that never touched the Role select)
      // would attempt a role reassignment and could be rejected outright.
      if (!canManageDynamicRoles) delete payload.roleId;
      // Same reasoning for modulePermissions — the backend treats it as an
      // access-control act requiring the ACTOR's own canManageAccessControl
      // (see usersController.updateUser), same as roleId. This field was
      // missing from this guard entirely, so every edit save — even a plain
      // name change on yourself or your own staff — always carried the
      // form's current modulePermissions array along and got rejected
      // outright for any actor whose own flag is off, regardless of
      // whether modules were ever touched.
      if (!canManageDynamicRoles) delete payload.modulePermissions;
      // Same reasoning again for isActive — deactivation blocks login
      // entirely, so it's gated the same as modulePermissions/roleId, and
      // every edit form carries the target's CURRENT isActive along
      // regardless of whether the (self-edit-hidden) toggle was ever shown.
      if (!canManageDynamicRoles) delete payload.isActive;
      // Same reasoning for canManageAccessControl — it's superadmin-only on
      // the backend, so a non-superadmin editing their own/another user
      // would otherwise get the whole save rejected just for carrying this
      // field's current (unchanged) value along.
      if (!isSuperAdmin) delete payload.canManageAccessControl;
      // Same reasoning again for businessId — it's superadmin-only on the
      // backend (reassigning a user's business crosses a tenant boundary),
      // but every edit form for a business-type target carries the
      // target's CURRENT businessId along regardless of which tab was
      // touched. Without this, a non-superadmin fixing a typo in their own
      // name would get the whole save rejected just for carrying that
      // field's unchanged value.
      if (!isSuperAdmin) delete payload.businessId;
      // Only meaningful for a business target, and only touched at all if
      // this actor could even see the Roles tab (canManageDynamicRoles).
      // restrictStaffRoles OFF after previously being ON means "clear this
      // restriction" — sent as an explicit null (backend: superadmin-only,
      // since un-restricting widens what the business can do). OFF and
      // never was restricted just omits the key (a true no-op, preserves
      // undefined either side).
      if (form.userType !== "business" || !canManageDynamicRoles) {
        delete payload.allowedStaffRoleIds;
      } else if (!restrictStaffRoles) {
        payload.allowedStaffRoleIds = Array.isArray(selectedUser?.allowedStaffRoleIds) ? null : undefined;
        if (payload.allowedStaffRoleIds === undefined) delete payload.allowedStaffRoleIds;
      }

      const userRes = await updateUser(selectedUser._id, payload);
      if (userRes?.error) {
        setLoading(false);
        return;
      }

      // The "self" card (renderUserCard(currentUser, true) in users/page.js)
      // renders from AuthContext's `currentUser`, not from the regular user
      // list — so a successful self-edit updates the DB but leaves the
      // displayed card, sidebar, and anywhere else currentUser is read
      // showing stale data until AuthContext's next periodic refresh (up to
      // 30s later, or a resume/focus event). Refresh it immediately instead
      // of waiting on that.
      if (String(selectedUser._id) === String(currentUser?._id || currentUser?.id)) {
        fetchMe().then(setCurrentUser).catch(() => {});
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
          // Superadmin-only on the backend too; harmless to always include
          // here since this whole branch already requires isSuperAdmin.
          canManageAccessControl: form.canManageAccessControl,
          // Mandatory except for a superadmin target, which bypasses roles
          // entirely (see permissionResolver.js's isSuper).
          roleId: form.userType === "superadmin" ? undefined : form.roleId,
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
            },

          // Applies to the new owner User being created, regardless of
          // whether they're attaching to an existing business or a brand
          // new one — this flag lives on the user, not the business.
          ...(isSuperAdmin
            ? { canManageAccessControl: form.canManageAccessControl }
            : {}),
          roleId: form.roleId,
          // Omitted entirely unless the actor actually turned the
          // restriction on — leaves the new owner unrestricted by default
          // (see User.js), same as an untouched pre-existing owner.
          ...(restrictStaffRoles ? { allowedStaffRoleIds: form.allowedStaffRoleIds || [] } : {}),
        });

        if (res?.error) {
          setLoading(false);
          return;
        }
        createdUserId = res?.user?.id || res?.user?._id || null;
      } else {
        // Staff creation
        const userRes = await createStaffUser(
          form.name,
          form.email,
          form.password,
          "staff",
          isAdminOrSuperAdmin ? form.businessId : currentUser.business._id,
          form.modulePermissions,
          form.roleId,
        );

        if (userRes?.error) {
          setLoading(false);
          return;
        }
        createdUserId = userRes?.user?.id || userRes?.user?._id || null;
      }

      // Overrides are still a separate follow-up call — role assignment is
      // now atomic with creation itself (see the roleId passed above),
      // since the backend requires it at creation time, not as a later
      // update.
      if (canManageDynamicRoles && createdUserId) {
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

  // Mirrors the backend's assertCanAssignRole ceiling check (roleAssignmentAuthz.js)
  // using data already on hand — rolePermissionRows loads as soon as a role is
  // picked, and currentUser.permissions is the same ceiling set already used
  // for the Permissions tab's per-checkbox disabling above. Surfaced right
  // under the Role select, immediately on selection, instead of only
  // discovering it from a generic backend error banner after Save — and for
  // the same reason the granted-but-ceiling-exceeding action wasn't otherwise
  // visually distinguishable from an ordinary disabled override in that tab.
  const roleCeilingViolation = useMemo(() => {
    if (isSuperAdmin || !form.roleId || rolePermissionRows.length === 0) return null;
    for (const perm of rolePermissionRows) {
      for (const action of perm.grantedActions || []) {
        if (!currentUser?.permissions?.includes(`${perm.module}:${action}`)) {
          return `${perm.module}:${action}`;
        }
      }
    }
    return null;
  }, [isSuperAdmin, form.roleId, rolePermissionRows, currentUser]);

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
        {((isAdminOrSuperAdmin && !isEditMode) || canEditTier) && (
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
              {!isEditMode && <MenuItem value="business">{t.businessUser}</MenuItem>}
              {!isEditMode && <MenuItem value="staff">{t.staffUser}</MenuItem>}
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
                            : key === "staffRoles"
                              ? t.staffRolesTab
                              : t.permissionsTab
                    }
                  />
                ))}
              </Tabs>
            </Box>
          )}

        {currentTabKey === "details" && (
          <Box sx={{ mt: 2 }}>
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

            {/* Never shown for self-edit (see updateUser's self-lockout
                guard) — same access-control-act gate as modulePermissions/
                roleId (canManageDynamicRoles), since deactivation blocks
                login entirely. */}
            {isEditMode && !isEditingSelf && canManageDynamicRoles && (
              <Box sx={{ mt: 1 }}>
                <FormControlLabel
                  sx={{ display: "flex", m: 0 }}
                  control={
                    <Switch
                      checked={form.isActive}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, isActive: e.target.checked }))
                      }
                    />
                  }
                  label={form.isActive ? t.active : t.inactive}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                  {t.accountActiveHint}
                </Typography>
              </Box>
            )}

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
                  {roleOptions.map((role) => (
                    <MenuItem key={role._id} value={role._id} disabled={role.isActive === false}>
                      {role.isActive === false ? `${role.name} (${t.roleInactiveShort})` : role.name}
                    </MenuItem>
                  ))}
                </Select>
                {roleCeilingViolation && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {`Cannot assign this role: it grants ${roleCeilingViolation}, which you do not have. Choose a different role, or ask a superadmin to grant your business that access first.`}
                  </Typography>
                )}
              </FormControl>
            )}
            {!isSuperAdmin &&
              !canManageDynamicRoles &&
              !!currentUser &&
              ((isBusinessUser && form.userType === "staff") ||
                (currentUserRole === "admin" &&
                  ["business", "staff"].includes(form.userType))) && (
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
            {isAdminOrSuperAdmin && form.attachToExistingBusiness && (
              <FormControl fullWidth margin="normal">
                <InputLabel>Select Business</InputLabel>
                <Select
                  value={form.businessId}
                  label="Select Business"
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, businessId: e.target.value }))
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
                    form.modulePermissions.length === ceilingFilteredModules.length
                  }
                  indeterminate={
                    form.modulePermissions.length > 0 &&
                    form.modulePermissions.length !== ceilingFilteredModules.length
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      const allKeys = ceilingFilteredModules.map((m) => m.key);
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
              {availableModules.map((mod) => {
                // Shown but disabled, not hidden, for modules outside the
                // actor's own ceiling — same "Your business does not have
                // this permission" treatment as the granular Permissions
                // tab (PermissionModuleCard above), so a business owner can
                // see the full catalog and understand why a module can't be
                // granted, rather than it silently not being there.
                const ceilingOk = !moduleCeilingActive || ceilingFilteredModules.some((m) => m.key === mod.key);
                return (
                  <Tooltip
                    key={mod.key}
                    title={!ceilingOk ? "Your business does not have this permission" : ""}
                  >
                    <FormControlLabel
                      disabled={!ceilingOk}
                      control={
                        <Checkbox
                          checked={form.modulePermissions.includes(mod.key)}
                          onChange={() => {
                            if (!ceilingOk) return;
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
                  </Tooltip>
                );
              })}
            </FormGroup>
          </Box>
        )}

        {currentTabKey === "staffRoles" && (
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              sx={{ display: "flex", m: 0 }}
              control={
                <Switch
                  checked={restrictStaffRoles}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setRestrictStaffRoles(checked);
                    setForm((prev) => ({
                      ...prev,
                      allowedStaffRoleIds: checked ? (prev.allowedStaffRoleIds || []) : undefined,
                    }));
                  }}
                />
              }
              label={t.restrictStaffRoles}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, mb: 2 }}>
              {t.restrictStaffRolesHint}
            </Typography>

            {restrictStaffRoles && (
              staffRoleCatalog.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t.noStaffRolesAvailable}
                </Typography>
              ) : (
                <FormGroup>
                  {staffRoleCatalog.map((role) => (
                    <FormControlLabel
                      key={role._id}
                      control={
                        <Checkbox
                          checked={(form.allowedStaffRoleIds || []).includes(role._id)}
                          onChange={() => {
                            const exists = (form.allowedStaffRoleIds || []).includes(role._id);
                            setForm((prev) => ({
                              ...prev,
                              allowedStaffRoleIds: exists
                                ? (prev.allowedStaffRoleIds || []).filter((id) => id !== role._id)
                                : [...(prev.allowedStaffRoleIds || []), role._id],
                            }));
                          }}
                        />
                      }
                      label={role.name}
                    />
                  ))}
                </FormGroup>
              )
            )}
          </Box>
        )}

        {currentTabKey === "permissions" && (
          <Box sx={{ mt: 2 }}>
            {isSuperAdmin && ["business", "admin"].includes(form.userType) && (
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
                    {form.userType === "admin"
                      ? t.canManageAccessControlHintAdmin
                      : t.canManageAccessControlHint}
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
