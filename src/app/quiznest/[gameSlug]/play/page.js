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
import { submitResult } from "@/services/quiznest/playerService";
import LanguageSelector from "@/components/LanguageSelector";
import useI18nLayout from "@/hooks/useI18nLayout";
import { translateText } from "@/services/translationService";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";

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
  },
};
export default function PlayPage() {
  const { game, loading } = useGame();
  const router = useRouter();
  const { t, dir, align, language } = useI18nLayout(gameTranslations);
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
  const currentQuestion =
    game?.questions?.[randomizedIndexes[questionIndex] ?? questionIndex];

  const correctSound =
    typeof Audio !== "undefined" ? new Audio("/correct.wav") : null;
  const wrongSound =
    typeof Audio !== "undefined" ? new Audio("/wrong.wav") : null;
  const celebrateSound =
    typeof Audio !== "undefined" ? new Audio("/celebrate.mp3") : null;

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
      questionObj.hint ? translateText(questionObj.hint, targetLang) : null,
    ]);

    if (
      !question.error ||
      (!answers.some((a) => a.error) && (!hint || !hint.error))
    ) {
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
    } else {
      console.error("Translation error:", error);
      setTranslatedContent({
        question: questionObj.question,
        answers: questionObj.answers,
        hint: questionObj.hint,
        uiLabels: {
          questionLabel: "Question",
          ofLabel: "of",
          countdownLabel: "sec",
        },
      });
    }
  };

  useEffect(() => {
    if (currentQuestion) {
      translateQuestion(currentQuestion);
    }
  }, [currentQuestion, language]);

  // Randomize question order when game loads
  useEffect(() => {
    if (game?.questions) {
      // Create array of indexes and shuffle them
      const indexes = Array.from(
        { length: game.questions.length },
        (_, i) => i
      );
      const shuffled = [...indexes].sort(() => Math.random() - 0.5);

      setRandomizedIndexes(shuffled);
    }
  }, [game]);

  // Load Player Info from LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem("playerInfo");
    if (stored) setPlayerInfo(JSON.parse(stored));
  }, []);

  //Countdown Before Starting Game
  useEffect(() => {
    // ⛔ Prevent starting countdown if no questions
    if (!game?.questions || game.questions.length === 0) return;

    if (!loading && delay > 0) {
      const countdown = setInterval(() => {
        setDelay((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(countdown);
    } else if (delay === 0 && !started) {
      setStarted(true);
      startSessionTimer();
    }
  }, [delay, loading, game?.questions]);

  //Start Session Timer (timer of the quiz (60sec))
  const startSessionTimer = () => {
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        timeLeftRef.current = newTime;

        if (newTime <= 0) {
          clearInterval(intervalRef.current);
          endGame();
          return 0;
        }
        return newTime;
      });
    }, 1000);
  };

  //Submit Results and End Game
  const endGame = async () => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    celebrateSound?.play();
    setEnded(true);

    const playerId = localStorage.getItem("playerId");
    const sessionId = localStorage.getItem("sessionId");

    await submitResult(sessionId, playerId, {
      score: scoreRef.current,
      attemptedQuestions: attemptedRef.current,
      timeTaken: game.gameSessionTimer - timeLeftRef.current,
    });
  };

  //Triggered when user clicks on an answer.
  const handleSelect = (i) => {
    if (selected !== null) return;

    const isCorrect = i === currentQuestion.correctAnswerIndex;
    setSelected(i);
    setAttempted((prev) => {
      const updated = prev + 1;
      attemptedRef.current = updated;
      return updated;
    });

    if (isCorrect) {
      correctSound?.play();
      setScore((prev) => {
        const updated = prev + 1;
        scoreRef.current = updated;
        return updated;
      });
      setTimeout(() => goNext(), 1000);
    } else {
      wrongSound?.play();
      if (currentQuestion.hint) {
        setShowHint(true);
        setTimeout(() => {
          setShowHint(false);
          setSelected(null);
        }, 2000);
      } else {
        setTimeout(() => goNext(), 1000);
      }
    }
  };

  //Navigating to Next Question
  const goNext = () => {
    if (questionIndex + 1 >= randomizedIndexes.length) {
      clearInterval(intervalRef.current);
      endGame();
    } else {
      setQuestionIndex((prev) => prev + 1);
      setSelected(null);
      setShowHint(false);
    }
  };

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

  if (!game?.questions || game.questions.length === 0) {
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
          <Paper
            elevation={6}
            sx={{
              maxWidth: 500,
              p: 4,
              textAlign: align,
              backdropFilter: "blur(6px)",
              backgroundColor: "rgba(255,255,255,0.6)",
              borderRadius: 4,
            }}
          >
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

  if (delay > 0) {
    return (
      <Box
        dir={dir}
        sx={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.9), rgba(0,0,0,0.6))",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
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
          {delay}
        </Typography>
      </Box>
    );
  }

  if (ended) {
    return (
      <Box sx={{ position: "relative" }}>
        <LanguageSelector top={20} right={20} />
        <Box
          sx={{
            height: "100vh",
            width: "100vw",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(135deg, rgba(0,0,0,0.8), rgba(50,50,50,0.8))",
            p: 2,
            textAlign: align,
          }}
          dir={dir}
        >
          <Fade in timeout={800}>
            <Paper
              elevation={8}
              sx={{
                width: { xs: "80%", sm: "50%" },
                p: 4,
                borderRadius: 3,
                background:
                  "linear-gradient(135deg, rgba(76,175,80,0.8), rgba(56,142,60,0.8))",
                color: "#fff",
                boxShadow: "0 0 30px rgba(0,0,0,0.6)",
                backdropFilter: "blur(5px)",
                marginTop: "15vh",
              }}
            >
              <Typography variant="h3" fontWeight="bold" mb={2}>
                {t.thankYou} {playerInfo.name}!
              </Typography>
              <Typography variant="h2" mb={1}>
                {t.score}: {score}
              </Typography>
              <Typography variant="h6" mb={3}>
                {t.attempted}: {attempted}
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                sx={{ fontSize: "1.5rem" }}
                onClick={() => router.push(`/quiznest/${game.slug}`)}
              >
                {t.playAgain}
              </Button>
            </Paper>
          </Fade>
        </Box>
      </Box>
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
            {timeLeft}
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
            {translatedContent.uiLabels?.countdownLabel || "sec"}
          </Typography>
        </Box>

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
              maxWidth: "100%",
              p: 4,
              textAlign: align,
              backdropFilter: "blur(6px)",
              backgroundColor: "rgba(255,255,255,0.5)",
              borderRadius: 4,
              marginTop: "10vh",
              overflow: "hidden",
              wordBreak: "break-word",
              boxSizing: "border-box",
            }}
          >
            <Typography
              variant="h5"
              gutterBottom
              fontWeight="bold"
              sx={{
                fontSize: { xs: "1rem", sm: "1.25rem", md: "1.5rem" },
                lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 },
                wordBreak: "break-word",
              }}
            >
              {translatedContent.uiLabels?.questionLabel || "Question"}{" "}
              {questionIndex + 1} {translatedContent.uiLabels?.ofLabel || "of"}{" "}
              {randomizedIndexes.length || game.questions.length}
            </Typography>
            <Typography
              sx={{
                fontSize: (() => {
                  const questionText =
                    translatedContent.question ||
                    currentQuestion?.question ||
                    "";
                  const textLength = questionText.length;
                  if (textLength <= 50) {
                    return { xs: "0.9rem", sm: "1.1rem", md: "1.4rem" };
                  } else if (textLength <= 100) {
                    return { xs: "0.8rem", sm: "1rem", md: "1.2rem" };
                  } else if (textLength <= 200) {
                    return { xs: "0.7rem", sm: "0.9rem", md: "1rem" };
                  } else {
                    return { xs: "0.6rem", sm: "0.8rem", md: "0.9rem" };
                  }
                })(),
                lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 },
                wordBreak: "break-word",
                overflowWrap: "break-word",
              }}
              gutterBottom
            >
              {translatedContent.question || currentQuestion?.question}
            </Typography>

            <Grid
              container
              spacing={2}
              justifyContent="center"
              alignItems="stretch"
              sx={{
                mt: 2,
                maxWidth: "100%",
                width: "100%",
                mx: "auto",
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gridAutoRows: "1fr",
                overflow: "hidden",
                boxSizing: "border-box",
                gap: "8px",
              }}
            >
              {Array.isArray(translatedContent.answers) &&
                translatedContent.answers.map((opt, i) => {
                  const isSelected = selected === i;
                  const isCorrect = i === currentQuestion.correctAnswerIndex;
                  const bg = isSelected
                    ? isCorrect
                      ? "#c8e6c9"
                      : "#ffcdd2"
                    : "#f5f5f5";

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
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => handleSelect(i)}
                        sx={{
                          backgroundColor: bg,
                          fontWeight: "bold",
                          fontSize: (() => {
                            const textLength = opt.length;
                            if (textLength <= 10) {
                              return {
                                xs: "0.8rem",
                                sm: "0.9rem",
                                md: "1.1rem",
                              };
                            } else if (textLength <= 30) {
                              return {
                                xs: "0.7rem",
                                sm: "0.8rem",
                                md: "1rem",
                              };
                            } else if (textLength <= 60) {
                              return {
                                xs: "0.6rem",
                                sm: "0.7rem",
                                md: "0.8rem",
                              };
                            } else {
                              return {
                                xs: "0.5rem",
                                sm: "0.6rem",
                                md: "0.7rem",
                              };
                            }
                          })(),
                          borderRadius: 2,
                          textTransform: "none",
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          overflowWrap: "break-word",
                          minHeight: { xs: "100px", sm: "120px", md: "150px" },
                          maxWidth: "100%",
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          p: { xs: 1, sm: 1.5, md: 2 },
                          overflow: "hidden",
                          boxSizing: "border-box",
                          flexShrink: 0,
                          minWidth: 0,
                        }}
                      >
                        <Box
                          sx={{
                            width: "100%",
                            height: "100%",
                            maxWidth: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: align,
                            px: 1,
                            overflow: "hidden",
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
