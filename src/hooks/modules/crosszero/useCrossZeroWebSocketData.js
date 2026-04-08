import { useCallback, useEffect, useState } from "react";
import useSocket from "@/utils/useSocket";

const useCrossZeroWebSocketData = (gameSlug) => {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);

  const { socket, connected } = useSocket({
    "cz:sessionsUpdate": (payload) => {
      const list = Array.isArray(payload) ? payload : [payload];
      setSessions(list);
    },
    "cz:sessionUpdate": (payload) => {
      setCurrentSession(payload);
    },
    "cz:allSessions": (payload) => {
      setSessions(Array.isArray(payload) ? payload : []);
    },
  });

  // Join game room on connect
  useEffect(() => {
    if (connected && socket && gameSlug) {
      socket.emit("cz:joinGameRoom", gameSlug);
    }
  }, [connected, socket, gameSlug]);

  // Join session room when we have a session
  useEffect(() => {
    if (connected && socket && currentSession?._id) {
      socket.emit("cz:joinSession", { sessionId: currentSession._id });
    }
  }, [connected, socket, currentSession?._id]);

  // Auto-select active/pending session as current
  useEffect(() => {
    if (!currentSession && sessions.length > 0) {
      const fallback =
        sessions.find((s) => s.status === "active") ||
        sessions.find((s) => s.status === "pending");
      if (fallback) setCurrentSession(fallback);
    }
  }, [currentSession, sessions]);

  const requestAllSessions = useCallback(() => {
    if (connected && socket && gameSlug) {
      socket.emit("cz:getAllSessions", { gameSlug });
    }
  }, [connected, gameSlug, socket]);

  const makeMove = useCallback((sessionId, playerId, cellIndex) => {
    if (connected && socket) {
      socket.emit("cz:makeMove", { sessionId, playerId, cellIndex });
    }
  }, [connected, socket]);

  return { sessions, currentSession, setCurrentSession, requestAllSessions, makeMove, connected, socket };
};

export default useCrossZeroWebSocketData;
