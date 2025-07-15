"use client";

import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  IconButton,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Menu,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import MoreVertIcon from "@mui/icons-material/MoreVert";

import BreadcrumbsNav from "@/components/BreadcrumbsNav";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import QuestionFormModal from "@/components/QuestionFormModal";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { useMessage } from "@/contexts/MessageContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import {
  getQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  uploadExcelQuestions,
  downloadTemplate,
} from "@/services/quiznest/questionService";
import { getGameBySlug } from "@/services/quiznest/gameService";
const translations = {
  en: {
    questionsTitle: 'Questions for "{gameTitle}" game',
    questionsDescription:
      "Choices per question: {choicesCount} | Countdown: {countdownTimer}s | Quiz Time: {gameSessionTimer}s",
    downloadTemplate: "Download Template",
    uploadQuestions: "Upload Questions (.xlsx)",
    addQuestion: "Add Question",
    questionLabel: "Question:",
    optionsLabel: "Options:",
    correctAnswerLabel: "Correct Answer:",
    hintLabel: "Hint:",
    deleteQuestionTitle: "Delete Question?",
    deleteQuestionMessage: "Are you sure you want to delete this question?",
    downloadTemplateTitle: "Download Template",
    numberOptionsLabel: "Number of Options",
    includeHintLabel: "Include Hint Column",
    cancelButton: "Cancel",
    downloadButton: "Download",
    editTooltip: "Edit",
    deleteTooltip: "Delete",
    errorLoading: "Error loading data.",
    questionAdded: "Question added!",
    questionUpdated: "Question updated!",
    questionDeleted: "Question deleted!",
    questionsUploaded: "Questions uploaded!",
    templateDownloaded: "Downloaded template!",
    moreOptions: "More",
    downloadTemplate: "Download Template",
    uploadQuestions: "Upload Questions",
    addQuestion: "Add Question",
  },
  ar: {
    questionsTitle: 'أسئلة لعبة "{gameTitle}"',
    questionsDescription:
      "خيارات لكل سؤال: {choicesCount} | العد التنازلي: {countdownTimer}ثانية | وقت الاختبار: {gameSessionTimer}ثانية",
    downloadTemplate: "تحميل القالب",
    uploadQuestions: "رفع الأسئلة (.xlsx)",
    addQuestion: "إضافة سؤال",
    questionLabel: "السؤال:",
    optionsLabel: "الخيارات:",
    correctAnswerLabel: "الإجابة الصحيحة:",
    hintLabel: "تلميح:",
    deleteQuestionTitle: "حذف السؤال؟",
    deleteQuestionMessage: "هل أنت متأكد أنك تريد حذف هذا السؤال؟",
    downloadTemplateTitle: "تحميل القالب",
    numberOptionsLabel: "عدد الخيارات",
    includeHintLabel: "تضمين عمود التلميح",
    cancelButton: "إلغاء",
    downloadButton: "تحميل",
    editTooltip: "تعديل",
    deleteTooltip: "حذف",
    errorLoading: "حدث خطأ أثناء تحميل البيانات.",
    questionAdded: "تمت إضافة السؤال!",
    questionUpdated: "تم تحديث السؤال!",
    questionDeleted: "تم حذف السؤال!",
    questionsUploaded: "تم رفع الأسئلة!",
    templateDownloaded: "تم تحميل القالب!",
    moreOptions: "خيارات",
    downloadTemplate: "تحميل النموذج",
    uploadQuestions: "تحميل الأسئلة",
    addQuestion: "إضافة سؤال",
  },
};
export default function QuestionsPage() {
  const { t, language } = useI18nLayout(translations);
  const { businessSlug, gameSlug } = useParams();
  const { showMessage } = useMessage();
  const [game, setGame] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [downloadChoices, setDownloadChoices] = useState(4);
  const [includeHint, setIncludeHint] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  // Fetch game and questions from backend
  useEffect(() => {
    const fetchGameAndQuestions = async () => {
      setLoading(true);
      try {
        const gameData = await getGameBySlug(gameSlug);
        setGame(gameData);
        const questionsData = await getQuestions(gameData._id);
        setQuestions(questionsData || []);
      } catch (err) {
        showMessage(t.errorLoading, "error");
      } finally {
        setLoading(false);
      }
    };
    if (gameSlug) fetchGameAndQuestions();
  }, [gameSlug, t, showMessage]);

  // Add or edit question
  const handleAddEdit = async (values, isEdit) => {
    try {
      let response;
      if (isEdit) {
        response = await updateQuestion(game._id, selectedQuestion._id, values);
        setQuestions((prev) =>
          prev.map((q) => (q._id === selectedQuestion._id ? response : q))
        );
        showMessage(t.questionUpdated, "success");
      } else {
        response = await addQuestion(game._id, values);
        setQuestions((prev) => [...prev, response]);
        showMessage(t.questionAdded, "success");
      }
    } catch (err) {
      showMessage(t.errorLoading, "error");
    }
    setOpenModal(false);
  };

  // Delete question
  const handleDelete = async () => {
    try {
      await deleteQuestion(game._id, selectedQuestion._id);
      setQuestions((prev) =>
        prev.filter((q) => q._id !== selectedQuestion._id)
      );
      showMessage(t.questionDeleted, "success");
    } catch (err) {
      showMessage(t.errorLoading, "error");
    }
    setConfirmOpen(false);
  };

  // Upload questions via Excel
  const handleUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      console.log(game._id, file);
      await uploadExcelQuestions(game._id, file);
      showMessage(t.questionsUploaded, "success");
      // Refresh questions
      const questionsData = await getQuestions(game._id);
      setQuestions(questionsData || []);
    } catch (err) {
      console.log(err);
      showMessage(t.errorLoading, "error");
    }
  };

  // Download template
  const handleDownload = async () => {
    try {
      const response = await downloadTemplate(downloadChoices, includeHint);
      const blob = response.data; // Axios returns the blob in .data
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "questions_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showMessage(t.templateDownloaded, "success");
    } catch (err) {
      showMessage(t.errorLoading, "error");
    }
    setDownloadModalOpen(false);
  };

  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      <Container maxWidth="lg">
        {loading ? (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <BreadcrumbsNav />
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                rowGap: 2,
                mb: 3,
              }}
            >
              {/* Title + Description */}
              <Box sx={{ flex: { xs: "1 1 100%", sm: "auto" } }}>
                <Typography variant="h5" fontWeight="bold">
                  {t.questionsTitle.replace("{gameTitle}", game?.title)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t.questionsDescription
                        .replace("{choicesCount}", game?.choicesCount)
                        .replace("{countdownTimer}", game?.countdownTimer)
                        .replace("{gameSessionTimer}", game?.gameSessionTimer),
                    }}
                  />
                </Typography>
              </Box>

              {/* Buttons Block */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "stretch",
                  gap: 1,
                  flexDirection: { xs: "column", sm: "row" },
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                {/* Add Question */}
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setEditMode(false);
                    setSelectedQuestion(null);
                    setOpenModal(true);
                  }}
                >
                  {t.addQuestion}
                </Button>

                {/* More Menu (Download + Upload) */}
                <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<MoreVertIcon />}
                    onClick={handleMenuOpen}
                  >
                    {t.moreOptions}
                  </Button>
                  <Menu
                    anchorEl={anchorEl}
                    open={openMenu}
                    onClose={handleMenuClose}
                  >
                    <MenuItem
                      onClick={() => {
                        setDownloadModalOpen(true);
                        handleMenuClose();
                      }}
                    >
                      <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
                      {t.downloadTemplate}
                    </MenuItem>
                    <MenuItem>
                      <UploadFileIcon fontSize="small" sx={{ mr: 1 }} />
                      <label style={{ cursor: "pointer" }}>
                        {t.uploadQuestions}
                        <input
                          type="file"
                          hidden
                          accept=".xlsx"
                          onChange={(e) => {
                            handleUpload(e);
                            handleMenuClose();
                          }}
                        />
                      </label>
                    </MenuItem>
                  </Menu>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3} justifyContent={"center"}>
              {questions?.map((q, idx) => (
                <Grid item xs={12} sm={6} md={4} key={q._id || idx}>
                  <Box
                    sx={{
                      borderRadius: 2,
                      boxShadow: 3,
                      p: 2,
                      bgcolor: "#fff",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      minHeight: 300, // ensures consistent height
                    }}
                  >
                    <Box>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        gutterBottom
                      >
                        Q{idx + 1}
                      </Typography>

                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>{t.questionLabel}</strong> {q.question}
                      </Typography>

                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          sx={{ mb: 0.5 }}
                        >
                          {t.optionsLabel}
                        </Typography>
                        {q.answers.map((a, i) => (
                          <Typography
                            key={i}
                            variant="body2"
                            sx={{
                              color:
                                i === q.correctAnswerIndex
                                  ? "green"
                                  : "text.secondary",
                            }}
                          >
                            {String.fromCharCode(65 + i)}. {a}
                          </Typography>
                        ))}
                      </Box>

                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>{t.correctAnswerLabel}</strong>{" "}
                        <span style={{ color: "green" }}>
                          {String.fromCharCode(65 + q.correctAnswerIndex)}.{" "}
                          {q.answers[q.correctAnswerIndex]}
                        </span>
                      </Typography>

                      {q.hint && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 1, display: "block" }}
                        >
                          <strong>{t.hintLabel}</strong> {q.hint}
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ display: "flex",justifyContent: "flex-end", gap: 1, mt: 2 }}>
                      <Tooltip title={t.editTooltip}>
                        <IconButton
                          color="info"
                          onClick={() => {
                            setSelectedQuestion(q);
                            setEditMode(true);
                            setOpenModal(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t.deleteTooltip}>
                        <IconButton
                          color="error"
                          onClick={() => {
                            setSelectedQuestion(q);
                            setConfirmOpen(true);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>

            <QuestionFormModal
              open={openModal}
              onClose={() => setOpenModal(false)}
              editMode={editMode}
              initialValues={selectedQuestion}
              onSubmit={(values) => handleAddEdit(values, editMode)}
              optionCount={game?.choicesCount}
            />

            <ConfirmationDialog
              open={confirmOpen}
              title={t.deleteQuestionTitle}
              message={t.deleteQuestionMessage}
              onClose={() => setConfirmOpen(false)}
              onConfirm={handleDelete}
            />
          </>
        )}
        <Dialog
          open={downloadModalOpen}
          onClose={() => setDownloadModalOpen(false)}
        >
          <DialogTitle>{t.downloadTemplateTitle}</DialogTitle>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
          >
            <FormControl fullWidth>
              <InputLabel>{t.numberOptionsLabel}</InputLabel>
              <Select
                value={downloadChoices}
                onChange={(e) => setDownloadChoices(e.target.value)}
                label={t.numberOptionsLabel}
              >
                {[2, 3, 4, 5].map((n) => (
                  <MenuItem key={n} value={n}>
                    {n}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={includeHint}
                  onChange={(e) => setIncludeHint(e.target.checked)}
                />
              }
              label={t.includeHintLabel}
            />
          </DialogContent>

          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => setDownloadModalOpen(false)}
              variant="outlined"
            >
              {t.cancelButton}
            </Button>
            <Button onClick={handleDownload} variant="contained">
              {t.downloadButton}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
