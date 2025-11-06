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
  CardContent,
  CardActions,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import MoreVertIcon from "@mui/icons-material/MoreVert";

import BreadcrumbsNav from "@/components/BreadcrumbsNav";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import QuestionFormModal from "@/components/QuestionFormModal";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import useI18nLayout from "@/hooks/useI18nLayout";
import {
  getQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  uploadExcelQuestions,
  downloadTemplate,
} from "@/services/eventduel/questionService";
import { getGameBySlug } from "@/services/eventduel/gameService";
import NoDataAvailable from "@/components/NoDataAvailable";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import AppCard from "@/components/cards/AppCard";

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
    delete: "Delete",
    deleteQuestionMessage: "Are you sure you want to move this item to the Recycle Bin?",
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
    deleteQuestionMessage: "هل أنت متأكد من أنك تريد نقل هذا العنصر إلى سلة المحذوفات؟",
    delete: "حذف",
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
  const { t, dir } = useI18nLayout(translations);
  const { gameSlug } = useParams();
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
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    const fetchGameAndQuestions = async () => {
      setLoading(true);
      const gameData = await getGameBySlug(gameSlug);
      if (!gameData.error) {
        setGame(gameData);
      }
      const questionsData = await getQuestions(gameData._id);
      if (!questionsData.error) {
        setQuestions(questionsData || []);
      }

      setLoading(false);
    };
    if (gameSlug) fetchGameAndQuestions();
  }, [gameSlug]);

  const handleAddEdit = async (values, isEdit) => {
    let response;
    if (isEdit) {
      response = await updateQuestion(game._id, selectedQuestion._id, values);
      setQuestions((prev) =>
        prev.map((q) => (q._id === selectedQuestion._id ? response : q))
      );
    } else {
      response = await addQuestion(game._id, values);
      setQuestions((prev) => [...prev, response]);
    }
    setOpenModal(false);
  };

  const handleDelete = async () => {
    await deleteQuestion(game._id, selectedQuestion._id);
    setQuestions((prev) => prev.filter((q) => q._id !== selectedQuestion._id));
    setConfirmOpen(false);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    console.log(game._id, file);
    await uploadExcelQuestions(game._id, file);
    const questionsData = await getQuestions(game._id);
    setQuestions(questionsData || []);
  };

  const handleDownload = async () => {
    await downloadTemplate(downloadChoices, includeHint);
    setDownloadModalOpen(false);
  };


  return (
    <Box sx={{ position: "relative", width: "100%" }} dir={dir}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <BreadcrumbsNav />

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "stretch", sm: "center" },
              mt: 2,
              mb: 1,
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Box sx={{ flex: 1 }}>
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
                flexDirection: { xs: "column", sm: "row" },
                gap: 1,
                width: { xs: "100%", sm: "auto" },
              }}
            >
              {/* Add Question */}
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditMode(false);
                  setSelectedQuestion(null);
                  setOpenModal(true);
                }}
                sx={getStartIconSpacing(dir)}
              >
                {t.addQuestion}
              </Button>

              {/* More Menu (Download + Upload) */}
              <Button
                variant="outlined"
                startIcon={<MoreVertIcon />}
                onClick={handleMenuOpen}
                sx={getStartIconSpacing(dir)}
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

          <Divider sx={{ mt: 2 }} />
        </Box>

        {loading ? (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : !game || questions.length === 0 ? (
          <NoDataAvailable />
        ) : (
          <Grid container spacing={3} justifyContent="center">
            {questions?.map((q, idx) => {
              const answerImages = q.answerImages || [];
              const answers = q.answers || [];
              return (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  key={q._id || idx}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  <AppCard
                    sx={{
                      width: "100%",
                      maxWidth: { xs: "none", sm: 360 },
                      mx: { xs: 0, sm: "auto" },
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <CardContent>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        gutterBottom
                      >
                        Q{idx + 1}
                      </Typography>

                      <Box>
                        <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>
                          <strong>{t.questionLabel}</strong> {q.question}
                        </Typography>
                        {q.questionImage && (
                          <Box
                            component="img"
                            src={q.questionImage}
                            alt="Question"
                            sx={{
                              width: 100,
                              height: { xs: 70, sm: 80 },
                              objectFit: "cover",
                              borderRadius: 1,
                              border: "1px solid #eee",
                              mb: 1,
                            }}
                          />
                        )}
                      </Box>

                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          sx={{ mb: 0.5 }}
                        >
                          {t.optionsLabel}
                        </Typography>
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: 1,
                          }}
                        >
                          {answers.map((a, i) => (
                            <Box key={i}>
                              <Typography
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
                              {answerImages[i] && (
                                <Box
                                  component="img"
                                  src={q.answerImages[i]}
                                  alt={`Option ${String.fromCharCode(65 + i)}`}
                                  sx={{
                                    width: 100,
                                    height: { xs: 70, sm: 80 },
                                    objectFit: "cover",
                                    borderRadius: 1,
                                    border: "1px solid #eee",
                                    mt: 0.5,
                                  }}
                                />
                              )}
                            </Box>
                          ))}
                        </Box>
                      </Box>

                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>{t.correctAnswerLabel}</strong>{" "}
                        <span style={{ color: "green" }}>
                          {String.fromCharCode(65 + (q.correctAnswerIndex || 0))}.{" "}
                          {answers[q.correctAnswerIndex || 0]}
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
                    </CardContent>
                    <CardActions sx={{ justifyContent: "center" }}>
                      <Tooltip title={t.editTooltip}>
                        <IconButton
                          color="secondary"
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
                    </CardActions>
                  </AppCard>
                </Grid>
              )
            })}
          </Grid>
        )}

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
          confirmButtonText={t.delete}
          confirmButtonIcon={<ICONS.delete />}
        />
        <Dialog
          open={downloadModalOpen}
          onClose={() => setDownloadModalOpen(false)}
          dir={dir}
        >
          <DialogTitle>{t.downloadTemplateTitle}</DialogTitle>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
          >
            <FormControl fullWidth sx={{ mt: 2 }}>
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
    </Box >
  );
}
