"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Divider,
} from "@mui/material";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import { useParams } from "next/navigation";
import {
  getQuestionsByBusiness,
  voteQuestion,
  submitQuestion,
} from "@/services/stageq/questionService";
import Image from "next/image";
import LanguageSelector from "@/components/LanguageSelector";
import NoDataAvailable from "@/components/NoDataAvailable";
import LoadingState from "@/components/LoadingState";
const translations = {
  en: {
    // Header Section
    askQuestion: "Ask a Question",
    scanQRDescription:
      "Scan the QR and post your question, or vote on existing ones.",
    postNewQuestion: "Post New Question",

    // Questions List
    noQuestions: "No questions yet.",

    // Visitor Info Labels
    anonymous: "Anonymous",
    notProvided: "Not provided",

    // Form Modal
    submitQuestion: "Submit a Question",
    yourName: "Your Name *",
    phone: "Phone",
    company: "Company",
    yourQuestion: "Your Question *",
    cancel: "Cancel",
    submit: "Submit",
  },
  ar: {
    // Header Section
    askQuestion: "اطرح سؤالاً",
    scanQRDescription:
      "امسح رمز الاستجابة السريعة واطرح سؤالك، أو صوت على الأسئلة الموجودة.",
    postNewQuestion: "انشر سؤالاً جديداً",

    // Questions List
    noQuestions: "لا توجد أسئلة حتى الآن.",

    // Visitor Info Labels
    anonymous: "مجهول",
    notProvided: "غير مقدم",

    // Form Modal
    submitQuestion: "إرسال سؤال",
    yourName: "اسمك *",
    phone: "الهاتف",
    company: "الشركة",
    yourQuestion: "سؤالك *",
    cancel: "إلغاء",
    submit: "إرسال",
  },
};
export default function AskQuestionsPage() {
  const { businessSlug } = useParams();
  const { t, dir, align } = useI18nLayout(translations);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    company: "",
    text: "",
  });

  const fetchQuestions = async () => {
    const data = await getQuestionsByBusiness(businessSlug);
    setQuestions(data);
    setLoading(false);
  };

  const handleVote = async (questionId) => {
    const voted = JSON.parse(localStorage.getItem("votedQuestions") || "[]");
    const hasVoted = voted.includes(questionId);

    const action = hasVoted ? "remove" : "add";
    await voteQuestion(questionId, action);

    const updated = hasVoted
      ? voted.filter((id) => id !== questionId)
      : [...voted, questionId];

    localStorage.setItem("votedQuestions", JSON.stringify(updated));
    fetchQuestions();
  };

  const handleSubmit = async () => {
    const { name, text } = formData;
    await submitQuestion(businessSlug, formData);
    setFormData({ name: "", phone: "", company: "", text: "" });
    setOpenForm(false);
    fetchQuestions();
  };

  useEffect(() => {
    fetchQuestions();
  }, [businessSlug]);

  return (
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
            {t.scanQRDescription}
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          onClick={() => setOpenForm(true)}
        >
          {t.postNewQuestion}
        </Button>
      </Box>

      {/* Questions List */}
      {loading ? (
        <LoadingState/>
      ) : (
        <Stack spacing={2}>
          {questions.length === 0 ? (
            <NoDataAvailable/>
          ) : (
            questions.map((q) => {
              const votedQuestions = JSON.parse(
                localStorage.getItem("votedQuestions") || "[]"
              );
              const hasVoted = votedQuestions.includes(q._id);

              return (
                <Card key={q._id} variant="outlined">
                  <CardContent>
                    {/* Question text */}
                    <Typography fontWeight="bold" gutterBottom>
                      {q.text}
                    </Typography>

                    {/* Visitor Info with Icons */}
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      mb={1}
                      sx={{ flexWrap: "nowrap", gap: 2 }}
                    >
                      {[
                        {
                          icon: <ICONS.person fontSize="small" />,
                          text: q.visitor?.name || t.anonymous,
                        },
                        // {
                        //   icon: <ICONS.phone fontSize="small" />,
                        //   text: q.visitor?.phone || t.notProvided,
                        // },
                        {
                          icon: <ICONS.business fontSize="small" />,
                          text: q.visitor?.company || t.notProvided,
                        },
                      ].map((item, index) => (
                        <Box
                          key={index}
                          sx={{
                            width: "33.33%",
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "flex-start",
                            gap: 1,
                            wordBreak: "break-word",
                            whiteSpace: "normal",
                          }}
                        >
                          {item.icon}
                          <Typography variant="body2">{item.text}</Typography>
                        </Box>
                      ))}
                    </Box>

                    {/* Voting */}
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      mt={1}
                    >
                      <IconButton
                        onClick={() => handleVote(q._id)}
                        color="primary"
                      >
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
      )}

      {/* Question Form Modal */}
      <Dialog
        open={openForm}
        onClose={() => setOpenForm(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: 6,
            textAlign: { xs: "center", sm: align },
          },
        }}
      >
        <DialogTitle
          fontWeight="bold"
          sx={{
            textAlign: { xs: "center", sm: align },
            pb: 1,
          }}
        >
          {t.submitQuestion}
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Stack
            spacing={2}
            sx={{
              alignItems: { xs: "center", sm: "stretch" },
              mb: 2,
            }}
          >
            <TextField
              label={t.yourName}
              fullWidth
              sx={{ mt: 4 }}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            <TextField
              label={t.phone}
              fullWidth
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
            <TextField
              label={t.company}
              fullWidth
              value={formData.company}
              onChange={(e) =>
                setFormData({ ...formData, company: e.target.value })
              }
            />
            <TextField
              label={t.yourQuestion}
              fullWidth
              multiline
              minRows={3}
              value={formData.text}
              onChange={(e) =>
                setFormData({ ...formData, text: e.target.value })
              }
            />
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2,
            justifyContent: { xs: "center", sm: "flex-end" },
          }}
        >
          <Button
            onClick={() => setOpenForm(false)}
            variant="outlined"
            color="error"
          >
            {t.cancel}
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            sx={{ minWidth: 120 }}
          >
            {t.submit}
          </Button>
        </DialogActions>
      </Dialog>
      <LanguageSelector top={20} right={20} />
    </Container>
  );
}
