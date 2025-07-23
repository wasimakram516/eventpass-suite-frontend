import { GameProvider } from "@/contexts/GameContext";

export default function GameLayout({ children }) {
  return <GameProvider module="eventduel">{children}</GameProvider>;
}
