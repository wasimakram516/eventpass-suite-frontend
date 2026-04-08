"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography, Button, CircularProgress, Paper, Stack, IconButton, LinearProgress, Fade } from "@mui/material";
import Confetti from "react-confetti";
import { useGame } from "@/contexts/GameContext";
import useCrossZeroWebSocketData from "@/hooks/modules/crosszero/useCrossZeroWebSocketData";
import CrossZeroMarkVisual from "@/components/crosszero/CrossZeroMarkVisual";
import { submitResult } from "@/services/crosszero/playerService";
import {
  abandonGameSession,
  activateGameSession,
} from "@/services/crosszero/gameSessionService";
import LanguageSelector from "@/components/LanguageSelector";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

// â”€â”€â”€ Translations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const translations = {
  en: {
    chooseDifficulty: "Choose Difficulty",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    easyDesc: "Random moves",
    mediumDesc: "Mixed strategy",
    hardDesc: "Unbeatable AI",
    getReady: "Get Ready!",
    waiting: "Waiting for opponent...",
    waitingForSession: "Waiting for session...",
    waitingForPlayers: "Waiting for both players to join...",
    bothPlayersJoined: "Both players have joined!",
    autoCloseNotice:
      "This session will auto-close if both players do not join within",
    sessionClosed: "Session closed",
    sessionClosedMessage:
      "This session ended before the match started. Please return to the lobby and try again.",
    yourTurn: "Your Turn",
    opponentTurn: "Opponent's Turn",
    youWin: "You Win!",
    youLose: "You Lose!",
    itsDraw: "It's a Draw!",
    aiWins: "AI Wins!",
    playerWins: "You Win!",
    playAgain: "Play Again",
    backToLobby: "Back to Lobby",
    startGame: "Start Game",
    anyPlayerCanStart: "Either player can start once both have joined.",
    joinedAs: "Joined as",
    player1: "Player 1",
    player2: "Player 2",
    emptySlot: "Waiting...",
    vsAI: "vs AI",
    vs: "vs",
    moveTimer: "Move timer",
    timeTaken: "Time Taken",
    seconds: "s",
  },
  ar: {
    chooseDifficulty: "اختر مستوى الصعوبة",
    easy: "سهل",
    medium: "متوسط",
    hard: "صعب",
    easyDesc: "حركات عشوائية",
    mediumDesc: "استراتيجية مختلطة",
    hardDesc: "ذكاء اصطناعي لا يُهزم",
    getReady: "استعد!",
    waiting: "بانتظار الخصم...",
    waitingForSession: "بانتظار الجلسة...",
    waitingForPlayers: "بانتظار انضمام اللاعبين معًا...",
    bothPlayersJoined: "انضم اللاعبان!",
    autoCloseNotice: "سيتم إغلاق الجلسة تلقائيًا إذا لم ينضم اللاعبان خلال",
    sessionClosed: "تم إغلاق الجلسة",
    sessionClosedMessage:
      "انتهت هذه الجلسة قبل بدء المباراة. ارجع إلى الواجهة الرئيسية وحاول مرة أخرى.",
    yourTurn: "دورك",
    opponentTurn: "دور الخصم",
    youWin: "لقد فزت!",
    youLose: "لقد خسرت!",
    itsDraw: "تعادل!",
    aiWins: "فاز الذكاء الاصطناعي!",
    playerWins: "لقد فزت!",
    playAgain: "العب مرة أخرى",
    backToLobby: "العودة إلى الواجهة",
    startGame: "ابدأ اللعبة",
    anyPlayerCanStart: "يمكن لأي لاعب بدء المباراة بعد انضمام الطرفين.",
    joinedAs: "الانضمام بصفة",
    player1: "اللاعب الأول",
    player2: "اللاعب الثاني",
    emptySlot: "بانتظار اللاعب...",
    vsAI: "ضد الذكاء الاصطناعي",
    vs: "ضد",
    moveTimer: "مؤقت الحركة",
    timeTaken: "الوقت المستغرق",
    seconds: "ث",
  },
};

// â”€â”€â”€ Game Logic â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const WINNING_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
const PLAYER_TYPE_MARK = { p1: "X", p2: "O" };
const MARK_PLAYER_TYPE = { X: "p1", O: "p2" };

function checkWinner(board) {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  return null;
}

function getWinningLine(board) {
  return checkWinner(board)?.line || null;
}

function minimax(board, isMaximizing) {
  const result = checkWinner(board);
  if (result?.winner === "O") return 10;
  if (result?.winner === "X") return -10;
  if (board.every(Boolean)) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = "O";
        best = Math.max(best, minimax(board, false));
        board[i] = null;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = "X";
        best = Math.min(best, minimax(board, true));
        board[i] = null;
      }
    }
    return best;
  }
}

function getBestMove(board) {
  let best = -Infinity, move = -1;
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = "O";
      const score = minimax(board, false);
      board[i] = null;
      if (score > best) { best = score; move = i; }
    }
  }
  return move;
}

function getRandomMove(board) {
  const empty = board.map((v, i) => (!v ? i : -1)).filter((i) => i !== -1);
  return empty[Math.floor(Math.random() * empty.length)];
}

function getAIMove(board, difficulty) {
  if (difficulty === "easy") return getRandomMove(board);
  if (difficulty === "medium") return Math.random() < 0.5 ? getBestMove([...board]) : getRandomMove(board);
  return getBestMove([...board]);
}

