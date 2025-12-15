"use client";

import {
  Drawer,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Stack,
  MenuItem,
  Divider,
  CircularProgress,
  Switch,
  FormControlLabel,
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
export default function PollFormDrawer({
  open,
  onClose,
  onSubmit,
  initialValues = null,
  business = "",
  onMediaDeleted,
}) {
  const isEdit = !!(initialValues && initialValues._id);

  const translations = {
    en: {
      editPoll: "Edit Poll",
      createPoll: "Create Poll",
      active: "Active",
      archived: "Archived",
      pollType: "Poll Type",
      optionsStandardPoll: "Options (Standard Poll)",
      slider: "Slider",
      question: "Question",
      options: "Options",
      option: "Option",
      uploadImage: "Upload Image",
      addOption: "Add Option",
      updatingPoll: "Updating Poll...",
      creatingPoll: "Creating Poll...",
      updatePoll: "Update Poll",
      createPollButton: "Create Poll",
      errors: {
        question: "Question is required",
        options: "At least 2 options are required",
        optionText: "Option text is required",
      },
    },
    ar: {
      editPoll: "تحرير الاستطلاع",
      createPoll: "إنشاء استطلاع",
      active: "نشط",
      archived: "مؤرشف",
      pollType: "نوع الاستطلاع",
      optionsStandardPoll: "خيارات (استطلاع قياسي)",
      slider: "شريط التمرير",
      question: "السؤال",
      options: "الخيارات",
      option: "الخيار",
      uploadImage: "رفع صورة",
      addOption: "إضافة خيار",
      updatingPoll: "جاري تحديث الاستطلاع...",
      creatingPoll: "جاري إنشاء الاستطلاع...",
      updatePoll: "تحديث الاستطلاع",
      createPollButton: "إنشاء الاستطلاع",
      errors: {
        question: "السؤال مطلوب",
        options: "يجب أن يكون هناك خياران على الأقل",
        optionText: "نص الخيار مطلوب",
      },
    },
  };

  const { t, dir } = useI18nLayout(translations);
  const { showMessage } = useMessage();

  const [form, setForm] = useState({
    businessId: "",
    question: "",
    options: [
      { text: "", imageFile: null, imagePreview: "", removeImage: false },
      { text: "", imageFile: null, imagePreview: "", removeImage: false },
    ],
    status: "active",
    type: "options",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    optionIndex: null,
    fileUrl: null,
  });
  const isDeletingImageRef = useRef(false);

  useEffect(() => {
    if (open) {
      // Skip form reset if we're in the middle of deleting an image
      // This prevents clearing unsaved blob URLs when deleting images
      if (isDeletingImageRef.current) {
        isDeletingImageRef.current = false;
        return;
      }

      setForm({
        businessId: initialValues?.business?._id || business?._id || "",
        question: initialValues?.question || "",
        options:
          initialValues?.options?.length > 0
            ? initialValues.options.map((opt) => ({
              text: opt.text,
              imageFile: null,
              imagePreview: opt.imageUrl || "",
              removeImage: false,
            }))
            : [
              { text: "", imageFile: null, imagePreview: "", removeImage: false },
              { text: "", imageFile: null, imagePreview: "", removeImage: false },
            ],
        status: initialValues?.status || "active",
        type: initialValues?.type || "options",
      });
      setErrors({});
      setLoading(false);
      setShowUploadProgress(false);
      setUploadProgress([]);
      setDeleteConfirm({ open: false, optionIndex: null, fileUrl: null });
    }
  }, [open, initialValues, business]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...form.options];
    updatedOptions[index].text = value;
    setForm((prev) => ({ ...prev, options: updatedOptions }));
  };

  const handleOptionImageChange = (index, file) => {
    if (!file) return;
    const updatedOptions = [...form.options];
    updatedOptions[index].imageFile = file;
    updatedOptions[index].imagePreview = URL.createObjectURL(file);
    updatedOptions[index].removeImage = false;
    setForm((prev) => ({ ...prev, options: updatedOptions }));
  };

  const handleDeleteOptionImage = (index) => {
    const option = form.options[index];
    if (!option) return;

    if (option.imagePreview && option.imagePreview.startsWith("blob:")) {
      const updatedOptions = [...form.options];
      updatedOptions[index].imageFile = null;
      updatedOptions[index].imagePreview = "";
      updatedOptions[index].removeImage = false;
      setForm((prev) => ({ ...prev, options: updatedOptions }));
      return;
    }

    if (option.imagePreview && !option.imagePreview.startsWith("blob:")) {
      setDeleteConfirm({
        open: true,
        optionIndex: index,
        fileUrl: option.imagePreview,
      });
    }
  };

  const confirmDeleteOptionImage = async () => {
    try {
      if (!business?.slug) {
        showMessage("Business information is missing", "error");
        return;
      }

      if (!initialValues?._id) {
        showMessage("Poll ID is required to delete image", "error");
        return;
      }

      isDeletingImageRef.current = true;

      const deletePayload = {
        fileUrl: deleteConfirm.fileUrl,
        storageType: "s3",
        pollId: initialValues._id,
        optionIndex: deleteConfirm.optionIndex,
        mediaType: "optionImage",
      };

      const response = await deleteMedia(deletePayload);
      const updatedPoll = response?.data || response;


      const updatedOptions = [...form.options];
      updatedOptions[deleteConfirm.optionIndex].imagePreview = "";
      updatedOptions[deleteConfirm.optionIndex].imageFile = null;
      updatedOptions[deleteConfirm.optionIndex].removeImage = false;
      setForm((prev) => ({ ...prev, options: updatedOptions }));


      if (updatedPoll && updatedPoll._id && initialValues) {

        if (updatedPoll.options && updatedPoll.options[deleteConfirm.optionIndex]) {
          const updatedInitialOptions = [...(initialValues.options || [])];
          updatedInitialOptions[deleteConfirm.optionIndex] = {
            ...updatedPoll.options[deleteConfirm.optionIndex],
          };
          initialValues.options = updatedInitialOptions;
        }
      }

      if (onMediaDeleted) {
        onMediaDeleted(deleteConfirm.optionIndex, updatedPoll);
      }

      setDeleteConfirm({ open: false, optionIndex: null, fileUrl: null });
      showMessage("Image deleted successfully", "success");
    } catch (err) {
      isDeletingImageRef.current = false; // Reset flag on error
      showMessage(err.message || "Failed to delete image", "error");
    }
  };

  const addOption = () => {
    setForm((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        { text: "", imageFile: null, imagePreview: "", removeImage: false },
      ],
    }));
  };

  const removeOption = (index) => {
    const updatedOptions = form.options.filter((_, i) => i !== index);
    setForm((prev) => ({ ...prev, options: updatedOptions }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.businessId) newErrors.businessId = "Business is required";
    if (!form.question) newErrors.question = t.errors.question;
    if (form.options.filter((opt) => opt.text.trim() !== "").length < 2) {
      newErrors.options = t.errors.options;
    }
    if (!["options", "slider"].includes(form.type)) {
      newErrors.type = "Poll type is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    if (!business?.slug) {
      showMessage("Business information is missing", "error");
      return;
    }

    setLoading(true);

    try {
      const filesToUpload = [];
      const fileKeyMap = {};

      form.options.forEach((opt, index) => {
        if (opt.imageFile && !opt.removeImage) {
          filesToUpload.push({
            file: opt.imageFile,
            type: "optionImage",
            label: `Option ${index + 1}`,
          });
          fileKeyMap[filesToUpload.length - 1] = index;
        }
      });

      let uploadedUrls = {};
      if (filesToUpload.length > 0) {
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
            businessSlug: business.slug,
            moduleName: "VoteCast",
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


          urls.forEach((url, uploadIndex) => {
            const optionIndex = fileKeyMap[uploadIndex];
            if (optionIndex !== undefined) {
              uploadedUrls[optionIndex] = url;
            }
          });
        } catch (uploadError) {
          setShowUploadProgress(false);
          throw uploadError;
        }
      }

      setShowUploadProgress(false);

      const optionsPayload = form.options.map((opt, index) => {
        let imageUrl = null;

        if (opt.removeImage) {

          imageUrl = null;
        } else if (uploadedUrls[index]) {

          imageUrl = uploadedUrls[index];
        } else if (opt.imagePreview && opt.imagePreview.trim() !== "" && opt.imagePreview.startsWith("http")) {

          imageUrl = opt.imagePreview;
        }


        return {
          text: opt.text,
          imageUrl: imageUrl,
        };
      });

      const payload = {
        businessId: form.businessId,
        question: form.question,
        status: form.status,
        type: form.type,
        options: JSON.stringify(optionsPayload),
      };

      await onSubmit(payload, initialValues?._id || null);
      setLoading(false);
    } catch (error) {
      console.error("Failed to upload/save:", error);
      showMessage(error.message || "Failed to save poll", "error");
      setLoading(false);
      setShowUploadProgress(false);
    }
  };

  const toggleStatus = () => {
    setForm((prev) => ({
      ...prev,
      status: prev.status === "active" ? "archived" : "active",
    }));
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "90%", sm: 400 },
          borderRadius: { xs: 0, sm: "8px 0 0 8px" },
        },
      }}
      dir={dir}
    >
      <Box
        sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          mb={2}
        >
          <Typography variant="h6" fontWeight="bold">
            {isEdit ? t.editPoll : t.createPoll}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <FormControlLabel
          control={
            <Switch
              checked={form.status === "active"}
              onChange={toggleStatus}
              color="primary"
            />
          }
          label={form.status === "active" ? t.active : t.archived}
          sx={{ mb: 2 }}
        />

        <Stack spacing={2} sx={{ flexGrow: 1, overflowY: "auto", pt: 2 }}>
          <TextField
            select
            label={t.pollType}
            name="type"
            value={form.type}
            onChange={handleChange}
            error={!!errors.type}
            helperText={errors.type}
            fullWidth
          >
            <MenuItem value="options">{t.optionsStandardPoll}</MenuItem>
            <MenuItem value="slider">{t.slider}</MenuItem>
          </TextField>

          {/* Question */}
          <TextField
            label={t.question}
            name="question"
            value={form.question}
            onChange={handleChange}
            error={!!errors.question}
            helperText={errors.question}
            fullWidth
            multiline
          />

          <Divider />

          <Typography variant="subtitle2" fontWeight="bold">
            {t.options}
          </Typography>

          {form.options.map((option, index) => (
            <Stack key={index} spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  fullWidth
                  value={option.text}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`${t.option} ${index + 1}`}
                />
                {form.options.length > 2 && (
                  <IconButton color="error" onClick={() => removeOption(index)}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </Stack>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  width: "100%",
                }}
              >
                <Button
                  component="label"
                  variant="outlined"
                  size="small"
                  startIcon={<UploadIcon />}
                  sx={getStartIconSpacing(dir)}
                >
                  {t.uploadImage}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) =>
                      handleOptionImageChange(index, e.target.files[0])
                    }
                  />
                </Button>

                {option.imagePreview && !option.removeImage && (
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      {initialValues && !option.imageFile
                        ? "Current Image"
                        : "Preview"}
                    </Typography>

                    <Box
                      sx={{
                        position: "relative",
                        display: "inline-block",
                        width: 200,
                      }}
                    >
                      <img
                        src={option.imagePreview}
                        alt={`Option ${index + 1} preview`}
                        style={{
                          width: "200px",
                          maxHeight: 100,
                          height: "auto",
                          borderRadius: 6,
                          objectFit: "cover",
                        }}
                      />

                      <IconButton
                        size="small"
                        onClick={() => handleDeleteOptionImage(index)}
                        sx={{
                          position: "absolute",
                          top: -18,
                          right: 6,
                          bgcolor: "error.main",
                          color: "#fff",
                          "&:hover": { bgcolor: "error.dark" },
                        }}
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
            <Typography variant="caption" color="error">
              {errors.options}
            </Typography>
          )}

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addOption}
            sx={getStartIconSpacing(dir)}
          >
            {t.addOption}
          </Button>
        </Stack>

        <Button
          fullWidth
          variant="contained"
          size="large"
          sx={{
            mt: 3,
            py: 1.5,
            fontWeight: "bold",
            fontSize: "1rem",
            ...getStartIconSpacing(dir),
          }}
          onClick={handleSubmit}
          disabled={loading}
          startIcon={
            loading ? (
              <CircularProgress size={18} color="inherit" thickness={5} />
            ) : isEdit ? (
              <EditIcon />
            ) : (
              <AddIcon />
            )
          }
        >
          {loading
            ? isEdit
              ? t.updatingPoll
              : t.creatingPoll
            : isEdit
              ? t.updatePoll
              : t.createPollButton}
        </Button>
      </Box>
      <MediaUploadProgress
        open={showUploadProgress}
        uploads={uploadProgress}
        onClose={() => setShowUploadProgress(false)}
        allowClose={false}
      />

      <ConfirmationDialog
        open={deleteConfirm.open}
        onClose={() =>
          setDeleteConfirm({ open: false, optionIndex: null, fileUrl: null })
        }
        onConfirm={confirmDeleteOptionImage}
        title="Delete Image"
        message="Are you sure you want to delete this image? This action cannot be undone."
        confirmButtonText="Delete"
        confirmButtonIcon={<ICONS.delete fontSize="small" />}
      />
    </Drawer>
  );
}
