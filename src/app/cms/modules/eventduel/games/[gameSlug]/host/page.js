"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Button,
  Typography,
  Paper,
  Fade,
  Container,
  Stack,
  Divider,
} from "@mui/material";

import ICONS from "@/utils/iconUtil";
import useWebSocketData from "@/hooks/modules/eventduel/useEventDuelWebSocketData";
import {
  startGameSession,
  endGameSession,
  activateGameSession,
} from "@/services/eventduel/gameSessionService";
import NoDataAvailable from "@/components/NoDataAvailable";
import useI18nLayout from "@/hooks/useI18nLayout";
import BreadcrumbsNav from "@/components/BreadcrumbsNav";

const translations = {
  en: {
    hostDashboard: "Host Dashboard",
    hostDescription: "Manage your game sessions and monitor progress.",
    allSessions: "All Sessions",
    questions: "Questions",
    startNewSession: "Start New Session",
    startGame: "Start the Game",
    waitingPlayers: "Waiting for Players",
    endGame: "End Game",
    activeSession: "Active Session",
    getReady: "Get Ready...",
    gameStartsIn: "Game starts in seconds",
    timeRemaining: "Time Remaining",
    secondsLeft: "seconds left to play",
    bothPlayersJoined: "Both Players have joined!",
    waitingForPlayers: "Waiting for Players...",
    sessionId: "Session ID",
    player1: "Player 1",
    player2: "Player 2",
    previousSession: "Previous Session",
    winner: "Winner",
    tie: "It's a Tie!",
    company: "Company",
    score: "Score",
    attempted: "Attempted",
    unknown: "Unknown",
    noData: "No data available",
  },
  ar: {
    hostDashboard: "لوحة التحكم",
    hostDescription: "إدارة الجلسات وتتبع التقدم.",
    allSessions: "كل الجلسات",
    questions: "الأسئلة",
    startNewSession: "بدء جلسة جديدة",
    startGame: "ابدأ اللعبة",
    waitingPlayers: "بانتظار اللاعبين",
    endGame: "إنهاء اللعبة",
    activeSession: "جلسة نشطة",
    getReady: "استعد...",
    gameStartsIn: "تبدأ اللعبة خلال ثوانٍ",
    timeRemaining: "الوقت المتبقي",
    secondsLeft: "ثوانٍ متبقية للعب",
    bothPlayersJoined: "انضم كلا اللاعبين!",
    waitingForPlayers: "بانتظار اللاعبين...",
    sessionId: "معرّف الجلسة",
    player1: "اللاعب 1",
    player2: "اللاعب 2",
    previousSession: "الجلسة السابقة",
    winner: "الفائز",
    tie: "تعادل!",
    company: "الشركة",
    score: "النتيجة",
    attempted: "المحاولات",
    unknown: "غير معروف",
    noData: "لا توجد بيانات متاحة",
  },
};