// â”€â”€â”€ Cell Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Cell({ value, index, onClick, isWinning, disabled, xImage, oImage }) {
  const isX = value === "X";
  const isO = value === "O";
  const color = isX ? "#00e5ff" : isO ? "#ff6b6b" : "transparent";
  const glow = isX ? "0 0 20px #00e5ff" : isO ? "0 0 20px #ff6b6b" : "none";
  const customImage = isX ? xImage : isO ? oImage : null;

  return (
    <Box
      onClick={() => !disabled && !value && onClick(index)}
      sx={{
        width: { xs: 90, sm: 110, md: 130 },
        height: { xs: 90, sm: 110, md: 130 },
        display: "flex", alignItems: "center", justifyContent: "center",
        border: "1.5px solid rgba(255,255,255,0.1)",
        borderRadius: 3,
        cursor: disabled || value ? "default" : "pointer",
        bgcolor: isWinning ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
        backdropFilter: "blur(4px)",
        transition: "all 0.2s",
        boxShadow: isWinning ? `inset 0 0 20px ${color}40` : "none",
        "&:hover": (!disabled && !value) ? { bgcolor: "rgba(255,255,255,0.06)", transform: "scale(1.03)" } : {},
      }}
    >
      {value && (
        customImage ? (
          <Box component="img" src={customImage} alt={isX ? "X" : "O"}
            sx={{ width: "62%", height: "62%", objectFit: "contain", filter: isWinning ? `drop-shadow(${glow})` : "none", userSelect: "none" }} />
        ) : (
          <Typography sx={{
            fontSize: { xs: "2.4rem", sm: "3rem", md: "3.6rem" },
            fontWeight: 900,
            color,
            textShadow: glow,
            userSelect: "none",
            lineHeight: 1,
          }}>
            {isX ? "✕" : "○"}
          </Typography>
        )
      )}
    </Box>
  );
}

