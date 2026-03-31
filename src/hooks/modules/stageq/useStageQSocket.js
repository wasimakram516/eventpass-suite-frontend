import { useEffect, useMemo, useRef } from "react";
import useSocket from "@/utils/useSocket";

// Joins a StageQ session room and subscribes to real-time question events.
const useStageQSocket = ({ sessionSlug, onVoteUpdated, onAnsweredUpdated, onNewQuestion }) => {
  // Store callbacks in a ref so the events object below can be stable (created once)
  // while still always calling the latest callback provided by the parent.
  const cbRef = useRef({});
  cbRef.current = { onVoteUpdated, onAnsweredUpdated, onNewQuestion };

  // Stable events object — never recreated, so useSocket's effect only runs once.
  const events = useMemo(() => ({
    questionVoteUpdated: (data) => cbRef.current.onVoteUpdated?.(data),
    questionAnsweredUpdated: (data) => cbRef.current.onAnsweredUpdated?.(data),
    newQuestion: (data) => cbRef.current.onNewQuestion?.(data),
  }), []);

  const { socket, connected } = useSocket(events);

  useEffect(() => {
    if (connected && socket && sessionSlug) {
      socket.emit("joinSession", sessionSlug);
    }
  }, [connected, socket, sessionSlug]);

  return { connected };
};

export default useStageQSocket;
