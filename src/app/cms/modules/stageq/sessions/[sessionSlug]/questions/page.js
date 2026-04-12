"use client";

import {
  Box,
  Container,
  Typography,
  Stack,
  Divider,
  IconButton,
  Button,
  Grid,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  CardActions,
  FormControl,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
} from "@mui/material";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMessage } from "@/contexts/MessageContext";
import {
  getQuestionsBySession,
} from "@/services/stageq/stageqSessionService";
import {
  updateQuestion,
  deleteQuestion,
} from "@/services/stageq/questionService";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import { useAuth } from "@/contexts/AuthContext";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import LoadingState from "@/components/LoadingState";
import NoDataAvailable from "@/components/NoDataAvailable";
import RecordMetadata from "@/components/RecordMetadata";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { useParams } from "next/navigation";
import useStageQSocket from "@/hooks/modules/stageq/useStageQSocket";
import AppCard from "@/components/cards/AppCard";
import { COUNTRY_CODES } from "@/utils/countryCodes";

const translations = {
  en: {
    title: "Session Questions",
    description: "Review and moderate questions submitted for this session.",
    openFullScreenButton: "Open Full Screen",
    editQuestionTitle: "Edit Question",
    editQuestionLabel: "Question Text",
    updateButton: "Update",
    cancelButton: "Cancel",
    deleteQuestionTitle: "Delete Question",
    deleteQuestionMessage: "Are you sure you want to move this item to the Recycle Bin?",
    deleteButton: "Delete",
    answered: "Answered",
    notAnswered: "Not Answered",
    editQuestionTooltip: "Edit Question",
    deleteQuestionTooltip: "Delete Question",
    anonymous: "Anonymous",
    notProvided: "Not provided",
    vote: "vote",
    votes: "votes",
    failedToUpdateAnsweredStatus: "Failed to update answered status",
    createdBy: "Created:",
    createdAt: "Created At:",
    updatedBy: "Updated:",
    updatedAt: "Updated At:",
  },
  ar: {
    title: "أسئلة الجلسة",
    description: "مراجعة وتعديل الأسئلة المرسلة لهذه الجلسة.",
    openFullScreenButton: "فتح في شاشة كاملة",
    editQuestionTitle: "تحرير السؤال",
    editQuestionLabel: "نص السؤال",
    updateButton: "تحديث",
    cancelButton: "إلغاء",
    deleteQuestionTitle: "حذف السؤال",
    deleteQuestionMessage: "هل أنت متأكد أنك تريد نقل هذا العنصر إلى سلة المحذوفات؟",
    deleteButton: "حذف",
    answered: "مجاب عليه",
    notAnswered: "غير مجاب عليه",
    editQuestionTooltip: "تحرير السؤال",
    deleteQuestionTooltip: "حذف السؤال",
    anonymous: "مجهول",
    notProvided: "غير مقدم",
    vote: "صوت",
    votes: "أصوات",
    failedToUpdateAnsweredStatus: "فشل في تحديث حالة الإجابة",
    createdBy: "أنشئ:",
    createdAt: "تاريخ الإنشاء:",
    updatedBy: "حدث:",
    updatedAt: "تاريخ التحديث:",
  },
};

