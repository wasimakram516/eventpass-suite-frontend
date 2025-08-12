import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

export const getModules = withApiHandler(async (role) => {
  const url = role ? `/modules?role=${encodeURIComponent(role)}` : "/modules";
  const { data } = await api.get(url);
  return data;
});