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
  useTheme,
} from "@mui/material";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import CrossZeroMarkVisual from "@/components/crosszero/CrossZeroMarkVisual";
import NoDataAvailable from "@/components/NoDataAvailable";
import useI18nLayout from "@/hooks/useI18nLayout";
import { toArabicDigits } from "@/utils/arabicDigits";
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
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
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
  const theme = useTheme();
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
          const color = cell === "X" ? theme.palette.crosszero.markX : cell === "O" ? theme.palette.crosszero.markO : "transparent";
          const glow = cell === "X" ? theme.palette.crosszero.markXGlowShadow : cell === "O" ? theme.palette.crosszero.markOGlowShadow : "none";
          const customImage = cell === "X" ? xImage : cell === "O" ? oImage : null;

          return (
            <Box
              key={i}
              sx={{
                aspectRatio: "1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: theme.palette.crosszero.boardCellBorder,
                borderRadius: 3,
                bgcolor: isWinning ? theme.palette.crosszero.boardCellBgWinning : theme.palette.crosszero.boardCellBg,
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
  const { t, dir, language } = useI18nLayout(translations);
  const { sessions, currentSession, requestAllSessions, connected } =
    useCrossZeroWebSocketData(gameSlug);
  const theme = useTheme();

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
              .catch(() => { });
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
    <Container dir={dir} maxWidth={false} disableGutters>
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
            <Typography
              variant="h5"
              sx={{
                fontWeight: "bold",
                mt: 2
              }}>
              {t.title}
            </Typography>
            <Typography variant="body2" sx={{
              color: "text.secondary"
            }}>
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
      <Stack spacing={3} sx={{
        alignItems: "center"
      }}>
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
              background: theme.palette.crosszero.hostCardGradient,
              boxShadow: theme.palette.crosszero.hostCardShadow,
              textAlign: "center",
              position: "relative",
              color: theme.palette.common.white,
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

                borderRadius: 999,
                fontWeight: "bold",
                bgcolor: theme.palette.crosszero.win,
                boxShadow: theme.palette.crosszero.liveChipShadow,
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
              sx={{
                fontWeight: 800,
                mb: 1,
                color: theme.palette.crosszero.win,
                letterSpacing: 1
              }}>
              {t.activeSession}
            </Typography>

            {/* X vs O */}
            <Stack
              direction="row"
              spacing={1.5}
              sx={{
                justifyContent: "center",
                alignItems: "center",
                mb: 3
              }}>
              <CrossZeroMarkVisual
                mark="X"
                xImage={activeSession?.gameId?.xImage}
                oImage={activeSession?.gameId?.oImage}
                size={26}
                fallbackSize="1.6rem"
              />
              <Typography sx={{ color: theme.palette.crosszero.sessionTextTertiary, fontSize: "0.85rem" }}>
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
              sx={{
                justifyContent: "center",
                alignItems: "center",
                mt: 2
              }}>
              <Typography sx={{ color: theme.palette.crosszero.sessionTextPrimary, fontSize: "0.9rem" }}>
                {t.currentTurn}:
              </Typography>
              <CrossZeroMarkVisual
                mark={activeSession?.xoStats?.currentTurn}
                xImage={activeSession?.gameId?.xImage}
                oImage={activeSession?.gameId?.oImage}
                size={18}
                fallbackSize="1rem"
                color={activeSession?.xoStats?.currentTurn === "X" ? theme.palette.crosszero.markX : theme.palette.crosszero.markO}
              />
            </Stack>

            {/* Player info */}
            <Grid
              container
              spacing={2}
              sx={{
                justifyContent: "center",
                mt: 2
              }}>
              {[
                {
                  label: t.player1,
                  mark: "O",
                  color: theme.palette.crosszero.markO,
                  player: activeSession.players?.find(
                    (p) => p.playerType === "p1"
                  ),
                },
                {
                  label: t.player2,
                  mark: "X",
                  color: theme.palette.crosszero.markX,
                  player: activeSession.players?.find(
                    (p) => p.playerType === "p2"
                  ),
                },
              ].map(({ label, mark, color, player }) => (
                <Grid
                  key={label}
                  size={{
                    xs: 12,
                    sm: 6
                  }}>
                  <Box
                    sx={{
                      bgcolor: theme.palette.crosszero.playerCardBg,
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
                      sx={{ color: theme.palette.crosszero.sessionTextSecondary }}
                    >
                      {label}
                    </Typography>
                    <Typography sx={{
                      fontWeight: 700
                    }}>
                      {player?.playerId?.name || "—"}
                    </Typography>
                    {player?.playerId?.company && (
                      <Typography sx={{ color: theme.palette.crosszero.sessionTextTertiary, fontSize: "0.85rem" }}>

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
              background: theme.palette.crosszero.pendingCardGradient,
              borderRadius: 6,
              color: theme.palette.common.white,
              textAlign: "center",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                mb: 3,
                color: theme.palette.common.white,
                textShadow: theme.palette.crosszero.pendingTextShadow
              }}>
              {bothPlayersJoined ? t.bothPlayersJoined : t.waitingForPlayers}
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "center" }}>
              {[
                { label: t.player1, mark: "O", player: pendingP1 },
                { label: t.player2, mark: "X", player: pendingP2 },
              ].map(({ label, mark, player }) => (
                <Box
                  key={label}
                  sx={{
                    backgroundColor: player?.playerId
                      ? theme.palette.crosszero.playerSlotFilled
                      : theme.palette.crosszero.playerSlotEmpty,
                    border: `2px solid ${player?.playerId
                      ? theme.palette.crosszero.playerSlotBorderFilled
                      : theme.palette.crosszero.playerSlotBorderEmpty
                      }`,
                    borderRadius: 4,
                    p: 2.5,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                    width: { xs: "100%", sm: 220 },
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
                      color={theme.palette.common.white}
                      shadow="none"
                    />
                  </Avatar>
                  <Typography variant="caption" sx={{ color: theme.palette.crosszero.pendingSecondaryText }}>
                    {label}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: "bold",
                      color: theme.palette.common.white,
                      wordWrap: "break-word"
                    }}>
                    {player?.playerId?.name || ""}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5
                    }}>
                    <ICONS.business sx={{ fontSize: 18 }} />
                    <Typography variant="caption" sx={{ color: theme.palette.crosszero.pendingSecondaryText }}>
                      {player?.playerId?.company || "N/A"}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Abandon timer */}
            {!bothPlayersJoined && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {t.autoCloseNotice} <b>{toArabicDigits(abandonRemaining, language)}</b> {t.seconds}.
                </Typography>
              </Box>
            )}

            <style jsx>{`
              @keyframes waitingPulse {
               0% { box-shadow: 0 0 0 0 ${theme.palette.crosszero.waitingPulseGlow}; }
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
            sx={{
              fontWeight: "bold",
              textAlign: "center",
              color: "primary.dark"
            }}>
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
                      background: theme.palette.crosszero.previousSessionGradient,
                      boxShadow: theme.palette.crosszero.previousSessionShadow,
                    }}
                  >
                    {/* Winner banner */}
                    <Box
                      sx={{
                        background: winnerName
                          ? theme.palette.crosszero.winnerBannerGradient
                          : theme.palette.crosszero.tieBannerGradient,
                        px: 3,
                        py: 1.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1,
                      }}
                    >
                      {winnerName && <ICONS.trophy sx={{ color: theme.palette.common.white }} />}
                      <Typography
                        variant="h6"
                        sx={{
                          color: theme.palette.common.white,

                          fontWeight: "bold"
                        }}>
                        {winnerName || t.tie}
                      </Typography>
                    </Box>

                    {/* Players */}
                    <Box sx={{ px: { xs: 2, sm: 4 }, py: 3, position: "relative" }}>
                      <Grid
                        container
                        spacing={3}
                        direction={{ xs: "column", sm: "row" }}
                        sx={{
                          alignItems: "stretch",
                          justifyContent: "space-between"
                        }}>
                        {/* Player 1 */}
                        <Grid
                          size={{
                            xs: 12,
                            sm: 5.5
                          }}>
                          <Box
                            sx={{
                              background: isP1Winner
                                ? theme.palette.crosszero.winnerCellGradient
                                : theme.palette.crosszero.loserCellBg,
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
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1
                              }}>
                              <CrossZeroMarkVisual
                                mark="O"
                                xImage={session?.gameId?.xImage}
                                oImage={session?.gameId?.oImage}
                                size={24}
                                fallbackSize="1.4rem"
                              />
                              <Typography variant="h6" sx={{
                                fontWeight: "bold"
                              }}>
                                {p1?.playerId?.name || t.unknown}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                alignItems: "center"
                              }}>
                              <ICONS.business fontSize="small" />
                              <Typography variant="body2" sx={{
                                color: "text.secondary"
                              }}>
                                {p1?.playerId?.company || "N/A"}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                alignItems: "center"
                              }}>
                              <ICONS.time fontSize="small" />
                              <Typography variant="body2" sx={{
                                color: "text.secondary"
                              }}>
                                {t.timeTaken}:{" "}
                                {toArabicDigits(session?.xoStats?.timeTaken != null
                                  ? `${session.xoStats.timeTaken}s`
                                  : "0s", language)}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                alignItems: "center"
                              }}>
                              <ICONS.leaderboard fontSize="small" />
                              <Typography variant="body2" sx={{
                                color: "text.secondary"
                              }}>
                                {t.moves}: {toArabicDigits(session?.xoStats?.moves ?? 0, language)}
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
                            bgcolor: theme.palette.crosszero.vsBadgeBg,
                            border: theme.palette.crosszero.vsBadgeBorder,
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
                        <Grid
                          size={{
                            xs: 12,
                            sm: 5.5
                          }}>
                          <Box
                            sx={{
                              background: isP2Winner
                                ? theme.palette.crosszero.winnerCellGradient
                                : theme.palette.crosszero.loserCellBg,
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
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1
                              }}>
                              <Typography variant="h6" sx={{
                                fontWeight: "bold"
                              }}>
                                {p2?.playerId?.name || t.unknown}
                              </Typography>
                              <CrossZeroMarkVisual
                                mark="X"
                                xImage={session?.gameId?.xImage}
                                oImage={session?.gameId?.oImage}
                                size={24}
                                fallbackSize="1.4rem"
                              />
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                alignItems: "center"
                              }}>
                              <Typography variant="body2" sx={{
                                color: "text.secondary"
                              }}>
                                {p2?.playerId?.company || "N/A"}
                              </Typography>
                              <ICONS.business fontSize="small" />
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                alignItems: "center"
                              }}>
                              <Typography variant="body2" sx={{
                                color: "text.secondary"
                              }}>
                                {t.timeTaken}:{" "}
                                {toArabicDigits(session?.xoStats?.timeTaken != null
                                  ? `${session.xoStats.timeTaken}s`
                                  : "0s", language)}
                              </Typography>
                              <ICONS.time fontSize="small" />
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                alignItems: "center"
                              }}>
                              <Typography variant="body2" sx={{
                                color: "text.secondary"
                              }}>
                                {t.moves}: {toArabicDigits(session?.xoStats?.moves ?? 0, language)}
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
