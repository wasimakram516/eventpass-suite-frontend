import api from "./api";
import axios from "axios";

// Store only access token, refresh token stays in cookies
export const getAccessToken = () => sessionStorage.getItem("accessToken");
export const setAccessToken = (accessToken) => sessionStorage.setItem("accessToken", accessToken);
export const setUser = (user) => sessionStorage.setItem("user", JSON.stringify(user));
export const clearTokens = () => {
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("user");
};

// **Login API Call**
export const login = async (email, password) => {
  const { data } = await api.post("/auth/login", { email, password });

  setAccessToken(data.data.accessToken);
  setUser(data.data.user);
  
  return data.data;
};

// **Register New Business User**
export const registerUser = async (name, email, password) => {
  const { data } = await api.post("/auth/register", { name, email, password });
  return data.data;
};

// **Refresh Access Token Using Secure Cookie**
export async function refreshToken() {
  try {
    const { data } = await api.post("/auth/refresh"); 
    setAccessToken(data.data.accessToken);
    return data.data.accessToken;
  } catch (error) {
    console.error("Failed to refresh token:", error);
    throw new Error("Failed to refresh token");
  }
}

// **Logout API Call**
export async function logoutUser() {
  try {
    await api.post("/auth/logout"); // Backend will clear the refresh token cookie
  } catch (error) {
    console.error("Failed to logout on the server:", error);
  } finally {
    clearTokens();
    
    // Prevent multiple redirects
    if (window.location.pathname !== "/auth/login") {
      window.location.href = "/auth/login";
    }
  }
}
