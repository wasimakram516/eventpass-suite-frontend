"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  Fade,
  Grid,
  Stack,
  Typography,
  Paper,
} from "@mui/material";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import CrossZeroMarkVisual from "@/components/crosszero/CrossZeroMarkVisual";
import NoDataAvailable from "@/components/NoDataAvailable";
import useI18nLayout from "@/hooks/useI18nLayout";
import useCrossZeroWebSocketData from "@/hooks/modules/crosszero/useCrossZeroWebSocketData";
import {
  activateGameSession,
  abandonGameSession,
  endGameSession,
  startGameSession,
} from "@/services/crosszero/gameSessionService";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

const translations = {
  en: {
    title: "Host Dashboard",
    description: "Manage live CrossZero PvP sessions.",
    allSessions: "All Sessions",
    startNewSession: "Start New Session",
    startGame: "Start the Game",
    waitingPlayers: "Waiting for Players",
    endGame: "End Game",
    activeSession: "Active Session",
    bothPlayersJoined: "Both Players have joined!",
    waitingForPlayers: "Waiting for Players...",
    autoCloseNotice: "This session will auto-close if both players don't join within",
    seconds: "seconds",
    player1: "Player 1",
    player2: "Player 2",
    previousSession: "Previous Session",
    currentTurn: "Current Turn",
    moves: "Moves",
    timeTaken: "Time Taken",
    winner: "Winner",
    tie: "It's a Tie!",
    unknown: "Unknown",
  },
  ar: {
    title: "لوحة الاستضافة",
    description: "إدارة جلسات CrossZero PvP المباشرة.",
    allSessions: "كل الجلسات",
    startNewSession: "بدء جلسة جديدة",
    startGame: "ابدأ اللعبة",
    waitingPlayers: "بانتظار اللاعبين",
    endGame: "إنهاء اللعبة",
    activeSession: "جلسة نشطة",
    bothPlayersJoined: "انضم كلا اللاعبين!",
    waitingForPlayers: "بانتظار اللاعبين...",
    autoCloseNotice: "سيتم إغلاق الجلسة تلقائيًا إذا لم ينضم اللاعبان خلال",
    seconds: "ثوانٍ",
    player1: "اللاعب الأول",
    player2: "اللاعب الثاني",
    previousSession: "الجلسة السابقة",
    currentTurn: "الدور الحالي",
    moves: "الحركات",
    timeTaken: "الوقت المستغرق",
    winner: "الفائز",
    tie: "تعادل!",
    unknown: "غير معروف",
  },
};

const WINNING_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

function getWinningLine(board) {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return [a, b, c];
    }
  }
  return null;
}

function SpectatorBoard({ board = [], xImage, oImage }) {
  const winLine = getWinningLine(board);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 1.5,
        width: "100%",
        maxWidth: 360,
        mx: "auto",
      }}
    >
      {Array(9)
        .fill(null)
        .map((_, i) => {
          const cell = board[i] || null;
          const isWinning = winLine?.includes(i);
          const color = cell === "X" ? "#00e5ff" : cell === "O" ? "#ff6b6b" : "transparent";
          const glow = cell === "X" ? "0 0 24px #00e5ff" : cell === "O" ? "0 0 24px #ff6b6b" : "none";
          const customImage = cell === "X" ? xImage : cell === "O" ? oImage : null;

          return (
            <Box
              key={i}
              sx={{
                aspectRatio: "1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1.5px solid rgba(255,255,255,0.12)",
                borderRadius: 3,
                bgcolor: isWinning ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
                boxShadow: isWinning ? `inset 0 0 20px ${color}40` : "none",
                transition: "all 0.3s",
              }}
            >
              {cell && (
                customImage ? (
                  <Box component="img" src={customImage} alt={cell}
                    sx={{ width: "62%", height: "62%", objectFit: "contain", filter: isWinning ? `drop-shadow(${glow})` : "none", userSelect: "none" }} />
                ) : (
                  <CrossZeroMarkVisual
                    mark={cell}
                    xImage={xImage}
                    oImage={oImage}
                    size={42}
                    fallbackSize={{ xs: "2rem", sm: "2.6rem" }}
                    color={color}
                    shadow={glow}
                  />
                )
              )}
            </Box>
          );
        })}
    </Box>
  );
}