export default function HostDashboard() {
  const router = useRouter();
  const { gameSlug } = useParams();
  const { t, dir, align } = useI18nLayout(translations);

  const { sessions, currentSession, requestAllSessions } =
    useWebSocketData(gameSlug);

    useEffect(() => {
  requestAllSessions();
}, [gameSlug]);

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
    return completed.length > 0 ? completed[0] : null;
  }, [sessions]);

  const [localDelay, setLocalDelay] = useState(0);
  const [localTime, setLocalTime] = useState(0);

  useEffect(() => {
    if (!activeSession) return;

    const countdown = activeSession?.gameId?.countdownTimer || 5;
    const gameDuration = activeSession?.gameId?.gameSessionTimer || 60;

    let countdownValue = countdown;
    let gameTimeValue = gameDuration;
    let inCountdown = true;

    setLocalDelay(countdownValue);
    setLocalTime(0);

    const interval = setInterval(() => {
      if (inCountdown) {
        countdownValue--;
        setLocalDelay(countdownValue);
        if (countdownValue <= 0) {
          inCountdown = false;
          setLocalTime(gameTimeValue);
        }
      } else {
        gameTimeValue--;
        setLocalTime(gameTimeValue);
        if (gameTimeValue <= 0) {
          clearInterval(interval);
          handleEndGame();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  const handleStartGame = async () => {
    await startGameSession(gameSlug);
    requestAllSessions();
  };

  const handleActivateSession = async () => {
    if (!pendingSession) return;
    await activateGameSession(pendingSession._id);
    requestAllSessions();
  };

  const handleEndGame = async () => {
    if (!activeSession) return;
    await endGameSession(currentSession._id);
    requestAllSessions();
  };

  return (
    <Container dir={dir} maxWidth="lg">
      <Box sx={{ textAlign: align }}>
        <BreadcrumbsNav />
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "center" },
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight="bold" sx={{ mt: 2 }}>
              {t.hostDashboard}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t.hostDescription}
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              variant="contained"
              color="info"
              startIcon={<ICONS.history />}
              onClick={() =>
                router.replace(
                  `/cms/modules/eventduel/games/${gameSlug}/host/sessions`
                )
              }
            >
              {t.allSessions}
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<ICONS.quiz />}
              onClick={() =>
                router.replace(
                  `/cms/modules/eventduel/games/${gameSlug}/host/questions`
                )
              }
            >
              {t.questions}
            </Button>
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />
      </Box>

      <Stack spacing={3} alignItems="center">
        {!pendingSession && !activeSession && (
          <Button
            variant="contained"
            color="success"
            startIcon={<ICONS.play />}
            onClick={handleStartGame}
          >
            {t.startNewSession}
          </Button>
        )}

        {pendingSession && (
          <Button
            variant="contained"
            color="warning"
            onClick={handleActivateSession}
            disabled={
              !pendingSession.players.find((p) => p.playerType === "p1") ||
              !pendingSession.players.find((p) => p.playerType === "p2")
            }
          >
            {pendingSession.players.find((p) => p.playerType === "p1") &&
            pendingSession.players.find((p) => p.playerType === "p2")
              ? t.startGame
              : t.waitingPlayers}
          </Button>
        )}

        {activeSession && (
          <Button
            variant="contained"
            color="error"
            startIcon={<ICONS.stop />}
            onClick={handleEndGame}
          >
            {t.endGame}
          </Button>
        )}

        {/* Active Session Card */}
        {activeSession && (
          <Paper
            elevation={8}
            sx={{
              p: 4,
              mt: 5,
              width: "100%",
              maxWidth: 450,
              textAlign: "center",
              background: "linear-gradient(135deg, #e0f7fa, #ffffff)",
              borderRadius: 3,
              boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.2)",
            }}
          >
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              mb={2}
            >
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{ color: "success.main", letterSpacing: "0.5px" }}
              >
                {t.activeSession}
              </Typography>
            </Box>

            {/* Countdown before game starts */}
            {localDelay > 0 && (
              <Fade in timeout={500}>
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    sx={{ color: "secondary.dark", mb: 1 }}
                  >
                    {t.getReady}
                  </Typography>
                  <Box
                    component="span"
                    sx={{
                      fontSize: { xs: "3.5rem", sm: "5rem" },
                      color: "secondary.main",
                      fontWeight: "bold",
                      animation: "pulse 1s infinite alternate",
                    }}
                  >
                    {localDelay}
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "secondary.dark", mt: 1, display: "block" }}
                  >
                    {t.gameStartsIn}
                  </Typography>
                </Box>
              </Fade>
            )}

            {/* Game session countdown */}
            {localTime > 0 && localDelay === 0 && (
              <Fade in timeout={500}>
                <Box>
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    sx={{ color: "primary.dark", mb: 1 }}
                  >
                    {t.timeRemaining}
                  </Typography>
                  <Box
                    component="span"
                    sx={{
                      fontSize: { xs: "3.5rem", sm: "5rem" },
                      color: "primary.main",
                      fontWeight: "bold",
                      animation: "pulse 1s infinite alternate",
                    }}
                  >
                    {localTime}
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "primary.dark", mt: 1, display: "block" }}
                  >
                    {t.secondsLeft}
                  </Typography>
                </Box>
              </Fade>
            )}

            <style jsx>{`
              @keyframes pulse {
                0% {
                  transform: scale(1);
                  opacity: 1;
                }
                100% {
                  transform: scale(1.1);
                  opacity: 0.9;
                }
              }
            `}</style>
          </Paper>
        )}

        {/* Pending Session Card */}
        {pendingSession &&
          (() => {
            const session = currentSession;

            const player1 = session?.players?.find(
              (p) => p.playerType === "p1"
            );
            const player2 = session?.players?.find(
              (p) => p.playerType === "p2"
            );

            const player1Name = player1?.playerId?.name || t.waitingPlayers;
            const player2Name = player2?.playerId?.name || t.waitingPlayers;
            const bothJoined = player1?.playerId && player2?.playerId;

            return (
              <Paper
                elevation={6}
                sx={{
                  p: 4,
                  mt: 4,
                  width: "100%",
                  maxWidth: 420,
                  textAlign: "center",
                  background: "linear-gradient(to right, #2c3e50, #4ca1af)",
                  color: "white",
                  borderRadius: 3,
                }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mb={2}
                >
                  <ICONS.people sx={{ color: "warning.light", mr: 1 }} />
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{
                      color: "warning.light",
                      textShadow: "0 0 10px rgba(255,165,0,0.8)",
                    }}
                  >
                    {bothJoined ? t.bothPlayersJoined : t.waitingForPlayers}
                  </Typography>
                </Box>

                <Box
                  display="inline-flex"
                  alignItems="center"
                  gap={1}
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    px: 2,
                    py: 0.5,
                    borderRadius: 2,
                    mb: 2,
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                  onClick={() => navigator.clipboard.writeText(session._id)}
                >
                  <ICONS.copy fontSize="small" />
                  <Typography variant="body2" color="#fff">
                    {t.sessionId}: <b>{session?._id}</b>
                  </Typography>
                </Box>

                {/* Player 1 */}
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  gap={1}
                  sx={{
                    mt: 2,
                    animation: player1?.playerId
                      ? "fadeIn 1s"
                      : "blink 1.5s infinite",
                  }}
                >
                  <ICONS.person fontSize="small" />
                  <Typography variant="body1" fontWeight="bold" color="#fff">
                    {t.player1}: {player1Name}
                  </Typography>
                </Box>

                {/* Player 2 */}
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  gap={1}
                  sx={{
                    mt: 1,
                    animation: player2?.playerId
                      ? "fadeIn 1s"
                      : "blink 1.5s infinite",
                  }}
                >
                  <ICONS.person fontSize="small" />
                  <Typography variant="body1" fontWeight="bold" color="#fff">
                    {t.player2}: {player2Name}
                  </Typography>
                </Box>

                <style jsx>{`
                  @keyframes fadeIn {
                    from {
                      opacity: 0;
                      transform: translateY(10px);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }

                  @keyframes blink {
                    0% {
                      opacity: 1;
                    }
                    50% {
                      opacity: 0.5;
                    }
                    100% {
                      opacity: 1;
                    }
                  }
                `}</style>
              </Paper>
            );
          })()}

        {/* Recently Completed Session Card */}
        <Box sx={{ mt: 4, width: "100%", maxWidth: 600 }}>
          <Typography
            variant="h6"
            fontWeight="bold"
            textAlign="center"
            color="primary.dark"
          >
            {t.previousSession}
          </Typography>
          {recentlyCompleted ? (
            (() => {
              const session = recentlyCompleted;
              const player1 = session.players.find(
                (p) => p.playerType === "p1"
              );
              const player2 = session.players.find(
                (p) => p.playerType === "p2"
              );
              const isPlayer1Winner =
                session.winner && session.winner._id === player1?.playerId?._id;
              const isPlayer2Winner =
                session.winner && session.winner._id === player2?.playerId?._id;

              return (
                <Fade in timeout={500} key={session._id}>
                  <Paper
                    elevation={6}
                    sx={{
                      p: 3,
                      my: 2,
                      borderRadius: 3,
                      background: "linear-gradient(135deg, #f5f5f5, #ffffff)",
                      boxShadow: "0px 4px 15px rgba(0,0,0,0.15)",
                    }}
                  >
                    {/* Session ID */}
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      textAlign="center"
                      color="secondary.main"
                    >
                      {t.sessionId}: {session._id}
                    </Typography>

                    {/* Winner */}
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      mt={1}
                      mb={2}
                    >
                      <ICONS.trophy sx={{ color: "#4CAF50", mr: 1 }} />
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        color={
                          session.winner ? "success.main" : "text.secondary"
                        }
                      >
                        {t.winner}: {session.winner?.name || t.tie}
                      </Typography>
                    </Box>

                    {/* VS Layout */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mt: 2,
                        p: 2,
                        borderRadius: 2,
                        background: "#f3f3f3",
                        position: "relative",
                      }}
                    >
                      {/* Player 1 */}
                      <Box
                        sx={{
                          textAlign: "left",
                          flex: 1,
                          background: isPlayer1Winner
                            ? "linear-gradient(135deg, #4CAF50, #66BB6A)"
                            : "grey.200",
                          p: 2,
                          borderRadius: "8px",
                          color: isPlayer1Winner ? "#fff" : "text.primary",
                        }}
                      >
                        <Typography fontWeight="bold">
                          {player1?.playerId?.name || t.unknown}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <ICONS.business fontSize="small" />
                          <Typography variant="caption">
                            {player1?.playerId?.company || "N/A"}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <ICONS.leaderboard fontSize="small" />
                          <Typography variant="caption">
                            {t.score}: {player1?.score ?? 0}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <ICONS.assignment fontSize="small" />
                          <Typography variant="caption">
                            {t.attempted}: {player1?.attemptedQuestions ?? 0}
                          </Typography>
                        </Box>
                      </Box>

                      {/* VS Separator */}
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.secondary"
                        sx={{
                          position: "absolute",
                          left: "50%",
                          transform: "translateX(-50%)",
                          fontSize: "0.85rem",
                          background: "#ffffff",
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          boxShadow: "0px 2px 10px rgba(0,0,0,0.1)",
                        }}
                      >
                        VS
                      </Typography>

                      {/* Player 2 */}
                      <Box
                        sx={{
                          textAlign: "right",
                          flex: 1,
                          background: isPlayer2Winner
                            ? "linear-gradient(135deg, #4CAF50, #66BB6A)"
                            : "grey.200",
                          p: 2,
                          borderRadius: "8px",
                          color: isPlayer2Winner ? "#fff" : "text.primary",
                        }}
                      >
                        <Typography fontWeight="bold">
                          {player2?.playerId?.name || t.unknown}
                        </Typography>
                        <Box
                          display="flex"
                          justifyContent="flex-end"
                          alignItems="center"
                          gap={1}
                        >
                          <Typography variant="caption">
                            {player2?.playerId?.company || "N/A"}
                          </Typography>
                          <ICONS.business fontSize="small" />
                        </Box>
                        <Box
                          display="flex"
                          justifyContent="flex-end"
                          alignItems="center"
                          gap={1}
                        >
                          <Typography variant="caption">
                            {t.score}: {player2?.score ?? 0}
                          </Typography>
                          <ICONS.leaderboard fontSize="small" />
                        </Box>
                        <Box
                          display="flex"
                          justifyContent="flex-end"
                          alignItems="center"
                          gap={1}
                        >
                          <Typography variant="caption">
                            {t.attempted}: {player2?.attemptedQuestions ?? 0}
                          </Typography>
                          <ICONS.assignment fontSize="small" />
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                </Fade>
              );
            })()
          ) : (
            <Fade in timeout={500}>
              <Paper
                sx={{
                  p: 3,
                  mt: 2,
                  textAlign: "center",
                  background: "#f0f0f0",
                  borderRadius: 2,
                }}
              >
                <NoDataAvailable />
              </Paper>
            </Fade>
          )}
        </Box>
      </Stack>
    </Container>
  );
}
