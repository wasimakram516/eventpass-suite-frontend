import { GameProvider } from "@/contexts/GameContext";

export default function GameLayout({ children }) {
  return <GameProvider>{children}</GameProvider>;
}
