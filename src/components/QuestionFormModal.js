"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Box,
  IconButton,
  Typography,
  Avatar,
  Divider
} from "@mui/material";
import { useState, useEffect } from "react";
import useI18nLayout from "../hooks/useI18nLayout";
import ICONS from "../utils/iconUtil";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CloseIcon from "@mui/icons-material/Close";

const QuestionFormModal = ({
  open,
  onClose,
  editMode = false,
  initialValues = {},
  onSubmit,
  optionCount = 4,
}) => {
  const [form, setForm] = useState({
    question: "",
    answers: Array(optionCount).fill(""),
    correctAnswerIndex: 0,
    hint: "",
  });

  const [questionImage, setQuestionImage] = useState(null);
  const [questionImagePreview, setQuestionImagePreview] = useState(null);
  const [answerImages, setAnswerImages] = useState(Array(optionCount).fill(null));
  const [answerImagePreviews, setAnswerImagePreviews] = useState(Array(optionCount).fill(null));
  const [removeQuestionImage, setRemoveQuestionImage] = useState(false);
  const [removeAnswerImages, setRemoveAnswerImages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const answers = initialValues?.answers || Array(optionCount).fill("");
    const existingAnswerImages = initialValues?.answerImages || Array(optionCount).fill(null);

    setForm({
      question: initialValues?.question || "",
      answers,
      correctAnswerIndex: initialValues?.correctAnswerIndex ?? 0,
      hint: initialValues?.hint || "",
    });

    setQuestionImage(null);
    setQuestionImagePreview(initialValues?.questionImage || null);
    setAnswerImages(Array(optionCount).fill(null));
    setAnswerImagePreviews(existingAnswerImages);
    setRemoveQuestionImage(false);
    setRemoveAnswerImages([]);
  }, [open, initialValues, optionCount]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAnswerChange = (index, value) => {
    const updated = [...form.answers];
    updated[index] = value;
    setForm((prev) => ({ ...prev, answers: updated }));
  };

  const handleQuestionImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setQuestionImage(file);
      setQuestionImagePreview(URL.createObjectURL(file));
      setRemoveQuestionImage(false);
    }
  };

  const handleAnswerImageChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const updatedImages = [...answerImages];
      updatedImages[index] = file;
      setAnswerImages(updatedImages);

      const updatedPreviews = [...answerImagePreviews];
      updatedPreviews[index] = URL.createObjectURL(file);
      setAnswerImagePreviews(updatedPreviews);

      setRemoveAnswerImages(removeAnswerImages.filter(i => i !== index));
    }
  };

  const handleRemoveQuestionImage = () => {
    setQuestionImage(null);
    setQuestionImagePreview(null);
    if (editMode && initialValues?.questionImage) {
      setRemoveQuestionImage(true);
    }
  };

  const handleRemoveAnswerImage = (index) => {
    const updatedImages = [...answerImages];
    updatedImages[index] = null;
    setAnswerImages(updatedImages);

    const updatedPreviews = [...answerImagePreviews];
    updatedPreviews[index] = null;
    setAnswerImagePreviews(updatedPreviews);

    if (editMode && initialValues?.answerImages?.[index]) {
      setRemoveAnswerImages([...removeAnswerImages, index]);
    }
  };

  const handleSubmit = async () => {
    if (!form.question || form.answers.some((a) => !a)) return;

    setLoading(true);
    try {
      const answerImagesWithIndices = answerImages.map((img, index) => ({
        file: img,
        index: index
      })).filter(item => item.file !== null);

      await onSubmit({
        ...form,
        questionImage,
        answerImages: answerImagesWithIndices,
        removeQuestionImage,
        removeAnswerImages,
      });
    } finally {
      setLoading(false);
    }
  };

  const { t, language } = useI18nLayout({
    en: {
      editTitle: "Edit Question",
      addTitle: "Add Question",
      questionLabel: "Question",
      questionImageLabel: "Question Image (Optional)",
      optionLabel: "Option",
      optionImageLabel: "Option Image (Optional)",
      correctAnswerLabel: "Correct Answer",
      hintLabel: "Hint (optional)",
      cancelButton: "Cancel",
      updateButton: "Update",
      addButton: "Add",
      updatingText: "Updating...",
      addingText: "Adding...",
      emptyOption: "(empty)",
      uploadImage: "Upload Image",
      removeImage: "Remove",
    },
    ar: {
      editTitle: "تعديل السؤال",
      addTitle: "إضافة سؤال",
      questionLabel: "السؤال",
      questionImageLabel: "صورة السؤال (اختياري)",
      optionLabel: "خيار",
      optionImageLabel: "صورة الخيار (اختياري)",
      correctAnswerLabel: "الإجابة الصحيحة",
      hintLabel: "تلميح (اختياري)",
      cancelButton: "إلغاء",
      updateButton: "تحديث",
      addButton: "إضافة",
      updatingText: "جارٍ التحديث...",
      addingText: "جارٍ الإضافة...",
      emptyOption: "(فارغ)",
      uploadImage: "تحميل صورة",
      removeImage: "إزالة",
    },
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{editMode ? t.editTitle : t.addTitle}</DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          label={t.questionLabel}
          name="question"
          value={form.question}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mt: 3 }}
        />

        {/* Question Image Upload */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              component="label"
              variant="outlined"
              size="small"
              startIcon={<AddPhotoAlternateIcon />}
            >
              {t.uploadImage}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleQuestionImageChange}
              />
            </Button>
            {questionImagePreview && (
              <Box sx={{ position: "relative" }}>
                <Avatar
                  src={questionImagePreview}
                  variant="rounded"
                  sx={{ width: 56, height: 56 }}
                />
                <IconButton
                  size="small"
                  sx={{
                    position: "absolute",
                    top: -8,
                    right: -8,
                    bgcolor: "background.paper",
                    boxShadow: 1,
                    "&:hover": { bgcolor: "error.light" },
                  }}
                  onClick={handleRemoveQuestionImage}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>
          <Divider sx={{ mt: 2 }} />
        </Box>

        {/* Answer Options with Images */}
        {form.answers.map((ans, idx) => (
          <Box key={idx} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <TextField
              label={`${t.optionLabel} ${String.fromCharCode(65 + idx)}`}
              value={ans}
              onChange={(e) => handleAnswerChange(idx, e.target.value)}
              fullWidth
              required
            />

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Button
                component="label"
                variant="outlined"
                size="small"
                startIcon={<AddPhotoAlternateIcon />}
              >
                {t.uploadImage}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => handleAnswerImageChange(idx, e)}
                />
              </Button>
              {answerImagePreviews[idx] && (
                <Box sx={{ position: "relative" }}>
                  <Avatar
                    src={answerImagePreviews[idx]}
                    variant="rounded"
                    sx={{ width: 56, height: 56 }}
                  />
                  <IconButton
                    size="small"
                    sx={{
                      position: "absolute",
                      top: -8,
                      right: -8,
                      bgcolor: "background.paper",
                      boxShadow: 1,
                      "&:hover": { bgcolor: "error.light" },
                    }}
                    onClick={() => handleRemoveAnswerImage(idx)}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Box>
          </Box>
        ))}

        <FormControl fullWidth>
          <InputLabel>{t.correctAnswerLabel}</InputLabel>
          <Select
            value={form.correctAnswerIndex}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                correctAnswerIndex: parseInt(e.target.value),
              }))
            }
            label={t.correctAnswerLabel}
          >
            {form.answers.map((ans, i) => (
              <MenuItem key={i} value={i}>
                {String.fromCharCode(65 + i)}. {ans || t.emptyOption}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label={t.hintLabel}
          name="hint"
          value={form.hint}
          onChange={handleChange}
          fullWidth
        />
      </DialogContent>

      <DialogActions sx={{ p: 3, justifyContent: "flex-end" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            width: { xs: "100%", sm: "auto" },
          }}
        >
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            startIcon={
              loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <ICONS.save />
              )
            }
            sx={{
              order: { xs: 1, sm: 2 },
              width: { xs: "100%", sm: "auto" },
            }}
          >
            {loading
              ? editMode
                ? t.updatingText
                : t.addingText
              : editMode
                ? t.updateButton
                : t.addButton}
          </Button>
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={loading}
            startIcon={<ICONS.cancel />}
            sx={{
              order: { xs: 2, sm: 1 },
              width: { xs: "100%", sm: "auto" },
            }}
          >
            {t.cancelButton}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default QuestionFormModal;