import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Store only access token, refresh token stays in cookies
export const getAccessToken = () => sessionStorage.getItem("accessToken");
export const setAccessToken = (accessToken) =>
  sessionStorage.setItem("accessToken", accessToken);
export const setUser = (user) =>
  sessionStorage.setItem("user", JSON.stringify(user));
export const clearTokens = () => {
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("user");
};

// **Login API Call**
export const login = withApiHandler(async (email, password) => {
  const { data } = await api.post("/auth/login", { email, password });
  setAccessToken(data.data.accessToken);
  setUser(data.data.user);
  return data;
});

// **Register New Business User**
export const registerUser = withApiHandler(
  async (
    name,
    email,
    password,
    role = "business",
    business = null,
    modulePermissions = []
  ) => {
    const { data } = await api.post("/auth/register", {
      name,
      email,
      password,
      role,
      business,
      modulePermissions,
    });
    return data;
  },
  { showSuccess: true }
);

// **Refresh Access Token Using Secure Cookie**
export const refreshToken = withApiHandler(async () => {
  const { data } = await api.post("/auth/refresh");
  setAccessToken(data.data.accessToken);
  return data.data.accessToken;
});

// **Fetch current user + resolved granular permissions.** Permissions are
// never baked into the access token (see backend permissionResolver.js), so
// this is how the frontend picks up a role/permission change an admin made
// mid-session without forcing the user to log out and back in.
export const fetchMe = async () => {
  const { data } = await api.get("/auth/me");
  setUser(data.data.user);
  return data.data.user;
};

// **Logout API Call**
export const logoutUser = async () => {
  await api.post("/auth/logout");
  clearTokens();
};
