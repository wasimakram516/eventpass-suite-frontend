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
import api from "@/services/api";

export default function PollFormDrawer({
  open,
  onClose,
  onSubmit,
  initialValues = null,
  businesses = [],
}) {
  const isEdit = !!(initialValues && initialValues._id);

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
        businessId: initialValues?.business?._id || "",
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
    if (!form.question) newErrors.question = "Question is required";
    if (form.options.filter((opt) => opt.text.trim() !== "").length < 2) {
      newErrors.options = "At least 2 options are required";
    }
    if (!["options", "slider"].includes(form.type)) {
      newErrors.type = "Poll type is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadImage = async (file) => {
    const uploadData = new FormData();
    uploadData.append("file", file);
    const { data } = await api.post("/upload", uploadData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data.url;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const preparedOptions = await Promise.all(
        form.options.map(async (opt) => {
          let imageUrl = opt.imagePreview;
          if (opt.imageFile) {
            const uploaded = await uploadImage(opt.imageFile);
            imageUrl = uploaded;
          }
          return { text: opt.text, imageUrl: imageUrl || undefined };
        })
      );

      const payload = {
        businessId: form.businessId,
        question: form.question,
        options: preparedOptions,
        status: form.status,
        type: form.type,
      };

      await onSubmit(payload, initialValues?._id || null);
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
            {isEdit ? "Edit Poll" : "Create Poll"}
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
          label={form.status === "active" ? "Active" : "Archived"}
          sx={{ mb: 2 }}
        />

        <Stack spacing={2} sx={{ flexGrow: 1, overflowY: "auto",pt:2 }}>
          <TextField
            select
            label="Business"
            name="businessId"
            value={form.businessId}
            onChange={handleChange}
            error={!!errors.businessId}
            helperText={errors.businessId}
            fullWidth
            disabled={isEdit}
          >
            {businesses.map((business) => (
              <MenuItem key={business._id} value={business._id}>
                {business.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Poll Type"
            name="type"
            value={form.type}
            onChange={handleChange}
            error={!!errors.type}
            helperText={errors.type}
            fullWidth
          >
            <MenuItem value="options">Options (Standard Poll)</MenuItem>
            <MenuItem value="slider">Slider</MenuItem>
          </TextField>

          {/* Question */}
          <TextField
            label="Question"
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
            Options
          </Typography>

          {form.options.map((option, index) => (
            <Stack key={index} spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  fullWidth
                  value={option.text}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
                {form.options.length > 2 && (
                  <IconButton color="error" onClick={() => removeOption(index)}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  component="label"
                  variant="outlined"
                  size="small"
                  fullWidth={false}
                  startIcon={<UploadIcon />}
                >
                  Upload Image
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
          >
            Add Option
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
              ? "Updating Poll..."
              : "Creating Poll..."
            : isEdit
            ? "Update Poll"
            : "Create Poll"}
        </Button>
      </Box>
    </Drawer>
  );
}
