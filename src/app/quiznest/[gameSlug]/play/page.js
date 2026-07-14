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
import { toArabicDigits } from "@/utils/arabicDigits";
import { translateTexts } from "@/services/translationService";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import { useTheme } from "@mui/material/styles";
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
  },
};
export default function PlayPage() {
  const theme = useTheme();
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
  const [timeTaken, setTimeTaken] = useState(0);
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

  // Load Player Info from SessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("playerInfo");
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
          endGame(true);
          return 0;
        }
        return newTime;
      });
    }, 1000);
  };

  //Submit Results and End Game
  const endGame = async (timedOut = false) => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    if (timedOut) wrongSound?.play();
    else celebrateSound?.play();
    setEnded(true);

    const playerId = sessionStorage.getItem("playerId");
    const sessionId = sessionStorage.getItem("sessionId");
    const timeTaken = game.gameSessionTimer - timeLeftRef.current;
    setTimeTaken(timeTaken);
    await submitResult(sessionId, playerId, {
      score: scoreRef.current,
      attemptedQuestions: attemptedRef.current,
      timeTaken: timeTaken,
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
              backgroundColor: theme.palette.quiznest.lightGlassBg,
              borderRadius: 4,
            }}
          >
            <QuizOutlinedIcon color="warning" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" gutterBottom sx={{
              fontWeight: "bold"
            }}>
              {t.noQuestionsTitle}
            </Typography>
            <Typography variant="body1" sx={{
              color: "text.secondary"
            }}>
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
          position: "relative",
          height: "100vh",
          width: "100vw",
          backgroundImage: `url(${game.backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          overflow: "hidden",
        }}
      >
        <Box
          sx={(theme) => ({
            position: "absolute",
            inset: 0,
            backgroundColor: theme.palette.quiznest.countdownOverlay,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <Typography
            variant="h1"
            sx={(theme) => ({
              fontWeight: "bold",
              fontSize: "10rem",
              color: "warning.light",
              textShadow: theme.palette.quiznest.countdownGlow,
              animation: "pulse 1s infinite alternate",
            })}
          >
            {toArabicDigits(delay, language)}
          </Typography>
        </Box>
      </Box>
    );
  }

  if (ended) {
    return (
      <Box
        sx={{
          position: "relative",
          height: "100vh",
          width: "100vw",
          backgroundImage: `url(${game.backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          overflow: "hidden",
        }}
      >
        <LanguageSelector top={20} right={20} />
        <Box
          dir={dir}
          sx={(theme) => ({
            position: "absolute",
            inset: 0,
            backgroundColor: theme.palette.quiznest.countdownOverlay,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
            textAlign: "center",
          })}
        >
          <Fade in timeout={800}>
            <Paper
              elevation={8}
              sx={(theme) => ({
                width: { xs: "90%", sm: "60%", md: "40%" },
                p: { xs: 3, sm: 4 },
                borderRadius: 3,
                background: theme.palette.quiznest.successGradient,
                color: theme.palette.common.white,
                boxShadow: theme.palette.shadow.glow,
                backdropFilter: "blur(5px)",
                textAlign: "center",
              })}
            >
              <Typography
                variant="h3"
                sx={{
                  fontWeight: "bold",
                  mb: 2
                }}>
                {t.thankYou} {playerInfo.name}!
              </Typography>

              <Typography variant="h2" sx={{
                mb: 2
              }}>
                {t.score}: {toArabicDigits(score, language)}
              </Typography>

              <Typography variant="h6" sx={{
                mb: 1
              }}>
                {t.attempted}: {toArabicDigits(attempted, language)}
              </Typography>

              <Typography variant="h6" sx={{
                mb: 3
              }}>
                {t.timeTaken}: {toArabicDigits(timeTaken, language)} {t.countdown}
              </Typography>

              <Button
                variant="contained"
                color="secondary"
                sx={{ fontSize: "1.25rem", px: 4, py: 1.5 }}
                onClick={() => router.push(`/quiznest/${game.slug}/name`)}
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
              textShadow: theme.palette.shadow.textGlowMd,
              lineHeight: 1,
            }}
          >
            {toArabicDigits(timeLeft, language)}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: "1rem", sm: "1.5rem" },
              color: theme.palette.common.black,
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
            elevation={8}
            sx={{
              width: "95%",
              maxWidth: "100%",
              p: { xs: 3, sm: 4 },
              textAlign: align,
              backdropFilter: "blur(16px)",
              backgroundColor: theme.palette.quiznest.glassBg,
              border: `1px solid ${theme.palette.quiznest.glassBorder}`,
              borderRadius: 4,
              marginTop: "10vh",
              overflow: "hidden",
              wordBreak: "break-word",
              boxSizing: "border-box",
              boxShadow: theme.palette.quiznest.dialogShadow,
            }}
          >
            {/* Question label — small secondary badge */}
            <Typography
              gutterBottom
              sx={(theme) => ({
                fontSize: { xs: "0.75rem", sm: "0.85rem", md: "1rem" },
                fontWeight: 600,
                color: theme.palette.quiznest.accent,
                textTransform: "uppercase",
                letterSpacing: 1,
                lineHeight: 1.3,
              })}
            >
              {translatedContent.uiLabels?.questionLabel || "Question"} #{toArabicDigits(questionIndex + 1, language)}
            </Typography>
            {/* Question text — main/prominent */}
            <Typography
              gutterBottom
              sx={{
                fontSize: (() => {
                  const len = (translatedContent.question || currentQuestion?.question || "").length;
                  if (len <= 60) return { xs: "1.2rem", sm: "1.6rem", md: "2rem" };
                  if (len <= 120) return { xs: "1rem", sm: "1.3rem", md: "1.6rem" };
                  if (len <= 200) return { xs: "0.9rem", sm: "1.15rem", md: "1.35rem" };
                  return { xs: "0.8rem", sm: "1rem", md: "1.15rem" };
                })(),
                fontWeight: 700,
                color: theme.palette.common.white,
                lineHeight: { xs: 1.4, sm: 1.5 },
                wordBreak: "break-word",
                overflowWrap: "break-word",
                mb: 1,
              }}
            >
              {translatedContent.question || currentQuestion?.question}
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
              sx={{
                justifyContent: "center",
                alignItems: "stretch",
                mt: 2,
                maxWidth: "100%",
                width: "100%",
                mx: "auto",
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gridAutoRows: "1fr",
                overflow: "hidden",
                boxSizing: "border-box",
                gap: "8px"
              }}>
              {Array.isArray(translatedContent.answers) &&
                translatedContent.answers.map((opt, i) => {
                  const isSelected = selected === i;
                  const isCorrect = i === currentQuestion.correctAnswerIndex;
                  // Answer option colors — inside the .map()
                  const { bg, borderColor, borderWidth } = (() => {
                    if (isSelected && isCorrect)
                      return {
                        bg: theme.palette.crosszero.answerCorrectBg,
                        borderColor: theme.palette.crosszero.answerCorrectBorder,
                        borderWidth: 2,
                      };
                    if (isSelected && !isCorrect)
                      return {
                        bg: theme.palette.crosszero.answerWrongBg,
                        borderColor: theme.palette.crosszero.answerWrongBorder,
                        borderWidth: 2,
                      };
                    return {
                      bg: theme.palette.quiznest.answerDefaultBg,
                      borderColor: theme.palette.quiznest.answerDefaultBorder,
                      borderWidth: 1.5,
                    };
                  })();
                  return (
                    <Grid
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
                      size={{
                        xs: 12,
                        sm: 6
                      }}>
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
                          transition:
                            "border-color 0.2s ease, border-width 0.2s ease",
                          "&:hover": { backgroundColor: bg, borderColor },
                          "&:active": { backgroundColor: bg, borderColor },
                          color: theme.palette.common.white,
                          fontSize: (() => {
                            const len = opt.length;
                            if (len <= 15) return { xs: "1rem", sm: "1.1rem", md: "1.2rem" };
                            if (len <= 40) return { xs: "0.9rem", sm: "1rem", md: "1.1rem" };
                            if (len <= 80) return { xs: "0.82rem", sm: "0.9rem", md: "1rem" };
                            return { xs: "0.75rem", sm: "0.85rem", md: "0.95rem" };
                          })(),
                        }}
                      >
                        <Box
                          sx={{
                            width: "100%",
                            display: "flex",
                            alignItems: currentQuestion?.answerImages?.[i]
                              ? "flex-start"
                              : "center",
                            justifyContent: "center",
                            textAlign: align,
                            px: 1,
                            boxSizing: "border-box",
                            overflowWrap: "break-word",
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

            {showHint && translatedContent.hint && (
              <Typography
                variant="body2"
                color="error"
                sx={{ mt: 3, fontStyle: "italic" }}
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
