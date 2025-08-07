import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Store only access token, refresh token stays in cookies
export const getAccessToken = () => sessionStorage.getItem("accessToken");
export const setAccessToken = (accessToken) => sessionStorage.setItem("accessToken", accessToken);
export const setUser = (user) => sessionStorage.setItem("user", JSON.stringify(user));
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
export const registerUser = withApiHandler(async (name, email, password) => {
  const { data } = await api.post("/auth/register", { name, email, password });
  return data;
});

// **Refresh Access Token Using Secure Cookie**
export const refreshToken = withApiHandler(async () => {
  const { data } = await api.post("/auth/refresh");
  setAccessToken(data.data.accessToken);
  return data.data.accessToken;
});

// **Logout API Call**
export const logoutUser = async () => {
    await api.post("/auth/logout");
    clearTokens();
};
