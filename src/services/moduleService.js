// services/moduleService.js
import api from "./api";

export const getModules = async () => {
  const { data } = await api.get("/modules");
  return data.data;
};
