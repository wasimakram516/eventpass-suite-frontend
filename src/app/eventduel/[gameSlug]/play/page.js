"use client";

import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Grid,
  Fade,
  Container,
  Card,
  CardContent,
  IconButton
} from "@mui/material";
import Confetti from "react-confetti";
import { useGame } from "@/contexts/GameContext";
import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  submitPvPResult,
  activateGameSession,
} from "@/services/eventduel/gameSessionService";
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
    timeTaken: "Time Taken",
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
    waitingTitle: "Get Ready!",
    waitingMessage: "The game will start shortly...",
    pendingTitle: "Waiting for Host to Start...",
    pendingMessage: "The game will begin shortly...",
    startNow: "Start Game",
    bothJoined: "Both players are ready!",
    waitingForBoth: "Waiting for both players to join...",
  },
  ar: {
    countdown: "ثانية",
    question: "سؤال",
    of: "من",
    hint: "تلميح",
    thankYou: "شكراً لك",
    score: "النقاط",
    attempted: "محاولات",
    timeTaken: "الوقت المستغرق",
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
    waitingTitle: "استعد!",
    waitingMessage: "ستبدأ اللعبة قريباً...",
    pendingTitle: "في انتظار بدء المضيف...",
    pendingMessage: "ستبدأ اللعبة قريباً...",
    startNow: "ابدأ اللعبة",
    bothJoined: "انضم اللاعبان! جاهزون للبدء",
    waitingForBoth: "بانتظار انضمام كلا اللاعبين...",
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
    requestAllSessions
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
  const [starting, setStarting] = useState(false);

  // ─── 6. SESSION STATUS DERIVATIONS ────────────────────────────────────
  const abandonedSession = useMemo(
    () => sessions.find((s) => s.status === "abandoned") || null,
    [sessions]
  );

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

  const bothPlayersJoined = useMemo(() => {
    if (!pendingSession) return false;
    const hasP1 = pendingSession.players?.some(
      (p) => p.playerType === "p1" && p.playerId
    );
    const hasP2 = pendingSession.players?.some(
      (p) => p.playerType === "p2" && p.playerId
    );
    return hasP1 && hasP2;
  }, [pendingSession]);

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
      answers:
        answers.length === questionObj.answers.length
          ? answers
          : questionObj.answers,
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
        countdown--;
        if (countdown <= 0) {
          inCountdown = false;
          setLocalDelay(0); // ensure it flips to zero
          setLocalTime(duration);
        } else {
          setLocalDelay(countdown);
        }
      } else {
        duration--;
        if (duration <= 0) {
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

  // 8.3 If Host ends the game session, submit player's stats
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      sessionStorage.getItem("forceSubmitTriggered") === "true"
    ) {
      if (!hasSubmittedRef.current) {
        hasSubmittedRef.current = true;
        submitProgress();
        clearPlayerSessionData();
      }
    }
  }, [localTime]);

  useEffect(() => {
    const { playerId, sessionId } = getPlayerSessionData();
    if (game && (!playerId || !sessionId)) {
      router.replace(`/eventduel/${game?.slug}`);
    }
  }, [pendingSession, abandonedSession]);

  // ─── 9. PROGRESS & FINAL SUBMISSION ────────────────────────────────────
  const submitProgress = async (timeOverride = null) => {
    const { playerId, sessionId } = getPlayerSessionData();

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
    await submitProgress();
    clearPlayerSessionData();
  };

  // ─── 10. HANDLERS ─────────────────────────────────────────────────
  const handlePlayerActivate = async () => {
    if (!pendingSession || !bothPlayersJoined || starting) return;
    try {
      setStarting(true);
      await activateGameSession(pendingSession._id);
      requestAllSessions();
    } finally {
      setStarting(false);
    }
  };

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

  const getPlayerSessionData = () => {
    if (typeof window === "undefined") return null;
    return {
      playerId: sessionStorage.getItem("playerId"),
      sessionId: sessionStorage.getItem("sessionId"),
    };
  };

  const clearPlayerSessionData = () => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem("playerId");
    sessionStorage.removeItem("sessionId");
    sessionStorage.removeItem("forceSubmitTriggered");
  };

  // ─── 11. RENDER BRANCHES ────────────────────────────────────────────────

  /* SESSION PENDING SCREEN (players can start) */
  if (pendingSession) {
    return (
      <>
        <LanguageSelector top={20} right={20} />
        <Box
          dir={dir}
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
          onClick={() => router.replace(`/eventduel/${game.slug}`)}
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
          {!bothPlayersJoined ? (
            <>
              <CircularProgress />
              <Typography
                variant="h3"
                sx={{
                  my: 6,
                  fontWeight: "bold",
                  textShadow:
                    "0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(0,255,255,0.6)",
                  letterSpacing: "2px",
                  animation: "pulseText 2s infinite",
                  fontSize: (() => {
                    const L = (t.waitingTitle || t.pendingTitle || "").length;
                    if (L <= 25) return { xs: "1.5rem", sm: "2.5rem" };
                    if (L <= 40) return { xs: "1.25rem", sm: "2rem" };
                    return { xs: "1rem", sm: "1.75rem" };
                  })(),
                  lineHeight: { xs: 1.2, sm: 1.3 },
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                {t.waitingTitle || t.pendingTitle}
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  mt: 2,
                  opacity: 0.6,
                  fontStyle: "italic",
                  animation: "blink 1.5s infinite",
                  fontSize: (() => {
                    const L = (t.waitingForBoth || t.pendingMessage || "")
                      .length;
                    if (L <= 30) return { xs: "0.9rem", sm: "1.1rem" };
                    if (L <= 50) return { xs: "0.8rem", sm: "1rem" };
                    return { xs: "0.7rem", sm: "0.9rem" };
                  })(),
                }}
              >
                {t.waitingForBoth || t.pendingMessage}
              </Typography>
            </>
          ) : (
            <>
              <Typography
                variant="h3"
                sx={{
                  mb: 4,
                  fontWeight: "bold",
                  textShadow:
                    "0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(0,255,255,0.6)",
                  letterSpacing: "2px",
                  animation: "pulseText 2s infinite",
                  fontSize: (() => {
                    const L = (t.bothJoined || "").length;
                    if (L <= 20) return { xs: "1.5rem", sm: "2.5rem" };
                    if (L <= 35) return { xs: "1.25rem", sm: "2rem" };
                    return { xs: "1rem", sm: "1.75rem" };
                  })(),
                }}
              >
                {t.bothJoined}
              </Typography>

              <Button
                variant="contained"
                size="large"
                onClick={handlePlayerActivate}
                disabled={starting}
                startIcon={<ICONS.play />}
                sx={{
                  px: 4,
                  py: 1.25,
                  borderRadius: 999,
                  fontWeight: "bold",
                  textTransform: "none",
                  ...getStartIconSpacing(dir),
                }}
              >
                {starting ? (
                  <CircularProgress size={22} sx={{ color: "#fff" }} />
                ) : (
                  t.startNow
                )}
              </Button>

              <Typography
                variant="body2"
                sx={{ mt: 4, opacity: 0.7, fontStyle: "italic" }}
              >
                {/* Small hint so users know anybody can start */}
                {language === "ar"
                  ? "يمكن لأي لاعب بدء اللعبة الآن."
                  : "Any player can start the game now."}
              </Typography>
            </>
          )}
        </Box>
      </>
    );
  }

  // show countdown before active
  if (localDelay > 0) {
    return (
      <>
        {/* Language switcher */}
        <LanguageSelector top={20} right={20} />
        <Box
          dir={dir}
          sx={{
            position: "relative",
            height: "100vh",
            width: "100vw",
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.85), rgba(0,0,0,0.65))",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            backdropFilter: "blur(8px)",
            animation: "fadeIn 1s ease-in-out",
            px: 3,
          }}
        >
          {/* Pre-game title */}
          <Typography
            variant="h3"
            sx={{
              mb: 4,
              fontWeight: "bold",
              textShadow:
                "0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(0,255,255,0.6)",
              letterSpacing: "2px",
              animation: "pulseText 2s infinite",
              fontSize: (() => {
                const titleLength = t.waitingTitle?.length || 0;
                if (titleLength <= 15) {
                  return { xs: "1.5rem", sm: "3rem" };
                } else if (titleLength <= 25) {
                  return { xs: "1.25rem", sm: "2.5rem" };
                } else {
                  return { xs: "1rem", sm: "2rem" };
                }
              })(),
              lineHeight: { xs: 1.2, sm: 1.3 },
              wordBreak: "break-word",
              overflowWrap: "break-word",
            }}
          >
            {t.waitingTitle}
          </Typography>

          {/* Countdown number */}
          <Typography
            variant="h1"
            sx={{
              fontWeight: "bold",
              fontSize: { xs: "8rem", sm: "10rem" },
              color: "warning.light",
              textShadow: "0 0 20px rgba(255,215,0,0.9)",
              animation: "pulse 1s infinite alternate",
            }}
          >
            {localDelay}
          </Typography>

          {/* Subtext */}
          <Typography
            variant="h6"
            sx={{
              mt: 2,
              opacity: 0.5,
              fontStyle: "italic",
              animation: "blink 1.5s infinite",
              fontSize: (() => {
                const messageLength = t.waitingMessage?.length || 0;
                if (messageLength <= 25) {
                  return { xs: "0.9rem", sm: "1.2rem" };
                } else if (messageLength <= 40) {
                  return { xs: "0.8rem", sm: "1.1rem" };
                } else {
                  return { xs: "0.7rem", sm: "1rem" };
                }
              })(),
              lineHeight: { xs: 1.2, sm: 1.3 },
              wordBreak: "break-word",
              overflowWrap: "break-word",
            }}
          >
            {t.waitingMessage}
          </Typography>
        </Box>
      </>
    );
  }

  // Active game UI
  if (activeSession) {
    // Player finished all questions but timer still running
    if (hasFinishedEarly) {
      return (
        <>
          <LanguageSelector top={20} right={20} />
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
                      fontSize: (() => {
                        const titleLength = t.finishedEarlyTitle?.length || 0;
                        if (titleLength <= 15) {
                          return { xs: "1.5rem", sm: "2rem", md: "2.5rem" };
                        } else if (titleLength <= 25) {
                          return { xs: "1.25rem", sm: "1.75rem", md: "2rem" };
                        } else {
                          return { xs: "1rem", sm: "1.5rem", md: "1.75rem" };
                        }
                      })(),
                      lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 },
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                    }}
                  >
                    🎉 {t.finishedEarlyTitle}
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{
                      mt: 2,
                      color: "text.primary",
                      fontSize: (() => {
                        const messageLength =
                          t.finishedEarlyMessage?.length || 0;
                        if (messageLength <= 50) {
                          return { xs: "1rem", sm: "1.25rem", md: "1.5rem" };
                        } else if (messageLength <= 80) {
                          return {
                            xs: "0.875rem",
                            sm: "1.125rem",
                            md: "1.25rem",
                          };
                        } else {
                          return { xs: "0.75rem", sm: "1rem", md: "1.125rem" };
                        }
                      })(),
                      lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 },
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                    }}
                  >
                    {t.finishedEarlyMessage}
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{
                      mt: 3,
                      fontStyle: "italic",
                      color: "text.secondary",
                      lineHeight: 1.6,
                      fontSize: (() => {
                        const waitMessageLength =
                          t.finishedEarlyWaitMessage?.length || 0;
                        if (waitMessageLength <= 60) {
                          return { xs: "0.875rem", sm: "1rem", md: "1.125rem" };
                        } else if (waitMessageLength <= 100) {
                          return { xs: "0.75rem", sm: "0.875rem", md: "1rem" };
                        } else {
                          return {
                            xs: "0.625rem",
                            sm: "0.75rem",
                            md: "0.875rem",
                          };
                        }
                      })(),
                      lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 },
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                    }}
                  >
                    {t.finishedEarlyWaitMessage}
                  </Typography>
                </CardContent>
              </Card>
            </Container>
          </Box>
        </>
      );
    }

    return (
      <Box sx={{ position: "relative" }}>
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
          dir={dir}
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
              <Typography
                variant="h5"
                gutterBottom
                fontWeight="bold"
                sx={{
                  fontSize: (() => {
                    const questionLabel = `${
                      translatedContent?.uiLabels?.questionLabel
                    } ${questionIndex + 1} ${
                      translatedContent?.uiLabels?.ofLabel
                    } ${questions.length}`;
                    const labelLength = questionLabel?.length || 0;
                    if (labelLength <= 25) {
                      return { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" };
                    } else if (labelLength <= 40) {
                      return { xs: "1rem", sm: "1.25rem", md: "1.5rem" };
                    } else {
                      return { xs: "0.875rem", sm: "1.125rem", md: "1.25rem" };
                    }
                  })(),
                  lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 },
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                {translatedContent?.uiLabels?.questionLabel} {questionIndex + 1}{" "}
                {translatedContent?.uiLabels?.ofLabel} {questions.length}
              </Typography>
              <Typography
                sx={{
                  fontSize: (() => {
                    const questionLength =
                      translatedContent?.question?.length || 0;
                    if (questionLength <= 30) {
                      return { xs: "2rem", sm: "2.5rem", md: "3rem" };
                    } else if (questionLength <= 60) {
                      return { xs: "1.5rem", sm: "2rem", md: "2.5rem" };
                    } else if (questionLength <= 100) {
                      return { xs: "1.25rem", sm: "1.75rem", md: "2rem" };
                    } else {
                      return { xs: "1rem", sm: "1.5rem", md: "1.75rem" };
                    }
                  })(),
                  lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 },
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                  fontWeight: "bold",
                }}
                gutterBottom
              >
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
                            fontSize: (() => {
                              const optionLength = opt?.length || 0;
                              if (optionLength <= 20) {
                                return {
                                  xs: "1.5rem",
                                  sm: "2rem",
                                  md: "2.5rem",
                                };
                              } else if (optionLength <= 40) {
                                return {
                                  xs: "1.25rem",
                                  sm: "1.75rem",
                                  md: "2rem",
                                };
                              } else if (optionLength <= 60) {
                                return {
                                  xs: "1rem",
                                  sm: "1.5rem",
                                  md: "1.75rem",
                                };
                              } else {
                                return {
                                  xs: "0.875rem",
                                  sm: "1.25rem",
                                  md: "1.5rem",
                                };
                              }
                            })(),
                            borderRadius: 2,
                            textTransform: "none",
                            minHeight: "150px",
                            p: 2,
                            lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 },
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
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
                  sx={{
                    mt: 3,
                    fontStyle: "italic",
                    fontSize: (() => {
                      const hintText = `${t.hint}: ${currentQuestion.hint}`;
                      const hintLength = hintText?.length || 0;
                      if (hintLength <= 50) {
                        return { xs: "0.875rem", sm: "1rem", md: "1.125rem" };
                      } else if (hintLength <= 80) {
                        return { xs: "0.75rem", sm: "0.875rem", md: "1rem" };
                      } else {
                        return {
                          xs: "0.625rem",
                          sm: "0.75rem",
                          md: "0.875rem",
                        };
                      }
                    })(),
                    lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 },
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}
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

    // 1. Lookup rather than index
    const playerObj = currentSession.players.find(
      (p) => p.playerType === selectedPlayer
    );
    const opponentObj = currentSession.players.find(
      (p) => p.playerType !== selectedPlayer
    );

    // 2. Tie check
    const isTie = currentSession.winner === null;

    // 3. Win check
    const isWinner =
      !isTie && currentSession.winner?._id === playerObj.playerId?._id;

    // 4. Extract scores
    const playerScore = playerObj.score;
    const playerAttempted = playerObj.attemptedQuestions;
    const playerTimeTaken = playerObj.timeTaken;
    const opponentScore = opponentObj.score;
    const opponentAttempted = opponentObj.attemptedQuestions;
    const opponentTimeTaken = opponentObj.timeTaken;

    // 5. Headline text
    const headlineText = isTie ? t.tie : isWinner ? t.win : t.lose;

    // 6. Background gradient
    const backgroundGradient = isTie
      ? "linear-gradient(135deg, #FFC107CC, #FF9800CC)"
      : isWinner
      ? "linear-gradient(135deg, #4CAF50CC, #388E3CCC)"
      : "linear-gradient(135deg, #F44336CC, #E53935CC)";

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
          overflow: "hidden",
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
            <Typography
              variant="h3"
              fontWeight={700}
              sx={{
                mb: 1,
                textShadow: "0 0 15px rgba(255,255,255,0.8)",
                fontSize: (() => {
                  const playerNameLength =
                    playerObj?.playerId?.name?.length || 0;
                  if (playerNameLength <= 20) {
                    return { xs: "1.5rem", sm: "2rem", md: "2.5rem" };
                  } else if (playerNameLength <= 35) {
                    return { xs: "1.25rem", sm: "1.75rem", md: "2rem" };
                  } else {
                    return { xs: "1rem", sm: "1.5rem", md: "1.75rem" };
                  }
                })(),
                lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 },
                wordBreak: "break-word",
                overflowWrap: "break-word",
              }}
            >
              {playerObj?.playerId?.name}
            </Typography>

            {/* Headline */}
            <Typography
              variant="h1"
              sx={{
                my: 2,
                textShadow: "0 0 15px rgba(255,255,255,0.8)",
                fontSize: (() => {
                  const headlineLength = headlineText?.length || 0;
                  if (headlineLength <= 15) {
                    return { xs: "2rem", sm: "3rem", md: "4rem" };
                  } else if (headlineLength <= 25) {
                    return { xs: "1.5rem", sm: "2.5rem", md: "3rem" };
                  } else {
                    return { xs: "1.25rem", sm: "2rem", md: "2.5rem" };
                  }
                })(),
                lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 },
                wordBreak: "break-word",
                overflowWrap: "break-word",
                fontWeight: "bold",
              }}
            >
              {headlineText}
            </Typography>

            {/* Score */}
            <Typography
              variant="h2"
              sx={{
                fontWeight: "bold",
                fontSize: { xs: "4rem", sm: "6rem" },
                textShadow: "0 0 20px rgba(255,255,255,0.6)",
              }}
            >
              {playerScore}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                mb: 1,
                fontSize: (() => {
                  const statsText = `${t.attempted}: ${playerAttempted} | ${t.timeTaken}: ${playerTimeTaken}`;
                  const statsLength = statsText?.length || 0;
                  if (statsLength <= 40) {
                    return { xs: "0.875rem", sm: "1rem", md: "1.125rem" };
                  } else if (statsLength <= 60) {
                    return { xs: "0.75rem", sm: "0.875rem", md: "1rem" };
                  } else {
                    return { xs: "0.625rem", sm: "0.75rem", md: "0.875rem" };
                  }
                })(),
                lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 },
                wordBreak: "break-word",
                overflowWrap: "break-word",
              }}
            >
              {t.attempted}: {playerAttempted}{" "}
              <Box component="span" sx={{ mx: 1, color: "text.secondary" }}>
                |
              </Box>{" "}
              {t.timeTaken}: {playerTimeTaken}
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
              <Typography
                variant="h6"
                sx={{
                  mb: 1,
                  fontSize: (() => {
                    const opponentLabelLength = t.opponent?.length || 0;
                    if (opponentLabelLength <= 10) {
                      return { xs: "1rem", sm: "1.25rem", md: "1.5rem" };
                    } else if (opponentLabelLength <= 20) {
                      return { xs: "0.875rem", sm: "1.125rem", md: "1.25rem" };
                    } else {
                      return { xs: "0.75rem", sm: "1rem", md: "1.125rem" };
                    }
                  })(),
                  lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 },
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                {t.opponent}
              </Typography>
              <Typography
                variant="h4"
                fontWeight="bold"
                sx={{
                  mb: 1,
                  fontSize: (() => {
                    const opponentNameLength =
                      opponentObj.playerId.name?.length || 0;
                    if (opponentNameLength <= 20) {
                      return { xs: "1.25rem", sm: "1.75rem", md: "2rem" };
                    } else if (opponentNameLength <= 35) {
                      return { xs: "1rem", sm: "1.5rem", md: "1.75rem" };
                    } else {
                      return { xs: "0.875rem", sm: "1.25rem", md: "1.5rem" };
                    }
                  })(),
                  lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 },
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                {opponentObj.playerId.name}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  mb: 0.5,
                  fontSize: (() => {
                    const scoreText = `${t.score}: ${opponentScore}`;
                    const scoreLength = scoreText?.length || 0;
                    if (scoreLength <= 25) {
                      return { xs: "0.875rem", sm: "1rem", md: "1.125rem" };
                    } else if (scoreLength <= 40) {
                      return { xs: "0.75rem", sm: "0.875rem", md: "1rem" };
                    } else {
                      return { xs: "0.625rem", sm: "0.75rem", md: "0.875rem" };
                    }
                  })(),
                  lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 },
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                {t.score}: {opponentScore}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  mb: 1,
                  fontSize: (() => {
                    const statsText = `${t.attempted}: ${opponentAttempted} | ${t.timeTaken}: ${opponentTimeTaken}`;
                    const statsLength = statsText?.length || 0;
                    if (statsLength <= 40) {
                      return { xs: "0.875rem", sm: "1rem", md: "1.125rem" };
                    } else if (statsLength <= 60) {
                      return { xs: "0.75rem", sm: "0.875rem", md: "1rem" };
                    } else {
                      return { xs: "0.625rem", sm: "0.75rem", md: "0.875rem" };
                    }
                  })(),
                  lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 },
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                {t.attempted}: {opponentAttempted}{" "}
                <Box component="span" sx={{ mx: 1, color: "text.secondary" }}>
                  |
                </Box>{" "}
                {t.timeTaken}: {opponentTimeTaken}
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
              {t.playAgain}
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
