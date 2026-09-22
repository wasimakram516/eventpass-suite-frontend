import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// ---- Roles ----

// Roles are global — assignable to any user regardless of business.
// Optional userType narrows to roles meant for that tier (admin/business/
// staff) — an untyped legacy role is included in every filtered result too
// (see roleController.listRoles), so this never hides a role nobody has
// gotten around to typing yet.
export const getRoles = withApiHandler(async (userType) => {
  const url = userType ? `/roles?userType=${encodeURIComponent(userType)}` : "/roles";
  const { data } = await api.get(url);
  return data;
});

export const getRoleById = withApiHandler(async (id) => {
  const { data } = await api.get(`/roles/${id}`);
  return data;
});

export const createRole = withApiHandler(
  async ({ name, description, userType, isSelfRegistrationDefault, canManageAccessControl }) => {
    const { data } = await api.post("/roles", {
      name,
      description,
      userType,
      isSelfRegistrationDefault,
      canManageAccessControl,
    });
    return data;
  },
  { showSuccess: true }
);

export const updateRole = withApiHandler(
  async (id, roleData) => {
    const { data } = await api.put(`/roles/${id}`, roleData);
    return data;
  },
  { showSuccess: true }
);

export const deleteRole = withApiHandler(
  async (id) => {
    const { data } = await api.delete(`/roles/${id}`);
    return data;
  },
  { showSuccess: true }
);

// ---- Role <-> Permission matrix ----

export const getRolePermissions = withApiHandler(async (roleId) => {
  const { data } = await api.get(`/roles/${roleId}/permissions`);
  return data;
});

export const setRolePermissions = withApiHandler(
  async (roleId, permissions) => {
    const { data } = await api.patch(`/roles/${roleId}/permissions`, { permissions });
    return data;
  },
  { showSuccess: true }
);

// ---- Permission catalog ----

export const getPermissions = withApiHandler(async () => {
  const { data } = await api.get("/permissions");
  return data;
});

// Bilingual action catalog: [{ key, labels: { en, ar } }] — same shape
// convention as getModules(), so action names never need hardcoding here.
export const getActions = withApiHandler(async () => {
  const { data } = await api.get("/actions");
  return data;
});

// ---- Per-user overrides ----

export const getUserPermissionOverrides = withApiHandler(async (userId) => {
  const { data } = await api.get(`/users/${userId}/permission-overrides`);
  return data;
});

export const setUserPermissionOverrides = withApiHandler(
  async (userId, overrides) => {
    const { data } = await api.put(`/users/${userId}/permission-overrides`, { overrides });
    return data;
  },
  { showSuccess: true }
);

export const getUserEffectivePermissions = withApiHandler(async (userId) => {
  const { data } = await api.get(`/users/${userId}/effective-permissions`);
  return data;
});
