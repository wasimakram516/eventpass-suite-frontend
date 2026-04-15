"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography, Button, CircularProgress, Paper, Stack, IconButton, LinearProgress, Fade, TextField } from "@mui/material";
import Confetti from "react-confetti";
import { useGame } from "@/contexts/GameContext";
import useCrossZeroWebSocketData from "@/hooks/modules/crosszero/useCrossZeroWebSocketData";
import CrossZeroMarkVisual from "@/components/crosszero/CrossZeroMarkVisual";
import { joinGame, submitResult } from "@/services/crosszero/playerService";
import {
  abandonGameSession,
  activateGameSession,
  startGameSession,
  joinGameSession,
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
    nameLabel: "Your Name",
    companyLabel: "Company (optional)",
    departmentLabel: "Department (optional)",
    nextPlayer: "Next: Player 2",
    wins: "Wins!",
    howToPlay: "How to Play",
    pvpMode: "Multiplayer · 1v1",
    rule1: "The board has 9 cells in a 3×3 grid.",
    rule2: "Players take turns placing their mark in an empty cell.",
    rule3: "Match 3 marks in a row to win. If the board fills first, it's a draw.",
    rule4Pvp: "Player 1 plays as ○ (goes first) and Player 2 plays as ✕.",
    goodLuck: "Good Luck!",
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
    nameLabel: "اسمك",
    companyLabel: "الشركة (اختياري)",
    departmentLabel: "القسم (اختياري)",
    nextPlayer: "التالي: اللاعب الثاني",
    wins: "فاز!",
    howToPlay: "طريقة اللعب",
    pvpMode: "متعدد اللاعبين · 1 ضد 1",
    rule1: "تتكون اللوحة من 9 خانات ضمن شبكة 3×3.",
    rule2: "يتناوب اللاعبون على وضع علامتهم داخل خانة فارغة.",
    rule3: "كوّن 3 علامات في صف واحد للفوز. وإذا امتلأت اللوحة أولًا تنتهي المباراة بالتعادل.",
    rule4Pvp: "اللاعب الأول يلعب بعلامة ○ (يبدأ أولاً) واللاعب الثاني يلعب بعلامة ✕.",
    goodLuck: "حظًا موفقًا!",
  },
};

// â”€â”€â”€ Game Logic â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const WINNING_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
const PLAYER_TYPE_MARK = { p1: "O", p2: "X" };
const MARK_PLAYER_TYPE = { O: "p1", X: "p2" };

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
  if (result?.winner === "X") return 10;
  if (result?.winner === "O") return -10;
  if (board.every(Boolean)) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = "X";
        best = Math.max(best, minimax(board, false));
        board[i] = null;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = "O";
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
      board[i] = "X";
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

