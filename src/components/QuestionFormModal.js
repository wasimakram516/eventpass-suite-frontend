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
} from "@mui/material";
import { useState, useEffect } from "react";
import useI18nLayout from "../hooks/useI18nLayout";
import ICONS from "../utils/iconUtil";

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

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      question: initialValues?.question || "",
      answers: initialValues?.answers || Array(optionCount).fill(""),
      correctAnswerIndex: initialValues?.correctAnswerIndex ?? 0,
      hint: initialValues?.hint || "",
    });
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

  const handleSubmit = async () => {
    if (!form.question || form.answers.some((a) => !a)) return;

    setLoading(true);
    try {
      await onSubmit(form);
    } finally {
      setLoading(false);
    }
  };
  const { t, language } = useI18nLayout({
    en: {
      editTitle: "Edit Question",
      addTitle: "Add Question",
      questionLabel: "Question",
      optionLabel: "Option",
      correctAnswerLabel: "Correct Answer",
      hintLabel: "Hint (optional)",
      cancelButton: "Cancel",
      updateButton: "Update",
      addButton: "Add",
      updatingText: "Updating...",
      addingText: "Adding...",
      emptyOption: "(empty)",
    },
    ar: {
      editTitle: "تعديل السؤال",
      addTitle: "إضافة سؤال",
      questionLabel: "السؤال",
      optionLabel: "خيار",
      correctAnswerLabel: "الإجابة الصحيحة",
      hintLabel: "تلميح (اختياري)",
      cancelButton: "إلغاء",
      updateButton: "تحديث",
      addButton: "إضافة",
      updatingText: "جارٍ التحديث...",
      addingText: "جارٍ الإضافة...",
      emptyOption: "(فارغ)",
    },
  });
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
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

        {form.answers.map((ans, idx) => (
          <TextField
            key={idx}
            label={`${t.optionLabel} ${String.fromCharCode(65 + idx)}`}
            value={ans}
            onChange={(e) => handleAnswerChange(idx, e.target.value)}
            fullWidth
            required
          />
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
