"use client";

import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Grid,
  IconButton,
  Fade,
  Container,
  Card,
  CardContent,
} from "@mui/material";
import Confetti from "react-confetti";
import { useGame } from "@/contexts/GameContext";
import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { submitPvPResult } from "@/services/eventduel/gameSessionService";
import LanguageSelector from "@/components/LanguageSelector";
import useI18nLayout from "@/hooks/useI18nLayout";
import { translateText } from "@/services/translationService";
import useEventDuelWebSocketData from "@/hooks/modules/eventduel/useEventDuelWebSocketData";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

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
    win: "YOU WIN!",
    lose: "YOU LOSE!",
    tie: "IT'S A TIE!",
    opponent: "Opponent",
    playAgain: "Play Again",
    finishedEarlyTitle: "Well Done!",
    finishedEarlyMessage: "You answered all questions before the time ran out.",
    finishedEarlyWaitMessage:
      "Please wait for the host to end the session to view the results.",
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
    win: "لقد فزت!",
    lose: "لقد خسرت!",
    tie: "تعادل!",
    opponent: "الخصم",
    playAgain: "العب مرة أخرى",
    finishedEarlyTitle: "أحسنت!",
    finishedEarlyMessage: "لقد أجبت على جميع الأسئلة قبل انتهاء الوقت.",
    finishedEarlyWaitMessage:
      "يرجى الانتظار حتى يقوم المضيف بإنهاء الجلسة لعرض النتائج.",
  },
};

