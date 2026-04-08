import { GameProvider } from "@/contexts/GameContext";

export default function CrossZeroLayout({ children }) {
  return <GameProvider module="crosszero">{children}</GameProvider>;
}
