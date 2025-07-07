import api from "./api";
export const translateText = async (text, targetLang) => {
  try {
    if (!text) return text;

    const response = await api.post("/translate", { text, targetLang });

    // Handle backend response structure
    if (response.data.success) {
      return response.data.data.translatedText;
    } else {
      console.error("Translation failed:", response.data.message);
      return text; // Fallback to original
    }
  } catch (error) {
    console.error("API call failed:", error);
    return text; // Return original text in case of failure
  }
};
