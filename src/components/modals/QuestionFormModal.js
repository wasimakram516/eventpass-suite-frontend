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
  Divider
} from "@mui/material";
import { useState, useEffect, useRef } from "react";
import useI18nLayout from "../../hooks/useI18nLayout";
import ICONS from "../../utils/iconUtil";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import { uploadMediaFiles } from "@/utils/mediaUpload";
import MediaUploadProgress from "@/components/MediaUploadProgress";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import { deleteMedia } from "@/services/deleteMediaService";
import { useMessage } from "@/contexts/MessageContext";

const QuestionFormModal = ({
  open,
  onClose,
  editMode = false,
  initialValues = {},
  onSubmit,
  optionCount = 4,
  selectedBusiness,
  gameId,
  onMediaDeleted,
  module = "quiznest",
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
  const [uploadProgress, setUploadProgress] = useState([]);
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    type: null,
    fileUrl: null,
    index: null,
  });
  const [buttonWidths, setButtonWidths] = useState({
    question: null,
  });
  const questionButtonRef = useRef(null);
  const answerButtonRefs = useRef([]);

  const { showMessage } = useMessage();

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

  useEffect(() => {
    const measureWidths = () => {
      const widths = {
        question: questionButtonRef.current?.offsetWidth || null,
      };
      answerButtonRefs.current.forEach((ref, idx) => {
        if (ref) {
          widths[`answer${idx}`] = ref.offsetWidth || null;
        }
      });
      setButtonWidths(widths);
    };

    const timeoutId = setTimeout(measureWidths, 100);
    window.addEventListener("resize", measureWidths);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", measureWidths);
    };
  }, [questionImagePreview, answerImagePreviews]);

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

  const handleDeleteMedia = (type, fileUrl, index = null) => {
    if (fileUrl && fileUrl.startsWith("blob:")) {
      if (type === "question") {
        setQuestionImage(null);
        setQuestionImagePreview(null);
        setRemoveQuestionImage(false);
      } else if (type === "answer") {
        const updatedImages = [...answerImages];
        updatedImages[index] = null;
        setAnswerImages(updatedImages);

        const updatedPreviews = [...answerImagePreviews];
        updatedPreviews[index] = null;
        setAnswerImagePreviews(updatedPreviews);
      }
      return;
    }

    setDeleteConfirm({
      open: true,
      type,
      fileUrl,
      index,
    });
  };

  const confirmDeleteMedia = async () => {
    try {
      const deletePayload = {
        fileUrl: deleteConfirm.fileUrl,
        storageType: "s3",
      };

      if (gameId && initialValues?._id) {
        deletePayload.gameId = gameId;
        deletePayload.questionId = initialValues._id;
        deletePayload.mediaType = deleteConfirm.type;
        if (deleteConfirm.type === "answer" && deleteConfirm.index !== null) {
          deletePayload.answerImageIndex = deleteConfirm.index;
        }
      }

      await deleteMedia(deletePayload);

      if (deleteConfirm.type === "question") {
        setQuestionImage(null);
        setQuestionImagePreview(null);
        setRemoveQuestionImage(true);
      } else if (deleteConfirm.type === "answer") {
        const updatedImages = [...answerImages];
        updatedImages[deleteConfirm.index] = null;
        setAnswerImages(updatedImages);

        const updatedPreviews = [...answerImagePreviews];
        updatedPreviews[deleteConfirm.index] = null;
        setAnswerImagePreviews(updatedPreviews);

        if (!removeAnswerImages.includes(deleteConfirm.index)) {
          setRemoveAnswerImages([...removeAnswerImages, deleteConfirm.index]);
        }
      }

      setDeleteConfirm({ open: false, type: null, fileUrl: null, index: null });
      showMessage("Media deleted successfully", "success");

      if (onMediaDeleted) {
        onMediaDeleted(deleteConfirm.type, deleteConfirm.index);
      }
    } catch (err) {
      showMessage(err.message || "Failed to delete media", "error");
    }
  };

  const handleSubmit = async () => {
    if (!form.question || form.answers.some((a) => !a)) return;

    setLoading(true);

    try {
      const filesToUpload = [];
      let questionImageUrl = form.removeQuestionImage ? null : (questionImage ? null : (questionImagePreview || null));
      const answerImageUrls = Array(optionCount).fill(null);

      if (questionImage && !form.removeQuestionImage) {
        filesToUpload.push({
          file: questionImage,
          type: "question",
          label: "Question Image",
        });
      }

      answerImages.forEach((img, idx) => {
        if (img && !removeAnswerImages.includes(idx)) {
          filesToUpload.push({
            file: img,
            type: "answer",
            label: `Answer Image ${String.fromCharCode(65 + idx)}`,
            index: idx,
          });
        }
      });

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
          index: item.index,
        }));

        setUploadProgress(uploads);

        try {
          const urls = await uploadMediaFiles({
            files: filesToUpload.map((item) => item.file),
            businessSlug: selectedBusiness,
            moduleName: module === "eventduel" ? "EventDuel" : "QuizNest",
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
            index: uploads[index].index,
          }));

          uploadResults.forEach((result) => {
            if (result.type === "question") {
              questionImageUrl = result.url;
            } else if (result.type === "answer" && result.index !== undefined) {
              answerImageUrls[result.index] = result.url;
            }
          });
        } catch (uploadError) {
          setShowUploadProgress(false);
          throw uploadError;
        }
      }

      setShowUploadProgress(false);

      answerImagePreviews.forEach((preview, idx) => {
        if (!answerImageUrls[idx] && preview && !preview.startsWith("blob:") && !removeAnswerImages.includes(idx)) {
          answerImageUrls[idx] = preview;
        }
      });

      await onSubmit({
        ...form,
        questionImage: questionImageUrl,
        answerImages: answerImageUrls,
        removeQuestionImage,
        removeAnswerImages,
      });
    } catch (error) {
      console.error("Upload or save failed:", error);
      showMessage(error.message || "Failed to upload media", "error");
    } finally {
      setLoading(false);
      setShowUploadProgress(false);
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
      currentImage: "Current Image:",
      preview: "Preview:",
      deleteMediaTitle: "Delete Media",
      deleteMediaMessage: "Are you sure you want to delete this media? This action cannot be undone.",
      deleteConfirm: "Delete",
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
      currentImage: ":الصورة الحالية",
      preview: ":معاينة",
      deleteMediaTitle: "حذف الوسائط",
      deleteMediaMessage: "هل أنت متأكد من حذف هذه الوسائط؟ لا يمكن التراجع عن هذا الإجراء.",
      deleteConfirm: "حذف",
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
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <Button
            ref={questionButtonRef}
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
          {questionImagePreview && !form.removeQuestionImage && (
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                {editMode && !questionImage ? t.currentImage || "Current Image:" : t.preview || "Preview:"}
              </Typography>
              <Box sx={{ position: "relative", display: "inline-block", width: buttonWidths.question || "auto" }}>
                <img
                  src={questionImagePreview}
                  alt="Question preview"
                  style={{
                    width: buttonWidths.question ? `${buttonWidths.question}px` : "auto",
                    maxHeight: 100,
                    height: "auto",
                    borderRadius: 6,
                    objectFit: "cover",
                  }}
                />
                <IconButton
                  size="small"
                  onClick={() => {
                    const fileUrl = initialValues?.questionImage || questionImagePreview;
                    handleDeleteMedia("question", fileUrl);
                  }}
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
          <Divider sx={{ mt: 2, width: "100%" }} />
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

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <Button
                ref={(el) => {
                  if (el) answerButtonRefs.current[idx] = el;
                }}
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
              {answerImagePreviews[idx] && !removeAnswerImages.includes(idx) && (
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    {editMode && !answerImages[idx] ? t.currentImage || "Current Image:" : t.preview || "Preview:"}
                  </Typography>
                  <Box sx={{ position: "relative", display: "inline-block", width: buttonWidths[`answer${idx}`] || "auto" }}>
                    <img
                      src={answerImagePreviews[idx]}
                      alt={`Answer ${String.fromCharCode(65 + idx)} preview`}
                      style={{
                        width: buttonWidths[`answer${idx}`] ? `${buttonWidths[`answer${idx}`]}px` : "auto",
                        maxHeight: 100,
                        height: "auto",
                        borderRadius: 6,
                        objectFit: "cover",
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => {
                        const fileUrl = initialValues?.answerImages?.[idx] || answerImagePreviews[idx];
                        handleDeleteMedia("answer", fileUrl, idx);
                      }}
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
      <MediaUploadProgress
        open={showUploadProgress}
        uploads={uploadProgress}
        onClose={() => setShowUploadProgress(false)}
        allowClose={false}
      />
      <ConfirmationDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, type: null, fileUrl: null, index: null })}
        onConfirm={confirmDeleteMedia}
        title={t.deleteMediaTitle || "Delete Media"}
        message={t.deleteMediaMessage || "Are you sure you want to delete this media? This action cannot be undone."}
        confirmButtonText={t.deleteConfirm || "Delete"}
        confirmButtonIcon={<ICONS.delete />}
        confirmButtonColor="error"
      />
    </Dialog>
  );
};

export default QuestionFormModal;