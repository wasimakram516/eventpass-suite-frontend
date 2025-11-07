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
  IconButton,
} from "@mui/material";
import Confetti from "react-confetti";
import { useGame } from "@/contexts/GameContext";
import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  submitPvPResult,
  activateGameSession,
  abandonGameSession,
  endGameSession,
} from "@/services/eventduel/gameSessionService";
import LanguageSelector from "@/components/LanguageSelector";
import useI18nLayout from "@/hooks/useI18nLayout";
import { translateTexts } from "@/services/translationService";
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
    autoCloseNotice:
      "This session will auto-close if players don't join within",
    seconds: "seconds",

    waitingTeamsTitle: "Waiting for all teams...",
    waitingTeamsMessage: "Waiting for teams to fill their players...",
    allTeamsJoined: "All teams have joined!",
    anyTeamCanStart: "Any team can start the game now.",
    anyPlayerCanStart: "Any player can start the game now.",
    teamCountdownTitle: "Teams, get ready!",
    teamCountdownMessage: "The game will begin in a few seconds...",
    teamWin: "YOUR TEAM WINS!",
    teamLose: "YOUR TEAM LOSES!",
    opponentTeams: "Opponent Teams",
    totalScore: "Total Score",
    averageTime: "Average Time",
    averageAttempted: "Average Attempted",
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
    autoCloseNotice: "سيتم إغلاق هذه الجلسة تلقائياً إذا لم ينضم اللاعبون خلال",
    seconds: "ثوانٍ",

    waitingTeamsTitle: "بانتظار جميع الفرق...",
    waitingTeamsMessage: "بانتظار الفرق لملء لاعبيها...",
    allTeamsJoined: "انضمت جميع الفرق!",
    anyTeamCanStart: "يمكن لأي فريق بدء اللعبة الآن.",
    anyPlayerCanStart: "يمكن لأي لاعب بدء اللعبة الآن.",
    teamCountdownTitle: "استعدوا أيها الفرق!",
    teamCountdownMessage: "ستبدأ اللعبة خلال لحظات...",
    teamWin: "فريقك فاز!",
    teamLose: "فريقك خسر!",
    opponentTeams: "الفرق المنافسة",
    totalScore: "المجموع الكلي",
    averageTime: "المتوسط الزمني",
    averageAttempted: "المعدل المتوسط للأسئلة المجابة",
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
    requestAllSessions,
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
  const timerIvRef = useRef(null);
  const endOnceRef = useRef(false);
  const [localDelay, setLocalDelay] = useState(0);
  const [localTime, setLocalTime] = useState(0);
  const [hasFinishedEarly, setHasFinishedEarly] = useState(false);
  const [starting, setStarting] = useState(false);
  const [abandonRemaining, setAbandonRemaining] = useState(60);

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

    const textsToTranslate = [];

    if (questionObj.question) textsToTranslate.push(questionObj.question);
    if (questionObj.answers) textsToTranslate.push(...questionObj.answers);
    if (questionObj.hint) textsToTranslate.push(questionObj.hint);

    if (!textsToTranslate.length) {
      setTranslatedContent({
        question: questionObj.question,
        answers: questionObj.answers,
        hint: questionObj.hint,
        uiLabels: {
          questionLabel: t.question,
          ofLabel: t.of,
          countdownLabel: t.countdown,
        },
      });
      return;
    }

    try {
      const results = await translateTexts(textsToTranslate, language);

      let index = 0;
      const translatedQuestion = results[index++] || questionObj.question;
      const translatedAnswers = questionObj.answers.map(
        () =>
          results[index++] ||
          questionObj.answers[index - 1 - questionObj.answers.length]
      );
      const translatedHint = questionObj.hint
        ? results[index++] || questionObj.hint
        : questionObj.hint;

      setTranslatedContent({
        question: translatedQuestion,
        answers: translatedAnswers,
        hint: translatedHint,
        uiLabels: {
          questionLabel: t.question,
          ofLabel: t.of,
          countdownLabel: t.countdown,
        },
      });
    } catch (err) {
      console.error("Translation error:", err);
      setTranslatedContent({
        question: questionObj.question,
        answers: questionObj.answers,
        hint: questionObj.hint,
        uiLabels: {
          questionLabel: t.question,
          ofLabel: t.of,
          countdownLabel: t.countdown,
        },
      });
    }
  };

  // ─── 8. EFFECTS ─────────────────────────────────────────────────────────

  // 8.0 Clear forced submit flag on new session
  useEffect(() => {
    if (pendingSession && typeof window !== "undefined") {
      sessionStorage.removeItem("forceSubmitTriggered");
    }
  }, [pendingSession?._id]);

  // 8.1 Countdown + game timer
  useEffect(() => {
    // run ONLY while active and not already finalized
    if (!activeSession || activeSession.status !== "active") return;
    if (hasSubmittedRef.current || endOnceRef.current) return;

    let countdown = activeSession.gameId.countdownTimer || 5;
    const sessionDuration = activeSession.gameId.gameSessionTimer || 60;
    let duration = sessionDuration;
    let inCountdown = true;

    setLocalDelay(countdown);
    setLocalTime(0);

    // clear any previous interval
    if (timerIvRef.current) clearInterval(timerIvRef.current);

    timerIvRef.current = setInterval(() => {
      if (inCountdown) {
        countdown--;
        if (countdown <= 0) {
          inCountdown = false;
          setLocalDelay(0);
          setLocalTime(duration);
        } else {
          setLocalDelay(countdown);
        }
      } else {
        duration--;
        if (duration <= 0) {
          setLocalTime(0);
          clearInterval(timerIvRef.current);
          timerIvRef.current = null;

          // one-shot finalize & end
          if (!endOnceRef.current) {
            endOnceRef.current = true;
            submitFinalResult(sessionDuration);
            if (activeSession?._id) {
              endGameSession(activeSession._id).catch(() => {});
              requestAllSessions?.(game?.slug);
            }
          }
        } else {
          setLocalTime(duration);
        }
      }
    }, 1000);

    return () => {
      if (timerIvRef.current) {
        clearInterval(timerIvRef.current);
        timerIvRef.current = null;
      }
    };
  }, [activeSession?._id, activeSession?.status]);

  // stop any running timer as soon as server marks session completed
  useEffect(() => {
    if (activeSession?.status === "completed" && timerIvRef.current) {
      clearInterval(timerIvRef.current);
      timerIvRef.current = null;
    }
  }, [activeSession?.status]);

  // 8.2 Translate on question change
  useEffect(() => {
    translateQuestion(currentQuestion);
  }, [currentQuestion, language]);

  // 8.3 Abandon pending session if not started in time
  useEffect(() => {
    if (!pendingSession) return;

    const isTeamMode = pendingSession?.gameId?.isTeamMode;
    const hasP1 = pendingSession.players?.some(
      (p) => p.playerType === "p1" && p.playerId
    );
    const hasP2 = pendingSession.players?.some(
      (p) => p.playerType === "p2" && p.playerId
    );
    const bothJoined = hasP1 && hasP2;

    const allTeamsReady = isTeamMode
      ? pendingSession.teams?.every(
          (t) =>
            (t.players?.length || 0) >=
            (pendingSession.gameId?.playersPerTeam || 0)
        )
      : false;

    const sessionReady = isTeamMode ? allTeamsReady : bothJoined;

    // timer duration: 3 min for team mode, 1 min for PvP
    const initialTimer = isTeamMode ? 180 : 60;
    setAbandonRemaining(initialTimer);

    if (sessionReady) return;

    let cancelled = false;
    const interval = setInterval(async () => {
      setAbandonRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          if (!cancelled) {
            abandonGameSession(pendingSession._id)
              .then(() => requestAllSessions())
              .catch(() => {
                /* silent fail; UI resyncs via socket */
              });
          }
        }
        return Math.max(next, 0);
      });
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pendingSession?._id, pendingSession?.players, pendingSession?.teams]);

  // 8.4 If Host ends the game session, submit player's stats
  useEffect(() => {
    if (!activeSession) return;

    const forced =
      typeof window !== "undefined" &&
      sessionStorage.getItem("forceSubmitTriggered") === "true";
    if (forced && !hasSubmittedRef.current) {
      hasSubmittedRef.current = true;
      submitProgress();
      sessionStorage.removeItem("forceSubmitTriggered");
    }
  }, [activeSession?._id]);

  // ─── 9. PROGRESS & FINAL SUBMISSION ────────────────────────────────────
  // --- SUBMIT PROGRESS (Team + PvP compatible) ---
  const submitProgress = async (timeOverride = null) => {
    const { playerId, sessionId, teamId } = getPlayerSessionData();
    if (!playerId || !sessionId) return;

    const sessionDuration =
      activeSession?.gameId?.gameSessionTimer ?? game?.gameSessionTimer ?? 60;

    let timeTaken =
      timeOverride !== null ? timeOverride : sessionDuration - localTime;

    // clamp & sanitize
    if (!Number.isFinite(timeTaken)) timeTaken = 0;
    if (timeTaken < 0) timeTaken = 0;
    if (timeTaken > sessionDuration) timeTaken = sessionDuration;

    await submitPvPResult({
      sessionId,
      playerId,
      payload: {
        teamId: teamId || null,
        score: scoreRef.current,
        attemptedQuestions: attemptedRef.current,
        timeTaken,
      },
    });
  };

  // --- SUBMIT FINAL RESULT (unchanged flow) ---
  const submitFinalResult = async (timeOverride = null) => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    await submitProgress(timeOverride);
    clearPlayerSessionData({ clearIds: true, clearFlag: true });
  };

  // ─── 10. HANDLERS ─────────────────────────────────────────────────
  const handlePlayerActivate = async () => {
    if (!pendingSession || starting) return;

    // Determine if it's team mode
    const isTeamMode = pendingSession?.teams && pendingSession.teams.length > 0;

    let canStart = false;

    if (isTeamMode) {
      // For team mode: each team must have at least one player joined
      canStart = pendingSession.teams.every(
        (team) => team.players && team.players.some((p) => p.playerId)
      );
    } else {
      // For PvP: both player slots must be filled
      const hasP1 = pendingSession.players?.some(
        (p) => p.playerType === "p1" && p.playerId
      );
      const hasP2 = pendingSession.players?.some(
        (p) => p.playerType === "p2" && p.playerId
      );
      canStart = hasP1 && hasP2;
    }

    if (!canStart) return;

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

  // --- FETCH PLAYER + TEAM SESSION DATA ---
  const getPlayerSessionData = () => {
    if (typeof window === "undefined") return null;

    const playerId = sessionStorage.getItem("playerId");
    const sessionId = sessionStorage.getItem("sessionId");
    const teamId = sessionStorage.getItem("selectedTeamId");
    const teamName = sessionStorage.getItem("selectedTeamName");

    return {
      playerId,
      sessionId,
      ...(teamId ? { teamId, teamName } : {}),
    };
  };

  // --- CLEAR PLAYER + TEAM SESSION DATA ---
  const clearPlayerSessionData = (
    opts = { clearIds: true, clearFlag: true }
  ) => {
    if (typeof window === "undefined") return;

    if (opts.clearIds) {
      sessionStorage.removeItem("playerId");
      sessionStorage.removeItem("sessionId");
    }

    if (opts.clearFlag) {
      sessionStorage.removeItem("forceSubmitTriggered");
    }
  };

  // ─── 11. RENDER BRANCHES ────────────────────────────────────────────────

  /* SESSION PENDING SCREEN (players or teams can start) */
  if (pendingSession) {
    const isTeamMode = pendingSession?.gameId?.isTeamMode;

    // For PvP:
    const hasP1 = pendingSession.players?.some(
      (p) => p.playerType === "p1" && p.playerId
    );
    const hasP2 = pendingSession.players?.some(
      (p) => p.playerType === "p2" && p.playerId
    );
    const bothPlayersJoined = hasP1 && hasP2;

    // For Team Mode:
    const allTeamsReady = isTeamMode
      ? pendingSession.teams?.every(
          (t) =>
            (t.players?.length || 0) >=
            (pendingSession.gameId?.playersPerTeam || 0)
        )
      : false;

    const sessionReady = isTeamMode ? allTeamsReady : bothPlayersJoined;

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

          {!sessionReady ? (
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
                    const L = (
                      isTeamMode
                        ? t.waitingTeamsTitle
                        : t.waitingTitle || t.pendingTitle
                    )?.length;
                    if (L <= 25) return { xs: "1.5rem", sm: "2.5rem" };
                    if (L <= 40) return { xs: "1.25rem", sm: "2rem" };
                    return { xs: "1rem", sm: "1.75rem" };
                  })(),
                  lineHeight: { xs: 1.2, sm: 1.3 },
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                {isTeamMode
                  ? t.waitingTeamsTitle
                  : t.waitingTitle || t.pendingTitle}
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  mt: 2,
                  opacity: 0.6,
                  fontStyle: "italic",
                  animation: "blink 1.5s infinite",
                  fontSize: (() => {
                    const L = (
                      isTeamMode
                        ? t.waitingTeamsMessage
                        : t.waitingForBoth || t.pendingMessage
                    )?.length;
                    if (L <= 30) return { xs: "0.9rem", sm: "1.1rem" };
                    if (L <= 50) return { xs: "0.8rem", sm: "1rem" };
                    return { xs: "0.7rem", sm: "0.9rem" };
                  })(),
                }}
              >
                {isTeamMode
                  ? t.waitingTeamsMessage
                  : t.waitingForBoth || t.pendingMessage}
              </Typography>

              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {t.autoCloseNotice} <b>{abandonRemaining}</b> {t.seconds}.
                </Typography>
              </Box>
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
                    const L = (isTeamMode ? t.allTeamsJoined : t.bothJoined)
                      ?.length;
                    if (L <= 20) return { xs: "1.5rem", sm: "2.5rem" };
                    if (L <= 35) return { xs: "1.25rem", sm: "2rem" };
                    return { xs: "1rem", sm: "1.75rem" };
                  })(),
                }}
              >
                {isTeamMode ? t.allTeamsJoined : t.bothJoined}
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
                {isTeamMode ? t.anyTeamCanStart : t.anyPlayerCanStart}
              </Typography>
            </>
          )}
        </Box>
      </>
    );
  }

  // --- PRE-GAME COUNTDOWN (PvP + Team mode) ---
  if (localDelay > 0) {
    const isTeamMode = game?.isTeamMode;

    return (
      <>
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
          {/* Title */}
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
                const title = isTeamMode
                  ? t.teamCountdownTitle
                  : t.waitingTitle;
                const titleLength = title?.length || 0;
                if (titleLength <= 15) return { xs: "1.5rem", sm: "3rem" };
                if (titleLength <= 25) return { xs: "1.25rem", sm: "2.5rem" };
                return { xs: "1rem", sm: "2rem" };
              })(),
              lineHeight: { xs: 1.2, sm: 1.3 },
              wordBreak: "break-word",
              overflowWrap: "break-word",
            }}
          >
            {isTeamMode ? t.teamCountdownTitle : t.waitingTitle}
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
                const msg = isTeamMode
                  ? t.teamCountdownMessage
                  : t.waitingMessage;
                const L = msg?.length || 0;
                if (L <= 25) return { xs: "0.9rem", sm: "1.2rem" };
                if (L <= 40) return { xs: "0.8rem", sm: "1.1rem" };
                return { xs: "0.7rem", sm: "1rem" };
              })(),
              lineHeight: { xs: 1.2, sm: 1.3 },
              wordBreak: "break-word",
              overflowWrap: "break-word",
            }}
          >
            {isTeamMode ? t.teamCountdownMessage : t.waitingMessage}
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
                width: { xs: "95%", md: "85%", lg: "75%" },
                maxWidth: "1200px",
                p: { xs: 4, md: 3 },
                textAlign: "center",
                backdropFilter: "blur(6px)",
                backgroundColor: "rgba(255,255,255,0.5)",
                borderRadius: 4,
                my: { xs: 2, md: 3 },
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

              {currentQuestion?.questionImage && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    mt: 2,
                    mb: 2,
                  }}
                >
                  <img
                    src={currentQuestion.questionImage}
                    alt="Question"
                    style={{
                      maxWidth: "clamp(200px, 50vw, 400px)",
                      maxHeight: "clamp(150px, 30vh, 300px)",
                      objectFit: "contain",
                      borderRadius: "8px",
                    }}
                  />
                </Box>
              )}

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
                  overflow: "hidden",
                  boxSizing: "border-box",
                  gap: "8px",
                }}
              >
                {currentQuestion &&
                  translatedContent?.answers?.map((opt, i) => {
                    const isSelected = selected === i;
                    const isCorrect = i === currentQuestion.correctAnswerIndex;
                    const { bg, borderColor, borderWidth } = (() => {
                      if (isSelected && isCorrect)
                        return {
                          bg: "#c8e6c9",
                          borderColor: "#81c784",
                          borderWidth: 3,
                        };
                      if (isSelected && !isCorrect)
                        return {
                          bg: "#ffcdd2",
                          borderColor: "#e57373",
                          borderWidth: 3,
                        };
                      return {
                        bg: "#f5f5f5",
                        borderColor: "#e0e0e0",
                        borderWidth: 2,
                      };
                    })();
                    return (
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        key={i}
                        sx={{
                          display: "flex",
                          minHeight: "150px",
                          maxWidth: "100%",
                          width: "100%",
                          gridColumn: i === 4 ? "1 / -1" : "auto",
                          overflow: "hidden",
                          boxSizing: "border-box",
                          flexShrink: 0,
                        }}
                      >
                        <Box
                          onClick={() => handleSelect(i)}
                          sx={{
                            cursor: "pointer",
                            backgroundColor: bg,
                            border: `${borderWidth}px solid ${borderColor}`,
                            borderRadius: 2,
                            fontWeight: "bold",
                            textTransform: "none",
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                            minHeight: { xs: 100, sm: 120, md: 150 },
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: currentQuestion?.answerImages?.[i]
                              ? "space-between"
                              : "center",
                            alignItems: "center",
                            p: { xs: 1, sm: 1.5, md: 2 },
                            overflow: "hidden",
                            boxSizing: "border-box",
                            flexShrink: 0,
                            userSelect: "none",
                            transition: "border 0.2s ease",
                            "&:hover": { backgroundColor: bg, borderColor },
                            "&:active": { backgroundColor: bg, borderColor },
                            fontSize: (() => {
                              const len = opt.length;
                              if (len <= 10)
                                return {
                                  xs: "0.8rem",
                                  sm: "0.9rem",
                                  md: "1.1rem",
                                };
                              if (len <= 30)
                                return {
                                  xs: "0.7rem",
                                  sm: "0.8rem",
                                  md: "1rem",
                                };
                              if (len <= 60)
                                return {
                                  xs: "0.6rem",
                                  sm: "0.7rem",
                                  md: "0.8rem",
                                };
                              return {
                                xs: "0.5rem",
                                sm: "0.6rem",
                                md: "0.7rem",
                              };
                            })(),
                          }}
                        >
                          <Box
                            sx={{
                              width: "100%",
                              maxWidth: "100%",
                              display: "flex",
                              alignItems: currentQuestion?.answerImages?.[i]
                                ? "flex-start"
                                : "center",
                              justifyContent: "center",
                              textAlign: "center",
                              px: 1,
                              wordBreak: "break-word",
                              overflowWrap: "break-word",
                              boxSizing: "border-box",
                              flexShrink: 0,
                              minWidth: 0,
                              hyphens: "auto",
                            }}
                          >
                            {opt}
                          </Box>

                          {currentQuestion?.answerImages?.[i] && (
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "flex-end",
                                mt: 1,
                              }}
                            >
                              <img
                                src={currentQuestion.answerImages[i]}
                                alt={`Answer ${i + 1}`}
                                style={{
                                  maxWidth: "clamp(80px, 30vw, 150px)",
                                  maxHeight: "clamp(60px, 20vh, 120px)",
                                  objectFit: "contain",
                                  borderRadius: 4,
                                }}
                              />
                            </Box>
                          )}
                        </Box>
                      </Grid>
                    );
                  })}
              </Grid>
              {showHint && translatedContent?.hint && (
                <Typography
                  variant="body2"
                  color="error"
                  sx={{
                    mt: 3,
                    fontStyle: "italic",
                    fontSize: (() => {
                      const hintText = `${t.hint}: ${translatedContent.hint}`;
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
                  {t.hint}: {translatedContent.hint}
                </Typography>
              )}
            </Paper>
          </Box>
        </Box>
      </Box>
    );
  }

  // --- GAME ENDED: PvP + TEAM MODE ---
  if ((selectedPlayer || game?.isTeamMode) && recentlyCompleted) {
    const currentSession = recentlyCompleted;
    const isTeamMode = game?.isTeamMode;

    // ============ TEAM MODE ============
    if (isTeamMode) {
      const { teamId, teamName } = getPlayerSessionData();

      const playerTeam = currentSession.teams?.find(
        (t) => t.teamId?._id === teamId
      );
      const opponentTeams =
        currentSession.teams?.filter((t) => t.teamId?._id !== teamId) || [];

      const isTie = !currentSession.winnerTeamId;
      const isWinner = !isTie && currentSession.winnerTeamId?._id === teamId;

      const headlineText = isTie ? t.tie : isWinner ? t.teamWin : t.teamLose;

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
                width: { xs: "85%", sm: "60%" },
                p: 4,
                borderRadius: 3,
                background: backgroundGradient,
                color: "#fff",
                textAlign: "center",
                boxShadow: "0 0 30px rgba(0,0,0,0.6)",
                backdropFilter: "blur(5px)",
              }}
            >
              {/* Team Name */}
              <Typography
                variant="h3"
                fontWeight={700}
                sx={{
                  mb: 1,
                  textShadow: "0 0 15px rgba(255,255,255,0.8)",
                  fontSize: (() => {
                    const nameLen = teamName?.length || 0;
                    if (nameLen <= 20)
                      return { xs: "1.5rem", sm: "2rem", md: "2.5rem" };
                    if (nameLen <= 35)
                      return { xs: "1.25rem", sm: "1.75rem", md: "2rem" };
                    return { xs: "1rem", sm: "1.5rem", md: "1.75rem" };
                  })(),
                }}
              >
                {teamName}
              </Typography>

              {/* Headline */}
              <Typography
                variant="h1"
                sx={{
                  my: 3,
                  fontWeight: "bold",
                  textShadow: "0 0 15px rgba(255,255,255,0.8)",
                  fontSize: { xs: "2.5rem", sm: "3.5rem", md: "4rem" },
                }}
              >
                {headlineText}
              </Typography>

              {/* Team Stats */}
              <Typography
                variant="h3"
                sx={{
                  my: 2,
                  textShadow: "0 0 10px rgba(255,255,255,0.6)",
                }}
              >
                {t.totalScore}: {playerTeam?.totalScore ?? 0}
              </Typography>

              <Typography variant="body1" sx={{ mb: 3 }}>
                {t.averageTime}: {playerTeam?.avgTimeTaken ?? 0}s{" "}
                <Box component="span" sx={{ mx: 1, color: "text.secondary" }}>
                  |
                </Box>{" "}
                {t.averageAttempted}: {playerTeam?.avgAttemptedQuestions ?? 0}
              </Typography>

              {/* Opponent Teams */}
              {opponentTeams.length > 0 && (
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
                    {t.opponentTeams}
                  </Typography>
                  {opponentTeams.map((opp, idx) => (
                    <Box key={idx} sx={{ mb: 1 }}>
                      <Typography variant="h5" fontWeight="bold">
                        {opp.teamId?.name}
                      </Typography>
                      <Typography variant="body2">
                        {t.totalScore}: {opp.totalScore ?? 0}
                      </Typography>
                      <Typography variant="body2">
                        {t.averageTime}: {opp.avgTimeTaken ?? 0}s
                      </Typography>
                      <Typography variant="body2">
                        {t.averageAttempted}: {opp.avgAttemptedQuestions ?? 0}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}

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

    // ============ PVP MODE ============
    const playerObj = currentSession.players.find(
      (p) => p.playerType === selectedPlayer
    );
    const opponentObj = currentSession.players.find(
      (p) => p.playerType !== selectedPlayer
    );

    const isTie = currentSession.winner === null;
    const isWinner =
      !isTie && currentSession.winner?._id === playerObj.playerId?._id;

    const playerScore = playerObj.score;
    const playerAttempted = playerObj.attemptedQuestions;
    const playerTimeTaken = playerObj.timeTaken;
    const opponentScore = opponentObj.score;
    const opponentAttempted = opponentObj.attemptedQuestions;
    const opponentTimeTaken = opponentObj.timeTaken;

    const headlineText = isTie ? t.tie : isWinner ? t.win : t.lose;
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

      <CircularProgress />
    </Box>
  );
}
