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
import { submitResult } from "@/services/tapmatch/playerService";
import LanguageSelector from "@/components/LanguageSelector";
import useI18nLayout from "@/hooks/useI18nLayout";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import Confetti from "react-confetti";
import { motion } from "framer-motion";
import {
  AccessTime,
  Shuffle,
  CheckCircle,
  HighlightOff,
  Speed,
  Replay,
} from "@mui/icons-material";

const translations = {
  en: {
    countdown: "sec",
    thankYou: "Well done,",
    timesUp: "Time’s Up!",
    betterLuck: "Better luck next time,",
    moves: "Moves",
    matches: "Matches",
    misses: "Misses",
    accuracy: "Accuracy",
    timeTaken: "Time Taken",
    playAgain: "Play Again",
    matchingPairs: "Matching Pairs",
    allMatched: "You’ve matched all pairs!",
    notAllMatched: "You didn’t match all pairs in time.",
    tap: "Tap",
  },
  ar: {
    countdown: "ثانية",
    thankYou: "أحسنت،",
    timesUp: "انتهى الوقت!",
    betterLuck: "حظاً أوفر في المرة القادمة،",
    moves: "المحاولات",
    matches: "التطابقات",
    misses: "الأخطاء",
    accuracy: "الدقة",
    timeTaken: "الوقت المستغرق",
    playAgain: "العب مجددًا",
    matchingPairs: "مطابقة البطاقات",
    allMatched: "لقد طابقت جميع الأزواج!",
    notAllMatched: "لم تتمكن من مطابقة جميع الأزواج في الوقت المحدد.",
    tap: "اضغط",
  },
};

