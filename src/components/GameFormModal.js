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
  CircularProgress,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useMessage } from "../contexts/MessageContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import slugify from "@/utils/slugify";
import ICONS from "@/utils/iconUtil";

const translations = {
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

    teamMode: "Enable Team Mode",
    maxTeams: "Number of Teams",
    playersPerTeam: "Players per Team",
    teamNames: "Team Names",
    teamNamePlaceholder: "Team {number} Name",

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
      maxTeamsRequired: "Number of teams is required",
      playersPerTeamRequired: "Players per team is required",
      teamNamesRequired: "All team names are required",
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
    currentImage: ":الصورة الحالية",
    preview: ":معاينة",
    cancel: "إلغاء",
    update: "تحديث",
    create: "إنشاء",
    updating: "جارٍ التحديث...",
    creating: "جارٍ الإنشاء...",

    teamMode: "تفعيل وضع الفرق",
    maxTeams: "عدد الفرق",
    playersPerTeam: "عدد اللاعبين في كل فريق",
    teamNames: "أسماء الفرق",
    teamNamePlaceholder: "اسم الفريق {number}",

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
      maxTeamsRequired: "عدد الفرق مطلوب",
      playersPerTeamRequired: "عدد اللاعبين في كل فريق مطلوب",
      teamNamesRequired: "يرجى إدخال أسماء جميع الفرق",
    },
  },
};

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
    isTeamMode: false,
    maxTeams: 2,
    playersPerTeam: 2,
    teamNames: ["", ""],
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { showMessage } = useMessage();
  const { t } = useI18nLayout(translations);

  useEffect(() => {
    if (!open) return;

    if (!editMode) {
      setForm({
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
        isTeamMode: false,
        maxTeams: 2,
        playersPerTeam: 2,
        teamNames: ["", ""],
      });
      setErrors({});
      return;
    }

    if (editMode && initialValues && Object.keys(initialValues).length > 0) {
      const teamNames =
        Array.isArray(initialValues.teams) && initialValues.teams.length > 0
          ? initialValues.teams.map((t) =>
              typeof t === "object" && t.name ? t.name : ""
            )
          : Array.from({ length: initialValues.maxTeams || 2 }, () => "");

      setForm({
        title: initialValues.title || "",
        slug: initialValues.slug || "",
        coverImage: null,
        coverPreview: initialValues.coverImage || "",
        nameImage: null,
        namePreview: initialValues.nameImage || "",
        backgroundImage: null,
        backgroundPreview: initialValues.backgroundImage || "",
        choicesCount: initialValues.choicesCount?.toString() || "4",
        countdownTimer: initialValues.countdownTimer?.toString() || "5",
        gameSessionTimer: initialValues.gameSessionTimer?.toString() || "60",
        isTeamMode: !!initialValues.isTeamMode,
        maxTeams: initialValues.maxTeams || teamNames.length || 2,
        playersPerTeam: initialValues.playersPerTeam || 2,
        teamNames,
      });

      setErrors({});
    }
  }, [open, editMode, initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "title" && !editMode) updated.slug = slugify(value);
      if (name === "maxTeams") {
        const count = parseInt(value, 10);
        const current = prev.teamNames || [];
        updated.teamNames =
          count > current.length
            ? [...current, ...Array(count - current.length).fill("")]
            : current.slice(0, count);
      }
      return updated;
    });
  };

  const handleTeamNameChange = (i, value) => {
    const updated = [...form.teamNames];
    updated[i] = value;
    setForm((prev) => ({ ...prev, teamNames: updated }));
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
        [key]: t.errors.invalidImage,
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    const te = t.errors;

    if (!form.title.trim()) newErrors.title = te.titleRequired;
    if (!form.slug.trim()) newErrors.slug = te.slugRequired;
    if (!form.choicesCount) newErrors.choicesCount = te.optionsRequired;
    if (!form.countdownTimer) newErrors.countdownTimer = te.countdownRequired;
    if (!form.gameSessionTimer)
      newErrors.gameSessionTimer = te.quizTimeRequired;
    if (!editMode && !form.coverImage) newErrors.coverImage = te.coverRequired;
    if (!editMode && !form.nameImage) newErrors.nameImage = te.nameRequired;
    if (!editMode && !form.backgroundImage)
      newErrors.backgroundImage = te.backgroundRequired;

    if (form.isTeamMode) {
      if (!form.maxTeams || form.maxTeams < 2)
        newErrors.maxTeams = te.maxTeamsRequired;
      if (!form.playersPerTeam || form.playersPerTeam < 1)
        newErrors.playersPerTeam = te.playersPerTeamRequired;
      if (form.teamNames.some((n) => !n.trim()))
        newErrors.teamNames = te.teamNamesRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    const payload = new FormData();
    payload.append("title", form.title);
    payload.append("slug", form.slug);
    payload.append("choicesCount", form.choicesCount);
    payload.append("countdownTimer", form.countdownTimer);
    payload.append("gameSessionTimer", form.gameSessionTimer);
    payload.append("isTeamMode", form.isTeamMode);

    if (form.isTeamMode) {
      payload.append("maxTeams", form.maxTeams);
      payload.append("playersPerTeam", form.playersPerTeam);
      form.teamNames.forEach((name, i) =>
        payload.append(`teamNames[${i}]`, name)
      );
    }

    if (form.coverImage) payload.append("cover", form.coverImage);
    if (form.nameImage) payload.append("name", form.nameImage);
    if (form.backgroundImage)
      payload.append("background", form.backgroundImage);

    await onSubmit(payload, editMode);
    setLoading(false);
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
        {editMode ? t.dialogTitleUpdate : t.dialogTitleCreate}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Basic fields */}
          <TextField
            label={t.gameTitle}
            name="title"
            value={form.title}
            onChange={handleChange}
            error={!!errors.title}
            helperText={errors.title}
            fullWidth
            required
          />

          <TextField
            label={t.slug}
            name="slug"
            value={form.slug}
            onChange={handleChange}
            error={!!errors.slug}
            helperText={errors.slug || t.slugHelper}
            fullWidth
            required
          />

          <TextField
            label={t.numberOfOptions}
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
            label={t.countdownTime}
            name="countdownTimer"
            type="number"
            value={form.countdownTimer}
            onChange={handleChange}
            fullWidth
          />

          <TextField
            label={t.quizTime}
            name="gameSessionTimer"
            type="number"
            value={form.gameSessionTimer}
            onChange={handleChange}
            fullWidth
          />

          {/* 🧩 Team Mode Section */}
          <Box sx={{ borderTop: "1px solid #eee", pt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.isTeamMode}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      isTeamMode: e.target.checked,
                    }))
                  }
                />
              }
              label={t.teamMode}
            />

            {form.isTeamMode && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  mt: 2,
                }}
              >
                <TextField
                  label={t.maxTeams}
                  name="maxTeams"
                  type="number"
                  value={form.maxTeams}
                  inputProps={{ min: 2, max: 10 }}
                  onChange={handleChange}
                  error={!!errors.maxTeams}
                  helperText={errors.maxTeams}
                />

                <TextField
                  label={t.playersPerTeam}
                  name="playersPerTeam"
                  type="number"
                  value={form.playersPerTeam}
                  inputProps={{ min: 2, max: 10 }}
                  onChange={handleChange}
                  error={!!errors.playersPerTeam}
                  helperText={errors.playersPerTeam}
                />

                <Typography variant="subtitle1">{t.teamNames}</Typography>
                {Array.from({ length: form.maxTeams || 0 }).map((_, i) => (
                  <TextField
                    key={i}
                    label={t.teamNamePlaceholder.replace("{number}", i + 1)}
                    value={form.teamNames[i] || ""}
                    onChange={(e) => handleTeamNameChange(i, e.target.value)}
                    error={!!errors.teamNames}
                    helperText={i === form.maxTeams - 1 ? errors.teamNames : ""}
                  />
                ))}
              </Box>
            )}
          </Box>

          {/* File Uploads */}
          {["coverImage", "nameImage", "backgroundImage"].map((key) => {
            const label = t[key];
            const previewSrc =
              editMode && !form[key]
                ? form[key.replace("Image", "Preview")]
                : form[`${key}Preview`];

            return (
              <Box key={key}>
                <Button
                  component="label"
                  variant="outlined"
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
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
                      {editMode && !form[key] ? t.currentImage : t.preview}
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
          startIcon={<ICONS.cancel />}
        >
          {t.cancel}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={
            loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <ICONS.save />
            )
          }
        >
          {loading
            ? editMode
              ? t.updating
              : t.creating
            : editMode
            ? t.update
            : t.create}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GameFormModal;
