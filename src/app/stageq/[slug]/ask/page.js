"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from "@mui/material";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import { useParams, useRouter } from "next/navigation";
import {
  getQuestionsBySession,
  submitQuestionToSession,
  getPublicSessionBySlug,
} from "@/services/stageq/stageqSessionService";
import { voteQuestion } from "@/services/stageq/questionService";
import { translateTexts } from "@/services/translationService";
import useStageQSocket from "@/hooks/modules/stageq/useStageQSocket";
import LanguageSelector from "@/components/LanguageSelector";
import NoDataAvailable from "@/components/NoDataAvailable";
import LoadingState from "@/components/LoadingState";
import Background from "@/components/Background";
import { getEventBackground } from "@/utils/eventBackground";
import { useLanguage } from "@/contexts/LanguageContext";

const translations = {
  en: {
    askQuestion: "Ask a Question",
    askDescription: "Submit your question or upvote existing ones.",
    postNewQuestion: "Post New Question",
    anonymous: "Anonymous",
    notProvided: "Not provided",
    submitQuestion: "Submit a Question",
    yourQuestion: "Your Question *",
    cancel: "Cancel",
    submit: "Submit",
    welcome: "Welcome",
    sessionNotFound: "Session not found",
  },
  ar: {
    askQuestion: "اطرح سؤالاً",
    askDescription: "أرسل سؤالك أو صوّت على الأسئلة الموجودة.",
    postNewQuestion: "انشر سؤالاً جديداً",
    anonymous: "مجهول",
    notProvided: "غير مقدم",
    submitQuestion: "إرسال سؤال",
    yourQuestion: "سؤالك *",
    cancel: "إلغاء",
    submit: "إرسال",
    welcome: "مرحباً",
    sessionNotFound: "الجلسة غير موجودة",
  },
};

