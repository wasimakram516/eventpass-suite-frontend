import api from "./api";
import withApiHandler from "@/utils/withApiHandler";

export const getModules = withApiHandler(async () => {
  const { data } = await api.get("/modules");
  return data.data;
});
