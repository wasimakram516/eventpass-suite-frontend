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
import { useMessage } from "@/contexts/MessageContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import slugify from "@/utils/slugify";
import ICONS from "@/utils/iconUtil";

const translations = {
  en: {
    dialogTitleUpdate: "Update Game",
    dialogTitleCreate: "Create Game",
    gameTitle: "Game Title",
    slug: "Slug",
    numberOfOptions: "Number of Options",
    countdownTime: "Countdown Time (seconds)",
    quizTime: "Game Duration (seconds)",
    coverImage: "Cover Image",
    nameImage: "Name Image",
    backgroundImage: "Background Image",
    memoryImages: "Memory Images",
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
      quizTimeRequired: "Game duration is required",
      coverRequired: "Cover image is required",
      nameRequired: "Name image is required",
      backgroundRequired: "Background image is required",
      invalidImage: "Please upload a valid image file",
      maxTeamsRequired: "Number of teams is required",
      playersPerTeamRequired: "Players per team is required",
      teamNamesRequired: "All team names are required",
      memoryImagesRequired: "At least one memory image is required",
    },
  },
  ar: {
    dialogTitleUpdate: "تحديث اللعبة",
    dialogTitleCreate: "إنشاء لعبة",
    gameTitle: "عنوان اللعبة",
    slug: "المعرف",
    numberOfOptions: "عدد الخيارات",
    countdownTime: "وقت العد التنازلي (ثانية)",
    quizTime: "مدة اللعبة (ثانية)",
    coverImage: "صورة الغلاف",
    nameImage: "صورة الاسم",
    backgroundImage: "صورة الخلفية",
    memoryImages: "صور البطاقات",
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
      quizTimeRequired: "مدة اللعبة مطلوبة",
      coverRequired: "صورة الغلاف مطلوبة",
      nameRequired: "صورة الاسم مطلوبة",
      backgroundRequired: "صورة الخلفية مطلوبة",
      invalidImage: "الرجاء رفع صورة صالحة",
      maxTeamsRequired: "عدد الفرق مطلوب",
      playersPerTeamRequired: "عدد اللاعبين في كل فريق مطلوب",
      teamNamesRequired: "يرجى إدخال أسماء جميع الفرق",
      memoryImagesRequired: "يجب رفع صورة واحدة على الأقل للبطاقات",
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
  module = "eventduel", // also supports "tapmatch"
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
    memoryImages: [],
    memoryPreviews: [],
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
  const { t } = useI18nLayout(translations);

  const isTapMatch = module === "tapmatch";

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
        memoryImages: [],
        memoryPreviews: [],
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
          ? initialValues.teams.map((t) => (t.name ? t.name : ""))
          : Array.from({ length: initialValues.maxTeams || 2 }, () => "");

      setForm((prev) => ({
        ...prev,
        title: initialValues.title || "",
        slug: initialValues.slug || "",
        coverPreview: initialValues.coverImage || "",
        namePreview: initialValues.nameImage || "",
        backgroundPreview: initialValues.backgroundImage || "",
        memoryPreviews: initialValues.memoryImages?.map((img) => img.url) || [],
        choicesCount: initialValues.choicesCount?.toString() || "4",
        countdownTimer: initialValues.countdownTimer?.toString() || "5",
        gameSessionTimer: initialValues.gameSessionTimer?.toString() || "60",
        isTeamMode: !!initialValues.isTeamMode,
        maxTeams: initialValues.maxTeams || teamNames.length || 2,
        playersPerTeam: initialValues.playersPerTeam || 2,
        teamNames,
      }));

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

  const handleFileChange = (e, key, multiple = false) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (multiple) {
      const valid = files.filter((f) => f.type.startsWith("image/"));
      setForm((prev) => ({
        ...prev,
        memoryImages: valid,
        memoryPreviews: valid.map((f) => URL.createObjectURL(f)),
      }));
      return;
    }

    const file = files[0];
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

  const handleTeamNameChange = (i, value) => {
    const updated = [...form.teamNames];
    updated[i] = value;
    setForm((prev) => ({ ...prev, teamNames: updated }));
  };

  const validate = () => {
    const newErrors = {};
    const te = t.errors;

    if (!form.title.trim()) newErrors.title = te.titleRequired;
    if (!form.slug.trim()) newErrors.slug = te.slugRequired;
    if (!form.countdownTimer) newErrors.countdownTimer = te.countdownRequired;
    if (!form.gameSessionTimer)
      newErrors.gameSessionTimer = te.quizTimeRequired;

    if (!editMode && !form.coverImage) newErrors.coverImage = te.coverRequired;
    if (!editMode && !form.nameImage) newErrors.nameImage = te.nameRequired;
    if (!editMode && !form.backgroundImage)
      newErrors.backgroundImage = te.backgroundRequired;

    if (!isTapMatch && !form.choicesCount)
      newErrors.choicesCount = te.optionsRequired;

    if (isTapMatch && !form.memoryImages.length && !editMode)
      newErrors.memoryImages = te.memoryImagesRequired;

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
    payload.append("countdownTimer", form.countdownTimer);
    payload.append("gameSessionTimer", form.gameSessionTimer);

    if (!isTapMatch) payload.append("choicesCount", form.choicesCount);
    if (form.coverImage) payload.append("cover", form.coverImage);
    if (form.nameImage) payload.append("name", form.nameImage);
    if (form.backgroundImage)
      payload.append("background", form.backgroundImage);
    if (isTapMatch && form.memoryImages.length) {
      form.memoryImages.forEach((img) => payload.append("memoryImages", img));
    }

    if (form.isTeamMode) {
      payload.append("isTeamMode", form.isTeamMode);
      payload.append("maxTeams", form.maxTeams);
      payload.append("playersPerTeam", form.playersPerTeam);
      form.teamNames.forEach((name, i) =>
        payload.append(`teamNames[${i}]`, name)
      );
    }

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
          <TextField
            label={t.gameTitle}
            name="title"
            value={form.title}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            label={t.slug}
            name="slug"
            value={form.slug}
            onChange={handleChange}
            fullWidth
            required
          />
          {!isTapMatch && (
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
          )}
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

          {/* 🧩 Team Mode Section (unchanged) */}
          {module === "eventduel" && (
            <Box sx={{ borderTop: "1px solid #eee", pt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.isTeamMode}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, isTeamMode: e.target.checked }))
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
                    onChange={handleChange}
                  />
                  <TextField
                    label={t.playersPerTeam}
                    name="playersPerTeam"
                    type="number"
                    value={form.playersPerTeam}
                    onChange={handleChange}
                  />
                  <Typography variant="subtitle1">{t.teamNames}</Typography>
                  {Array.from({ length: form.maxTeams || 0 }).map((_, i) => (
                    <TextField
                      key={i}
                      label={t.teamNamePlaceholder.replace("{number}", i + 1)}
                      value={form.teamNames[i] || ""}
                      onChange={(e) => handleTeamNameChange(i, e.target.value)}
                    />
                  ))}
                </Box>
              )}
            </Box>
          )}

          {/* Existing Image Fields + Preview logic unchanged */}
          {["coverImage", "nameImage", "backgroundImage"].map((key) => {
            const label = t[key];
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
                      {t.preview}
                    </Typography>
                    <img
                      src={previewSrc}
                      alt={key}
                      style={{ maxHeight: 100, borderRadius: 6 }}
                    />
                  </Box>
                )}
              </Box>
            );
          })}

          {/* ✅ TapMatch Memory Image Upload */}
          {isTapMatch && (
            <Box>
              <Button component="label" variant="outlined">
                {t.memoryImages}
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileChange(e, "memoryImages", true)}
                />
              </Button>
              {form.memoryPreviews.length > 0 && (
                <Box
                  sx={{
                    mt: 1,
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, 80px)",
                    gap: 1,
                  }}
                >
                  {form.memoryPreviews.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`Memory ${i}`}
                      style={{
                        width: 80,
                        height: 80,
                        objectFit: "cover",
                        borderRadius: 6,
                      }}
                    />
                  ))}
                </Box>
              )}
              {errors.memoryImages && (
                <Typography variant="caption" color="error">
                  {errors.memoryImages}
                </Typography>
              )}
            </Box>
          )}
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
