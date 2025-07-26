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
  Grid,
  Avatar,
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
import getStartIconSpacing from "@/utils/getStartIconSpacing";

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
    timeTaken: "Time Taken",
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
    timeTaken: "الوقت المستغرق",
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
    await activateGameSession(pendingSession?._id);
    requestAllSessions();
  };

  const handleEndGame = async () => {
    if (!activeSession) return;
    await endGameSession(currentSession?._id);
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
              sx={getStartIconSpacing(dir)}
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
              sx={getStartIconSpacing(dir)}
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
            sx={getStartIconSpacing(dir)}
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
            startIcon={
              pendingSession.players.find((p) => p.playerType === "p1") &&
              pendingSession.players.find((p) => p.playerType === "p2") && (
                <ICONS.play />
              )
            }
            sx={getStartIconSpacing(dir)}
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
            sx={getStartIconSpacing(dir)}
          >
            {t.endGame}
          </Button>
        )}

        {/* Active Session Card */}
        {activeSession && (
          <Paper
            elevation={10}
            sx={{
              mt: 6,
              width: "100%",
              maxWidth: 480,
              mx: "auto",
              px: 4,
              py: 5,
              borderRadius: 4,
              background: "linear-gradient(135deg, #e1f5fe, #ffffff)",
              boxShadow: "0 12px 35px rgba(0,0,0,0.15)",
              backdropFilter: "blur(4px)",
              textAlign: "center",
              position: "relative",
            }}
          >
            {/* Glowing Live Chip */}
            <Box
              sx={{
                position: "absolute",
                top: 16,
                right: 16,
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 0.5,
                bgcolor: "#4CAF50",
                borderRadius: 999,
                color: "#fff",
                fontWeight: "bold",
                boxShadow: "0 0 8px 2px rgba(76, 175, 80, 0.4)",
                textTransform: "uppercase",
                fontSize: 12,
                letterSpacing: 0.5,
              }}
            >
              <ICONS.flash sx={{ fontSize: 16 }} />
              LIVE
            </Box>

            {/* Header */}
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{
                mb: 3,
                color: "success.dark",
                textShadow: "0 0 6px rgba(0, 0, 0, 0.1)",
                letterSpacing: "1px",
              }}
            >
              {t.activeSession}
            </Typography>

            {/* Delay Countdown */}
            {localDelay > 0 && (
              <Fade in timeout={500}>
                <Box>
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    sx={{ color: "warning.main", mb: 1 }}
                  >
                    {t.getReady}
                  </Typography>
                  <Box
                    key={localDelay} // Force animation to restart every second
                    component="div"
                    className="pulse"
                    sx={{
                      fontSize: { xs: "3.8rem", sm: "5rem" },
                      fontWeight: "bold",
                      color: "warning.main",
                    }}
                  >
                    {localDelay}
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "warning.dark", mt: 1, display: "block" }}
                  >
                    {t.gameStartsIn}
                  </Typography>
                </Box>
              </Fade>
            )}

            {/* Main Game Countdown */}
            {localTime > 0 && localDelay === 0 && (
              <Fade in timeout={500}>
                <Box>
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    sx={{ color: "info.main", mb: 1 }}
                  >
                    {t.timeRemaining}
                  </Typography>
                  <Box
                    key={localTime} // Force animation to restart every second
                    component="div"
                    className="pulse"
                    sx={{
                      fontSize: { xs: "3.8rem", sm: "5rem" },
                      fontWeight: "bold",
                      color: "info.main",
                    }}
                  >
                    {localTime}
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "info.dark", mt: 1, display: "block" }}
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
                  opacity: 0.85;
                }
              }

              .pulse {
                animation: pulse 1s ease-in-out;
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

            return (
              <Paper
                elevation={6}
                sx={{
                  p: 4,
                  mt: 4,
                  width: "100%",
                  maxWidth: 580,
                  mx: "auto",
                  background: "linear-gradient(135deg, #1e3c72, #2a5298)",
                  borderRadius: 6,
                  color: "#fff",
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{
                    mb: 3,
                    color: "white",
                    textShadow: "0 0 10px rgba(255,255,255,0.3)",
                  }}
                >
                  {player1 && player2 ? t.bothPlayersJoined : t.waitingPlayers}
                </Typography>

                <Grid container spacing={3} justifyContent="center">
                  {[
                    { label: t.player1, player: player1 },
                    { label: t.player2, player: player2 },
                  ].map(({ label, player }, idx) => (
                    <Grid item xs={12} sm={6} key={idx}>
                      <Box
                        sx={{
                          backgroundColor: player?.playerId
                            ? "#4CAF50"
                            : "#ffffff11",
                          border: `2px solid ${
                            player?.playerId ? "#4caf50" : "#ffffff44"
                          }`,
                          borderRadius: 4,
                          p: 2.5,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 1,
                          width: "200px",
                          height: "100%",
                          textAlign: "center",
                          animation: !player?.playerId
                            ? "waitingPulse 1.2s ease-in-out infinite"
                            : "none",
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: player?.playerId
                              ? "success.dark"
                              : "grey.700",
                            width: 48,
                            height: 48,
                          }}
                        >
                          <ICONS.person />
                        </Avatar>
                        <Typography variant="caption" sx={{ color: "#e0f2f1" }}>
                          {label}
                        </Typography>
                        <Typography
                          variant="subtitle1"
                          fontWeight="bold"
                          sx={{ color: "#fff", wordWrap: "break-word" }}
                        >
                          {player?.playerId?.name || ""}
                        </Typography>
                        <Box
                          display="flex"
                          alignItems="center"
                          gap={0.5}
                          sx={{ justifyContent: "center", flexWrap: "wrap" }}
                        >
                          <ICONS.business sx={{ fontSize: 18 }} />
                          <Typography
                            variant="caption"
                            sx={{ color: "#e0f2f1", wordBreak: "break-word" }}
                          >
                            {player?.playerId?.company || "N/A"}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                  <style jsx>{`
                    @keyframes waitingPulse {
                      0% {
                        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.25);
                      }
                      70% {
                        box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
                      }
                      100% {
                        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
                      }
                    }
                  `}</style>
                </Grid>
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
                session.winner?._id === player1?.playerId?._id;
              const isPlayer2Winner =
                session.winner?._id === player2?.playerId?._id;

              return (
                <Fade in timeout={500} key={session._id}>
                  <Paper
                    elevation={6}
                    sx={{
                      overflow: "hidden",
                      borderRadius: 4,
                      my: 3,
                      background:
                        "linear-gradient(to bottom, #f7f7f7, #ffffff)",
                      boxShadow: "0px 6px 20px rgba(0,0,0,0.1)",
                    }}
                  >
                    {/* Winner Banner */}
                    <Box
                      sx={{
                        background: session.winner
                          ? "linear-gradient(to right, #4CAF50, #81C784)"
                          : "linear-gradient(to right, #9E9E9E, #BDBDBD)",
                        px: 3,
                        py: 1.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1,
                      }}
                    >
                      {session?.winner && (
                        <ICONS.trophy sx={{ color: "#fff" }} />
                      )}
                      <Typography variant="h6" color="#fff" fontWeight="bold">
                        {session.winner ? session.winner.name : t.tie}
                      </Typography>
                    </Box>

                    {/* Players */}
                    <Box
                      sx={{
                        px: { xs: 2, sm: 4 },
                        py: 3,
                        position: "relative",
                      }}
                    >
                      <Grid
                        container
                        spacing={3}
                        direction={{ xs: "column", sm: "row" }}
                        alignItems="stretch"
                        justifyContent="space-between"
                      >
                        {/* Player 1 */}
                        <Grid item xs={12} sm={5.5}>
                          <Box
                            sx={{
                              background: isPlayer1Winner
                                ? "linear-gradient(135deg, #A5D6A7, #C8E6C9)"
                                : "grey.100",
                              borderRadius: 3,
                              p: 3,
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              gap: 1.5,
                              textAlign: "left",
                              alignItems: "flex-start",
                            }}
                          >
                            <Typography variant="h6" fontWeight="bold">
                              {player1?.playerId?.name || t.unknown}
                            </Typography>

                            <Box display="flex" gap={1} alignItems="center">
                              <ICONS.business fontSize="small" />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {player1?.playerId?.company || "N/A"}
                              </Typography>
                            </Box>

                            <Box display="flex" gap={1} alignItems="center">
                              <ICONS.leaderboard fontSize="small" />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {t.score}: {player1?.score ?? 0}
                              </Typography>
                            </Box>

                            <Box display="flex" gap={1} alignItems="center">
                              <ICONS.assignment fontSize="small" />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {t.attempted}:{" "}
                                {player1?.attemptedQuestions ?? 0}
                              </Typography>
                            </Box>
                            <Box display="flex" gap={1} alignItems="center">
                              <ICONS.time fontSize="small" />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {t.timeTaken}:{" "}
                                {player1?.timeTaken != null
                                  ? `${player1.timeTaken}s`
                                  : "0s"}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>

                        {/* VS Badge */}
                        <Box
                          sx={{
                            position: { xs: "static", sm: "absolute" },
                            top: "50%",
                            left: "50%",
                            transform: {
                              xs: "none",
                              sm: "translate(-50%, -50%)",
                            },
                            background: "#fff",
                            border: "2px solid #ccc",
                            px: 2,
                            py: 0.5,
                            borderRadius: "50px",
                            fontWeight: "bold",
                            width: "fit-content",
                            mx: "auto",
                            my: { xs: 1, sm: 0 },
                            zIndex: 2,
                          }}
                        >
                          VS
                        </Box>
                        {/* Player 2 */}
                        <Grid item xs={12} sm={5.5}>
                          <Box
                            sx={{
                              background: isPlayer2Winner
                                ? "linear-gradient(135deg, #A5D6A7, #C8E6C9)"
                                : "grey.100",
                              borderRadius: 3,
                              p: 3,
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              gap: 1.5,
                              textAlign: "right",
                              alignItems: "flex-end",
                            }}
                          >
                            <Typography variant="h6" fontWeight="bold">
                              {player2?.playerId?.name || t.unknown}
                            </Typography>

                            <Box display="flex" gap={1} alignItems="center">
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {player2?.playerId?.company || "N/A"}
                              </Typography>
                              <ICONS.business fontSize="small" />
                            </Box>

                            <Box display="flex" gap={1} alignItems="center">
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {t.score}: {player2?.score ?? 0}
                              </Typography>
                              <ICONS.leaderboard fontSize="small" />
                            </Box>

                            <Box display="flex" gap={1} alignItems="center">
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {t.attempted}:{" "}
                                {player2?.attemptedQuestions ?? 0}
                              </Typography>
                              <ICONS.assignment fontSize="small" />
                            </Box>

                            <Box display="flex" gap={1} alignItems="center">
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {t.timeTaken}:{" "}
                                {player2?.timeTaken != null
                                  ? `${player2.timeTaken}s`
                                  : "0s"}
                              </Typography>
                              <ICONS.time fontSize="small" />
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </Paper>
                </Fade>
              );
            })()
          ) : (
            <NoDataAvailable />
          )}
        </Box>
      </Stack>
    </Container>
  );
}