export default function PlayPage() {
  // ─── 1. CONTEXT & ROUTER ───────────────────────────────────────────────
  const { game } = useGame();
  const router = useRouter();
  const { t, dir, language } = useI18nLayout(gameTranslations);

  // ─── 2. SOCKET DATA ────────────────────────────────────────────────────
  const {
    sessions = [],
    selectedPlayer = null,
    questions: PlayerQuestions = [],
  } = useEventDuelWebSocketData(game?.slug) || {};

  // ─── 3. DERIVED QUESTIONS ARRAY ────────────────────────────────────────
  const questions = useMemo(
    () => (Array.isArray(PlayerQuestions) ? PlayerQuestions : []),
    [PlayerQuestions]
  );
  
  // ─── 4. AUDIO INSTANCES ─────────────────────────────────────────────────
  const correctSound =
    typeof Audio !== "undefined" ? new Audio("/correct.wav") : null;
  const wrongSound =
    typeof Audio !== "undefined" ? new Audio("/wrong.wav") : null;
  const celebrateSound =
    typeof Audio !== "undefined" ? new Audio("/celebrate.mp3") : null;

  // ─── 5. STATE & REFS ────────────────────────────────────────────────────
  const [questionIndex, setQuestionIndex] = useState(0);
  const currentQuestion = questions[questionIndex];
  const [selected, setSelected] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [translatedContent, setTranslatedContent] = useState({});
  const hasSubmittedRef = useRef(false);
  const [disabled, setDisabled] = useState(false);
  const scoreRef = useRef(0);
  const attemptedRef = useRef(0);
  const [localDelay, setLocalDelay] = useState(0);
  const [localTime, setLocalTime] = useState(0);
  const [hasFinishedEarly, setHasFinishedEarly] = useState(false);

  // ─── 6. SESSION STATUS DERIVATIONS ────────────────────────────────────
  const pendingSession = useMemo(
    () => sessions.find((s) => s.status === "pending") || null,
    [sessions]
  );
  const activeSession = useMemo(
    () => sessions.find((s) => s.status === "active") || null,
    [sessions]
  );
  const recentlyCompleted = useMemo(() => {
    const completed = sessions
      .filter((s) => s.status === "completed")
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    return completed[0] || null;
  }, [sessions]);

  // ─── 7. QUESTION TRANSLATION HELPER ────────────────────────────────────
  const translateQuestion = async (questionObj) => {
    if (!questionObj) return;
    const [q, answers, hint] = await Promise.all([
      translateText(questionObj.question, language),
      Promise.all(questionObj.answers.map((a) => translateText(a, language))),
      questionObj.hint ? translateText(questionObj.hint, language) : null,
    ]);
    setTranslatedContent({
      question: q || questionObj.question,
      answers: answers.length === questionObj.answers.length ? answers : questionObj.answers,
      hint: hint || questionObj.hint,
      uiLabels: {
        questionLabel: t.question,
        ofLabel: t.of,
        countdownLabel: t.countdown,
      },
    });
  };

  // ─── 8. EFFECTS ─────────────────────────────────────────────────────────
  // 8.1 Countdown + game timer
  useEffect(() => {
    if (!activeSession) return;
    let countdown = activeSession.gameId.countdownTimer || 5;
    let duration = activeSession.gameId.gameSessionTimer || 60;
    let inCountdown = true;
    setLocalDelay(countdown);
    setLocalTime(0);

    const iv = setInterval(() => {
      if (inCountdown) {
        if (--countdown <= 0) {
          inCountdown = false;
          setLocalTime(duration);
        } else {
          setLocalDelay(countdown);
        }
      } else {
        if (--duration <= 0) {
          clearInterval(iv);
          submitFinalResult();
        } else {
          setLocalTime(duration);
        }
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [activeSession]);

  // 8.2 Translate on question change
  useEffect(() => {
    translateQuestion(currentQuestion);
  }, [currentQuestion, language]);

  // ─── 9. PROGRESS & FINAL SUBMISSION ────────────────────────────────────
  const submitProgress = async (timeOverride = null) => {
    const playerId = sessionStorage.getItem("playerId");
    const sessionId = sessionStorage.getItem("sessionId");
    if (!playerId || !sessionId) return;
    const timeTaken =
      timeOverride !== null ? timeOverride : game.gameSessionTimer - localTime;
    await submitPvPResult({
      sessionId,
      playerId,
      payload: {
        score: scoreRef.current,
        attemptedQuestions: attemptedRef.current,
        timeTaken,
      },
    });
  };

  const submitFinalResult = async () => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    await submitProgress(game.gameSessionTimer);
    sessionStorage.removeItem("playerId");
    sessionStorage.removeItem("sessionId");
  };

  // ─── 10. ANSWER HANDLER ─────────────────────────────────────────────────
  const handleSelect = (i) => {
    if (!currentQuestion || selected !== null || disabled) return;
    const isCorrect = i === currentQuestion.correctAnswerIndex;
    setSelected(i);
    setDisabled(true);
    attemptedRef.current++;

    if (isCorrect) {
      scoreRef.current++;
      correctSound?.play().catch(() => {});
    } else {
      wrongSound?.play().catch(() => {});
      if (currentQuestion.hint) setShowHint(true);
    }

    if (questionIndex + 1 < questions.length) submitProgress();

    setTimeout(() => {
      if (!isCorrect && currentQuestion.hint) setShowHint(false);

      const isLast = questionIndex + 1 >= questions.length;
      if (isLast) {
        if (localTime > 0) {
          setHasFinishedEarly(true);
          celebrateSound?.play().catch(() => {});
        }
        submitFinalResult();
      } else {
        setQuestionIndex((q) => q + 1);
        setSelected(null);
        setDisabled(false);
      }
    }, 1000);
  };

  // ─── 11. RENDER BRANCHES ────────────────────────────────────────────────

  /* SESSION PENDING SCREEN (waiting for host)*/
  if (pendingSession) {
    return (
      <Box
        sx={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.9), rgba(0,0,0,0.6))",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          backdropFilter: "blur(10px)",
          animation: "fadeIn 1s ease-in-out",
          px: 3,
        }}
      >
        {/* Back Button */}
        <IconButton
          size="small"
          onClick={() => router.push(`/eventduel/${game.slug}/`)}
          sx={{
            position: "fixed",
            top: 20,
            left: 20,
            bgcolor: "primary.main",
            color: "white",
          }}
        >
          <ICONS.back />
        </IconButton>

        {/* Loading Spinner */}
        <CircularProgress />

        {/* Animated Text */}
        <Typography
          variant="h3"
          sx={{
            my: 6,
            fontWeight: "bold",
            color: "#fff",
            textShadow:
              "0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(0,255,255,0.6)",
            letterSpacing: "2px",
            animation: "pulseText 2s infinite",
            fontSize: { xs: "1.5rem", sm: "2.5rem" },
          }}
        >
          Waiting for Host to Start...
        </Typography>

        {/* Additional Loading Message */}
        <Typography
          variant="h6"
          sx={{
            mt: 2,
            opacity: 0.5,
            fontSize: { xs: "0.9rem", sm: "1.1rem" },
            fontStyle: "italic",
            animation: "blink 1.5s infinite",
          }}
        >
          The game will begin shortly...
        </Typography>
      </Box>
    );
  }

  // show countdown before active
  if (localDelay > 0) {
    return (
      <Box
        dir={dir}
        sx={{
          position: "relative",
          height: "100vh",
          width: "100vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.9), rgba(0,0,0,0.6))",
        }}
      >
        <LanguageSelector top={20} right={20} />
        <Typography
          variant="h1"
          sx={{
            fontWeight: "bold",
            fontSize: "10rem",
            color: "warning.light",
            textShadow:
              "0 0 15px rgba(255,215,0,0.8), 0 0 30px rgba(255,165,0,0.6)",
            animation: "pulse 1s infinite alternate",
          }}
        >
          {localDelay}
        </Typography>
      </Box>
    );
  }

  // Active game UI
  if (activeSession) {
    // Player finished all questions but timer still running
    if (hasFinishedEarly) {
      return (
        <Box
          dir={dir}
          sx={{
            position: "relative",
            height: "100vh",
            width: "100vw",
            backgroundImage: `url(${game.backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              bgcolor: "rgba(0,0,0,0.5)",
            },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
            textAlign: "center",
          }}
        >
          <Confetti
            recycle={false}
            numberOfPieces={300}
            gravity={0.2}
            style={{ position: "absolute", top: 0, left: 0 }}
          />

          <LanguageSelector top={20} right={20} />

          <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
            <Card elevation={8} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ py: 4, px: 3 }}>
                <Typography
                  variant="h3"
                  gutterBottom
                  sx={{
                    fontWeight: 700,
                    color: "primary.main",
                    letterSpacing: 1,
                  }}
                >
                  🎉 {t.finishedEarlyTitle}
                </Typography>

                <Typography variant="h6" sx={{ mt: 2, color: "text.primary" }}>
                  {t.finishedEarlyMessage}
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    mt: 3,
                    fontStyle: "italic",
                    color: "text.secondary",
                    lineHeight: 1.6,
                  }}
                >
                  {t.finishedEarlyWaitMessage}
                </Typography>
              </CardContent>
            </Card>
          </Container>
        </Box>
      );
    }

    return (
      <Box dir={dir} sx={{ position: "relative" }}>
        <LanguageSelector top={20} right={20} />
        <Box
          sx={{
            height: "100vh",
            width: "100vw",
            backgroundImage: `url(${game.backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
            px: 2,
            py: 6,
          }}
        >
          {/* Timer display */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-end",
              gap: 1,
              position: "absolute",
              top: { xs: 20, sm: 150 },
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "4rem", sm: "6rem", md: "8rem" },
                fontWeight: "bold",
                color: "secondary.main",
                textShadow: "0 0 15px rgba(255,255,255,0.6)",
                lineHeight: 1,
              }}
            >
              {localTime}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: "1rem", sm: "1.5rem" },
                color: "#000",
                fontStyle: "italic",
                opacity: 0.7,
                mb: { xs: "0.4rem", sm: "0.6rem" },
              }}
            >
              {translatedContent?.uiLabels?.countdownLabel}
            </Typography>
          </Box>

          {/* Question panel */}
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              px: 2,
              backgroundImage: `url(${game.backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundAttachment: "fixed",
            }}
          >
            <Paper
              elevation={4}
              sx={{
                width: "95%",
                p: 4,
                textAlign: "center",
                backdropFilter: "blur(6px)",
                backgroundColor: "rgba(255,255,255,0.5)",
                borderRadius: 4,
                marginTop: "10vh",
              }}
            >
              <Typography variant="h5" gutterBottom fontWeight="bold">
                {translatedContent?.uiLabels?.questionLabel} {questionIndex + 1}{" "}
                {translatedContent?.uiLabels?.ofLabel} {questions.length}
              </Typography>
              <Typography sx={{ fontSize: "3rem" }} gutterBottom>
                {translatedContent?.question}
              </Typography>

              <Grid
                container
                spacing={2}
                justifyContent="center"
                alignItems="stretch"
                sx={{
                  mt: 2,
                  maxWidth: "600px",
                  mx: "auto",
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gridAutoRows: "1fr",
                }}
              >
                {currentQuestion &&
                  translatedContent?.answers?.map((opt, i) => {
                    const isSelected = selected === i;
                    const isCorrect = i === currentQuestion.correctAnswerIndex;
                    const bg = isSelected
                      ? isCorrect
                        ? "#c8e6c9"
                        : "#ffcdd2"
                      : "#f5f5f5";
                    return (
                      <Grid item xs={12} sm={6} key={i}>
                        <Button
                          fullWidth
                          variant="outlined"
                          onClick={() => handleSelect(i)}
                          sx={{
                            backgroundColor: bg,
                            fontWeight: "bold",
                            fontSize: "2rem",
                            borderRadius: 2,
                            textTransform: "none",
                            minHeight: "150px",
                            p: 2,
                          }}
                        >
                          <Box sx={{ width: "100%", textAlign: "center" }}>
                            {opt}
                          </Box>
                        </Button>
                      </Grid>
                    );
                  })}
              </Grid>

              {showHint && currentQuestion.hint && (
                <Typography
                  variant="body2"
                  color="error"
                  sx={{ mt: 3, fontStyle: "italic" }}
                >
                  {t.hint}: {currentQuestion.hint}
                </Typography>
              )}
            </Paper>
          </Box>
        </Box>
      </Box>
    );
  }

  // Game ended – show result
  if (selectedPlayer && recentlyCompleted) {
    const currentSession = recentlyCompleted;

    const isPlayer1Winner =
      currentSession?.winner?._id ===
      currentSession?.players?.[0]?.playerId?._id;
    const isPlayer2Winner =
      currentSession?.winner?._id ===
      currentSession?.players?.[1]?.playerId?._id;

    const isWinner =
      selectedPlayer === "p1" ? isPlayer1Winner : isPlayer2Winner;
    const isTie = currentSession?.winner === null;

    const playerObj =
      selectedPlayer === "p1"
        ? currentSession.players[0]
        : currentSession.players[1];
    const opponentObj =
      selectedPlayer === "p1"
        ? currentSession.players[1]
        : currentSession.players[0];

    const playerScore = playerObj.score;
    const playerAttempted = playerObj.attemptedQuestions;
    const opponentScore = opponentObj.score;
    const opponentAttempted = opponentObj.attemptedQuestions;

    const winText = t.win || "YOU WIN!";
    const loseText = t.lose || "YOU LOSE!";
    const tieText = t.tie || "IT'S A TIE!";

    let backgroundGradient, headlineText;
    if (isTie) {
      backgroundGradient = "linear-gradient(135deg, #FFC107CC, #FF9800CC)";
      headlineText = tieText;
    } else if (isWinner) {
      backgroundGradient = "linear-gradient(135deg, #4CAF50CC, #388E3CCC)";
      headlineText = winText;
    } else {
      backgroundGradient = "linear-gradient(135deg, #F44336CC, #E53935CC)";
      headlineText = loseText;
    }

    return (
      <Box
        sx={{
          position: "relative",
          height: "100vh",
          width: "100vw",
          background:
            "linear-gradient(135deg, rgba(0,0,0,0.8), rgba(50,50,50,0.8))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          p: 2,
        }}
      >
        {isWinner && (
          <Confetti
            recycle={false}
            numberOfPieces={300}
            gravity={0.2}
            style={{ position: "absolute", top: 0, left: 0 }}
          />
        )}
        <LanguageSelector top={20} right={20} />
        <Fade in timeout={800}>
          <Paper
            dir={dir}
            elevation={8}
            sx={{
              width: { xs: "80%", sm: "50%" },
              p: 4,
              borderRadius: 3,
              background: backgroundGradient,
              color: "#fff",
              textAlign: "center",
              boxShadow: "0 0 30px rgba(0,0,0,0.6)",
              backdropFilter: "blur(5px)",
            }}
          >
            {/* Player Name */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h3"
                fontWeight={700}
                sx={{ textShadow: "0 0 15px rgba(255,255,255,0.8)" }}
              >
                {playerObj?.playerId?.name}
              </Typography>
            </Box>

            {/* Headline */}
            <Typography
              variant="h1"
              sx={{
                fontWeight: "bold",
                mb: 3,
                textShadow: "0 0 10px rgba(255,255,255,0.6)",
              }}
            >
              {headlineText}
            </Typography>

            {/* Score */}
            <Typography
              variant="h2"
              sx={{
                fontWeight: "bold",
                mb: 1,
                fontSize: { xs: "4rem", sm: "6rem" },
                textShadow: "0 0 20px rgba(255,255,255,0.6)",
              }}
            >
              {playerScore}
            </Typography>

            <Typography variant="h5" sx={{ mb: 3 }}>
              {t.attempted}: {playerAttempted}
            </Typography>

            {/* Opponent Box */}
            <Box
              sx={{
                background: "#ffffffaa",
                backdropFilter: "blur(4px)",
                p: 2,
                borderRadius: 2,
                color: "#000",
                mb: 3,
              }}
            >
              <Typography variant="h6" sx={{ mb: 1 }}>
                {t.opponent || "Opponent"}
              </Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                {opponentObj?.playerId?.name || "N/A"}
              </Typography>
              <Typography variant="body1" sx={{ mb: 0.5 }}>
                {t.score}: {opponentScore}
              </Typography>
              <Typography variant="body1">
                {t.attempted}: {opponentAttempted}
              </Typography>
            </Box>

            {/* Play Again */}
            <Button
              variant="contained"
              color="secondary"
              size="large"
              onClick={() => router.push(`/eventduel/${game.slug}`)}
              startIcon={<ICONS.replay />}
              sx={getStartIconSpacing(dir)}
            >
              {t.playAgain || "Play Again"}
            </Button>
          </Paper>
        </Fade>
      </Box>
    );
  }

  // Default landing page
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
