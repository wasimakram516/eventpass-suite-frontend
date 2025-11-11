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
  Avatar,
  Switch,
  FormControlLabel,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadIcon from "@mui/icons-material/CloudUpload";
import { useEffect, useState } from "react";
import useI18nLayout from "@/hooks/useI18nLayout";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
export default function PollFormDrawer({
  open,
  onClose,
  onSubmit,
  initialValues = null,
  business = "",
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

  const { t,dir } = useI18nLayout(translations);

  const [form, setForm] = useState({
    businessId: "",
    question: "",
    options: [
      { text: "", imageFile: null, imagePreview: "" },
      { text: "", imageFile: null, imagePreview: "" },
    ],
    status: "active",
    type: "options",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        businessId: initialValues?.business?._id || business._id,
        question: initialValues?.question || "",
        options:
          initialValues?.options?.length > 0
            ? initialValues.options.map((opt) => ({
                text: opt.text,
                imageFile: null,
                imagePreview: opt.imageUrl || "",
              }))
            : [
                { text: "", imageFile: null, imagePreview: "" },
                { text: "", imageFile: null, imagePreview: "" },
              ],
        status: initialValues?.status || "active",
        type: initialValues?.type || "options",
      });
      setErrors({});
      setLoading(false);
    }
  }, [open, initialValues]);

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
    const updatedOptions = [...form.options];
    updatedOptions[index].imageFile = file;
    updatedOptions[index].imagePreview = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, options: updatedOptions }));
  };

  const addOption = () => {
    setForm((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        { text: "", imageFile: null, imagePreview: "" },
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

  // Update the handleSubmit function in PollFormDrawer
  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const formData = new FormData();

      // Add basic fields
      formData.append("businessId", form.businessId);
      formData.append("question", form.question);
      formData.append("status", form.status);
      formData.append("type", form.type);

      // Prepare options for JSON
      const optionsForJson = form.options.map((opt) => ({
        text: opt.text,
        imageUrl: opt.imageFile ? undefined : opt.imagePreview, // Keep existing URL if no new file
      }));

      formData.append("options", JSON.stringify(optionsForJson));

      // Add image files
      form.options.forEach((opt, index) => {
        if (opt.imageFile) {
          formData.append("images", opt.imageFile);
        }
      });

      await onSubmit(formData, initialValues?._id || null);
      setLoading(false);
    } catch (error) {
      console.error("Failed to upload/save:", error);
      setLoading(false);
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

                                                           <Stack 
                  direction="row" 
                  spacing={1}
                  alignItems="center"
                  sx={{
                    gap: dir === "rtl" ? 1 : 0,
                  }}
                >
                 <Button
                   component="label"
                   variant="outlined"
                   size="small"
                   fullWidth={false}
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

                 {option.imagePreview && (
                   <Avatar
                     src={option.imagePreview}
                     variant="rounded"
                     sx={{ width: 56, height: 56 }}
                   />
                 )}
               </Stack>
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
    </Drawer>
  );
}
