import api from "./api";

// Get all users (admin)
export const getAllUsers = async () => {
  const { data } = await api.get("/users");
  return data.data;
};

// Get unassigned users (for assigning to new businesses)
export const getUnassignedUsers = async () => {
  const { data } = await api.get("/users/unassigned");
  return data.data;
};

// Get a single user by ID
export const getUserById = async (id) => {
  const { data } = await api.get(`/users/${id}`);
  return data.data;
};

// Update a user (admin)
export const updateUser = async (id, userData) => {
  const { data } = await api.put(`/users/${id}`, userData);
  return data.data;
};

// Delete a user (admin)
export const deleteUser = async (id) => {
  const { data } = await api.delete(`/users/${id}`);
  return data.data;
};
