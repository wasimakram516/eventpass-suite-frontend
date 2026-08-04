import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// get all staff users
export const getAllStaffUsers = withApiHandler(async (businessId) => {
  const { data } = await api.get(`/users/${businessId}/staff`);
  return data;
});

// Create a new staff user
export const createStaffUser = withApiHandler(
  async (name, email, password, role, business, modulePermissions = [], roleId) => {
    const { data } = await api.post("/users/register/staff", {
      name,
      email,
      password,
      role,
      business,
      modulePermissions,
      roleId,
    });
    return data;
  },
  { showSuccess: true }
);

// Create admin user (superadmin only). Pass role: "superadmin" to create
// another superadmin instead of a regular admin — the backend only allows
// this for callers who are already superadmin (route is superAdminOnly).
export const createAdminUser = withApiHandler(
  async ({
    name,
    email,
    password,
    modulePermissions = [],
    role = "admin",
    canManageAccessControl,
    roleId,
  }) => {
    const { data } = await api.post("/users/register/admin", {
      name,
      email,
      password,
      modulePermissions,
      role,
      canManageAccessControl,
      roleId,
    });
    return data;
  },
  { showSuccess: true }
);

// Create business user (admin only)
export const createBusinessUser = withApiHandler(
  async ({
    name,
    email,
    password,
    modulePermissions = [],
    attachToExistingBusiness,
    businessId,
    business, // object when creating new business
    canManageAccessControl,
    roleId,
  }) => {
    const { data } = await api.post("/users/register/business", {
      name,
      email,
      password,
      modulePermissions,
      attachToExistingBusiness,
      businessId,
      business,
      canManageAccessControl,
      roleId,
    });

    return data;
  },
  { showSuccess: true }
);

// Get all users (admin). Pass `{ scope: "admins" }` for the lightweight
// superadmin/admin/orphan-only view, or `{ businessId }` to load just one
// business's users on demand — omit params entirely for the original
// unfiltered "everyone" shape (relied on by Trash/Logs for name resolution).
export const getAllUsers = withApiHandler(async (params) => {
  const { data } = await api.get("/users", { params });
  return data;
});

// Get unassigned users (for assigning to new businesses)
export const getUnassignedUsers = withApiHandler(async () => {
  const { data } = await api.get("/users/unassigned");
  return data;
});

// Get a single user by ID
export const getUserById = withApiHandler(async (id) => {
  const { data } = await api.get(`/users/${id}`);
  return data;
});

// Update a user (admin) → show success snackbar on completion
export const updateUser = withApiHandler(
  async (id, userData) => {
    const { data } = await api.put(`/users/${id}`, userData);
    return data;
  },
  { showSuccess: true }
);

// Delete a user (admin) → show success snackbar on completion
export const deleteUser = withApiHandler(
  async (id) => {
    const { data } = await api.delete(`/users/${id}`);
    return data;
  },
  { showSuccess: true }
);