export default function TapMatchPlayPage() {
  const { game, loading } = useGame();
  const router = useRouter();
  const { t, dir, align } = useI18nLayout(translations);

  const [playerInfo, setPlayerInfo] = useState(null);
  const [delay, setDelay] = useState(game?.countdownTimer || 5);
  const [timeLeft, setTimeLeft] = useState(game?.gameSessionTimer || 60);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [won, setWon] = useState(false);
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  const hasSubmittedRef = useRef(false);
  const movesRef = useRef(0);
  const matchedRef = useRef([]);
  const flippedRef = useRef([]);
  const timeLeftRef = useRef(0);
  const endedRef = useRef(false);
  const startTimestampRef = useRef(null);
  const timerRef = useRef(null);

  const matchSound =
    typeof Audio !== "undefined" ? new Audio("/correct.wav") : null;
  const wrongSound =
    typeof Audio !== "undefined" ? new Audio("/wrong.wav") : null;
  const celebrateSound =
    typeof Audio !== "undefined" ? new Audio("/celebrate.mp3") : null;

  useEffect(() => {
    movesRef.current = moves;
  }, [moves]);
  useEffect(() => {
    matchedRef.current = matched;
  }, [matched]);
  useEffect(() => {
    flippedRef.current = flipped;
  }, [flipped]);
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);
  useEffect(() => {
    endedRef.current = ended;
  }, [ended]);

  useEffect(() => {
    if (game?.gameSessionTimer) setTimeLeft(game.gameSessionTimer);
    if (game?.countdownTimer) setDelay(game.countdownTimer);
  }, [game]);

  useEffect(() => {
    if (loading) return;
    if (!game?.memoryImages?.length) return;

    if (delay > 0) {
      const countdown = setInterval(() => setDelay((prev) => prev - 1), 1000);
      return () => clearInterval(countdown);
    } else if (delay === 0 && !started) {
      initGame();
      startTimer();
    }
  }, [delay, loading, game?.memoryImages]);

  useEffect(() => {
    if (!loading && delay === 0 && !started && game?.memoryImages?.length) {
      initGame();
      startTimer();
    }
  }, [delay, loading, started, game?.memoryImages]);

  useEffect(() => {
    const stored = sessionStorage.getItem("playerInfo");
    if (stored) setPlayerInfo(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (started && matched.length === cards.length && cards.length > 0) {
      stopTimer();
      endGame(true);
    }
  }, [matched]);

  const initGame = () => {
    if (!game?.memoryImages?.length) {
      console.warn("No memory images found for this game");
      return;
    }

    const duplicated = [...game.memoryImages, ...game.memoryImages].map(
      (img) => ({
        ...img,
        id: `${img._id}-${Math.random()}`,
      })
    );

    const shuffled = duplicated.sort(() => Math.random() - 0.5);

    setCards(shuffled);
    setStarted(true);
  };

  const handleFlip = (index) => {
    if (
      flipped.length === 2 ||
      matched.includes(index) ||
      flipped.includes(index)
    )
      return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = newFlipped;
      const first = cards[firstIdx];
      const second = cards[secondIdx];

      setTimeout(() => {
        if (first.url === second.url) {
          setMatched((prev) => [...prev, firstIdx, secondIdx]);
          matchSound?.play();
        } else {
          wrongSound?.play();
          setTimeout(() => setFlipped([]), 300);
        }
      }, 1000);

      // Reset flipped for matched pair after short pause
      if (first.url === second.url) {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  // ----------------------------
  // Start timer only once
  // ----------------------------
  const startTimer = () => {
    if (timerRef.current) return; // prevent double interval
    startTimestampRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - startTimestampRef.current) / 1000
      );
      const remaining = game.gameSessionTimer - elapsed;

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setTimeLeft(0);
        endGame(); // time expired
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
  };

  // ----------------------------
  // Stop timer
  // ----------------------------
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // ----------------------------
  // Use accurate timeUsed
  // ----------------------------
  const endGame = async (completed = false) => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    if (completed) celebrateSound?.play();
    else wrongSound?.play();
    setWon(completed);
    setEnded(true);

    const playerId = sessionStorage.getItem("playerId");
    const sessionId = sessionStorage.getItem("sessionId");

    stopTimer();

    // derive accurate elapsed time from timestamp
    const totalElapsed = Math.floor(
      (Date.now() - startTimestampRef.current) / 1000
    );
    const timeUsed = Math.min(totalElapsed, game.gameSessionTimer);
    setTimeTaken(timeUsed);

    const currentMoves = movesRef.current;
    const currentMatched = matchedRef.current;
    const matches = currentMatched.length / 2;
    const misses = currentMoves - matches;
    const accuracy =
      currentMoves > 0 ? ((matches / currentMoves) * 100).toFixed(1) : 0;

    await submitResult(sessionId, playerId, {
      moves: currentMoves,
      matches,
      misses,
      totalTime: timeUsed,
      accuracy,
    });
  };

  // COUNTDOWN SCREEN WITH DARK OVERLAY
  if (delay > 0) {
    return (
      <Box
        dir={dir}
        sx={{
          height: "100vh",
          width: "100vw",
          position: "relative",
          backgroundImage: `url("${encodeURI(game?.backgroundImage)}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            variant="h1"
            sx={{
              fontWeight: "bold",
              fontSize: { xs: "25vw", md: "40vw" },
              color: "#FFD700",
              textShadow:
                "0 0 20px rgba(255,215,0,0.9), 0 0 40px rgba(255,215,0,0.7)",
            }}
          >
            {delay}
          </Typography>
        </Box>
      </Box>
    );
  }

  if (loading || !game || !playerInfo) {
    return (
      <Box
        sx={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: `url("${encodeURI(game?.backgroundImage)}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (ended) {
    const matchesCount = matched.length / 2;
    const misses = moves - matchesCount;
    const accuracy = moves > 0 ? ((matchesCount / moves) * 100).toFixed(1) : 0;

    const headlineText = won ? t.thankYou : t.timesUp;
    const backgroundGradient = won
      ? "linear-gradient(135deg, #4CAF50CC, #388E3CCC)"
      : "linear-gradient(135deg, #F44336CC, #E53935CC)";

    return (
      <Box
        sx={{
          position: "relative",
          height: "100vh",
          width: "100vw",
          backgroundImage: `url("${encodeURI(game?.backgroundImage)}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          overflow: "hidden",
        }}
      >
        {/* Dark overlay — same as countdown screen */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
          }}
        >
        {won && (
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
                fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
              }}
            >
              {playerInfo?.name}
            </Typography>

            {/* Headline */}
            <Typography
              variant="h1"
              sx={{
                my: 2,
                textShadow: "0 0 15px rgba(255,255,255,0.8)",
                fontSize: { xs: "2rem", sm: "3rem", md: "4rem" },
                fontWeight: 900,
              }}
            >
              {headlineText}
            </Typography>

            {/* Subtitle */}
            <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
              {won ? t.allMatched : t.notAllMatched}
            </Typography>

            {/* Stats */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 1.5,
                px: 2,
                mb: 4,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Shuffle fontSize="small" sx={{ color: "#fff" }} />
                <Typography variant="body1" sx={{ color: "#fff" }}>
                  <strong>{t.moves}:</strong> {moves}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CheckCircle fontSize="small" sx={{ color: "#fff" }} />
                <Typography variant="body1" sx={{ color: "#fff" }}>
                  <strong>{t.matches}:</strong> {matchesCount}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <HighlightOff fontSize="small" sx={{ color: "#fff" }} />
                <Typography variant="body1" sx={{ color: "#fff" }}>
                  <strong>{t.misses}:</strong> {misses}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Speed fontSize="small" sx={{ color: "#fff" }} />
                <Typography variant="body1" sx={{ color: "#fff" }}>
                  <strong>{t.accuracy}:</strong> {accuracy}%
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AccessTime fontSize="small" sx={{ color: "#fff" }} />
                <Typography variant="body1" sx={{ color: "#fff" }}>
                  <strong>{t.timeTaken}:</strong> {timeTaken} {t.countdown}
                </Typography>
              </Box>
            </Box>

            {/* Button */}
            <Button
              variant="contained"
              color="secondary"
              startIcon={<Replay />}
              size="large"
              onClick={() => router.push(`/tapmatch/${game.slug}/name`)}
              sx={{
                ...getStartIconSpacing(dir),
              }}
            >
              {t.playAgain}
            </Button>
          </Paper>
        </Fade>
        </Box>
      </Box>
    );
  }
  // ACTIVE GAME SCREEN
  const matchesCount = matched.length / 2;
  const misses = moves - matchesCount;
  const accuracy = moves > 0 ? ((matchesCount / moves) * 100).toFixed(1) : 0;

  return (
    <>
      <LanguageSelector top={20} right={20} />
      <Box
        dir={dir}
        sx={{
          height: "100vh",
          width: "100vw",
          backgroundImage: `url("${encodeURI(game.backgroundImage)}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          px: 2,
          py: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* TIMER */}
        <Box
          sx={{
            textAlign: "center",
            mt: 3,
          }}
        >
          <Typography
            variant="h2"
            sx={{
              color: "#FFD700",
              fontWeight: "bold",
              fontSize: "clamp(5rem, 18vw, 14rem)",
              textShadow:
                "0 0 15px rgba(255,215,0,0.9), 0 0 30px rgba(255,215,0,0.6)",
            }}
          >
            {timeLeft}
            <Typography
              component="span"
              sx={{
                fontSize: "clamp(0.8rem, 2vw, 1.5rem)",
                ml: 1,
                color: "#FFD700",
                opacity: 0.8,
              }}
            >
              {t.countdown}
            </Typography>
          </Typography>
        </Box>

        {/* CARD GRID */}
        <Grid
          container
          spacing={{ xs: 1, sm: 2, md: 3 }}
          justifyContent="center"
          alignItems="center"
          columns={{ xs: 8, sm: 12, md: 12 }}
          sx={{
            width: "90vw",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            mx: "auto",
            mt: 6,
          }}
        >
          {cards.map((card, index) => {
            const isFlipped =
              flipped.includes(index) || matched.includes(index);
            const isMatched = matched.includes(index);

            return (
              <Grid
                item
                key={card.id}
                xs={3}
                sm={2}
                md={2}
                sx={{ display: "flex", justifyContent: "center" }}
              >
                <Box
                  sx={{
                    perspective: "1000px",
                    cursor: isMatched ? "default" : "pointer",
                    width: "clamp(60px, 20vw, 300px)",
                    aspectRatio: "1 / 1",
                    position: "relative",
                  }}
                  onClick={() => handleFlip(index)}
                >
                  <motion.div
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.5 }}
                    style={{
                      width: "100%",
                      height: "100%",
                      position: "relative",
                      transformStyle: "preserve-3d",
                    }}
                  >
                    {/* Front Face */}
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        backfaceVisibility: "hidden",
                        transform: "rotateY(0deg)",
                        borderRadius: 2,
                        background: "linear-gradient(145deg, #1976d2, #42a5f5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: "clamp(1rem, 4vw, 5rem)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                      }}
                    >
                      {t.tap}
                    </Box>

                    {/* Back Face */}
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        borderRadius: 2,
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={card.url}
                        alt="Memory card"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "8px",
                        }}
                      />

                      {isMatched && (
                        <Box
                          sx={{
                            position: "absolute",
                            inset: 0,
                            backgroundColor: "rgba(0,255,0,0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 2,
                            transition: "opacity 0.3s ease-in-out",
                          }}
                        >
                          <CheckCircle
                            sx={{
                              fontSize: 60,
                              color: "rgba(255,255,255,0.9)",
                              textShadow: "0 0 10px rgba(0,128,0,0.8)",
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                  </motion.div>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </>
  );
}
