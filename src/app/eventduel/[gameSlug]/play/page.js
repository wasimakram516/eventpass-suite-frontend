"use client";

import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Grid,
  Fade,
} from "@mui/material";
import { useGame } from "@/contexts/GameContext";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { submitPvPResult } from "@/services/eventduel/gameSessionService";
import LanguageSelector from "@/components/LanguageSelector";
import useI18nLayout from "@/hooks/useI18nLayout";
import { translateText } from "@/services/translationService";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import useEventDuelWebSocketData from "@/hooks/modules/eventduel/useEventDuelWebSocketData";

const gameTranslations = {
  en: {
    countdown: "sec",
    question: "Question",
    of: "of",
    hint: "Hint",
    thankYou: "Thank you,",
    score: "Score",
    attempted: "Attempted",
    playAgain: "Play Again",
    noQuestionsTitle: "Please wait...",
    noQuestionsMessage:
      "An administrator needs to add questions to this game before you can start playing.",
    waitingTitle: "Waiting for players...",
    waitingMessage: "Please wait until the host activates the session.",
  },
  ar: {
    countdown: "ثانية",
    question: "سؤال",
    of: "من",
    hint: "تلميح",
    thankYou: "شكراً لك",
    score: "النقاط",
    attempted: "محاولات",
    playAgain: "العب مرة أخرى",
    noQuestionsTitle: "الرجاء الانتظار...",
    noQuestionsMessage:
      "يجب على المسؤول إضافة أسئلة إلى هذه اللعبة قبل أن تتمكن من البدء.",
    waitingTitle: "في انتظار اللاعبين...",
    waitingMessage: "يرجى الانتظار حتى يقوم المضيف بتنشيط الجلسة.",
  },
};