// â”€â”€â”€ Move Timer Bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function MoveTimerBar({ seconds, maxSeconds, isMyTurn }) {
  const pct = (seconds / maxSeconds) * 100;
  const color = pct > 50 ? "#00e5ff" : pct > 25 ? "#ffb300" : "#ff4444";
  return (
    <Box sx={{ width: "100%", mb: 1 }}>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 6, borderRadius: 3,
          bgcolor: "rgba(255,255,255,0.08)",
          "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3, transition: "width 1s linear" },
        }}
      />
    </Box>
  );
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function CrossZeroPlayPage() {
  const { game, loading } = useGame();
  const router = useRouter();
  const { t, dir } = useI18nLayout(translations);
  const {
    sessions,
    currentSession,
    setCurrentSession,
    requestAllSessions,
    makeMove,
    connected,
  } = useCrossZeroWebSocketData(game?.slug);

  // Session info
  const [playerMark, setPlayerMark] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [soloPlayerName, setSoloPlayerName] = useState("");
  const [playerInfo, setPlayerInfo] = useState(null);

  // Game phase: "difficulty" | "countdown" | "waiting" | "playing" | "result"
  const [phase, setPhase] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [starting, setStarting] = useState(false);
  const [abandonRemaining, setAbandonRemaining] = useState(60);

  // AI mode local state
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentTurn, setCurrentTurn] = useState("X");
  const [winResult, setWinResult] = useState(null); // { winner, line } | "draw"
  const [aiThinking, setAiThinking] = useState(false);
  const [aiResultSummary, setAiResultSummary] = useState({ timeTaken: 0, moves: 0 });

  // Move timer
  const [moveTimeLeft, setMoveTimeLeft] = useState(null);
  const moveTimerRef = useRef(null);
  const aiMoveTimeoutRef = useRef(null);
  const countdownRef = useRef(null);
  const gameStartTimeRef = useRef(null);

  // Celebration sound
  const celebrateSoundRef = useRef(
    typeof Audio !== "undefined" ? new Audio("/celebrate.mp3") : null
  );
  const celebrationPlayedRef = useRef(false);

  // Refs for stable closures
  const boardRef = useRef(board);
  const phaseRef = useRef(phase);
  boardRef.current = board;
  phaseRef.current = phase;
  const isAIMode = game?.mode === "solo";

  useEffect(() => {
    return () => {
      clearInterval(moveTimerRef.current);
      clearTimeout(aiMoveTimeoutRef.current);
      clearInterval(countdownRef.current);
    };
  }, []);

  // â”€â”€ Init â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const mark = sessionStorage.getItem("playerMark") || "X";
    const pid = sessionStorage.getItem("playerId");
    const sid = sessionStorage.getItem("sessionId");
    const storedPlayerInfo = sessionStorage.getItem("playerInfo");
    setPlayerMark(mark);
    setPlayerId(pid);
    setSessionId(sid);
    if (storedPlayerInfo) {
      try {
        const parsed = JSON.parse(storedPlayerInfo);
        setSoloPlayerName(parsed?.name || "");
        setPlayerInfo(parsed);
      } catch {
        setSoloPlayerName("");
        setPlayerInfo(null);
      }
    } else {
      setPlayerInfo(null);
    }

    if (game?.mode === "solo") {
      setPhase("difficulty");
    } else {
      setPhase("waiting");
    }
  }, [game?.mode]);

  const matchingSession = useMemo(() => {
    if (!sessionId) return null;
    if (currentSession?._id === sessionId) return currentSession;
    return sessions.find((session) => session._id === sessionId) || null;
  }, [currentSession, sessionId, sessions]);

  const pendingSession = useMemo(() => {
    if (matchingSession?.status === "pending") return matchingSession;
    if (currentSession?.status === "pending") return currentSession;
    return sessions.find((session) => session.status === "pending") || null;
  }, [currentSession, matchingSession, sessions]);

  const activePvPSession = useMemo(() => {
    if (matchingSession?.status === "active") return matchingSession;
    if (currentSession?.status === "active") return currentSession;
    return sessions.find((session) => session.status === "active") || null;
  }, [currentSession, matchingSession, sessions]);

  const completedPvPSession = useMemo(() => {
    if (matchingSession?.status === "completed") return matchingSession;
    if (currentSession?._id === sessionId && currentSession?.status === "completed") return currentSession;
    // Do NOT fall through to arbitrary completed sessions — that would show results from previous games
    return null;
  }, [currentSession, matchingSession, sessionId]);

  const abandonedSession = useMemo(() => {
    if (matchingSession?.status === "abandoned") return matchingSession;
    if (currentSession?.status === "abandoned") return currentSession;
    return null;
  }, [currentSession, matchingSession]);

  useEffect(() => {
    if (game?.mode !== "pvp" || !connected || !game?.slug) return;
    requestAllSessions();
  }, [connected, game?.mode, game?.slug, requestAllSessions]);

  useEffect(() => {
    if (game?.mode !== "pvp") return;

    const nextSession =
      matchingSession ||
      activePvPSession ||
      pendingSession ||
      completedPvPSession ||
      abandonedSession;

    if (nextSession && currentSession?._id !== nextSession._id) {
      setCurrentSession(nextSession);
    }
  }, [
    abandonedSession,
    activePvPSession,
    completedPvPSession,
    currentSession?._id,
    game?.mode,
    matchingSession,
    pendingSession,
    setCurrentSession,
  ]);

  // â”€â”€ PvP: watch session status â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (game?.mode !== "pvp") return;
    if (activePvPSession?.status === "active" && phase === "waiting") {
      startCountdown();
    }
    if (completedPvPSession?.status === "completed") {
      setPhase("result");
    }
  }, [activePvPSession?.status, completedPvPSession?.status, game?.mode, phase]);

  // â”€â”€ Countdown â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const startCountdown = useCallback(() => {
    clearInterval(countdownRef.current);
    setCountdown(3);
    setPhase("countdown");
    let c = 3;
    countdownRef.current = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(countdownRef.current);
        gameStartTimeRef.current = Date.now();
        setPhase("playing");
        if (game?.moveTimer > 0) setMoveTimeLeft(game.moveTimer);
      }
    }, 1000);
  }, [game?.moveTimer]);

  const triggerCelebration = useCallback(() => {
    if (celebrationPlayedRef.current) return;
    celebrationPlayedRef.current = true;
    if (celebrateSoundRef.current) {
      celebrateSoundRef.current.currentTime = 0;
      celebrateSoundRef.current.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (game?.mode !== "pvp" || !pendingSession?._id) return;

    const hasP1 = pendingSession.players?.some(
      (player) => player.playerType === "p1" && player.playerId
    );
    const hasP2 = pendingSession.players?.some(
      (player) => player.playerType === "p2" && player.playerId
    );

    setAbandonRemaining(60);
    if (hasP1 && hasP2) return;

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
  }, [game?.mode, pendingSession?._id, pendingSession?.players, requestAllSessions]);

  useEffect(() => {
    const isSoloWinner =
      game?.mode === "solo" &&
      phase === "result" &&
      winResult &&
      winResult !== "draw" &&
      winResult.winner === playerMark;
    const isPvPWinner =
      game?.mode === "pvp" &&
      completedPvPSession?.xoStats?.result === `${playerMark}_wins`;
    const shouldCelebrate = Boolean(isSoloWinner || isPvPWinner);

    if (!shouldCelebrate) {
      celebrationPlayedRef.current = false;
      return;
    }
    triggerCelebration();
  }, [completedPvPSession?.xoStats?.result, game?.mode, phase, playerMark, triggerCelebration, winResult]);

  // â”€â”€ Move timer tick (AI mode only, player's turn only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (game?.mode !== "solo" || phase !== "playing" || !game?.moveTimer) return;
    if (currentTurn !== playerMark) { clearInterval(moveTimerRef.current); return; }
    clearInterval(moveTimerRef.current);
    setMoveTimeLeft(game.moveTimer);
    moveTimerRef.current = setInterval(() => {
      setMoveTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(moveTimerRef.current);
          // Auto-play random move on timeout
          const b = [...boardRef.current];
          if (phaseRef.current === "playing") {
            const idx = getRandomMove(b);
            if (idx !== undefined && idx !== -1) {
              handleCellClick(idx, true);
            }
          }
          return game.moveTimer;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(moveTimerRef.current);
  }, [currentTurn, phase, game?.mode, game?.moveTimer]);

  // â”€â”€ AI move â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    clearTimeout(aiMoveTimeoutRef.current);
    if (game?.mode !== "solo" || phase !== "playing" || currentTurn !== "O" || winResult) {
      setAiThinking(false);
      return;
    }
    setAiThinking(true);
    const delay = 400 + Math.random() * 300;
    aiMoveTimeoutRef.current = setTimeout(() => {
      const b = [...boardRef.current];
      const idx = getAIMove(b, difficulty);
      if (idx !== undefined && idx !== -1 && !b[idx]) {
        b[idx] = "O";
        const result = checkWinner(b);
        setBoard(b);
        if (result) {
          setWinResult(result);
          setPhase("result");
          handleAIGameEnd(b, result.winner);
        } else if (b.every(Boolean)) {
          setWinResult("draw");
          setPhase("result");
          handleAIGameEnd(b, null);
        } else {
          setCurrentTurn("X");
        }
      }
      setAiThinking(false);
    }, delay);
    return () => clearTimeout(aiMoveTimeoutRef.current);
  }, [currentTurn, phase, winResult, difficulty, game?.mode]);

  // â”€â”€ Cell click (AI mode) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleCellClick = useCallback((index, isAuto = false) => {
    if (phase !== "playing" || game?.mode !== "solo") return;
    if (!isAuto && currentTurn !== playerMark) return;
    const b = [...boardRef.current];
    if (b[index]) return;

    clearInterval(moveTimerRef.current);
    b[index] = currentTurn;
    const result = checkWinner(b);
    setBoard(b);

    if (result) {
      setWinResult(result);
      setPhase("result");
      if (result.winner === playerMark) triggerCelebration();
      handleAIGameEnd(b, result.winner);
    } else if (b.every(Boolean)) {
      setWinResult("draw");
      setPhase("result");
      handleAIGameEnd(b, null);
    } else {
      setCurrentTurn((prev) => (prev === "X" ? "O" : "X"));
    }
  }, [phase, currentTurn, playerMark, game?.mode, triggerCelebration]);

  // â”€â”€ Submit AI result â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleAIGameEnd = useCallback(async (finalBoard, winner) => {
    const timeTaken = gameStartTimeRef.current ? Math.floor((Date.now() - gameStartTimeRef.current) / 1000) : 0;
    const moves = finalBoard.filter(Boolean).length;
    const result = winner === null ? "draw" : winner === playerMark ? `${playerMark}_wins` : `${winner}_wins`;

    setAiResultSummary({ timeTaken, moves });

    if (playerId && sessionId) {
      await submitResult(sessionId, playerId, {
        result,
        timeTaken,
        moves,
        board: finalBoard,
        difficulty,
      });
    }
  }, [playerId, sessionId, difficulty, playerMark]);


  // â”€â”€â”€ Render helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Active board + stats for current render
  const livePvPSession =
    completedPvPSession || activePvPSession || pendingSession || currentSession;
  const activeBoard = isAIMode ? board : (livePvPSession?.xoStats?.board || Array(9).fill(null));
  const activeTurn = isAIMode ? currentTurn : livePvPSession?.xoStats?.currentTurn;
  const activeResult = isAIMode ? winResult : livePvPSession?.xoStats?.result;
  const winLine = isAIMode
    ? (winResult && winResult !== "draw" ? winResult.line : null)
    : getWinningLine(activeBoard);

  const isMyTurn = activeTurn === playerMark;
  const isResult = phase === "result" || (!isAIMode && Boolean(activeResult));
  const isDraw = isAIMode ? winResult === "draw" : activeResult === "draw";
  const isPlayerWinner = isAIMode
    ? phase === "result" && winResult?.winner === playerMark
    : activeResult === `${playerMark}_wins`;
  const bothPlayersJoined = Boolean(
    pendingSession?.players?.some(
      (player) => player.playerType === "p1" && player.playerId
    ) &&
      pendingSession?.players?.some(
        (player) => player.playerType === "p2" && player.playerId
      )
  );
  const playerRoleLabel =
    MARK_PLAYER_TYPE[playerMark] === "p1"
      ? (t.player1 || "Player 1")
      : (t.player2 || "Player 2");
  const resultLabel = isDraw
    ? t.itsDraw
    : isPlayerWinner
      ? (isAIMode ? t.playerWins : t.youWin)
      : (isAIMode ? t.aiWins : t.youLose);
  const showConfetti = isResult && !isDraw && isPlayerWinner;
  const playerMarkColor = playerMark === "X" ? "#00e5ff" : "#ff6b6b";
  const opponentMark = playerMark === "X" ? "O" : "X";
  const opponentMarkColor = opponentMark === "X" ? "#00e5ff" : "#ff6b6b";
  const playerSession = isAIMode
    ? null
    : livePvPSession?.players?.find((player) => PLAYER_TYPE_MARK[player.playerType] === playerMark);
  const opponentSession = isAIMode
    ? null
    : livePvPSession?.players?.find((player) => PLAYER_TYPE_MARK[player.playerType] === opponentMark);
  const displayPlayerName = isAIMode
    ? soloPlayerName
    : playerInfo?.name || playerSession?.playerId?.name;
  const resultSummary = isAIMode
    ? aiResultSummary
    : {
        timeTaken: livePvPSession?.xoStats?.timeTaken ?? 0,
        moves: livePvPSession?.xoStats?.moves ?? activeBoard.filter(Boolean).length,
      };
  const resultBackgroundGradient = isDraw
    ? "linear-gradient(135deg, #FFC107CC, #FF9800CC)"
    : isPlayerWinner
      ? "linear-gradient(135deg, #4CAF50CC, #388E3CCC)"
      : "linear-gradient(135deg, #F44336CC, #E53935CC)";
  const handlePvPCellClick = useCallback((index) => {
    if (phase !== "playing" || game?.mode !== "pvp") return;
    const xoStats = livePvPSession?.xoStats;
    if (!xoStats) return;
    if (xoStats.result) return;
    if (xoStats.currentTurn !== playerMark) return;
    if (xoStats.board[index]) return;
    if (!sessionId || !playerId) return;
    makeMove(sessionId, playerId, index);
  }, [phase, game?.mode, livePvPSession, playerMark, sessionId, playerId, makeMove]);

  const handlePlayerActivate = useCallback(async () => {
    if (!pendingSession?._id || !bothPlayersJoined || starting) return;

    try {
      setStarting(true);
      await activateGameSession(pendingSession._id);
      requestAllSessions();
    } finally {
      setStarting(false);
    }
  }, [bothPlayersJoined, pendingSession?._id, requestAllSessions, starting]);

  const handlePlayAgain = () => {
    setBoard(Array(9).fill(null));
    setCurrentTurn("X");
    setWinResult(null);
    setAiThinking(false);
    setAiResultSummary({ timeTaken: 0, moves: 0 });
    celebrationPlayedRef.current = false;
    clearInterval(moveTimerRef.current);
    clearTimeout(aiMoveTimeoutRef.current);
    clearInterval(countdownRef.current);
    if (game?.moveTimer > 0) setMoveTimeLeft(game.moveTimer);
    if (isAIMode) {
      setPhase("difficulty");
      setDifficulty(null);
    } else {
      router.replace(`/crosszero/${game.slug}`);
    }
  };

  // â”€â”€â”€ Loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (loading || !game || !playerMark) {
    return (
      <Box sx={{ height: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  // â”€â”€â”€ Shared wrapper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const PageWrapper = ({ children }) => (
    <Box
      dir={dir}
      sx={{
        minHeight: "100vh", width: "100vw",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        backgroundImage: `url(${game.coverImage || game.nameImage || game.backgroundImage})`,
        backgroundSize: "cover", backgroundPosition: "center",
        backgroundAttachment: "fixed", px: 2, py: 4,
        position: "relative",
      }}
    >
      <LanguageSelector top={20} right={20} />
      <IconButton
        size="small"
        onClick={() => router.replace(`/crosszero/${game.slug}`)}
        sx={{ position: "fixed", top: 20, left: 20, bgcolor: "rgba(0,0,0,0.5)", color: "white" }}
      >
        <ICONS.back />
      </IconButton>
      {children}
    </Box>
  );

  // â”€â”€â”€ Phase: difficulty â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (phase === "difficulty") {
    const levels = [
      { id: "easy", label: t.easy, desc: t.easyDesc, color: "#00e676", glow: "rgba(0,230,118,0.4)" },
      { id: "medium", label: t.medium, desc: t.mediumDesc, color: "#ffb300", glow: "rgba(255,179,0,0.4)" },
      { id: "hard", label: t.hard, desc: t.hardDesc, color: "#ff4444", glow: "rgba(255,68,68,0.4)" },
    ];
    return (
      <PageWrapper>
        <Paper
          elevation={8}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: 6,
            bgcolor: "rgba(10,10,20,0.78)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
            maxWidth: 420,
            width: "100%",
          }}
        >
          <Typography variant="h5" fontWeight={800} sx={{ color: "#fff", mb: 1, textAlign: "center", textShadow: "0 2px 16px #000" }}>
            {displayPlayerName || game.title}
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.5)", mb: 4, textAlign: "center", fontSize: "0.9rem" }}>
            {t.chooseDifficulty}
          </Typography>
          <Stack spacing={2} sx={{ width: "100%" }}>
            {levels.map((lvl) => (
              <Paper
                key={lvl.id}
                onClick={() => { setDifficulty(lvl.id); startCountdown(); }}
                elevation={0}
                sx={{
                  p: 2.5, cursor: "pointer", borderRadius: 4,
                  border: `1.5px solid ${lvl.color}40`,
                  bgcolor: "rgba(255,255,255,0.08)",
                  backdropFilter: "blur(12px)",
                  transition: "all 0.2s",
                  "&:hover": { transform: "translateY(-3px)", boxShadow: `0 12px 28px ${lvl.glow}`, border: `1.5px solid ${lvl.color}` },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: lvl.color, boxShadow: `0 0 10px ${lvl.glow}` }} />
                  <Box>
                    <Typography sx={{ color: lvl.color, fontWeight: 800, fontSize: "1rem" }}>{lvl.label}</Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.8rem" }}>{lvl.desc}</Typography>
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Paper>
      </PageWrapper>
    );
  }

  // â”€â”€â”€ Phase: countdown â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (phase === "countdown") {
    return (
      <Box
        dir={dir}
        sx={{
          position: "relative",
          minHeight: "100vh",
          width: "100vw",
          backgroundImage: `url(${game.coverImage || game.nameImage || game.backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          overflow: "hidden",
        }}
      >
        <LanguageSelector top={20} right={20} />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.85), rgba(0,0,0,0.65))",
            backdropFilter: "blur(8px)",
          }}
        />
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            color: "#fff",
            px: 3,
          }}
        >
          <Typography
            variant="h3"
            sx={{
              mb: 4,
              fontWeight: "bold",
              textShadow: "0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(0,255,255,0.6)",
              letterSpacing: "2px",
              animation: "pulseText 2s infinite",
              fontSize: { xs: "1.5rem", sm: "2.75rem" },
            }}
          >
            {t.getReady}
          </Typography>
          <Typography
            variant="h1"
            sx={{
              fontWeight: "bold",
              fontSize: { xs: "8rem", sm: "10rem" },
              color: "warning.light",
              textShadow: "0 0 20px rgba(255,215,0,0.9)",
              animation: "pulse 1s infinite alternate",
              lineHeight: 1,
            }}
          >
            {countdown || "GO!"}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              mt: 3,
              opacity: 0.7,
              fontStyle: "italic",
              animation: "blink 1.5s infinite",
              maxWidth: 480,
            }}
          >
            {t.countdownMessage || "The game will begin in a few seconds..."}
          </Typography>
        </Box>
      </Box>
    );
  }

  // â”€â”€â”€ Phase: waiting (PvP) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (phase === "waiting") {
    if (game?.mode === "pvp" && abandonedSession && !pendingSession && !activePvPSession) {
      return (
        <PageWrapper>
          <Paper
            elevation={8}
            sx={{
              p: { xs: 3, sm: 4 },
              borderRadius: 6,
              maxWidth: 520,
              width: "100%",
              textAlign: "center",
              bgcolor: "rgba(10,10,20,0.84)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
            }}
          >
            <Typography variant="h5" fontWeight={800} sx={{ mb: 1.5 }}>
              {t.sessionClosed || "Session closed"}
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.72)", mb: 3 }}>
              {t.sessionClosedMessage || "This session ended before the match started. Please return to the lobby and try again."}
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={() => router.replace(`/crosszero/${game.slug}`)}
              startIcon={<ICONS.back />}
              sx={getStartIconSpacing(dir)}
            >
              {t.backToLobby}
            </Button>
          </Paper>
        </PageWrapper>
      );
    }

    if (game?.mode === "pvp" && pendingSession) {
      const p1 = pendingSession.players?.find((player) => player.playerType === "p1");
      const p2 = pendingSession.players?.find((player) => player.playerType === "p2");
      const playerRoleLabel =
        MARK_PLAYER_TYPE[playerMark] === "p1"
          ? (t.player1 || "Player 1")
          : (t.player2 || "Player 2");

      return (
        <PageWrapper>
          <Paper
            elevation={8}
            sx={{
              p: { xs: 2.5, sm: 3.5 },
              borderRadius: 6,
              bgcolor: "rgba(10,10,20,0.84)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
              maxWidth: 560,
              width: "100%",
            }}
          >
            <Typography
              variant="h5"
              fontWeight={800}
              sx={{ color: "#fff", textAlign: "center", mb: 1 }}
            >
              {displayPlayerName || game.title}
            </Typography>
            <Stack
              direction="row"
              justifyContent="center"
              alignItems="center"
              spacing={1}
              sx={{ mb: 3, flexWrap: "wrap" }}
            >
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.72)",
                  textAlign: "center",
                  fontSize: "0.9rem",
                }}
              >
                {(t.joinedAs || "Joined as")} {playerRoleLabel}
              </Typography>
              <CrossZeroMarkVisual
                mark={playerMark}
                xImage={game?.xImage}
                oImage={game?.oImage}
                size={18}
                fallbackSize="1rem"
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  p: 2,
                  borderRadius: 4,
                  bgcolor: p1?.playerId ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(0,229,255,0.4)",
                }}
              >
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography sx={{ color: "#00e5ff", fontWeight: 800 }}>
                    {t.player1 || "Player 1"}
                  </Typography>
                  <CrossZeroMarkVisual
                    mark="X"
                    xImage={game?.xImage}
                    oImage={game?.oImage}
                    size={18}
                    fallbackSize="1rem"
                  />
                </Stack>
                <Typography sx={{ color: "#fff", fontWeight: 700 }}>
                  {p1?.playerId?.name || (t.emptySlot || "Waiting...")}
                </Typography>
                {p1?.playerId?.company ? (
                  <Typography sx={{ color: "rgba(255,255,255,0.58)", fontSize: "0.8rem", mt: 0.25 }}>
                    {p1.playerId.company}
                  </Typography>
                ) : null}
              </Paper>
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  p: 2,
                  borderRadius: 4,
                  bgcolor: p2?.playerId ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,107,107,0.4)",
                }}
              >
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography sx={{ color: "#ff6b6b", fontWeight: 800 }}>
                    {t.player2 || "Player 2"}
                  </Typography>
                  <CrossZeroMarkVisual
                    mark="O"
                    xImage={game?.xImage}
                    oImage={game?.oImage}
                    size={18}
                    fallbackSize="1rem"
                  />
                </Stack>
                <Typography sx={{ color: "#fff", fontWeight: 700 }}>
                  {p2?.playerId?.name || (t.emptySlot || "Waiting...")}
                </Typography>
                {p2?.playerId?.company ? (
                  <Typography sx={{ color: "rgba(255,255,255,0.58)", fontSize: "0.8rem", mt: 0.25 }}>
                    {p2.playerId.company}
                  </Typography>
                ) : null}
              </Paper>
            </Stack>

            {!bothPlayersJoined ? (
              <Box sx={{ textAlign: "center" }}>
                <CircularProgress sx={{ color: "#00e5ff", mb: 2 }} />
                <Typography variant="h6" sx={{ color: "#fff", fontWeight: 800, mb: 1 }}>
                  {t.waitingForPlayers || "Waiting for both players to join..."}
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.58)", fontSize: "0.9rem" }}>
                  {(t.autoCloseNotice || "This session will auto-close if both players do not join within")} <b>{abandonRemaining}</b> {t.seconds}.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h6" sx={{ color: "#fff", fontWeight: 800, mb: 1 }}>
                  {t.bothPlayersJoined || "Both players have joined!"}
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.62)", fontSize: "0.88rem", mb: 3 }}>
                  {t.anyPlayerCanStart || "Either player can start once both have joined."}
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handlePlayerActivate}
                  disabled={starting}
                  startIcon={starting ? null : <ICONS.play />}
                  sx={{
                    ...getStartIconSpacing(dir),
                    px: 4,
                    py: 1.2,
                    borderRadius: 999,
                    fontWeight: 800,
                  }}
                >
                  {starting ? (
                    <CircularProgress size={20} sx={{ color: "#fff" }} />
                  ) : (
                    t.startGame || "Start Game"
                  )}
                </Button>
              </Box>
            )}
          </Paper>
        </PageWrapper>
      );
    }

    return (
      <PageWrapper>
        <CircularProgress sx={{ color: "#7b2ff7", mb: 3 }} size={52} />
        <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>
          {t.waitingForSession || t.waiting}
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.4)", mt: 1, fontSize: "0.85rem" }}>
          {game.title} · {t.vs}
        </Typography>
      </PageWrapper>
    );
  }

  // â”€â”€â”€ Phase: playing / result â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (isResult) {
    return (
      <Box
        dir={dir}
        sx={{
          position: "relative",
          minHeight: "100vh",
          width: "100vw",
          backgroundImage: `url(${game.coverImage || game.nameImage || game.backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          overflow: "hidden",
          p: 2,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(0,0,0,0.8), rgba(50,50,50,0.8))",
            backdropFilter: "blur(5px)",
          }}
        />
        {showConfetti && (
          <Confetti
            recycle={false}
            numberOfPieces={300}
            gravity={0.2}
            style={{ position: "fixed", top: 0, left: 0, zIndex: 9999 }}
          />
        )}
        <LanguageSelector top={20} right={20} />
        <Fade in timeout={800}>
          <Paper
            dir={dir}
            elevation={8}
            sx={{
              position: "relative",
              zIndex: 1,
              width: { xs: "88%", sm: "58%" },
              maxWidth: 620,
              p: 4,
              borderRadius: 3,
              background: resultBackgroundGradient,
              color: "#fff",
              boxShadow: "0 0 30px rgba(0,0,0,0.6)",
              backdropFilter: "blur(5px)",
            }}
          >
            <Typography variant="h5" fontWeight={700} sx={{ mb: 1, textShadow: "0 0 15px rgba(255,255,255,0.6)" }}>
              {displayPlayerName || game.title}
            </Typography>
            <Typography
              variant="h1"
              sx={{
                my: 2,
                fontWeight: "bold",
                textShadow: "0 0 15px rgba(255,255,255,0.8)",
                fontSize: { xs: "2.2rem", sm: "3.2rem", md: "3.8rem" },
              }}
            >
              {resultLabel}
            </Typography>
            {isAIMode ? (
              <Typography variant="body1" sx={{ mb: 3, opacity: 0.95 }}>
                {`${t.vsAI} · ${difficulty}`}
              </Typography>
            ) : (
              <Stack
                direction="row"
                spacing={1}
                justifyContent="center"
                alignItems="center"
                sx={{ mb: 3, opacity: 0.95, flexWrap: "wrap" }}
              >
                <Typography variant="body1">
                  {displayPlayerName || (t.youAre || "You are")}
                </Typography>
                <CrossZeroMarkVisual
                  mark={playerMark}
                  xImage={game?.xImage}
                  oImage={game?.oImage}
                  size={20}
                  fallbackSize="1.05rem"
                />
              </Stack>
            )}

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
                {displayPlayerName || (t.youAre || "You are")}
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <CrossZeroMarkVisual
                  mark={playerMark}
                  xImage={game?.xImage}
                  oImage={game?.oImage}
                  size={46}
                  fallbackSize="2.2rem"
                  color={playerMarkColor}
                  shadow={`0 0 12px ${playerMarkColor}55`}
                />
              </Box>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {(t.moves || "Moves")}: {resultSummary.moves ?? 0}
                <Box component="span" sx={{ mx: 1, color: "text.secondary" }}>|</Box>
                {t.timeTaken}: {resultSummary.timeTaken ?? 0}{t.seconds}
              </Typography>
            </Box>

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
                {isAIMode ? (t.aiOpponent || "AI Opponent") : (t.opponent || "Opponent")}
              </Typography>
              <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" flexWrap="wrap">
                <Typography variant="h4" fontWeight="bold" sx={{ color: opponentMarkColor, textShadow: `0 0 12px ${opponentMarkColor}55` }}>
                  {isAIMode ? "AI" : (opponentSession?.playerId?.name || (t.opponent || "Opponent"))}
                </Typography>
                <CrossZeroMarkVisual
                  mark={opponentMark}
                  xImage={game?.xImage}
                  oImage={game?.oImage}
                  size={46}
                  fallbackSize="2.2rem"
                  color={opponentMarkColor}
                  shadow={`0 0 12px ${opponentMarkColor}55`}
                />
              </Stack>
              {isAIMode && (
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {(t.difficultyLabel || "Difficulty")}: {difficulty}
                </Typography>
              )}
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                onClick={handlePlayAgain}
                startIcon={<ICONS.replay />}
                sx={getStartIconSpacing(dir)}
              >
                {t.playAgain}
              </Button>
              {isAIMode && (
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => router.replace(`/crosszero/${game.slug}`)}
                  startIcon={<ICONS.back />}
                  sx={{
                    ...getStartIconSpacing(dir),
                    borderColor: "rgba(255,255,255,0.4)",
                    color: "#fff",
                    "&:hover": { borderColor: "rgba(255,255,255,0.7)", bgcolor: "rgba(255,255,255,0.08)" },
                  }}
                >
                  {t.backToLobby}
                </Button>
              )}
            </Stack>
          </Paper>
        </Fade>
      </Box>
    );
  }

  return (
    <PageWrapper>
      <Paper
        elevation={8}
        sx={{
          p: { xs: 2.5, sm: 4 }, borderRadius: 6,
          bgcolor: "rgba(10,10,20,0.85)", backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
          maxWidth: 520, width: "100%",
        }}
      >
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box>
            <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1rem" }}>{displayPlayerName || game.title}</Typography>
            {isAIMode ? (
              <Typography sx={{ color: "rgba(255,255,255,0.72)", fontSize: "0.78rem" }}>
                {`${t.vsAI} · ${difficulty}`}
              </Typography>
            ) : (
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexWrap: "wrap" }}>
                <Typography sx={{ color: "rgba(255,255,255,0.72)", fontSize: "0.78rem" }}>
                  {playerRoleLabel || t.vs}
                </Typography>
                <CrossZeroMarkVisual
                  mark={playerMark}
                  xImage={game?.xImage}
                  oImage={game?.oImage}
                  size={16}
                  fallbackSize="0.9rem"
                />
              </Stack>
            )}
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <CrossZeroMarkVisual
              mark="X"
              xImage={game?.xImage}
              oImage={game?.oImage}
              size={20}
              fallbackSize="1.2rem"
            />
            <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.8rem" }}>vs</Typography>
            <CrossZeroMarkVisual
              mark="O"
              xImage={game?.xImage}
              oImage={game?.oImage}
              size={20}
              fallbackSize="1.2rem"
            />
          </Stack>
        </Stack>

        {/* Turn indicator / result */}
        {isResult ? (
          <Box sx={{ textAlign: "center", mb: 2 }}>
            <Typography variant="h4" fontWeight={900} sx={{
              color: resultLabel === t.itsDraw ? "#ffb300"
                : (resultLabel === t.youWin || resultLabel === t.playerWins) ? "#00e5ff" : "#ff4444",
              textShadow: `0 0 24px currentColor`, mb: 0.5,
            }}>
              {resultLabel}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ textAlign: "center", mb: 2 }}>
            <Typography sx={{
              color: isMyTurn ? "#00e5ff" : "rgba(255,255,255,0.78)",
              fontWeight: 700, fontSize: "0.95rem",
              textShadow: isMyTurn ? "0 0 12px rgba(0,229,255,0.4)" : "none",
              transition: "all 0.3s",
            }}>
              {isMyTurn ? t.yourTurn : t.opponentTurn}
              {aiThinking && <CircularProgress size={12} sx={{ color: "#ff4444", ml: 1 }} />}
            </Typography>
          </Box>
        )}

        {/* Move timer */}
        {game?.moveTimer > 0 && isAIMode && (
          <MoveTimerBar seconds={moveTimeLeft || 0} maxSeconds={game.moveTimer} isMyTurn={isMyTurn} />
        )}

        {/* Board */}
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, mb: 2 }}>
          {activeBoard.map((cell, i) => (
            <Cell
              key={i}
              value={cell}
              index={i}
              onClick={isAIMode ? handleCellClick : handlePvPCellClick}
              isWinning={winLine?.includes(i)}
              disabled={aiThinking || (!isAIMode && activeTurn !== playerMark)}
              xImage={game?.xImage}
              oImage={game?.oImage}
            />
          ))}
        </Box>

        {/* My mark indicator */}
        <Stack direction="row" justifyContent="center" spacing={1} sx={{ mb: 0.5 }} alignItems="center">
          <Typography sx={{ color: "rgba(255,255,255,0.72)", fontSize: "0.8rem" }}>
            {t.youAre || "You are"}:
          </Typography>
          <CrossZeroMarkVisual
            mark={playerMark}
            xImage={game?.xImage}
            oImage={game?.oImage}
            size={16}
            fallbackSize="0.9rem"
            color={playerMarkColor}
            shadow={`0 0 8px ${playerMarkColor}`}
          />
        </Stack>
      </Paper>
    </PageWrapper>
  );
}
