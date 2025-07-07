// context/GameContext.js
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { getGameBySlug } from "@/services/quiznest/gameService";
import { useParams } from "next/navigation";

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const { gameSlug } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (gameSlug) {
      getGameBySlug(gameSlug)
        .then(setGame)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [gameSlug]);

  return (
    <GameContext.Provider value={{ game, loading }}>
      {children}
    </GameContext.Provider>
  );
};