export default function PlayPage() {
  const { game, loading } = useGame();
  const router = useRouter();
  const { t, dir, align, language } = useI18nLayout(gameTranslations);

  // ① remove local questions, get directly from hook:
  const { currentSession,selectedPlayer, questions } = useEventDuelWebSocketData(game?.slug);

console.log(`Questions for ${selectedPlayer}:`, questions);

  const [playerInfo, setPlayerInfo] = useState(null);
  const [delay, setDelay] = useState(game?.countdownTimer || 3);
  const [timeLeft, setTimeLeft] = useState(game?.gameSessionTimer || 60);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [translatedContent, setTranslatedContent] = useState({});
  const intervalRef = useRef(null);
  const hasSubmittedRef = useRef(false);
  const scoreRef = useRef(0);
  const attemptedRef = useRef(0);
  const timeLeftRef = useRef(game?.gameSessionTimer || 60);
  const [randomizedIndexes, setRandomizedIndexes] = useState([]);

  // pick the current question
  const currentQuestion =
    questions?.[randomizedIndexes[questionIndex] ?? questionIndex];

  // sounds...
  const correctSound =
    typeof Audio !== "undefined" ? new Audio("/correct.wav") : null;
  const wrongSound =
    typeof Audio !== "undefined" ? new Audio("/wrong.wav") : null;
  const celebrateSound =
    typeof Audio !== "undefined" ? new Audio("/celebrate.mp3") : null;

  // translate logic unchanged...
  const getText = (t, fallback) =>
    typeof t === "object" && t?.translatedText ? t.translatedText : fallback;
  const translateQuestion = async (questionObj) => {
    if (!questionObj) return;
    const targetLang = language;
    const [question, answers, hint] = await Promise.all([
      translateText(questionObj.question, targetLang),
      Promise.all(
        questionObj.answers.map((answer) => translateText(answer, targetLang))
      ),
      questionObj.hint
        ? translateText(questionObj.hint, targetLang)
        : null,
    ]);
    setTranslatedContent({
      question: getText(question, questionObj.question),
      answers: Array.isArray(answers)
        ? answers.map((a, i) => getText(a, questionObj.answers[i]))
        : questionObj.answers,
      hint: getText(hint, questionObj.hint),
      uiLabels: {
        questionLabel: t.question,
        ofLabel: t.of,
        countdownLabel: t.countdown,
      },
    });
  };

  // ─── ③ NEW: derive delay & timeLeft from currentSession timestamps ───
useEffect(() => {
  if (currentSession?.status === "active") {
    const now    = Date.now();
    const start  = new Date(currentSession.startTime).getTime();
    const end    = new Date(currentSession.endTime).getTime();

    // seconds until start
    setDelay(Math.max(0, Math.ceil((start - now) / 1000)));

    // total game seconds remaining
    setTimeLeft(Math.max(0, Math.ceil((end   - now) / 1000)));
  }
}, [currentSession]);

  useEffect(() => {
    translateQuestion(currentQuestion);
  }, [currentQuestion, language]);

  // shuffle indexes when questions change
  useEffect(() => {
    if (Array.isArray(questions)) {
      const idxs = questions.map((_, i) => i);
      setRandomizedIndexes(idxs.sort(() => Math.random() - 0.5));
    }
  }, [questions]);

  // grab playerInfo from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("playerInfo");
    if (stored) setPlayerInfo(JSON.parse(stored));
  }, []);

  // ② COUNTDOWN: only start when session is ACTIVE
  useEffect(() => {
    if (currentSession?.status !== "active") return;

    // only begin if questions are loaded
    if (questions.length > 0 && delay > 0) {
      const cnt = setInterval(() => {
        setDelay((d) => d - 1);
      }, 1000);
      return () => clearInterval(cnt);
    } else if (delay === 0 && !started) {
      setStarted(true);
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          const nt = t - 1;
          timeLeftRef.current = nt;
          if (nt <= 0) {
            clearInterval(intervalRef.current);
            endGame();
            return 0;
          }
          return nt;
        });
      }, 1000);
    }
  }, [delay, questions, currentSession?.status, loading, started]);

  const endGame = async () => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    celebrateSound?.play();
    setEnded(true);
    const playerId = localStorage.getItem("playerId");
    const sessionId = localStorage.getItem("sessionId");
    await submitPvPResult(sessionId, playerId, {
      score: scoreRef.current,
      attemptedQuestions: attemptedRef.current,
      timeTaken: game.gameSessionTimer - timeLeftRef.current,
    });
  };

  const handleSelect = (i) => {
    if (selected !== null) return;
    const isCorrect = i === currentQuestion.correctAnswerIndex;
    setSelected(i);
    attemptedRef.current += 1;
    setAttempted(attemptedRef.current);

    if (isCorrect) {
      correctSound?.play();
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setTimeout(goNext, 1000);
    } else {
      wrongSound?.play();
      if (currentQuestion.hint) {
        setShowHint(true);
        setTimeout(() => {
          setShowHint(false);
          setSelected(null);
        }, 2000);
      } else {
        setTimeout(goNext, 1000);
      }
    }
  };

  const goNext = () => {
    if (questionIndex + 1 >= randomizedIndexes.length) {
      clearInterval(intervalRef.current);
      endGame();
    } else {
      setQuestionIndex((q) => q + 1);
      setSelected(null);
      setShowHint(false);
    }
  };

  // ─── UI ──────────────────────────────────────────────────────────────────

  if (loading || !game || !playerInfo) {
    return (
      <Box
        sx={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: `url(${game?.backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // no questions at all in game config
  if (!game.questions?.length) {
    return (
      <Box dir={dir} sx={{ position: "relative" }}>
        <LanguageSelector top={20} right={20} />
        <Box
          sx={{
            height: "100vh",
            width: "100vw",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundImage: `url(${game.backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
            px: 2,
          }}
        >
          <Paper elevation={6} sx={{ maxWidth: 500, p: 4, textAlign: "center", backdropFilter: "blur(6px)", backgroundColor: "rgba(255,255,255,0.6)", borderRadius: 4 }}>
            <QuizOutlinedIcon color="warning" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              {t.noQuestionsTitle}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t.noQuestionsMessage}
            </Typography>
          </Paper>
        </Box>
      </Box>
    );
  }

  // still pending (waiting for host)
  if (currentSession?.status === "pending") {
    return (
      <Box dir={dir} sx={{ position: "relative" }}>
        <LanguageSelector top={20} right={20} />
        <Box
          sx={{
            height: "100vh",
            width: "100vw",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundImage: `url(${game.backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
            px: 2,
          }}
        >
          <Paper elevation={6} sx={{ maxWidth: 500, p: 4, textAlign: "center", backdropFilter: "blur(6px)", backgroundColor: "rgba(255,255,255,0.6)", borderRadius: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              {t.waitingTitle}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t.waitingMessage}
            </Typography>
          </Paper>
        </Box>
      </Box>
    );
  }

  // show countdown before active
  if (!started) {
    return (
      <Box dir={dir} sx={{ height: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(to bottom, rgba(0,0,0,0.9), rgba(0,0,0,0.6))" }}>
        <Typography variant="h1" sx={{ fontWeight: "bold", fontSize: "10rem", color: "warning.light", textShadow: "0 0 15px rgba(255,215,0,0.8), 0 0 30px rgba(255,165,0,0.6)", animation: "pulse 1s infinite alternate" }}>
          {delay}
        </Typography>
      </Box>
    );
  }

  // game ended – show result
  if (ended) {
    return (
      <Box dir={dir} sx={{ position: "relative" }}>
        <LanguageSelector top={20} right={20} />
        <Box sx={{ height: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, rgba(0,0,0,0.8), rgba(50,50,50,0.8))", p: 2, textAlign: "center" }}>
          <Fade in timeout={800}>
            <Paper elevation={8} sx={{ width: { xs: "80%", sm: "50%" }, p: 4, borderRadius: 3, background: "linear-gradient(135deg, rgba(0,150,136,0.85), rgba(0,105,92,0.85))", color: "#fff", textAlign: "center", boxShadow: "0 0 30px rgba(0,0,0,0.6)", backdropFilter: "blur(5px)" }}>
              <Typography variant="h4" fontWeight="bold" sx={{ textShadow: "0 0 10px rgba(255,255,255,0.7)", mb: 2 }}>
                {playerInfo?.name}
              </Typography>
              <Typography variant="h2" fontWeight="bold" sx={{ mb: 3, textShadow: "0 0 15px rgba(255,255,255,0.6)" }}>
                {t.thankYou}
              </Typography>
              <Typography variant="h3" mb={1}>
                {t.score}: {score}
              </Typography>
              <Typography variant="h6" mb={3}>
                {t.attempted}: {attempted}
              </Typography>
              <Button variant="contained" color="secondary" sx={{ fontSize: "1.25rem" }} onClick={() => router.push(`/eventduel/${game.slug}`)}>
                {t.playAgain}
              </Button>
            </Paper>
          </Fade>
        </Box>
      </Box>
    );
  }

  // ─── Main active game UI ──────────────────────────────────────────────────
  return (
    <Box dir={dir} sx={{ position: "relative" }}>
      <LanguageSelector top={20} right={20} />
      <Box sx={{ height: "100vh", width: "100vw", backgroundImage: `url(${game.backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed", px: 2, py: 6 }}>
        {/* Timer display */}
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 1, position: "absolute", top: { xs: 20, sm: 150 }, left: "50%", transform: "translateX(-50%)" }}>
          <Typography variant="h1" sx={{ fontSize: { xs: "4rem", sm: "6rem", md: "8rem" }, fontWeight: "bold", color: "secondary.main", textShadow: "0 0 15px rgba(255,255,255,0.6)", lineHeight: 1 }}>
            {timeLeft}
          </Typography>
          <Typography variant="h6" sx={{ fontSize: { xs: "1rem", sm: "1.5rem" }, color: "#000", fontStyle: "italic", opacity: 0.7, mb: { xs: "0.4rem", sm: "0.6rem" } }}>
            {translatedContent.uiLabels.countdownLabel}
          </Typography>
        </Box>

        {/* Question panel */}
        <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", px: 2, backgroundImage: `url(${game.backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }}>
          <Paper elevation={4} sx={{ width: "95%", p: 4, textAlign: "center", backdropFilter: "blur(6px)", backgroundColor: "rgba(255,255,255,0.5)", borderRadius: 4, marginTop: "10vh" }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              {translatedContent.uiLabels.questionLabel} {questionIndex + 1} {translatedContent.uiLabels.ofLabel}{" "}
              {randomizedIndexes.length}
            </Typography>
            <Typography sx={{ fontSize: "3rem" }} gutterBottom>
              {translatedContent.question}
            </Typography>

            <Grid container spacing={2} justifyContent="center" alignItems="stretch" sx={{ mt: 2, maxWidth: "600px", mx: "auto", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gridAutoRows: "1fr" }}>
              {translatedContent.answers.map((opt, i) => {
                const isSelected = selected === i;
                const isCorrect = i === currentQuestion.correctAnswerIndex;
                const bg = isSelected ? (isCorrect ? "#c8e6c9" : "#ffcdd2") : "#f5f5f5";
                return (
                  <Grid item xs={12} sm={6} key={i} sx={{ display: "flex", minHeight: "150px", gridColumn: i === 4 ? "1 / -1" : "auto" }}>
                    <Button fullWidth variant="outlined" onClick={() => handleSelect(i)} sx={{ backgroundColor: bg, fontWeight: "bold", fontSize: "2rem", borderRadius: 2, textTransform: "none", whiteSpace: "normal", wordBreak: "break-word", overflowWrap: "break-word", minHeight: "150px", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
                      <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", px: 1 }}>
                        {opt}
                      </Box>
                    </Button>
                  </Grid>
                );
              })}
            </Grid>

            {showHint && currentQuestion.hint && (
              <Typography variant="body2" color="error" sx={{ mt: 3, fontStyle: "italic" }}>
                {t.hint}: {currentQuestion.hint}
              </Typography>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
