// services/userService.js
import api from "./api";
import withApiHandler from "@/utils/withApiHandler";

// Get all users (admin)
export const getAllUsers = withApiHandler(async () => {
  const { data } = await api.get("/users");
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
