"use client";

import {
  Drawer,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Stack,
  Divider,
  CircularProgress,
  MenuItem,
  FormControlLabel,
  Switch,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadIcon from "@mui/icons-material/CloudUpload";
import { useEffect, useState, useRef } from "react";
import useI18nLayout from "@/hooks/useI18nLayout";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { uploadMediaFiles } from "@/utils/mediaUpload";
import MediaUploadProgress from "@/components/MediaUploadProgress";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import { deleteMedia } from "@/services/deleteMediaService";
import { useMessage } from "@/contexts/MessageContext";
import ICONS from "@/utils/iconUtil";
import { common } from "@mui/material/colors";

const translations = {
  en: {
    editQuestion: "Edit Question",
    createQuestion: "Create Question",
    question: "Question",
    options: "Options",
    option: "Option",
    uploadImage: "Upload Image",
    addOption: "Add Option",
    updatingQuestion: "Updating...",
    creatingQuestion: "Creating...",
    updateQuestion: "Update Question",
    createQuestionButton: "Create Question",
    allowMultiple: "Allow multiple answers",
    errors: {
      question: "Question is required",
      options: "At least 2 options are required",
    },
    type: "Type",
    optionsType: "Options",
    ratingType: "Rating",
    npsType: "NPS",
    textType: "Text",
    min: "Min",
    max: "Max",
    step: "Step",
  },
  ar: {
    editQuestion: "تحرير السؤال",
    createQuestion: "إنشاء سؤال",
    question: "السؤال",
    options: "الخيارات",
    option: "الخيار",
    uploadImage: "رفع صورة",
    addOption: "إضافة خيار",
    updatingQuestion: "جاري التحديث...",
    creatingQuestion: "جاري الإنشاء...",
    updateQuestion: "تحديث السؤال",
    createQuestionButton: "إنشاء السؤال",
    allowMultiple: "السماح بإجابات متعددة",
    errors: {
      question: "السؤال مطلوب",
      options: "يجب أن يكون هناك خياران على الأقل",
    },
    type: "النوع",
    optionsType: "خيارات",
    ratingType: "تقييم",
    npsType: "NPS",
    textType: "نص",
    min: "الأدنى",
    max: "الأقصى",
    step: "الخطوة",
  },
};

export default function QuestionFormDrawer({
  open,
  onClose,
  onSubmit,
  initialValues = null,
  businessSlug = "",
  pollId = "",
  onMediaDeleted,
}) {
  const isEdit = !!(initialValues && initialValues._id);
  const { t, dir } = useI18nLayout(translations);
  const { showMessage } = useMessage();

  const [form, setForm] = useState({
    question: "",
    type: "options",
    allowMultipleAnswers: false,
    scale: { min: 1, max: 5, step: 1 },
    options: [
      { text: "", imageFile: null, imagePreview: "", removeImage: false },
      { text: "", imageFile: null, imagePreview: "", removeImage: false },
    ],
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, optionIndex: null, fileUrl: null });
  const isDeletingImageRef = useRef(false);

  useEffect(() => {
    if (open) {
      if (isDeletingImageRef.current) {
        isDeletingImageRef.current = false;
        return;
      }
      setForm({
        question: initialValues?.question || "",
        type: initialValues?.type === "slider" ? "rating" : (initialValues?.type || "options"),
        allowMultipleAnswers: initialValues?.allowMultipleAnswers || false,
        scale: initialValues?.type === "nps"
          ? { min: 0, max: 10, step: initialValues?.scale?.step || 1 }
          : (initialValues?.scale || { min: 1, max: 5, step: 1 }),
        options: initialValues?.options?.length > 0
          ? initialValues.options.map(opt => ({
              text: opt.text || "",
              imageFile: null,
              imagePreview: opt.imageUrl || "",
              removeImage: false,
            }))
          : [
              { text: "", imageFile: null, imagePreview: "", removeImage: false },
              { text: "", imageFile: null, imagePreview: "", removeImage: false },
            ],
      });
      setErrors({});
      setLoading(false);
      setShowUploadProgress(false);
      setUploadProgress([]);
      setDeleteConfirm({ open: false, optionIndex: null, fileUrl: null });
    }
  }, [open, initialValues]);

  const handleOptionChange = (index, value) => {
    const updated = [...form.options];
    updated[index].text = value;
    setForm(prev => ({ ...prev, options: updated }));
  };

  const handleOptionImageChange = (index, file) => {
    if (!file) return;
    const updated = [...form.options];
    updated[index].imageFile = file;
    updated[index].imagePreview = URL.createObjectURL(file);
    updated[index].removeImage = false;
    setForm(prev => ({ ...prev, options: updated }));
  };

  const handleDeleteOptionImage = (index) => {
    const option = form.options[index];
    if (!option) return;
    if (option.imagePreview?.startsWith("blob:")) {
      const updated = [...form.options];
      updated[index].imageFile = null;
      updated[index].imagePreview = "";
      updated[index].removeImage = false;
      setForm(prev => ({ ...prev, options: updated }));
      return;
    }
    if (option.imagePreview) {
      setDeleteConfirm({ open: true, optionIndex: index, fileUrl: option.imagePreview });
    }
  };

  const confirmDeleteOptionImage = async () => {
    try {
      if (!pollId || !initialValues?._id) {
        showMessage("Required info missing to delete image", "error");
        return;
      }
      isDeletingImageRef.current = true;
      const deletePayload = {
        fileUrl: deleteConfirm.fileUrl,
        storageType: "s3",
        pollId,
        questionId: initialValues._id,
        optionIndex: deleteConfirm.optionIndex,
        mediaType: "optionImage",
      };
      const response = await deleteMedia(deletePayload);
      const updatedQuestion = response?.data || response;

      const updated = [...form.options];
      updated[deleteConfirm.optionIndex].imagePreview = "";
      updated[deleteConfirm.optionIndex].imageFile = null;
      updated[deleteConfirm.optionIndex].removeImage = false;
      setForm(prev => ({ ...prev, options: updated }));

      if (onMediaDeleted) onMediaDeleted(deleteConfirm.optionIndex, updatedQuestion);
      setDeleteConfirm({ open: false, optionIndex: null, fileUrl: null });
      showMessage("Image deleted successfully", "success");
    } catch (err) {
      isDeletingImageRef.current = false;
      showMessage(err.message || "Failed to delete image", "error");
    }
  };

  const addOption = () => {
    setForm(prev => ({
      ...prev,
      options: [...prev.options, { text: "", imageFile: null, imagePreview: "", removeImage: false }],
    }));
  };

  const removeOption = (index) => {
    setForm(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== index) }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.question.trim()) newErrors.question = t.errors.question;
    if (form.type === "options") {
      const validOptions = form.options.filter(opt => {
        const hasText = opt.text?.trim() !== "";
        const hasImage = opt.imagePreview?.trim() !== "" && !opt.removeImage;
        return hasText || hasImage;
      });
      if (validOptions.length < 2) newErrors.options = t.errors.options;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      let uploadedUrls = {};
      let optionsPayload = [];

      if (form.type === "options") {
        const filesToUpload = [];
        const fileKeyMap = {};
        form.options.forEach((opt, index) => {
          if (opt.imageFile && !opt.removeImage) {
            filesToUpload.push({ file: opt.imageFile, type: "optionImage", label: `Option ${index + 1}` });
            fileKeyMap[filesToUpload.length - 1] = index;
          }
        });

        if (filesToUpload.length > 0) {
          setShowUploadProgress(true);
          const uploads = filesToUpload.map(item => ({
            file: item.file, label: item.label, percent: 0, loaded: 0, total: item.file.size, error: null, url: null, type: item.type,
          }));
          setUploadProgress(uploads);

          const urls = await uploadMediaFiles({
            files: filesToUpload.map(item => item.file),
            businessSlug,
            moduleName: "VoteCast",
            onProgress: (progressUploads) => {
              progressUploads.forEach((pu, index) => {
                if (uploads[index]) {
                  uploads[index].percent = pu.percent;
                  uploads[index].loaded = pu.loaded;
                  uploads[index].total = pu.total;
                  uploads[index].error = pu.error;
                  uploads[index].url = pu.url;
                }
              });
              setUploadProgress([...uploads]);
            },
          });

          urls.forEach((url, uploadIndex) => {
            const optionIndex = fileKeyMap[uploadIndex];
            if (optionIndex !== undefined) uploadedUrls[optionIndex] = url;
          });
          setShowUploadProgress(false);
        }

        optionsPayload = form.options.map((opt, index) => {
          let imageUrl = null;
          if (opt.removeImage) {
            imageUrl = null;
          } else if (uploadedUrls[index]) {
            imageUrl = uploadedUrls[index];
          } else if (opt.imagePreview?.startsWith("http")) {
            imageUrl = opt.imagePreview;
          }
          return { text: opt.text, imageUrl };
        });
      }

      const payload = {
        question: form.question.trim(),
        type: form.type,
        allowMultipleAnswers: form.type === "options" ? form.allowMultipleAnswers : false,
        scale: form.scale,
        options: JSON.stringify(optionsPayload),
      };

      await onSubmit(payload, initialValues?._id || null);
      setLoading(false);
    } catch (error) {
      showMessage(error.message || "Failed to save question", "error");
      setLoading(false);
      setShowUploadProgress(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      dir={dir}
      slotProps={{
        paper: { sx: { width: { xs: "90%", sm: 420 }, borderRadius: { xs: 0, sm: "8px 0 0 8px" } } }
      }}
    >
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}>
        <Stack
          direction="row"
          spacing={2}
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2
          }}>
          <Typography variant="h6" sx={{
            fontWeight: "bold"
          }}>
            {isEdit ? t.editQuestion : t.createQuestion}
          </Typography>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Stack>

        <Stack spacing={2} sx={{ flexGrow: 1, overflowY: "auto", pt: 1 }}>
          {/* Question */}
          <TextField
            label={t.question}
            value={form.question}
            onChange={e => setForm(prev => ({ ...prev, question: e.target.value }))}
            error={!!errors.question}
            helperText={errors.question}
            fullWidth
            multiline
          />

          <TextField
            select
            label={t.type}
            value={form.type}
            onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
            fullWidth
          >
            <MenuItem value="options">{t.optionsType}</MenuItem>
            <MenuItem value="rating">{t.ratingType}</MenuItem>
            <MenuItem value="nps">{t.npsType}</MenuItem>
            <MenuItem value="text">{t.textType}</MenuItem>
          </TextField>

          {form.type === "rating" && (
            <Stack direction="row" spacing={2}>
              <TextField
                label={t.min}
                type="number"
                value={form.scale.min}
                onChange={e => setForm(prev => ({ ...prev, scale: { ...prev.scale, min: Number(e.target.value) } }))}
                fullWidth
              />
              <TextField
                label={t.max}
                type="number"
                value={form.scale.max}
                onChange={e => setForm(prev => ({ ...prev, scale: { ...prev.scale, max: Number(e.target.value) } }))}
                fullWidth
              />
              <TextField
                label={t.step}
                type="number"
                value={form.scale.step}
                onChange={e => setForm(prev => ({ ...prev, scale: { ...prev.scale, step: Number(e.target.value) } }))}
                fullWidth
              />
            </Stack>
          )}

          {form.type === "nps" && (
            <Stack direction="row" spacing={2}>
              <TextField
                label={t.step}
                type="number"
                value={form.scale.step}
                onChange={e => setForm(prev => ({ ...prev, scale: { ...prev.scale, step: Number(e.target.value) } }))}
                fullWidth
              />
            </Stack>
          )}

          {form.type === "options" && (
            <>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.allowMultipleAnswers}
                    onChange={e => setForm(prev => ({ ...prev, allowMultipleAnswers: e.target.checked }))}
                  />
                }
                label={t.allowMultiple}
              />
              <Divider />
              <Typography variant="subtitle2" sx={{
                fontWeight: "bold"
              }}>{t.options}</Typography>

              {form.options.map((option, index) => (
                <Stack key={index} spacing={1}>
                  <Stack direction="row" spacing={1} sx={{
                    alignItems: "center"
                  }}>
                    <TextField
                      fullWidth
                      value={option.text}
                      onChange={e => handleOptionChange(index, e.target.value)}
                      placeholder={`${t.option} ${index + 1}`}
                    />
                    {form.options.length > 2 && (
                      <IconButton color="error" onClick={() => removeOption(index)}>
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Stack>

                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                    <Button component="label" variant="outlined" size="small" startIcon={<UploadIcon />} sx={getStartIconSpacing(dir)}>
                      {t.uploadImage}
                      <input type="file" hidden accept="image/*" onChange={e => handleOptionImageChange(index, e.target.files[0])} />
                    </Button>

                    {option.imagePreview && !option.removeImage && (
                      <Box sx={{ mt: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                          {initialValues && !option.imageFile ? "Current Image" : "Preview"}
                        </Typography>
                        <Box sx={{ position: "relative", display: "inline-block", width: 200 }}>
                          <img
                            src={option.imagePreview}
                            alt={`Option ${index + 1} preview`}
                            style={{ width: "200px", maxHeight: 100, height: "auto", borderRadius: 6, objectFit: "cover" }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteOptionImage(index)}
                            sx={{ position: "absolute", top: -18, right: 6, bgcolor: "error.main", color: common.white, "&:hover": { bgcolor: "error.dark" } }}
                          >
                            <ICONS.delete sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Stack>
              ))}

              {errors.options && (
                <Typography variant="caption" color="error">{errors.options}</Typography>
              )}

              <Button variant="outlined" startIcon={<AddIcon />} onClick={addOption} sx={getStartIconSpacing(dir)}>
                {t.addOption}
              </Button>
            </>
          )}
        </Stack>

        <Button
          fullWidth variant="contained" size="large"
          sx={{ mt: 3, py: 1.5, fontWeight: "bold", fontSize: "1rem", ...getStartIconSpacing(dir) }}
          onClick={handleSubmit}
          disabled={loading}
          startIcon={
            loading ? <CircularProgress size={18} color="inherit" thickness={5} /> :
            isEdit ? <EditIcon /> : <AddIcon />
          }
        >
          {loading ? (isEdit ? t.updatingQuestion : t.creatingQuestion) : (isEdit ? t.updateQuestion : t.createQuestionButton)}
        </Button>
      </Box>
      <MediaUploadProgress open={showUploadProgress} uploads={uploadProgress} onClose={() => setShowUploadProgress(false)} allowClose={false} />
      <ConfirmationDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, optionIndex: null, fileUrl: null })}
        onConfirm={confirmDeleteOptionImage}
        title="Delete Image"
        message="Are you sure you want to delete this image? This action cannot be undone."
        confirmButtonText="Delete"
        confirmButtonIcon={<ICONS.delete fontSize="small" />}
      />
    </Drawer>
  );
}
