import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import useSocket from "@/utils/useSocket";
import { mergeRowsById } from "@/utils/gameResultsUtils";

// A game results page loads its first batch over
// the API, then appends the remaining completed sessions as they stream in
// over `gameResultsProgress` batches. Handlers stay fresh via a ref, and the
// events object is stable so useSocket only registers listeners once.
export default function useGameResultsSocket({ gameId, onLoadingProgress }) {
  const handlersRef = useRef({ onLoadingProgress });

  useEffect(() => {
    handlersRef.current = { onLoadingProgress };
  }, [onLoadingProgress]);

  const [loadingProgress, setLoadingProgress] = useState(null);

  const events = useMemo(() => {
    const gameIdStr = gameId?.toString();

    return {
      gameResultsProgress: (data) => {
        if (data.gameId?.toString() !== gameIdStr) return;

        setLoadingProgress(data);
        handlersRef.current.onLoadingProgress?.(data);
      },
    };
  }, [gameId]);

  const { socket, connected, connectionError } = useSocket(events);

  return {
    socket,
    connected,
    connectionError,
    loadingProgress: loadingProgress || { loaded: 0, total: 0, data: [] },
  };
}

// Convenience wrapper shared by every game results/sessions page: subscribes
// to the game's results stream and accumulates the incoming batches into a
// single id-keyed list, exposing `rows` + `loadingMore` so callers don't
// re-implement the merge and "load more" logic per page. `getId` lets pages
// key on their own identity (session id, participant id, etc.).
export function useGameResultsStream({ gameId, getId }) {
  const [rows, setRows] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);

  const handleProgress = useCallback(
    ({ data: batch, loaded, total }) => {
      if (Array.isArray(batch) && batch.length > 0) {
        setRows((prev) => mergeRowsById(prev, batch, getId));
      }
      setLoadingMore(!!loaded && !!total && loaded < total);
    },
    [getId]
  );

  useGameResultsSocket({ gameId, onLoadingProgress: handleProgress });

  return { rows, setRows, loadingMore };
}