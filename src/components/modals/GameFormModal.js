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
  IconButton,
} from "@mui/material";
import { useState, useEffect, useRef } from "react";
import { useMessage } from "@/contexts/MessageContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import slugify from "@/utils/slugify";
import ICONS from "@/utils/iconUtil";
import { uploadMediaFiles } from "@/utils/mediaUpload";
import MediaUploadProgress from "@/components/MediaUploadProgress";

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
  selectedBusiness, // business slug for uploads
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
  const [uploadProgress, setUploadProgress] = useState([]);
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [buttonWidths, setButtonWidths] = useState({
    cover: null,
    name: null,
    background: null,
  });

  const coverButtonRef = useRef(null);
  const nameButtonRef = useRef(null);
  const backgroundButtonRef = useRef(null);

  const { t } = useI18nLayout(translations);
  const { showMessage } = useMessage();

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

  useEffect(() => {
    const measureWidths = () => {
      const widths = {
        cover: coverButtonRef.current?.offsetWidth || null,
        name: nameButtonRef.current?.offsetWidth || null,
        background: backgroundButtonRef.current?.offsetWidth || null,
      };
      setButtonWidths(widths);
    };

    const timeoutId = setTimeout(measureWidths, 100);
    window.addEventListener("resize", measureWidths);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", measureWidths);
    };
  }, [form.coverPreview, form.namePreview, form.backgroundPreview]);

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
        memoryImages: [...(prev.memoryImages || []), ...valid],
        memoryPreviews: [
          ...(prev.memoryPreviews || []),
          ...valid.map((f) => URL.createObjectURL(f)),
        ],
      }));
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated.memoryImages;
        return updated;
      });
      e.target.value = "";
      return;
    }

    const file = files[0];
    if (file && file.type.startsWith("image/")) {
      const previewKeyMap = {
        coverImage: "coverPreview",
        nameImage: "namePreview",
        backgroundImage: "backgroundPreview",
      };

      setForm((prev) => ({
        ...prev,
        [key]: file,
        [previewKeyMap[key] || `${key}Preview`]: URL.createObjectURL(file),
      }));
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
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

    if (!form.coverImage && !form.coverPreview) {
      newErrors.coverImage = te.coverRequired;
    }
    if (!form.nameImage && !form.namePreview) {
      newErrors.nameImage = te.nameRequired;
    }
    if (!form.backgroundImage && !form.backgroundPreview) {
      newErrors.backgroundImage = te.backgroundRequired;
    }

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
    if (!validate()) {
      const errorFields = Object.keys(errors);
      if (errorFields.length > 0) {
        const fieldNames = errorFields.map((field) => {
          if (field === "coverImage") return "Cover Image";
          if (field === "nameImage") return "Name Image";
          if (field === "backgroundImage") return "Background Image";
          return field;
        });
        showMessage(`Please fill in all required fields: ${fieldNames.join(", ")}`, "error");
      }
      return;
    }
    if (!selectedBusiness || selectedBusiness.trim() === "") {
      showMessage("Business information is missing. Please refresh the page and try again.", "error");
      return;
    }

    setLoading(true);

    try {
      const filesToUpload = [];
      let coverImageUrl = form.coverImage ? null : (form.coverPreview || null);
      let nameImageUrl = form.nameImage ? null : (form.namePreview || null);
      let backgroundImageUrl = form.backgroundImage ? null : (form.backgroundPreview || null);
      const memoryImageUrls = [];

      if (form.coverImage) {
        filesToUpload.push({
          file: form.coverImage,
          type: "cover",
          label: "Cover Image",
        });
      }

      if (form.nameImage) {
        filesToUpload.push({
          file: form.nameImage,
          type: "name",
          label: "Name Image",
        });
      }

      if (form.backgroundImage) {
        filesToUpload.push({
          file: form.backgroundImage,
          type: "background",
          label: "Background Image",
        });
      }

      if (isTapMatch) {
        const existingMemoryUrls = form.memoryPreviews.filter(
          (preview) => preview && preview.startsWith("http") && !preview.startsWith("blob:")
        );
        memoryImageUrls.push(...existingMemoryUrls);

        if (form.memoryImages.length) {
          form.memoryImages.forEach((img, idx) => {
            filesToUpload.push({
              file: img,
              type: "memory",
              label: `Memory Image ${idx + 1}`,
            });
          });
        }
      }

      if (filesToUpload.length > 0) {
        if (!selectedBusiness || selectedBusiness.trim() === "") {
          showMessage("Business information is missing. Please refresh the page and try again.", "error");
          setLoading(false);
          return;
        }
        setShowUploadProgress(true);
        const uploads = filesToUpload.map((item) => ({
          file: item.file,
          label: item.label,
          percent: 0,
          loaded: 0,
          total: item.file.size,
          error: null,
          url: null,
          type: item.type,
        }));

        setUploadProgress(uploads);

        try {
          const urls = await uploadMediaFiles({
            files: filesToUpload.map((item) => item.file),
            businessSlug: selectedBusiness,
            moduleName: module === "eventduel" ? "EventDuel" : module === "tapmatch" ? "TapMatch" : "QuizNest",
            onProgress: (progressUploads) => {
              progressUploads.forEach((progressUpload, index) => {
                if (uploads[index]) {
                  uploads[index].percent = progressUpload.percent;
                  uploads[index].loaded = progressUpload.loaded;
                  uploads[index].total = progressUpload.total;
                  uploads[index].error = progressUpload.error;
                  uploads[index].url = progressUpload.url;
                }
              });
              setUploadProgress([...uploads]);
            },
          });

          const uploadResults = urls.map((url, index) => ({
            type: uploads[index].type,
            url,
          }));

          uploadResults.forEach((result) => {
            if (result.type === "cover") coverImageUrl = result.url;
            else if (result.type === "name") nameImageUrl = result.url;
            else if (result.type === "background") backgroundImageUrl = result.url;
            else if (result.type === "memory") memoryImageUrls.push(result.url);
          });
        } catch (uploadError) {
          setShowUploadProgress(false);
          throw uploadError;
        }
      }

      setShowUploadProgress(false);

      if (!coverImageUrl || !nameImageUrl || !backgroundImageUrl) {
        const missingFields = [];
        if (!coverImageUrl) missingFields.push("Cover Image");
        if (!nameImageUrl) missingFields.push("Name Image");
        if (!backgroundImageUrl) missingFields.push("Background Image");
        showMessage(`Please upload required media: ${missingFields.join(", ")}`, "error");
        setLoading(false);
        return;
      }

      const payload = {
        title: form.title,
        slug: form.slug,
        countdownTimer: form.countdownTimer,
        gameSessionTimer: form.gameSessionTimer,
        coverImage: coverImageUrl,
        nameImage: nameImageUrl,
        backgroundImage: backgroundImageUrl,
      };

      if (!isTapMatch) payload.choicesCount = form.choicesCount;
      if (isTapMatch) {
        if (memoryImageUrls.length > 0) {
          payload.memoryImages = memoryImageUrls;
        } else if (editMode && form.memoryPreviews.length > 0) {
          const existingUrls = form.memoryPreviews.filter(
            (preview) => preview && preview.startsWith("http") && !preview.startsWith("blob:")
          );
          if (existingUrls.length > 0) {
            payload.memoryImages = existingUrls;
          }
        }
      }

      if (form.isTeamMode) {
        payload.isTeamMode = form.isTeamMode;
        payload.maxTeams = form.maxTeams;
        payload.playersPerTeam = form.playersPerTeam;
        payload.teamNames = form.teamNames;
      }

      await onSubmit(payload, editMode);
      setLoading(false);
    } catch (error) {
      console.error("Upload or save failed:", error);
      showMessage(error.message || "Failed to upload media", "error");
      setLoading(false);
      setShowUploadProgress(false);
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

          {/* Image Fields with Preview and Delete */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <Button
              ref={coverButtonRef}
              component="label"
              variant="outlined"
            >
              {t.coverImage}
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "coverImage")}
              />
            </Button>
            {errors.coverImage && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                {errors.coverImage}
              </Typography>
            )}
            {form.coverPreview && (
              <Box sx={{ mt: 1.5 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  {editMode && !form.coverImage ? t.currentImage : t.preview}
                </Typography>
                <Box sx={{ display: "inline-block", width: buttonWidths.cover || "auto" }}>
                  <img
                    src={form.coverPreview}
                    alt="Cover preview"
                    style={{
                      width: buttonWidths.cover ? `${buttonWidths.cover}px` : "auto",
                      maxHeight: 100,
                      height: "auto",
                      borderRadius: 6,
                      objectFit: "cover",
                    }}
                  />
                </Box>
              </Box>
            )}
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <Button
              ref={nameButtonRef}
              component="label"
              variant="outlined"
            >
              {t.nameImage}
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "nameImage")}
              />
            </Button>
            {errors.nameImage && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                {errors.nameImage}
              </Typography>
            )}
            {form.namePreview && (
              <Box sx={{ mt: 1.5 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  {editMode && !form.nameImage ? t.currentImage : t.preview}
                </Typography>
                <Box sx={{ display: "inline-block", width: buttonWidths.name || "auto" }}>
                  <img
                    src={form.namePreview}
                    alt="Name preview"
                    style={{
                      width: buttonWidths.name ? `${buttonWidths.name}px` : "auto",
                      maxHeight: 100,
                      height: "auto",
                      borderRadius: 6,
                      objectFit: "cover",
                    }}
                  />
                </Box>
              </Box>
            )}
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <Button
              ref={backgroundButtonRef}
              component="label"
              variant="outlined"
            >
              {t.backgroundImage}
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "backgroundImage")}
              />
            </Button>
            {errors.backgroundImage && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                {errors.backgroundImage}
              </Typography>
            )}
            {form.backgroundPreview && (
              <Box sx={{ mt: 1.5 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  {editMode && !form.backgroundImage ? t.currentImage : t.preview}
                </Typography>
                <Box sx={{ display: "inline-block", width: buttonWidths.background || "auto" }}>
                  <img
                    src={form.backgroundPreview}
                    alt="Background preview"
                    style={{
                      width: buttonWidths.background ? `${buttonWidths.background}px` : "auto",
                      maxHeight: 100,
                      height: "auto",
                      borderRadius: 6,
                      objectFit: "cover",
                    }}
                  />
                </Box>
              </Box>
            )}
          </Box>

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
      <MediaUploadProgress
        open={showUploadProgress}
        uploads={uploadProgress}
        onClose={() => setShowUploadProgress(false)}
        allowClose={false}
      />
    </Dialog>
  );
};

export default GameFormModal;