export default function SessionQuestionsPage() {
  const { sessionSlug } = useParams();
  const { showMessage } = useMessage();
  const { user } = useAuth();
  const { t, dir, language } = useI18nLayout(translations);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [countdowns, setCountdowns] = useState({});
  const countdownRef = useRef({});

  const fetchQuestions = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    const data = await getQuestionsBySession(sessionSlug);
    if (!data?.error) {
      const list = Array.isArray(data) ? data : [];
      setQuestions(list);
      const now = Date.now();
      list.forEach(q => {
        if (q.visibleAt && new Date(q.visibleAt).getTime() > now) {
          startCountdown(q._id, q.visibleAt);
        }
      });
    }
    if (showLoader) setLoading(false);
  };

  useEffect(() => {
    if (!sessionSlug) return;
    fetchQuestions(true);
  }, [sessionSlug]);

  const handleVoteUpdated = useCallback(({ questionId, votes }) => {
    setQuestions(prev => prev.map(q => q._id === questionId ? { ...q, votes } : q));
  }, []);

  const handleAnsweredUpdated = useCallback(({ questionId, answered }) => {
    setQuestions(prev => prev.map(q => q._id === questionId ? { ...q, answered } : q));
  }, []);

  const startCountdown = useCallback((questionId, visibleAt) => {
    if (!visibleAt) return;
    const target = new Date(visibleAt).getTime();
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((target - Date.now()) / 1000));
      setCountdowns(prev => ({ ...prev, [questionId]: remaining }));
      if (remaining > 0) {
        countdownRef.current[questionId] = setTimeout(tick, 1000);
      } else {
        delete countdownRef.current[questionId];
        setCountdowns(prev => { const next = { ...prev }; delete next[questionId]; return next; });
      }
    };
    tick();
  }, []);

  const handleNewQuestionAdmin = useCallback((question) => {
    setQuestions(prev => prev.some(q => q._id === question._id) ? prev : [question, ...prev]);
    if (question.visibleAt) startCountdown(question._id, question.visibleAt);
  }, [startCountdown]);

  useEffect(() => {
    return () => {
      Object.values(countdownRef.current).forEach(clearTimeout);
    };
  }, []);

  useStageQSocket({
    sessionSlug,
    onVoteUpdated: handleVoteUpdated,
    onAnsweredUpdated: handleAnsweredUpdated,
    onNewQuestionAdmin: handleNewQuestionAdmin,
  });

  const handleDelete = async () => {
    await deleteQuestion(confirmDelete.id);
    fetchQuestions();
    setConfirmDelete({ open: false, id: null });
  };

  const handleEditSubmit = async () => {
    await updateQuestion(editData._id, { text: editData.text });
    fetchQuestions();
    setEditDialogOpen(false);
  };

  return (
    <Box dir={dir} sx={{ display: "flex", minHeight: "100vh" }}>
      <Container maxWidth="lg">
        <BreadcrumbsNav />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
          mb={3}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight="bold">{t.title}</Typography>
            <Typography variant="body2" color="text.secondary">{t.description}</Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }}>
            {sessionSlug && (
              <Button
                variant="contained"
                color="success"
                onClick={() => window.open(`/stageq/${sessionSlug}/display`, "_blank")}
                startIcon={<ICONS.fullscreen fontSize="small" />}
                size="medium"
                sx={{ ...getStartIconSpacing(dir) }}
              >
                {t.openFullScreenButton}
              </Button>
            )}
          </Stack>
        </Stack>

        <Divider sx={{ mb: 4 }} />

        {loading ? (
          <LoadingState />
        ) : questions.length === 0 ? (
          <NoDataAvailable />
        ) : (
          <Grid container spacing={3} justifyContent="center">
            {questions.map((q) => (
              <Grid item xs={12} sm={6} md={4} key={q._id}>
                <AppCard
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "100%",
                    width: { xs: "100%", sm: "360px" },
                  }}
                >
                  {countdowns[q._id] > 0 && (
                    <Box sx={{ px: 2, pt: 1.5 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <Chip
                          label={`On screen in ${countdowns[q._id]}s`}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={100 - (countdowns[q._id] / (q.visibleAt ? Math.ceil((new Date(q.visibleAt).getTime() - new Date(q.createdAt).getTime()) / 1000) : 30)) * 100}
                        color="warning"
                        sx={{ borderRadius: 1, height: 4 }}
                      />
                    </Box>
                  )}
                  <Box sx={{ px: 2, pt: 2 }}>
                    <Typography fontWeight="bold" fontSize="1.05rem" color="text.primary" sx={{ lineHeight: 1.4 }}>
                      {q.text}
                    </Typography>
                  </Box>

                  <Box sx={{ px: 2, pt: 1, pb: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                    {/* Votes */}
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ gap: dir === "rtl" ? 1 : 0 }}>
                      {<ICONS.thumb fontSize="small" />}
                      <Typography variant="body2" color="text.secondary">
                        {q.votes} {q.votes === 1 ? t.vote : t.votes}
                      </Typography>
                    </Stack>
                    <Divider sx={{ my: 1 }} />

                    {/* Submitter Info */}
                    <Stack spacing={0.5}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ gap: dir === "rtl" ? 1 : 0 }}>
                        <ICONS.person fontSize="small" />
                        <Typography variant="body2">
                          {q.submitterName || q.visitor?.name || t.anonymous}
                        </Typography>
                      </Stack>
                      {(q.submitterPhone || q.visitor?.phone) && (
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ gap: dir === "rtl" ? 1 : 0 }}>
                          <ICONS.phone fontSize="small" />
                          <Typography variant="body2">
                            {(() => {
                              const phone = q.submitterPhone || q.visitor?.phone;
                              const iso = q.submitterIsoCode;
                              const dialCode = iso ? COUNTRY_CODES.find(c => c.isoCode === iso.toLowerCase())?.code : null;
                              return dialCode ? `${dialCode}${phone}` : phone;
                            })()}
                          </Typography>
                        </Stack>
                      )}
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ gap: dir === "rtl" ? 1 : 0 }}>
                        <ICONS.business fontSize="small" />
                        <Typography variant="body2">
                          {q.submitterCompany || q.visitor?.company || t.notProvided}
                        </Typography>
                      </Stack>
                    </Stack>

                  </Box>

                  <RecordMetadata
                    createdByName={q.createdBy}
                    updatedByName={q.updatedBy}
                    createdAt={q.createdAt}
                    updatedAt={q.updatedAt}
                    createdByDisplayName={q.createdBy == null ? (q.submitterName || q.visitor?.name) : undefined}
                    locale={language === "ar" ? "ar-SA" : "en-GB"}
                    sx={{ mt: 0, px: 2, width: "100%" }}
                  />

                  <CardActions
                    sx={{
                      justifyContent: "space-between",
                      borderTop: "1px solid rgba(0,0,0,0.06)",
                      px: 1,
                      py: 0.5,
                      bgcolor: "rgba(0,0,0,0.02)",
                    }}
                  >
                    <FormControl size="small" sx={{ minWidth: 140, ml: 1 }}>
                      <Select
                        value={q.answered ? "answered" : "unanswered"}
                        onChange={async (e) => {
                          try {
                            await updateQuestion(q._id, { answered: e.target.value === "answered" });
                          } catch {
                            showMessage(t.failedToUpdateAnsweredStatus, "error");
                          }
                        }}
                        sx={{ fontSize: "0.875rem" }}
                      >
                        <MenuItem value="answered">{t.answered}</MenuItem>
                        <MenuItem value="unanswered">{t.notAnswered}</MenuItem>
                      </Select>
                    </FormControl>
                    <Stack direction="row">
                      <Tooltip title={t.editQuestionTooltip}>
                        <IconButton
                          onClick={() => { setEditData(q); setEditDialogOpen(true); }}
                          color="warning"
                          sx={{ "&:hover": { transform: "scale(1.1)" }, transition: "0.2s" }}
                        >
                          <ICONS.edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t.deleteQuestionTooltip}>
                        <IconButton
                          onClick={() => setConfirmDelete({ open: true, id: q._id })}
                          color="error"
                          sx={{ "&:hover": { transform: "scale(1.1)" }, transition: "0.2s" }}
                        >
                          <ICONS.delete />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </CardActions>
                </AppCard>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{t.editQuestionTitle}</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label={t.editQuestionLabel}
              multiline
              minRows={3}
              value={editData?.text || ""}
              onChange={(e) => setEditData({ ...editData, text: e.target.value })}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: dir === "rtl" ? 1 : 0 }}>
            <Button onClick={() => setEditDialogOpen(false)} color="error" variant="outlined" startIcon={<ICONS.close fontSize="small" />} sx={getStartIconSpacing(dir)}>
              {t.cancelButton}
            </Button>
            <Button onClick={handleEditSubmit} variant="contained" startIcon={<ICONS.save fontSize="small" />} sx={getStartIconSpacing(dir)}>
              {t.updateButton}
            </Button>
          </DialogActions>
        </Dialog>

        <ConfirmationDialog
          open={confirmDelete.open}
          onClose={() => setConfirmDelete({ open: false, id: null })}
          onConfirm={handleDelete}
          title={t.deleteQuestionTitle}
          message={t.deleteQuestionMessage}
          confirmButtonText={t.deleteButton}
          confirmButtonIcon={<ICONS.delete fontSize="small" />}
          cancelButtonIcon={<ICONS.close fontSize="small" />}
        />
      </Container>
    </Box>
  );
}
