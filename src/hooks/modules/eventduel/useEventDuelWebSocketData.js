import { useEffect, useRef, useState } from "react";
import useSocket from "@/utils/useSocket";

const useEventDuelWebSocketData = (gameSlug) => {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [questions, setQuestions] = useState([]);

  const [pendingSession, setPendingSession] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [recentlyCompleted, setRecentlyCompleted] = useState(null);

  const selectedPlayer =
    typeof window !== "undefined"
      ? sessionStorage.getItem("selectedPlayer")
      : null;

  const { socket, connected } = useSocket(
    {
      pvpAllSessions: (payload) => {
        console.log("📜 All sessions received", payload);
        setSessions(payload);
      },
      pvpCurrentSession: (payload) => {
        console.log("🔄 pvpCurrentSession received", payload);
        const { session, player1Questions, player2Questions } = payload;

        setCurrentSession(session);

        const playerQs =
          selectedPlayer === "p1" ? player1Questions : player2Questions;

        setQuestions(playerQs || []);
      },
    },
    [selectedPlayer]
  );

  useEffect(() => {
  
  socket?.emit("getAllSessions", { gameSlug });
}, [connected, socket, gameSlug]);

  const requestAllSessions = () => {
  if (connected && socket && gameSlug) {
    console.log("🔁 Emitting getAllSessions");
    socket.emit("getAllSessions", { gameSlug });
  } else {
    console.warn("🔒 Cannot emit getAllSessions yet", { connected, socket, gameSlug });
  }
};

  // Update derived sessions
  useEffect(() => {
    const latestPending = sessions.find((s) => s.status === "pending") || null;
    const latestActive = sessions.find((s) => s.status === "active") || null;
    const latestCompleted =
      [...sessions]
        .filter((s) => s.status === "completed")
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0] || null;

    setPendingSession(latestPending);
    setActiveSession(latestActive);
    setRecentlyCompleted(latestCompleted);
  }, [sessions]);

  // Auto-select fallback current session if not explicitly set
  useEffect(() => {
    if (!currentSession && sessions.length > 0) {
      const fallback =
        sessions.find((s) => s.status === "active") ||
        sessions.find((s) => s.status === "pending");
      if (fallback) setCurrentSession(fallback);
    }
  }, [currentSession, sessions]);

  // Rejoin room for game
  useEffect(() => {
    if (connected && socket && gameSlug) {
      socket.emit("joinGameRoom", gameSlug);
    }
  }, [connected, socket, gameSlug]);

  // Rejoin room for current session
  useEffect(() => {
    if (connected && socket && currentSession?._id) {
      socket.emit("joinSession", { sessionId: currentSession._id });
    }
  }, [connected, socket, currentSession]);

  return {
    sessions,
    currentSession,
    requestAllSessions,
    selectedPlayer,
    questions,
    connected,
    pendingSession,
    activeSession,
    recentlyCompleted,
  };
};

export default useEventDuelWebSocketData;
