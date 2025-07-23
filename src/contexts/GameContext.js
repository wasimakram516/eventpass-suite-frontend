"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { getGameBySlug as getQuiznestGame } from "@/services/quiznest/gameService";
import { getGameBySlug as getEventduelGame } from "@/services/eventduel/gameService";

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children, module = "quiznest" }) => {
  const { gameSlug } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);

  // Choose service method dynamically
  const fetchGameFunc =
    module === "eventduel" ? getEventduelGame : getQuiznestGame;

  useEffect(() => {
    if (!gameSlug) return;

    const fetchGame = async () => {
      const result = await fetchGameFunc(gameSlug);
      if (!result?.error) {
        setGame(result);
      }

      setLoading(false);
    };

    fetchGame();
  }, [gameSlug, module]);

  return (
    <GameContext.Provider value={{ game, loading }}>
      {children}
    </GameContext.Provider>
  );
};
