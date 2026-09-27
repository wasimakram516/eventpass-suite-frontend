"use client";
import { useState, useEffect, useRef } from "react";

// Debounced local search used by every results/sessions list page: the input
// box binds to `rawSearch` (updates per keystroke), while `searchTerm` only
// settles after `delay` ms of quiet — so the client-side filter over the
// accumulated list doesn't re-run on every character. `onCommit` runs with
// the settled term.
export default function useDebouncedSearch({
  initial = "",
  delay = 300,
  onCommit,
} = {}) {
  const [rawSearch, setRawSearch] = useState(initial);
  const [searchTerm, setSearchTerm] = useState(initial.trim().toLowerCase());
  const commitRef = useRef(onCommit);

  useEffect(() => {
    commitRef.current = onCommit;
  }, [onCommit]);

  useEffect(() => {
    const id = setTimeout(() => {
      const next = rawSearch.trim().toLowerCase();
      setSearchTerm(next);
      commitRef.current?.(next);
    }, delay);
    return () => clearTimeout(id);
  }, [rawSearch, delay]);

  return { searchTerm, rawSearch, setRawSearch };
}