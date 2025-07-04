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
} from "@mui/material";
import { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";

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
const { language } = useLanguage(); //Language Usage

const questionDialogTranslations = {
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
};
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {editMode
          ? questionDialogTranslations[language].editTitle
          : questionDialogTranslations[language].addTitle}
      </DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          label={questionDialogTranslations[language].questionLabel}
          name="question"
          value={form.question}
          onChange={handleChange}
          fullWidth
          required
        />

        {form.answers.map((ans, idx) => (
          <TextField
            key={idx}
            label={`${
              questionDialogTranslations[language].optionLabel
            } ${String.fromCharCode(65 + idx)}`}
            value={ans}
            onChange={(e) => handleAnswerChange(idx, e.target.value)}
            fullWidth
            required
          />
        ))}

        <FormControl fullWidth>
          <InputLabel>
            {questionDialogTranslations[language].correctAnswerLabel}
          </InputLabel>
          <Select
            value={form.correctAnswerIndex}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                correctAnswerIndex: parseInt(e.target.value),
              }))
            }
            label={questionDialogTranslations[language].correctAnswerLabel}
          >
            {form.answers.map((ans, i) => (
              <MenuItem key={i} value={i}>
                {String.fromCharCode(65 + i)}.{" "}
                {ans || questionDialogTranslations[language].emptyOption}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label={questionDialogTranslations[language].hintLabel}
          name="hint"
          value={form.hint}
          onChange={handleChange}
          fullWidth
        />
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button variant="outlined" onClick={onClose} disabled={loading}>
          {questionDialogTranslations[language].cancelButton}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
        >
          {loading
            ? editMode
              ? questionDialogTranslations[language].updatingText
              : questionDialogTranslations[language].addingText
            : editMode
            ? questionDialogTranslations[language].updateButton
            : questionDialogTranslations[language].addButton}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuestionFormModal;
