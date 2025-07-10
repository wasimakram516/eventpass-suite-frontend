import api from "./api";
import withApiHandler from "@/utils/withApiHandler";

export const translateText = withApiHandler(async (text, targetLang) => {
  if (!text) return { translatedText: text };

  const {data} = await api.post("/translate", { text, targetLang });

  return {
    translatedText: data.translatedText,
  };
});