export default function CrossZeroHostPage() {
  const { gameSlug } = useParams();
  const router = useRouter();
  const { t, dir } = useI18nLayout(translations);
  const { sessions, currentSession, requestAllSessions, connected } =
    useCrossZeroWebSocketData(gameSlug);

  const [starting, setStarting] = useState(false);
  const [activating, setActivating] = useState(false);
  const [ending, setEnding] = useState(false);
  const [abandonRemaining, setAbandonRemaining] = useState(60);

  useEffect(() => {
    if (connected && gameSlug) requestAllSessions();
  }, [connected, gameSlug, requestAllSessions]);

  const pendingSession = useMemo(
    () => sessions.find((s) => s.status === "pending") || null,
    [sessions]
  );
  const activeSession = useMemo(
    () => sessions.find((s) => s.status === "active") || null,
    [sessions]
  );
  const recentlyCompleted = useMemo(
    () =>
      [...sessions]
        .filter((s) => s.status === "completed")
        .sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt) -
            new Date(a.updatedAt || a.createdAt)
        )[0] || null,
    [sessions]
  );

  const pendingP1 = pendingSession?.players?.find((p) => p.playerType === "p1");
  const pendingP2 = pendingSession?.players?.find((p) => p.playerType === "p2");
  const bothPlayersJoined = Boolean(pendingP1?.playerId && pendingP2?.playerId);

  useEffect(() => {
    if (!pendingSession?._id || bothPlayersJoined) return;
    setAbandonRemaining(60);
    let cancelled = false;
    const interval = setInterval(() => {
      setAbandonRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          if (!cancelled) {
            abandonGameSession(pendingSession._id)
              .then(() => requestAllSessions())
              .catch(() => {});
          }
        }
        return Math.max(next, 0);
      });
    }, 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [bothPlayersJoined, pendingSession?._id, requestAllSessions]);

  const handleStartSession = async () => {
    if (!gameSlug || starting) return;
    try {
      setStarting(true);
      await startGameSession(gameSlug);
      requestAllSessions();
    } finally {
      setStarting(false);
    }
  };

  const handleActivate = async () => {
    if (!pendingSession?._id || activating || !bothPlayersJoined) return;
    try {
      setActivating(true);
      await activateGameSession(pendingSession._id);
      requestAllSessions();
    } finally {
      setActivating(false);
    }
  };

  const handleEnd = async () => {
    if (!activeSession?._id || ending) return;
    try {
      setEnding(true);
      await endGameSession(activeSession._id);
      requestAllSessions();
    } finally {
      setEnding(false);
    }
  };

  return (
    <Container dir={dir} maxWidth="lg">
      <Box sx={{ textAlign: dir === "rtl" ? "right" : "left" }}>
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
              {t.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t.description}
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="info"
            startIcon={<ICONS.history />}
            onClick={() =>
              router.push(`/cms/modules/crosszero/games/${gameSlug}/sessions`)
            }
            sx={{
              ...getStartIconSpacing(dir),
              width: { xs: "100%", sm: "auto" },
            }}
          >
            {t.allSessions}
          </Button>
        </Box>
        <Divider sx={{ my: 2 }} />
      </Box>

      <Stack spacing={3} alignItems="center">
        {/* ── Idle: start button ── */}
        {!pendingSession && !activeSession && (
          <Button
            variant="contained"
            color="success"
            startIcon={<ICONS.play />}
            onClick={handleStartSession}
            disabled={starting}
            sx={getStartIconSpacing(dir)}
          >
            {t.startNewSession}
          </Button>
        )}

        {/* ── Pending: activate button ── */}
        {pendingSession && (
          <Button
            variant="contained"
            color={bothPlayersJoined ? "warning" : "inherit"}
            startIcon={bothPlayersJoined ? <ICONS.play /> : null}
            onClick={handleActivate}
            disabled={!bothPlayersJoined || activating}
            sx={getStartIconSpacing(dir)}
          >
            {bothPlayersJoined ? t.startGame : t.waitingPlayers}
          </Button>
        )}

        {/* ── Active: end button ── */}
        {activeSession && (
          <Button
            variant="contained"
            color="error"
            startIcon={<ICONS.stop />}
            onClick={handleEnd}
            disabled={ending}
            sx={getStartIconSpacing(dir)}
          >
            {t.endGame}
          </Button>
        )}

        {/* ══ ACTIVE SESSION CARD ══ */}
        {activeSession && (
          <Paper
            elevation={10}
            sx={{
              mt: 2,
              width: "100%",
              maxWidth: 700,
              mx: "auto",
              px: { xs: 3, sm: 5 },
              py: { xs: 4, sm: 5 },
              borderRadius: 4,
              background: "linear-gradient(135deg, #0f172a, #1e293b)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.35)",
              textAlign: "center",
              position: "relative",
              color: "#fff",
            }}
          >
            {/* LIVE chip */}
            <Box
              sx={{
                position: "absolute",
                top: 16,
                right: 20,
                display: "flex",
                alignItems: "center",
                gap: 0.8,
                px: 1.5,
                py: 0.4,
                bgcolor: "#4CAF50",
                borderRadius: 999,
                fontWeight: "bold",
                boxShadow: "0 0 10px 2px rgba(76,175,80,0.5)",
                fontSize: 11,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              <ICONS.flash sx={{ fontSize: 14 }} />
              LIVE
            </Box>

            <Typography
              variant="h5"
              fontWeight={800}
              sx={{ mb: 1, color: "#4CAF50", letterSpacing: 1 }}
            >
              {t.activeSession}
            </Typography>

            {/* X vs O */}
            <Stack
              direction="row"
              justifyContent="center"
              alignItems="center"
              spacing={1.5}
              sx={{ mb: 3 }}
            >
              <CrossZeroMarkVisual
                mark="X"
                xImage={activeSession?.gameId?.xImage}
                oImage={activeSession?.gameId?.oImage}
                size={26}
                fallbackSize="1.6rem"
              />
              <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.85rem" }}>
                vs
              </Typography>
              <CrossZeroMarkVisual
                mark="O"
                xImage={activeSession?.gameId?.xImage}
                oImage={activeSession?.gameId?.oImage}
                size={26}
                fallbackSize="1.6rem"
              />
            </Stack>

            {/* Live spectator board */}
            <SpectatorBoard board={activeSession?.xoStats?.board || []} xImage={activeSession?.gameId?.xImage} oImage={activeSession?.gameId?.oImage} />

            {/* Current turn */}
            <Stack
              direction="row"
              spacing={0.75}
              justifyContent="center"
              alignItems="center"
              sx={{ mt: 2 }}
            >
              <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.9rem" }}>
                {t.currentTurn}:
              </Typography>
              <CrossZeroMarkVisual
                mark={activeSession?.xoStats?.currentTurn}
                xImage={activeSession?.gameId?.xImage}
                oImage={activeSession?.gameId?.oImage}
                size={18}
                fallbackSize="1rem"
                color={activeSession?.xoStats?.currentTurn === "X" ? "#00e5ff" : "#ff6b6b"}
              />
            </Stack>

            {/* Player info */}
            <Grid container spacing={2} sx={{ mt: 2 }} justifyContent="center">
              {[
                {
                  label: t.player1,
                  mark: "X",
                  color: "#00e5ff",
                  player: activeSession.players?.find(
                    (p) => p.playerType === "p1"
                  ),
                },
                {
                  label: t.player2,
                  mark: "O",
                  color: "#ff6b6b",
                  player: activeSession.players?.find(
                    (p) => p.playerType === "p2"
                  ),
                },
              ].map(({ label, mark, color, player }) => (
                <Grid item xs={12} sm={6} key={label}>
                  <Box
                    sx={{
                      bgcolor: "rgba(255,255,255,0.06)",
                      border: `1.5px solid ${color}44`,
                      borderRadius: 3,
                      p: 2,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <CrossZeroMarkVisual
                      mark={mark}
                      xImage={activeSession?.gameId?.xImage}
                      oImage={activeSession?.gameId?.oImage}
                      size={22}
                      fallbackSize="1.3rem"
                      color={color}
                      shadow={`0 0 10px ${color}`}
                    />
                    <Typography
                      variant="caption"
                      sx={{ color: "rgba(255,255,255,0.55)" }}
                    >
                      {label}
                    </Typography>
                    <Typography fontWeight={700}>
                      {player?.playerId?.name || "—"}
                    </Typography>
                    {player?.playerId?.company && (
                      <Typography
                        variant="caption"
                        sx={{ color: "rgba(255,255,255,0.45)" }}
                      >
                        {player.playerId.company}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        {/* ══ PENDING SESSION CARD ══ */}
        {pendingSession && (
          <Paper
            elevation={6}
            sx={{
              p: 4,
              mt: 2,
              width: "100%",
              maxWidth: 700,
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
              sx={{ mb: 3, color: "white", textShadow: "0 0 10px rgba(255,255,255,0.3)" }}
            >
              {bothPlayersJoined ? t.bothPlayersJoined : t.waitingForPlayers}
            </Typography>

            <Grid container spacing={3} justifyContent="center">
              {[
                { label: t.player1, mark: "X", player: pendingP1 },
                { label: t.player2, mark: "O", player: pendingP2 },
              ].map(({ label, mark, player }) => (
                <Grid item xs={12} sm={6} key={label}>
                  <Box
                    sx={{
                      backgroundColor: player?.playerId ? "#4CAF50" : "#ffffff11",
                      border: `2px solid ${player?.playerId ? "#4caf50" : "#ffffff44"}`,
                      borderRadius: 4,
                      p: 2.5,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 1,
                      textAlign: "center",
                      animation: !player?.playerId
                        ? "waitingPulse 1.2s ease-in-out infinite"
                        : "none",
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: player?.playerId ? "success.dark" : "grey.700",
                        width: 48,
                        height: 48,
                      }}
                    >
                      <CrossZeroMarkVisual
                        mark={mark}
                        xImage={pendingSession?.gameId?.xImage}
                        oImage={pendingSession?.gameId?.oImage}
                        size={22}
                        fallbackSize="1.2rem"
                        color="#fff"
                        shadow="none"
                      />
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
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <ICONS.business sx={{ fontSize: 18 }} />
                      <Typography variant="caption" sx={{ color: "#e0f2f1" }}>
                        {player?.playerId?.company || "N/A"}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Abandon timer */}
            {!bothPlayersJoined && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {t.autoCloseNotice} <b>{abandonRemaining}</b> {t.seconds}.
                </Typography>
              </Box>
            )}

            <style jsx>{`
              @keyframes waitingPulse {
                0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.25); }
                70% { box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); }
                100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
              }
            `}</style>
          </Paper>
        )}

        {/* ══ PREVIOUS SESSION CARD ══ */}
        <Box sx={{ mt: 2, width: "100%", maxWidth: 700 }}>
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
              const p1 = session.players?.find((p) => p.playerType === "p1");
              const p2 = session.players?.find((p) => p.playerType === "p2");
              const result = session?.xoStats?.result;
              const isP1Winner = result === "O_wins";
              const isP2Winner = result === "X_wins";
              const isDraw = result === "draw";
              const winnerName = isP1Winner
                ? p1?.playerId?.name
                : isP2Winner
                ? p2?.playerId?.name
                : null;

              return (
                <Fade in timeout={500} key={session._id}>
                  <Paper
                    elevation={6}
                    sx={{
                      overflow: "hidden",
                      borderRadius: 4,
                      my: 3,
                      background: "linear-gradient(to bottom, #f7f7f7, #ffffff)",
                      boxShadow: "0px 6px 20px rgba(0,0,0,0.1)",
                    }}
                  >
                    {/* Winner banner */}
                    <Box
                      sx={{
                        background: winnerName
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
                      {winnerName && <ICONS.trophy sx={{ color: "#fff" }} />}
                      <Typography variant="h6" color="#fff" fontWeight="bold">
                        {winnerName || t.tie}
                      </Typography>
                    </Box>

                    {/* Players */}
                    <Box sx={{ px: { xs: 2, sm: 4 }, py: 3, position: "relative" }}>
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
                              background: isP1Winner
                                ? "linear-gradient(135deg, #A5D6A7, #C8E6C9)"
                                : "#f5f5f5",
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
                            <Box display="flex" alignItems="center" gap={1}>
                              <CrossZeroMarkVisual
                                mark="X"
                                xImage={session?.gameId?.xImage}
                                oImage={session?.gameId?.oImage}
                                size={24}
                                fallbackSize="1.4rem"
                              />
                              <Typography variant="h6" fontWeight="bold">
                                {p1?.playerId?.name || t.unknown}
                              </Typography>
                            </Box>
                            <Box display="flex" gap={1} alignItems="center">
                              <ICONS.business fontSize="small" />
                              <Typography variant="body2" color="text.secondary">
                                {p1?.playerId?.company || "N/A"}
                              </Typography>
                            </Box>
                            <Box display="flex" gap={1} alignItems="center">
                              <ICONS.time fontSize="small" />
                              <Typography variant="body2" color="text.secondary">
                                {t.timeTaken}:{" "}
                                {session?.xoStats?.timeTaken != null
                                  ? `${session.xoStats.timeTaken}s`
                                  : "0s"}
                              </Typography>
                            </Box>
                            <Box display="flex" gap={1} alignItems="center">
                              <ICONS.leaderboard fontSize="small" />
                              <Typography variant="body2" color="text.secondary">
                                {t.moves}: {session?.xoStats?.moves ?? 0}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>

                        {/* VS badge */}
                        <Box
                          sx={{
                            position: { xs: "static", sm: "absolute" },
                            top: "50%",
                            left: "50%",
                            transform: { xs: "none", sm: "translate(-50%, -50%)" },
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
                              background: isP2Winner
                                ? "linear-gradient(135deg, #A5D6A7, #C8E6C9)"
                                : "#f5f5f5",
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
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="h6" fontWeight="bold">
                                {p2?.playerId?.name || t.unknown}
                              </Typography>
                              <CrossZeroMarkVisual
                                mark="O"
                                xImage={session?.gameId?.xImage}
                                oImage={session?.gameId?.oImage}
                                size={24}
                                fallbackSize="1.4rem"
                              />
                            </Box>
                            <Box display="flex" gap={1} alignItems="center">
                              <Typography variant="body2" color="text.secondary">
                                {p2?.playerId?.company || "N/A"}
                              </Typography>
                              <ICONS.business fontSize="small" />
                            </Box>
                            <Box display="flex" gap={1} alignItems="center">
                              <Typography variant="body2" color="text.secondary">
                                {t.timeTaken}:{" "}
                                {session?.xoStats?.timeTaken != null
                                  ? `${session.xoStats.timeTaken}s`
                                  : "0s"}
                              </Typography>
                              <ICONS.time fontSize="small" />
                            </Box>
                            <Box display="flex" gap={1} alignItems="center">
                              <Typography variant="body2" color="text.secondary">
                                {t.moves}: {session?.xoStats?.moves ?? 0}
                              </Typography>
                              <ICONS.leaderboard fontSize="small" />
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
            <Box sx={{ mt: 2 }}>
              <NoDataAvailable />
            </Box>
          )}
        </Box>
      </Stack>
    </Container>
  );
}
