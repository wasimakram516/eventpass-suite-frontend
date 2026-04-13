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
import { deleteMedia } from "@/services/deleteMediaService";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";

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
    deleteMemoryImageTitle: "Delete Memory Image",
    deleteMemoryImageMessage: "Are you sure you want to delete this memory image? This action cannot be undone.",
    deleteAllMemoryImagesTitle: "Delete All Memory Images",
    deleteAllMemoryImagesMessage: "Are you sure you want to delete all memory images? This action cannot be undone.",
    deleteConfirm: "Delete",
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
    deleteMemoryImageTitle: "حذف صورة الذاكرة",
    deleteMemoryImageMessage: "هل أنت متأكد من حذف صورة الذاكرة هذه؟ لا يمكن التراجع عن هذا الإجراء.",
    deleteAllMemoryImagesTitle: "حذف جميع صور الذاكرة",
    deleteAllMemoryImagesMessage: "هل أنت متأكد من حذف جميع صور الذاكرة؟ لا يمكن التراجع عن هذا الإجراء.",
    deleteConfirm: "حذف",
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
  gameId, // game ID for memory image deletion
  onGameUpdate,
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
    existingMemoryImages: [],
    removeMemoryImageIds: [],
    clearAllMemoryImages: false,
    choicesCount: "4",
    countdownTimer: "5",
    gameSessionTimer: "60",
    isTeamMode: false,
    maxTeams: 2,
    playersPerTeam: 2,
    teamNames: ["", ""],
    mode: "solo",
    moveTimer: "0",
    xImage: null,
    xImagePreview: "",
    oImage: null,
    oImagePreview: "",
    pvpScreenMode: "dual",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    index: null,
    imageId: null,
    isExisting: false,
    isDeleteAll: false,
  });
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
  const isCrossZero = module === "crosszero";
  const currentGameId = gameId || selectedGame?._id || initialValues?._id;

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
        existingMemoryImages: [],
        removeMemoryImageIds: [],
        clearAllMemoryImages: false,
        choicesCount: "4",
        countdownTimer: "5",
        gameSessionTimer: "60",
        isTeamMode: false,
        maxTeams: 2,
        playersPerTeam: 2,
        teamNames: ["", ""],
        mode: "solo",
        moveTimer: "0",
        xImage: null,
        xImagePreview: "",
        oImage: null,
        oImagePreview: "",
        pvpScreenMode: "dual",
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
        existingMemoryImages: initialValues.memoryImages || [],
        memoryPreviews: initialValues.memoryImages?.map((img) => img.url) || [],
        removeMemoryImageIds: [],
        clearAllMemoryImages: false,
        choicesCount: initialValues.choicesCount?.toString() || "4",
        countdownTimer: initialValues.countdownTimer?.toString() || "5",
        gameSessionTimer: initialValues.gameSessionTimer?.toString() || "60",
        isTeamMode: !!initialValues.isTeamMode,
        maxTeams: initialValues.maxTeams || teamNames.length || 2,
        playersPerTeam: initialValues.playersPerTeam || 2,
        teamNames,
        mode: initialValues.mode || "solo",
        moveTimer: initialValues.moveTimer?.toString() || "0",
        xImagePreview: initialValues.xImage || "",
        oImagePreview: initialValues.oImage || "",
        pvpScreenMode: initialValues.pvpScreenMode || "dual",
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
        xImage: "xImagePreview",
        oImage: "oImagePreview",
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

  const handleRemoveMemoryImage = (index, imageId) => {
    const isNewImage = !imageId;

    if (!isNewImage && editMode && currentGameId) {
      setDeleteConfirm({
        open: true,
        index,
        imageId,
        isExisting: true,
      });
    } else {
      setForm((prev) => {
        const newPreviews = [...prev.memoryPreviews];
        const newMemoryImages = [...prev.memoryImages];
        const newExisting = [...prev.existingMemoryImages];
        const newRemoveIds = [...prev.removeMemoryImageIds];
        const prevExistingCount = prev.existingMemoryImages.length;

        if (isNewImage) {
          const newImageIndex = index - prevExistingCount;
          if (newImageIndex >= 0 && newImageIndex < newMemoryImages.length) {
            newMemoryImages.splice(newImageIndex, 1);
          }
          newPreviews.splice(index, 1);
        } else {
          if (!newRemoveIds.includes(imageId)) {
            newRemoveIds.push(imageId);
          }
          const existingIndex = newExisting.findIndex((img) => img._id === imageId);
          if (existingIndex !== -1) {
            newExisting.splice(existingIndex, 1);
          }
          newPreviews.splice(index, 1);
        }

        return {
          ...prev,
          memoryPreviews: newPreviews,
          memoryImages: newMemoryImages,
          existingMemoryImages: newExisting,
          removeMemoryImageIds: newRemoveIds,
        };
      });
    }
  };

  const confirmDeleteMemoryImage = async () => {
    const { index, imageId, isExisting, isDeleteAll } = deleteConfirm;

    if (isDeleteAll && editMode && currentGameId) {
      try {
        await deleteMedia({
          gameId: currentGameId,
          mediaType: "memoryImage",
          deleteAllMemoryImages: true,
          storageType: "s3",
        });

        setForm((prev) => ({
          ...prev,
          memoryPreviews: [],
          memoryImages: [],
          existingMemoryImages: [],
          removeMemoryImageIds: [],
        }));

        setDeleteConfirm({ open: false, index: null, imageId: null, isExisting: false, isDeleteAll: false });
        showMessage("All memory images deleted successfully", "success");

        if (onGameUpdate && currentGameId) {
          onGameUpdate(currentGameId, []);
        }
      } catch (error) {
        showMessage(error.message || "Failed to delete all memory images", "error");
        setDeleteConfirm({ open: false, index: null, imageId: null, isExisting: false, isDeleteAll: false });
      }
    } else if (editMode && isExisting && currentGameId) {
      try {
        const existingImg = form.existingMemoryImages.find((img) => img._id === imageId);
        if (existingImg) {
          await deleteMedia({
            fileUrl: existingImg.url,
            gameId: currentGameId,
            mediaType: "memoryImage",
            memoryImageId: imageId,
            storageType: "s3",
          });

          const newExisting = form.existingMemoryImages.filter((img) => img._id !== imageId);

          setForm((prev) => {
            const newPreviews = [...prev.memoryPreviews];
            newPreviews.splice(index, 1);

            return {
              ...prev,
              memoryPreviews: newPreviews,
              existingMemoryImages: newExisting,
              removeMemoryImageIds: prev.removeMemoryImageIds.filter((id) => id !== imageId),
            };
          });

          setDeleteConfirm({ open: false, index: null, imageId: null, isExisting: false, isDeleteAll: false });
          showMessage("Memory image deleted successfully", "success");

          if (onGameUpdate && currentGameId) {
            onGameUpdate(currentGameId, newExisting);
          }
        }
      } catch (error) {
        showMessage(error.message || "Failed to delete memory image", "error");
        setDeleteConfirm({ open: false, index: null, imageId: null, isExisting: false, isDeleteAll: false });
      }
    } else {
      setForm((prev) => {
        const newPreviews = [...prev.memoryPreviews];
        const newMemoryImages = [...prev.memoryImages];
        const newExisting = [...prev.existingMemoryImages];
        const newRemoveIds = [...prev.removeMemoryImageIds];
        const prevExistingCount = prev.existingMemoryImages.length;

        if (imageId) {
          if (!newRemoveIds.includes(imageId)) {
            newRemoveIds.push(imageId);
          }
          const existingIndex = newExisting.findIndex((img) => img._id === imageId);
          if (existingIndex !== -1) {
            newExisting.splice(existingIndex, 1);
          }
          newPreviews.splice(index, 1);
        } else {
          if (index >= prevExistingCount) {
            const newImageIndex = index - prevExistingCount;
            newMemoryImages.splice(newImageIndex, 1);
            newPreviews.splice(index, 1);
          } else {
            const existingImg = prev.existingMemoryImages[index];
            if (existingImg?._id && !newRemoveIds.includes(existingImg._id)) {
              newRemoveIds.push(existingImg._id);
            }
            newExisting.splice(index, 1);
            newPreviews.splice(index, 1);
          }
        }

        return {
          ...prev,
          memoryPreviews: newPreviews,
          memoryImages: newMemoryImages,
          existingMemoryImages: newExisting,
          removeMemoryImageIds: newRemoveIds,
        };
      });

      setDeleteConfirm({ open: false, index: null, imageId: null, isExisting: false, isDeleteAll: false });
    }
  };

  const handleClearAllMemoryImages = () => {
    const hasExistingImages = form.existingMemoryImages.length > 0;

    if (editMode && currentGameId && hasExistingImages) {
      setDeleteConfirm({
        open: true,
        index: null,
        imageId: null,
        isExisting: false,
        isDeleteAll: true,
      });
    } else {
      setForm((prev) => ({
        ...prev,
        memoryPreviews: [],
        memoryImages: [],
        existingMemoryImages: [],
        removeMemoryImageIds: prev.existingMemoryImages.map((img) => img._id).filter(Boolean),
        clearAllMemoryImages: hasExistingImages,
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    const te = t.errors;

    if (!form.title.trim()) newErrors.title = te.titleRequired;
    if (!form.slug.trim()) newErrors.slug = te.slugRequired;
    if (!form.countdownTimer) newErrors.countdownTimer = te.countdownRequired;
    if (!isCrossZero && !form.gameSessionTimer)
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

    if (!isTapMatch && !isCrossZero && !form.choicesCount)
      newErrors.choicesCount = te.optionsRequired;


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
      let xImageUrl = form.xImage ? null : (form.xImagePreview || null);
      let oImageUrl = form.oImage ? null : (form.oImagePreview || null);
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

      if (isCrossZero && form.xImage) {
        filesToUpload.push({ file: form.xImage, type: "xImage", label: "Player X Image" });
      }
      if (isCrossZero && form.oImage) {
        filesToUpload.push({ file: form.oImage, type: "oImage", label: "Player O Image" });
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
            moduleName: module === "eventduel" ? "EventDuel" : module === "tapmatch" ? "TapMatch" : module === "crosszero" ? "CrossZero" : "QuizNest",
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
            else if (result.type === "xImage") xImageUrl = result.url;
            else if (result.type === "oImage") oImageUrl = result.url;
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
        ...(!isCrossZero && { gameSessionTimer: form.gameSessionTimer }),
        coverImage: coverImageUrl,
        nameImage: nameImageUrl,
        backgroundImage: backgroundImageUrl,
      };

      if (!isTapMatch && !isCrossZero) payload.choicesCount = form.choicesCount;
      if (isCrossZero) {
        payload.mode = form.mode;
        payload.moveTimer = Number(form.moveTimer) || 0;
        payload.pvpScreenMode = form.mode === "pvp" ? form.pvpScreenMode : "dual";
        payload.xImage = xImageUrl || null;
        payload.oImage = oImageUrl || null;
      }
      if (isTapMatch) {
        if (form.clearAllMemoryImages) {
          payload.clearAllMemoryImages = "true";
        } else {
          if (editMode && form.removeMemoryImageIds.length > 0) {
            payload.removeMemoryImageIds = JSON.stringify(form.removeMemoryImageIds);
          }
          if (!editMode) {
            if (memoryImageUrls.length > 0) {
              payload.memoryImages = memoryImageUrls;
            }
          } else {
            if (memoryImageUrls.length > 0) {
              payload.memoryImages = memoryImageUrls;
            }
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
          {!isTapMatch && !isCrossZero && (
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
          {isCrossZero && (
            <>
              <TextField
                label="Game Mode"
                name="mode"
                value={form.mode}
                onChange={handleChange}
                select
                fullWidth
              >
                <MenuItem value="solo">Solo (vs AI)</MenuItem>
                <MenuItem value="pvp">Multiplayer (PvP)</MenuItem>
              </TextField>
              {form.mode === "pvp" && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.pvpScreenMode === "single"}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          pvpScreenMode: e.target.checked ? "single" : "dual",
                        }))
                      }
                    />
                  }
                  label="Single Screen Mode (both players on one device, no host needed)"
                />
              )}
              <TextField
                label="Per-Move Timer (seconds, 0 = disabled)"
                name="moveTimer"
                type="number"
                value={form.moveTimer}
                onChange={handleChange}
                fullWidth
                inputProps={{ min: 0 }}
              />

              {/* Player O / X custom images (optional) — O first since P1=O goes first */}
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {/* O Image (Player 1) */}
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", flex: 1, minWidth: 140 }}>
                  <Button component="label" variant="outlined" size="small"
                    sx={{ borderColor: "#ff6b6b", color: "#ff6b6b", "&:hover": { borderColor: "#e53935", bgcolor: "rgba(255,107,107,0.06)" } }}>
                    Player 1 ○ Image <Typography component="span" variant="caption" sx={{ ml: 0.5, opacity: 0.6 }}>(optional)</Typography>
                    <input hidden type="file" accept="image/*" onChange={(e) => handleFileChange(e, "oImage")} />
                  </Button>
                  {form.oImagePreview && (
                    <Box sx={{ mt: 1, position: "relative", display: "inline-block" }}>
                      <img src={form.oImagePreview} alt="O preview"
                        style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", border: "2px solid #ff6b6b" }} />
                      <IconButton size="small" onClick={() => setForm((p) => ({ ...p, oImage: null, oImagePreview: "" }))}
                        sx={{ position: "absolute", top: -8, right: -8, bgcolor: "background.paper", border: "1px solid #ccc", p: 0.3 }}>
                        <ICONS.close sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  )}
                </Box>

                {/* X Image (Player 2) */}
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", flex: 1, minWidth: 140 }}>
                  <Button component="label" variant="outlined" size="small"
                    sx={{ borderColor: "#00e5ff", color: "#00e5ff", "&:hover": { borderColor: "#00b8d4", bgcolor: "rgba(0,229,255,0.06)" } }}>
                    Player 2 ✕ Image <Typography component="span" variant="caption" sx={{ ml: 0.5, opacity: 0.6 }}>(optional)</Typography>
                    <input hidden type="file" accept="image/*" onChange={(e) => handleFileChange(e, "xImage")} />
                  </Button>
                  {form.xImagePreview && (
                    <Box sx={{ mt: 1, position: "relative", display: "inline-block" }}>
                      <img src={form.xImagePreview} alt="X preview"
                        style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", border: "2px solid #00e5ff" }} />
                      <IconButton size="small" onClick={() => setForm((p) => ({ ...p, xImage: null, xImagePreview: "" }))}
                        sx={{ position: "absolute", top: -8, right: -8, bgcolor: "background.paper", border: "1px solid #ccc", p: 0.3 }}>
                        <ICONS.close sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              </Box>
            </>
          )}
          <TextField
            label={t.countdownTime}
            name="countdownTimer"
            type="number"
            value={form.countdownTimer}
            onChange={handleChange}
            fullWidth
          />
          {!isCrossZero && (
            <TextField
              label={t.quizTime}
              name="gameSessionTimer"
              type="number"
              value={form.gameSessionTimer}
              onChange={handleChange}
              fullWidth
            />
          )}

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
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
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
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={handleClearAllMemoryImages}
                    startIcon={<ICONS.delete />}
                  >
                    Delete All
                  </Button>
                )}
              </Box>
              {form.memoryPreviews.length > 0 && (
                <Box
                  sx={{
                    mt: 3,
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, 80px)",
                    gap: 1,
                  }}
                >
                  {form.memoryPreviews.map((src, i) => {
                    const existingCount = form.existingMemoryImages.length;
                    let imageId = null;
                    if (i < existingCount) {
                      imageId = form.existingMemoryImages[i]?._id;
                    }
                    return (
                      <Box
                        key={i}
                        sx={{
                          position: "relative",
                          width: 80,
                          height: 80,
                        }}
                      >
                        <img
                          src={src}
                          alt={`Memory ${i}`}
                          style={{
                            width: 80,
                            height: 80,
                            objectFit: "cover",
                            borderRadius: 6,
                          }}
                        />
                        <IconButton
                          size="small"
                          sx={{
                            position: "absolute",
                            top: -18,
                            right: 6,
                            bgcolor: "error.main",
                            color: "#fff",
                            "&:hover": { bgcolor: "error.dark" },
                            zIndex: 1,
                          }}
                          onClick={() => handleRemoveMemoryImage(i, imageId)}
                        >
                          <ICONS.delete sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>
                    );
                  })}
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
      <ConfirmationDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, index: null, imageId: null, isExisting: false, isDeleteAll: false })}
        onConfirm={confirmDeleteMemoryImage}
        title={deleteConfirm.isDeleteAll ? t.deleteAllMemoryImagesTitle : t.deleteMemoryImageTitle}
        message={deleteConfirm.isDeleteAll ? t.deleteAllMemoryImagesMessage : t.deleteMemoryImageMessage}
        confirmButtonText={t.deleteConfirm}
        confirmButtonIcon={<ICONS.delete />}
        confirmButtonColor="error"
      />
    </Dialog>
  );
};

export default GameFormModal;
