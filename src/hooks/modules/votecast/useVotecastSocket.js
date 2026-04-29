"use client";
import { useRef, useEffect, useMemo } from "react";
import useSocket from "@/utils/useSocket";

export default function useVotecastSocket({ pollId, onVoteCast, onQuestionCountChanged }) {
  const handlersRef = useRef({ onVoteCast, onQuestionCountChanged });

  useEffect(() => {
    handlersRef.current = { onVoteCast, onQuestionCountChanged };
  }, [onVoteCast, onQuestionCountChanged]);

  const events = useMemo(() => {
    const pollIdStr = pollId?.toString();

    return {
      pollVoteCast: (data) => {
        if (data.pollId !== pollIdStr) return;
        handlersRef.current.onVoteCast?.(data);
      },
      pollQuestionCountChanged: (data) => {
        if (data.pollId !== pollIdStr) return;
        handlersRef.current.onQuestionCountChanged?.(data);
      },
    };
  }, [pollId]);

  const { socket, connected, connectionError } = useSocket(events);

  return { socket, connected, connectionError };
}
