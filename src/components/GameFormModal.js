"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  MenuItem,
  CircularProgress
} from "@mui/material";
import { useState, useEffect } from "react";
import { useMessage } from "../contexts/MessageContext";
import { useLanguage } from "../contexts/LanguageContext";

const GameFormModal = ({
  open,
  onClose,
  editMode = false,
  initialValues = {},
  selectedGame = null,
  onSubmit,
}) => {
  const [form, setForm] = useState({
    title: "",
    slug: "",
    coverImage: null,
    coverPreview: "",
    nameImage: null,
    namePreview: "",
    backgroundImage: null,
    backgroundPreview: "",
    choicesCount: "4",
    countdownTimer: "5",
    gameSessionTimer: "60",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { showMessage } = useMessage();
  const { language } = useLanguage(); //Language Usage
  useEffect(() => {
    if (!open || !initialValues || Object.keys(initialValues).length === 0)
      return;

    setForm({
      title: initialValues.title || "",
      slug: initialValues.slug || "",
      coverImage: null, // <- only set to file when uploaded
      coverPreview: initialValues.coverImage || "",
      nameImage: null,
      namePreview: initialValues.nameImage || "",
      backgroundImage: null,
      backgroundPreview: initialValues.backgroundImage || "",
      choicesCount: initialValues.choicesCount?.toString() || "4",
      countdownTimer: initialValues.countdownTimer?.toString() || "5",
      gameSessionTimer: initialValues.gameSessionTimer?.toString() || "60",
    });

    setErrors({});
  }, [open, initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, key) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setForm((prev) => ({
        ...prev,
        [key]: file,
        [`${key}Preview`]: URL.createObjectURL(file),
      }));
    } else {
      setErrors((prev) => ({
        ...prev,
        [key]: "Please upload a valid image file",
      }));
    }
  };
const gameDialogTranslations = {
  en: {
    dialogTitleUpdate: "Update Game",
    dialogTitleCreate: "Create Game",
    gameTitle: "Game Title",
    slug: "Slug",
    slugHelper: "Used in URLs (e.g., 'quiz-1')",
    numberOfOptions: "Number of Options",
    countdownTime: "Countdown Time (seconds)",
    quizTime: "Quiz Time (seconds)",
    coverImage: "Cover Image",
    nameImage: "Name Image",
    backgroundImage: "Background Image",
    currentImage: "Current Image:",
    preview: "Preview:",
    cancel: "Cancel",
    update: "Update",
    create: "Create",
    updating: "Updating...",
    creating: "Creating...",
    errors: {
      titleRequired: "Title is required",
      slugRequired: "Slug is required",
      optionsRequired: "Option count is required",
      countdownRequired: "Countdown time is required",
      quizTimeRequired: "Quiz time is required",
      coverRequired: "Cover image is required",
      nameRequired: "Name image is required",
      backgroundRequired: "Background image is required",
      invalidImage: "Please upload a valid image file",
    },
  },
  ar: {
    dialogTitleUpdate: "تحديث اللعبة",
    dialogTitleCreate: "إنشاء لعبة",
    gameTitle: "عنوان اللعبة",
    slug: "المعرف",
    slugHelper: "يستخدم في الروابط (مثال: 'quiz-1')",
    numberOfOptions: "عدد الخيارات",
    countdownTime: "وقت العد التنازلي (ثانية)",
    quizTime: "وقت الاختبار (ثانية)",
    coverImage: "صورة الغلاف",
    nameImage: "صورة الاسم",
    backgroundImage: "صورة الخلفية",
    currentImage: "الصورة الحالية:",
    preview: "معاينة:",
    cancel: "إلغاء",
    update: "تحديث",
    create: "إنشاء",
    updating: "جارٍ التحديث...",
    creating: "جارٍ الإنشاء...",
    errors: {
      titleRequired: "العنوان مطلوب",
      slugRequired: "المعرف مطلوب",
      optionsRequired: "عدد الخيارات مطلوب",
      countdownRequired: "وقت العد التنازلي مطلوب",
      quizTimeRequired: "وقت الاختبار مطلوب",
      coverRequired: "صورة الغلاف مطلوبة",
      nameRequired: "صورة الاسم مطلوبة",
      backgroundRequired: "صورة الخلفية مطلوبة",
      invalidImage: "الرجاء رفع صورة صالحة",
    },
  },
};
  const validate = () => {
    const newErrors = {};
    const t = gameDialogTranslations[language].errors;

    if (!form.title.trim()) newErrors.title = t.titleRequired;
    if (!form.slug.trim()) newErrors.slug = t.slugRequired;
    if (!form.choicesCount) newErrors.choicesCount = t.optionsRequired;
    if (!form.countdownTimer) newErrors.countdownTimer = t.countdownRequired;
    if (!form.gameSessionTimer) newErrors.gameSessionTimer = t.quizTimeRequired;
    if (!editMode && !form.coverImage) newErrors.coverImage = t.coverRequired;
    if (!editMode && !form.nameImage) newErrors.nameImage = t.nameRequired;
    if (!editMode && !form.backgroundImage)
      newErrors.backgroundImage = t.backgroundRequired;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const payload = new FormData();
      payload.append("title", form.title);
      payload.append("slug", form.slug);
      payload.append("choicesCount", form.choicesCount);
      payload.append("countdownTimer", form.countdownTimer);
      payload.append("gameSessionTimer", form.gameSessionTimer);

      if (form.coverImage) payload.append("cover", form.coverImage);
      if (form.nameImage) payload.append("name", form.nameImage);
      if (form.backgroundImage)
        payload.append("background", form.backgroundImage);

      await onSubmit(payload, editMode);
    } catch (error) {
      showMessage(
        error.response?.data?.message || "Failed to save game.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      key={selectedGame?._id || "create"}
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {editMode
          ? gameDialogTranslations[language].dialogTitleUpdate
          : gameDialogTranslations[language].dialogTitleCreate}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label={gameDialogTranslations[language].gameTitle}
            name="title"
            value={form.title}
            onChange={handleChange}
            error={!!errors.title}
            helperText={errors.title}
            fullWidth
            required
          />

          <TextField
            label={gameDialogTranslations[language].slug}
            name="slug"
            value={form.slug}
            onChange={handleChange}
            error={!!errors.slug}
            helperText={errors.slug || gameDialogTranslations[language].slugHelper}
            fullWidth
            required
          />

          <TextField
            label={gameDialogTranslations[language].numberOfOptions}
            name="choicesCount"
            value={form.choicesCount}
            onChange={handleChange}
            select
            fullWidth
          >
            {[2, 3, 4, 5].map((n) => (
              <MenuItem key={n} value={n.toString()}>
                {n}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label={gameDialogTranslations[language].countdownTime}
            name="countdownTimer"
            type="number"
            value={form.countdownTimer}
            onChange={handleChange}
            fullWidth
          />

          <TextField
            label={gameDialogTranslations[language].quizTime}
            name="gameSessionTimer"
            type="number"
            value={form.gameSessionTimer}
            onChange={handleChange}
            fullWidth
          />

          {["coverImage", "nameImage", "backgroundImage"].map((key) => {
            const label = gameDialogTranslations[language][key];
            const previewSrc =
              editMode && !form[key]
                ? form[key.replace("Image", "Preview")]
                : form[`${key}Preview`];

            return (
              <Box key={key}>
                <Button component="label" variant="outlined">
                  {label}
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, key)}
                  />
                </Button>

                {previewSrc && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      {editMode && !form[key]
                        ? gameDialogTranslations[language].currentImage
                        : gameDialogTranslations[language].preview}
                    </Typography>
                    <img
                      src={previewSrc}
                      alt={`${key} preview`}
                      style={{ maxHeight: 100, borderRadius: 6 }}
                    />
                  </Box>
                )}

                {errors[key] && (
                  <Typography variant="caption" color="error">
                    {errors[key]}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          disabled={loading}
        >
          {gameDialogTranslations[language].cancel}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
        >
          {loading
            ? editMode
              ? gameDialogTranslations[language].updating
              : gameDialogTranslations[language].creating
            : editMode
            ? gameDialogTranslations[language].update
            : gameDialogTranslations[language].create}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GameFormModal;
