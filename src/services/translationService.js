import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

export const translateTexts = withApiHandler(async (texts, targetLang) => {
  if (!Array.isArray(texts) || !texts.length) return texts;
  const { data } = await api.post("/translate", { text: texts, targetLang });
  return data;
});
