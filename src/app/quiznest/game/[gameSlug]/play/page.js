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
//static translations

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
  },
};
export default function PlayPage() {
  const { game, loading } = useGame();
  const router = useRouter();
  const { t, dir, align, language } = useI18nLayout(gameTranslations); // UPDATED
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
  const [randomizedIndexes, setRandomizedIndexes] = useState([]); //random questions
  const currentQuestion =
    game?.questions?.[randomizedIndexes[questionIndex] ?? questionIndex];

  const correctSound =
    typeof Audio !== "undefined" ? new Audio("/correct.wav") : null;
  const wrongSound =
    typeof Audio !== "undefined" ? new Audio("/wrong.wav") : null;
  const celebrateSound =
    typeof Audio !== "undefined" ? new Audio("/celebrate.mp3") : null;

  const languageCodeMap = {
    en: "en",
    ar: "ar",
    // Add more as needed
  };
  const translateQuestion = async (questionObj) => {
    if (!questionObj) return;

    const targetLang = languageCodeMap[language] || "en";

    try {
      const [question, answers, hint] = await Promise.all([
        translateText(questionObj.question, targetLang),
        Promise.all(
          questionObj.answers.map((answer) => translateText(answer, targetLang))
        ),
        questionObj.hint ? translateText(questionObj.hint, targetLang) : null,
      ]);

      setTranslatedContent({
        question,
        answers,
        hint,
        uiLabels: {
          questionLabel: t.question,
          ofLabel: t.of,
          countdownLabel: t.countdown,
        },
      });
    } catch (error) {
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
    if (!loading && delay > 0) {
      const countdown = setInterval(() => {
        setDelay((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(countdown);
    } else if (delay === 0 && !started) {
      setStarted(true);
      startSessionTimer();
    }
  }, [delay, loading]);

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

    await submitResult(playerId, {
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

  if (delay > 0) {
    return (
      <Box
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
        <LanguageSelector />
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
            textAlign: "center",
          }}
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
                onClick={() => router.push(`/quiznest/game/${game.slug}`)}
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
      <LanguageSelector />
      <Box
        sx={{
          minHeight: "100vh",
          width: "100vw",
          backgroundImage: `url(${game.backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          px: 2,
          py: 6,
        }}
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
              mb: { xs: "0.4rem", sm: "0.6rem" }, // slight bottom align
            }}
          >
            {translatedContent.uiLabels?.countdownLabel || "sec"}
          </Typography>
        </Box>

        <Box
          sx={{
            height: "100vh",
            width: "100vw",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 2, // some padding on small screens
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
              {translatedContent.uiLabels?.questionLabel || "Question"}{" "}
              {questionIndex + 1} {translatedContent.uiLabels?.ofLabel || "of"}{" "}
              {randomizedIndexes.length || game.questions.length}
            </Typography>
            <Typography sx={{ fontSize: "3rem" }} gutterBottom>
              {translatedContent.question || currentQuestion?.question}
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
                gridTemplateColumns: "repeat(2, 1fr)", // Enforce 2 columns
                gridAutoRows: "1fr", // Equal height rows
              }}
            >
              {translatedContent.answers.map((opt, i) => {
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
                      minHeight: "150px", // Minimum height
                      gridColumn: i === 4 ? "1 / -1" : "auto", // Span full width for 5th option
                    }}
                  >
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
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        minHeight: "150px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        p: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          textAlign: "center",
                          px: 1,
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