export default function AskQuestionsPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { t, dir, align, language } = useI18nLayout(translations);
  const { language: contextLanguage } = useLanguage();
  const currentLang = contextLanguage || "en";

  // Read identity from session storage (set during verification)
  const registrationId = typeof window !== "undefined" ? sessionStorage.getItem(`stageq_reg_${slug}`) : null;
  const userName = typeof window !== "undefined" ? sessionStorage.getItem(`stageq_name_${slug}`) : null;
  const userCompany = typeof window !== "undefined" ? sessionStorage.getItem(`stageq_company_${slug}`) : null;

  const [session, setSession] = useState(null);
  const [event, setEvent] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [translatedQuestionTexts, setTranslatedQuestionTexts] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [questionText, setQuestionText] = useState("");

  const handleVoteUpdated = useCallback(({ questionId, votes }) => {
    setQuestions(prev => prev.map(q => q._id === questionId ? { ...q, votes } : q));
  }, []);

  const handleNewQuestion = useCallback((question) => {
    setQuestions(prev => prev.some(q => q._id === question._id) ? prev : [question, ...prev]);
  }, []);

  const handleTextUpdated = useCallback(({ questionId, text }) => {
    setQuestions(prev => prev.map(q => q._id === questionId ? { ...q, text } : q));
  }, []);

  const handleQuestionDeleted = useCallback(({ questionId }) => {
    setQuestions(prev => prev.filter(q => q._id !== questionId));
  }, []);

  useStageQSocket({
    sessionSlug: slug,
    onVoteUpdated: handleVoteUpdated,
    onNewQuestion: handleNewQuestion,
    onTextUpdated: handleTextUpdated,
    onQuestionDeleted: handleQuestionDeleted,
  });

  // Translate question texts on language change
  useEffect(() => {
    const list = Array.isArray(questions) ? questions : [];
    if (!list.length) { setTranslatedQuestionTexts({}); return; }
    let cancelled = false;
    const entries = list.map(q => ({ id: q._id, text: q?.text?.trim() ? q.text : "" }));
    translateTexts(entries.map(e => e.text), language)
      .then(results => {
        if (cancelled) return;
        const map = {};
        entries.forEach((e, i) => { map[e.id] = results[i] || e.text; });
        setTranslatedQuestionTexts(map);
      })
      .catch(() => { if (!cancelled) setTranslatedQuestionTexts({}); });
    return () => { cancelled = true; };
  }, [questions, language]);

  const fetchQuestions = async () => {
    const data = await getQuestionsBySession(slug);
    if (!data?.error) {
      setQuestions(Array.isArray(data) ? data : (data?.data ?? []));
    }
  };

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      getPublicSessionBySlug(slug),
      getQuestionsBySession(slug),
    ]).then(async ([sessionData, questionsData]) => {
      if (sessionData && !sessionData.error) {
        setSession(sessionData);
        const eventId = sessionData.linkedEventRegId?._id || sessionData.linkedEventRegId;
        if (eventId) {
          try {
            const { getPublicEventById } = await import("@/services/eventreg/eventService");
            const eventData = await getPublicEventById(eventId);
            if (eventData && !eventData.error) setEvent(eventData);
          } catch { /* ignore */ }
        }
        // Redirect to verify if session requires verification and no reg ID
        if (sessionData.linkedEventRegId && sessionData.primaryField && !registrationId) {
          router.replace(`/stageq/${slug}`);
          return;
        }
      }
      if (!questionsData?.error) {
        setQuestions(Array.isArray(questionsData) ? questionsData : []);
      }
      setLoading(false);
    });
  }, [slug]);

  const background = useMemo(() => getEventBackground(event, currentLang), [event, currentLang]);

  const voteStorageKey = `stageq_voted_${registrationId || slug}`;

  const handleVote = async (questionId) => {
    const voted = JSON.parse(localStorage.getItem(voteStorageKey) || "[]");
    const hasVoted = voted.includes(questionId);
    const action = hasVoted ? "remove" : "add";

    // Optimistic update
    setQuestions(prev => prev.map(q =>
      q._id === questionId ? { ...q, votes: Math.max(0, q.votes + (action === "add" ? 1 : -1)) } : q
    ));
    localStorage.setItem(
      voteStorageKey,
      JSON.stringify(hasVoted ? voted.filter(id => id !== questionId) : [...voted, questionId])
    );

    await voteQuestion(questionId, action);
  };

  const handleSubmit = async () => {
    if (!questionText.trim()) return;
    try {
      setSubmitting(true);
      await submitQuestionToSession(slug, {
        text: questionText.trim(),
        registrationId: registrationId || undefined,
      });
      setQuestionText("");
      setOpenForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box minHeight="100vh" display="flex" justifyContent="center" alignItems="center">
        <Background />
        <CircularProgress />
      </Box>
    );
  }

  if (!session) {
    return (
      <Box minHeight="100vh" display="flex" justifyContent="center" alignItems="center">
        <Background />
        <Typography variant="h5" fontWeight="bold">{t.sessionNotFound}</Typography>
      </Box>
    );
  }

  return (
    <>
      {background?.fileType === "image" && background.url && (
        <Box
          component="img"
          src={background.url}
          alt="background"
          sx={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: -1, pointerEvents: "none" }}
        />
      )}
      {!background && <Background />}

      <Container
        sx={{
          textAlign: align,
          minHeight: "100vh",
          position: "relative",
          overflowY: "auto",
          px: { xs: 2, sm: 4 },
          pt: 10,
          mb: 10,
        }}
        dir={dir}
      >
        {/* Welcome message */}
        {userName && (
          <Typography
            sx={{
              color: "primary.main",
              fontSize: { xs: "6vw", sm: "5vw", md: "4.5vw" },
              fontWeight: "bold",
              textAlign: "center",
              whiteSpace: "nowrap",
              mb: 2,
            }}
          >
            {t.welcome}, {userName}!
          </Typography>
        )}

        {/* Header Section */}
        <Box
          sx={{
            display: "flex",
            justifyContent: { xs: "center", sm: "space-between" },
            alignItems: { xs: "center", sm: "center" },
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            mb: 4,
            textAlign: { xs: "center", sm: align },
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {t.askQuestion}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t.askDescription}
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            onClick={() => setOpenForm(true)}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            {t.postNewQuestion}
          </Button>
        </Box>

        {/* Questions List */}
        <Stack spacing={2}>
          {questions.length === 0 ? (
            <NoDataAvailable />
          ) : (
            questions.map(q => {
              const votedQuestions = JSON.parse(localStorage.getItem(voteStorageKey) || "[]");
              const hasVoted = votedQuestions.includes(q._id);
              const displayName = q.submitterName || q.visitor?.name || t.anonymous;
              const displayCompany = q.submitterCompany || q.visitor?.company || t.notProvided;

              return (
                <Card key={q._id} variant="outlined" sx={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)" }}>
                  <CardContent>
                    {/* Question text */}
                    <Typography fontWeight="bold" gutterBottom>
                      {translatedQuestionTexts[q._id] ?? q.text}
                    </Typography>

                    {/* Submitter Info */}
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      mb={1}
                      sx={{ flexWrap: "nowrap", gap: 2 }}
                    >
                      {[
                        { icon: <ICONS.person fontSize="small" />, text: displayName },
                        { icon: <ICONS.business fontSize="small" />, text: displayCompany },
                      ].map((item, index) => (
                        <Box
                          key={index}
                          sx={{
                            width: "50%",
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "flex-start",
                            gap: 1,
                            wordBreak: "break-word",
                          }}
                        >
                          {item.icon}
                          <Typography variant="body2">{item.text}</Typography>
                        </Box>
                      ))}
                    </Box>

                    {/* Voting */}
                    <Stack direction="row" spacing={1} alignItems="center" mt={1}>
                      <IconButton onClick={() => handleVote(q._id)} color="primary">
                        {hasVoted ? <ICONS.thumb /> : <ICONS.thumbOff />}
                      </IconButton>
                      <Typography>{q.votes}</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })
          )}
        </Stack>

        {/* Question Form Modal */}
        <Dialog
          open={openForm}
          onClose={() => setOpenForm(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3, boxShadow: 6 } }}
        >
          <DialogTitle fontWeight="bold">{t.submitQuestion}</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2} sx={{ mb: 2, mt: 3 }}>
              <TextField
                label={t.yourQuestion}
                fullWidth
                multiline
                minRows={3}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, justifyContent: "flex-end" }}>
            <Button onClick={() => setOpenForm(false)} variant="outlined" color="error" startIcon={<ICONS.cancel />}>
              {t.cancel}
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              sx={{ minWidth: 120 }}
              disabled={submitting || !questionText.trim()}
              startIcon={submitting ? null : <ICONS.send />}
            >
              {submitting ? <CircularProgress size={20} color="inherit" /> : t.submit}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
      <Box dir="ltr"><LanguageSelector top={20} right={20} /></Box>
    </>
  );
}