// ─── Single-Screen Onboarding Form (isolated to prevent re-render focus loss) ──
function SingleOnboardingForm({ game, singleStep, singleP1, singleSubmitting, onSubmit, t, dir }) {
  const [form, setForm] = useState({ name: "" });

  const isStep1 = singleStep === 1;
  const stepLabel = isStep1 ? (t.player1 || "Player 1") : (t.player2 || "Player 2");
  const stepMark = isStep1 ? "O" : "X";
  const stepColor = isStep1 ? "#ff6b6b" : "#00e5ff";

  const handleSubmit = () => {
    if (!form.name.trim() || singleSubmitting) return;
    onSubmit({ ...form });
  };

  return (
    <Paper elevation={8} sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 6, bgcolor: "rgba(10,10,20,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 40px rgba(0,0,0,0.6)", maxWidth: 460, width: "100%" }}>
      <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
        {[1, 2].map((s) => (
          <Box key={s} sx={{ width: 36, height: 6, borderRadius: 3, bgcolor: singleStep >= s ? stepColor : "rgba(255,255,255,0.15)", transition: "background 0.3s" }} />
        ))}
      </Stack>

      <Typography variant="h5" fontWeight={800} sx={{ color: "#fff", textAlign: "center", mb: 0.5 }}>{game.title}</Typography>

      <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <Typography sx={{ color: stepColor, fontWeight: 700, fontSize: "1rem" }}>{stepLabel}</Typography>
        <CrossZeroMarkVisual mark={stepMark} xImage={game?.xImage} oImage={game?.oImage} size={22} fallbackSize="1.2rem" />
      </Stack>

      <Stack spacing={2}>
        <TextField
          label={t.nameLabel || "Your Name"} required fullWidth
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          InputProps={{ sx: { backgroundColor: "rgba(255,255,255,0.1)", color: "#fff", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.25)" } } }}
          InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }}
        />
        {/* <TextField
          label={t.companyLabel || "Company (optional)"} fullWidth
          value={form.company}
          onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
          InputProps={{ sx: { backgroundColor: "rgba(255,255,255,0.1)", color: "#fff", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.25)" } } }}
          InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }}
        />
        <TextField
          label={t.departmentLabel || "Department (optional)"} fullWidth
          value={form.department}
          onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
          InputProps={{ sx: { backgroundColor: "rgba(255,255,255,0.1)", color: "#fff", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.25)" } } }}
          InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }}
        /> */}
      </Stack>

      {singleStep === 2 && singleP1 && (
        <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: "rgba(255,107,107,0.12)", border: "1px solid rgba(255,107,107,0.3)" }}>
          <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.8rem" }}>
            {t.player1 || "Player 1"}: <Box component="span" sx={{ color: "#ff6b6b", fontWeight: 700 }}>{singleP1.name}</Box>
          </Typography>
        </Box>
      )}

      <Button
        variant="contained" fullWidth size="large"
        onClick={handleSubmit}
        disabled={!form.name.trim() || singleSubmitting}
        startIcon={singleSubmitting ? <CircularProgress size={18} color="inherit" /> : <ICONS.next />}
        sx={{ ...getStartIconSpacing(dir), mt: 3, py: 1.2, borderRadius: 999, fontWeight: 800, bgcolor: stepColor, "&:hover": { filter: "brightness(1.15)" }, "&:disabled": { opacity: 0.5 } }}
      >
        {isStep1 ? (t.nextPlayer || "Next: Player 2") : (t.startGame || "Start Game")}
      </Button>
    </Paper>
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

  // Single-screen onboarding state
  const isSingleScreen = game?.mode === "pvp" && game?.pvpScreenMode === "single";
  const [singleStep, setSingleStep] = useState(1); // 1 = P1 form, 2 = P2 form
  const [singleP1, setSingleP1] = useState(null); // { name, playerId, playerType, mark }
  const [singleP2, setSingleP2] = useState(null);
  const [singleSubmitting, setSingleSubmitting] = useState(false);
  // Both players' info for single-screen turn display
  const [singlePlayers, setSinglePlayers] = useState({ p1: null, p2: null });

  // Game phase: "difficulty" | "single-onboarding" | "countdown" | "waiting" | "playing" | "result"
  const [phase, setPhase] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [starting, setStarting] = useState(false);
  const [replaying, setReplaying] = useState(false);
  const [abandonRemaining, setAbandonRemaining] = useState(60);

  // AI mode local state
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentTurn, setCurrentTurn] = useState("O");
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
  const wrongSoundRef = useRef(
    typeof Audio !== "undefined" ? new Audio("/wrong.wav") : null
  );
  const celebrationPlayedRef = useRef(false);
  const wrongPlayedRef = useRef(false);

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
    const mark = sessionStorage.getItem("playerMark") || "O";
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
    } else if (game?.pvpScreenMode === "single") {
      setPhase("single-onboarding");
    } else {
      setPhase("waiting");
    }
  }, [game?.mode, game?.pvpScreenMode]);

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
    // In single-screen mode, we manage both players ourselves — no abandon timer needed
    if (game?.mode !== "pvp" || !pendingSession?._id || phase === "single-onboarding" || phase === "single-instructions") return;

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
    const isSingleScreenWin =
      isSingleScreen &&
      completedPvPSession?.xoStats?.result &&
      completedPvPSession.xoStats.result !== "draw";
    const isPvPWinner =
      game?.mode === "pvp" &&
      !isSingleScreen &&
      completedPvPSession?.xoStats?.result === `${playerMark}_wins`;
    const shouldCelebrate = Boolean(isSoloWinner || isPvPWinner || isSingleScreenWin);

    if (!shouldCelebrate) {
      celebrationPlayedRef.current = false;
      // Play wrong sound on loss (not draw, and only when there's an actual result)
      const hasSoloLoss = game?.mode === "solo" && phase === "result" && winResult && winResult !== "draw" && winResult.winner !== playerMark;
      const hasPvPLoss = game?.mode === "pvp" && !isSingleScreen && completedPvPSession?.xoStats?.result && completedPvPSession.xoStats.result !== "draw" && completedPvPSession.xoStats.result !== `${playerMark}_wins`;
      if ((hasSoloLoss || hasPvPLoss) && !wrongPlayedRef.current) {
        wrongPlayedRef.current = true;
        wrongSoundRef.current?.play().catch(() => {});
      }
      return;
    }
    wrongPlayedRef.current = false;
    triggerCelebration();
  }, [completedPvPSession?.xoStats?.result, game?.mode, isSingleScreen, phase, playerMark, triggerCelebration, winResult]);

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
    if (game?.mode !== "solo" || phase !== "playing" || currentTurn !== "X" || winResult) {
      setAiThinking(false);
      return;
    }
    setAiThinking(true);
    const delay = 400 + Math.random() * 300;
    aiMoveTimeoutRef.current = setTimeout(() => {
      const b = [...boardRef.current];
      const idx = getAIMove(b, difficulty);
      if (idx !== undefined && idx !== -1 && !b[idx]) {
        b[idx] = "X";
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
          setCurrentTurn("O");
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
  const singleScreenWinner = isSingleScreen && activeResult
    ? (activeResult === "O_wins" ? (singlePlayers.p1?.name || t.player1) : activeResult === "X_wins" ? (singlePlayers.p2?.name || t.player2) : null)
    : null;
  const resultLabel = isDraw
    ? t.itsDraw
    : isSingleScreen
      ? (singleScreenWinner ? `${singleScreenWinner} ${t.wins || "Wins!"}` : t.itsDraw)
      : isPlayerWinner
        ? (isAIMode ? t.playerWins : t.youWin)
        : (isAIMode ? t.aiWins : t.youLose);
  const showConfetti = isResult && !isDraw && (isSingleScreen || isPlayerWinner);
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
    : isSingleScreen
      ? "linear-gradient(135deg, #4CAF50CC, #388E3CCC)"
      : isPlayerWinner
        ? "linear-gradient(135deg, #4CAF50CC, #388E3CCC)"
        : "linear-gradient(135deg, #F44336CC, #E53935CC)";
  const handlePvPCellClick = useCallback((index) => {
    if (phase !== "playing" || game?.mode !== "pvp") return;
    const xoStats = livePvPSession?.xoStats;
    if (!xoStats) return;
    if (xoStats.result) return;
    if (xoStats.board[index]) return;

    if (isSingleScreen) {
      // In single screen mode, find the player whose turn it is and use their ID
      const currentMark = xoStats.currentTurn;
      const currentPlayerType = currentMark === "O" ? "p1" : "p2";
      const currentPlayer = currentPlayerType === "p1" ? singleP1 : singleP2;
      if (!currentPlayer?.playerId || !sessionId) return;
      makeMove(sessionId, currentPlayer.playerId, index);
    } else {
      if (xoStats.currentTurn !== playerMark) return;
      if (!sessionId || !playerId) return;
      makeMove(sessionId, playerId, index);
    }
  }, [phase, game?.mode, livePvPSession, playerMark, sessionId, playerId, makeMove, isSingleScreen, singleP1, singleP2]);

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

  const handleSingleStepSubmit = useCallback(async (formData) => {
    if (singleSubmitting) return;
    setSingleSubmitting(true);
    try {
      if (singleStep === 1) {
        const sessionRes = await startGameSession(game?.slug);
        const newSessionId = sessionRes?.data?._id || sessionRes?._id;
        if (!newSessionId) return;

        const joinRes = await joinGameSession({
          gameSlug: game?.slug,
          sessionId: newSessionId,
          name: formData.name.trim(),
          playerType: "p1",
        });
        if (joinRes?.error) return;

        const p1Data = { name: formData.name.trim(), playerId: joinRes.playerId, playerType: "p1", mark: "O" };
        setSingleP1(p1Data);
        setSinglePlayers((prev) => ({ ...prev, p1: p1Data }));
        setSessionId(newSessionId);
        setSingleStep(2);
      } else {
        const joinRes = await joinGameSession({
          gameSlug: game?.slug,
          sessionId,
          name: formData.name.trim(),
          playerType: "p2",
        });
        if (joinRes?.error) return;

        const p2Data = { name: formData.name.trim(), playerId: joinRes.playerId, playerType: "p2", mark: "X" };
        setSingleP2(p2Data);
        setSinglePlayers((prev) => ({ ...prev, p2: p2Data }));
        await activateGameSession(sessionId);
        startCountdown();
      }
    } finally {
      setSingleSubmitting(false);
    }
  }, [singleStep, singleSubmitting, game?.slug, sessionId, startCountdown]);

  const resetLocalSoloState = () => {
    setBoard(Array(9).fill(null));
    setCurrentTurn("O");
    setWinResult(null);
    setAiThinking(false);
    setAiResultSummary({ timeTaken: 0, moves: 0 });
    celebrationPlayedRef.current = false;
    wrongPlayedRef.current = false;
    clearInterval(moveTimerRef.current);
    clearTimeout(aiMoveTimeoutRef.current);
    clearInterval(countdownRef.current);
    if (game?.moveTimer > 0) setMoveTimeLeft(game.moveTimer);
  };

  const handlePlayAgain = async () => {
    resetLocalSoloState();

    if (isAIMode) {
      const name = playerInfo?.name?.trim();

      if (!name || replaying) {
        router.replace(`/crosszero/${game.slug}/name`);
        return;
      }

      try {
        setReplaying(true);
        const res = await joinGame(game._id, { name });

        if (res?.error || !res?.playerId || !res?.sessionId) {
          router.replace(`/crosszero/${game.slug}/name`);
          return;
        }

        sessionStorage.setItem(
          "playerInfo",
          JSON.stringify({ name, mode: "solo" })
        );
        sessionStorage.setItem("playerId", res.playerId);
        sessionStorage.setItem("sessionId", res.sessionId);
        sessionStorage.setItem("playerMark", "O");

        setPlayerId(res.playerId);
        setSessionId(res.sessionId);
        setPlayerMark("O");
        setDifficulty(null);
        setPhase("difficulty");
      } finally {
        setReplaying(false);
      }
    } else if (isSingleScreen) {
      // Reset single screen state and go back to onboarding
      setSingleStep(1);
      setSingleP1(null);
      setSingleP2(null);
      setSinglePlayers({ p1: null, p2: null });
      setSingleStep(1);
      setSessionId(null);
      setPhase("single-onboarding");
    } else {
      router.replace(`/crosszero/${game.slug}`);
    }
  };

  // â”€â”€â”€ Loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (loading || !game || (!playerMark && !isSingleScreen)) {
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
  // ─── Phase: single-onboarding ────────────────────────────────────────────────
  if (phase === "single-onboarding") {
    return (
      <PageWrapper>
        <SingleOnboardingForm
          game={game}
          singleStep={singleStep}
          singleP1={singleP1}
          singleSubmitting={singleSubmitting}
          onSubmit={handleSingleStepSubmit}
          t={t}
          dir={dir}
        />
      </PageWrapper>
    );
  }

  // ─── Phase: single-instructions ──────────────────────────────────────────────
  if (phase === "single-instructions") {
    const rules = [
      t.rule1,
      t.rule2,
      t.rule3,
      t.rule4Pvp,
    ];
    return (
      <PageWrapper>
        <Paper
          dir={dir}
          elevation={8}
          sx={{
            p: { xs: 3, sm: 4.5 },
            borderRadius: 6,
            bgcolor: "rgba(10,10,20,0.88)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
            maxWidth: 520,
            width: "100%",
          }}
        >
          {/* Mark visuals */}
          <Stack direction="row" justifyContent="center" spacing={1.5} sx={{ mb: 2 }}>
            <CrossZeroMarkVisual mark="O" xImage={game.xImage} oImage={game.oImage} size={42} fallbackSize="2rem" />
            <CrossZeroMarkVisual mark="X" xImage={game.xImage} oImage={game.oImage} size={42} fallbackSize="2rem" />
          </Stack>

          <Typography variant="h4" fontWeight={800} sx={{ color: "#fff", textAlign: "center", mb: 0.5 }}>
            {game.title}
          </Typography>

          {/* Both player names */}
          <Stack direction="row" justifyContent="center" spacing={2} sx={{ mb: 1, flexWrap: "wrap" }}>
            {[
              { data: singlePlayers.p1, mark: "O", color: "#ff6b6b", label: t.player1 },
              { data: singlePlayers.p2, mark: "X", color: "#00e5ff", label: t.player2 },
            ].map(({ data, mark, color, label }) => (
              <Stack key={mark} direction="row" alignItems="center" spacing={0.5}>
                <Typography sx={{ color, fontWeight: 700, fontSize: "0.9rem" }}>
                  {data?.name || label}
                </Typography>
                <CrossZeroMarkVisual mark={mark} xImage={game.xImage} oImage={game.oImage} size={18} fallbackSize="1rem" />
              </Stack>
            ))}
          </Stack>

          <Typography sx={{ color: "rgba(255,255,255,0.5)", textAlign: "center", mb: 2.5, fontSize: "0.85rem" }}>
            {t.pvpMode}
          </Typography>

          <Typography variant="h6" fontWeight={700} sx={{ color: "rgba(255,255,255,0.6)", textAlign: "center", mb: 2, fontSize: "0.95rem" }}>
            {t.howToPlay}
          </Typography>

          <Stack spacing={1.2} sx={{ mb: 3 }}>
            {rules.map((rule, i) => (
              <Stack
                key={i}
                direction="row"
                spacing={1.25}
                alignItems="flex-start"
                sx={{ px: 1.5, py: 1.1, borderRadius: 2.5, bgcolor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <Box sx={{ minWidth: 26, height: 26, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.1)", color: "primary.main", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.82rem", mt: 0.1 }}>
                  {i + 1}
                </Box>
                <Typography sx={{ color: "rgba(255,255,255,0.82)", fontSize: "0.92rem", lineHeight: 1.55 }}>
                  {rule}
                </Typography>
              </Stack>
            ))}
          </Stack>

          <Typography variant="h6" fontWeight={700} sx={{ color: "#00e5ff", textAlign: "center", mb: 3, textShadow: "0 0 12px rgba(0,229,255,0.4)" }}>
            {t.goodLuck}
          </Typography>

          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={startCountdown}
            startIcon={<ICONS.play />}
            sx={{ ...getStartIconSpacing(dir), py: 1.2, borderRadius: 999, fontWeight: 800 }}
          >
            {t.startGame}
          </Button>
        </Paper>
      </PageWrapper>
    );
  }

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
            backgroundColor: "rgba(0,0,0,0.65)",
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
          height: "100vh",
          width: "100vw",
          backgroundImage: `url(${game.coverImage || game.nameImage || game.backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          overflow: "hidden",
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
            textAlign: "center",
            p: 2,
          }}
        >
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
              {isSingleScreen ? game.title : (displayPlayerName || game.title)}
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
            ) : !isSingleScreen ? (
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
            ) : <Box sx={{ mb: 2 }} />}

            {isSingleScreen ? (
              // Single-screen: show both named players with winner highlighted
              <Stack spacing={1.5} sx={{ mb: 3 }}>
                {[
                  { data: singlePlayers.p1, mark: "O", label: t.player1 || "Player 1", color: "#ff6b6b" },
                  { data: singlePlayers.p2, mark: "X", label: t.player2 || "Player 2", color: "#00e5ff" },
                ].map(({ data, mark, label, color }) => {
                  const isWinner = (mark === "O" && activeResult === "O_wins") || (mark === "X" && activeResult === "X_wins");
                  return (
                    <Box
                      key={mark}
                      sx={{
                        background: isWinner ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.12)",
                        backdropFilter: "blur(4px)",
                        p: 2,
                        borderRadius: 2,
                        border: isWinner ? "2px solid rgba(255,255,255,0.7)" : "2px solid transparent",
                        color: "#000",
                      }}
                    >
                      <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                        <Typography variant="h6" fontWeight={800} sx={{ color: isWinner ? "#fff" : "rgba(255,255,255,0.75)" }}>
                          {data?.name || label}
                        </Typography>
                        <CrossZeroMarkVisual
                          mark={mark}
                          xImage={game?.xImage}
                          oImage={game?.oImage}
                          size={24}
                          fallbackSize="1.3rem"
                          color={color}
                        />
                        {isWinner && (
                          <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "0.9rem" }}>🏆</Typography>
                        )}
                      </Stack>
                      <Typography variant="body2" sx={{ color: isWinner ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.45)", textAlign: "center" }}>
                        {label}
                      </Typography>
                      {isWinner && (
                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)", textAlign: "center", mt: 0.5 }}>
                          {(t.moves || "Moves")}: {resultSummary.moves ?? 0}
                          <Box component="span" sx={{ mx: 1 }}>|</Box>
                          {t.timeTaken}: {resultSummary.timeTaken ?? 0}{t.seconds}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            ) : (
              <>
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
              </>
            )}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                onClick={handlePlayAgain}
                disabled={replaying}
                startIcon={replaying ? null : <ICONS.replay />}
                sx={getStartIconSpacing(dir)}
              >
                {replaying ? (
                  <CircularProgress size={20} sx={{ color: "#fff" }} />
                ) : (
                  t.playAgain
                )}
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
                    "&:hover": {
                      borderColor: "rgba(255,255,255,0.7)",
                      bgcolor: "rgba(255,255,255,0.08)",
                    },
                  }}
                >
                  {t.backToLobby}
                </Button>
              )}
            </Stack>
          </Paper>
        </Fade>
        </Box>
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
          {/* Left: title + mode subtitle (AI only) */}
          <Box>
            <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1rem" }}>{game.title}</Typography>
            {isAIMode && (
              <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.75rem" }}>
                {`${t.vsAI} · ${difficulty}`}
              </Typography>
            )}
          </Box>
          {/* Center / Right: O vs X mark icons */}
          <Stack direction="row" spacing={1} alignItems="center">
            <CrossZeroMarkVisual
              mark="O"
              xImage={game?.xImage}
              oImage={game?.oImage}
              size={26}
              fallbackSize="1.4rem"
            />
            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", fontWeight: 700 }}>vs</Typography>
            <CrossZeroMarkVisual
              mark="X"
              xImage={game?.xImage}
              oImage={game?.oImage}
              size={26}
              fallbackSize="1.4rem"
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
        ) : isSingleScreen ? (
          /* Single screen: player name cards with active turn highlighted */
          <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} alignItems="stretch">
            {[
              { player: singlePlayers.p1, mark: "O", color: "#ff6b6b", label: t.player1 || "Player 1" },
              { player: singlePlayers.p2, mark: "X", color: "#00e5ff", label: t.player2 || "Player 2" },
            ].map(({ player, mark, color, label }) => {
              const isActive = activeTurn === mark && !isResult;
              return (
                <Box
                  key={mark}
                  sx={{
                    flex: 1,
                    borderRadius: 3,
                    p: 1.5,
                    border: `2px solid ${isActive ? color : "rgba(255,255,255,0.1)"}`,
                    bgcolor: isActive ? `${color}18` : "rgba(255,255,255,0.04)",
                    boxShadow: isActive ? `0 0 18px ${color}55` : "none",
                    transition: "all 0.35s ease",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0.5,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {isActive && (
                    <Box sx={{
                      position: "absolute", top: 0, left: 0, right: 0, height: 3,
                      bgcolor: color,
                      boxShadow: `0 0 10px ${color}`,
                      borderRadius: "3px 3px 0 0",
                    }} />
                  )}
                  <CrossZeroMarkVisual mark={mark} xImage={game?.xImage} oImage={game?.oImage} size={20} fallbackSize="1.1rem" color={isActive ? color : "rgba(255,255,255,0.35)"} shadow={isActive ? `0 0 10px ${color}` : "none"} />
                  <Typography sx={{ color: isActive ? "#fff" : "rgba(255,255,255,0.45)", fontWeight: isActive ? 800 : 500, fontSize: "0.82rem", textAlign: "center", lineHeight: 1.2 }}>
                    {player?.name || label}
                  </Typography>
                  {isActive && (
                    <Typography sx={{ color, fontSize: "0.7rem", fontWeight: 700, letterSpacing: 0.5 }}>
                      {t.yourTurn || "Your Turn"}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Stack>
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
              disabled={aiThinking || (!isAIMode && !isSingleScreen && activeTurn !== playerMark)}
              xImage={game?.xImage}
              oImage={game?.oImage}
            />
          ))}
        </Box>

        {/* My mark indicator — hidden in single screen mode */}
        {!isSingleScreen && (
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
        )}
      </Paper>
    </PageWrapper>
  );
}
