import { useEffect, useState } from "react";
import useSocket from "@/utils/useSocket";

const useMosaicWallMediaSocket = ({ wallSlug, onMediaUpdate }) => {
  const [registeredSlug, setRegisteredSlug] = useState(null);

  const { socket, connected, connectionError } = useSocket({
    mediaUpdate: (mediaList) => {
      console.log("🖼️ Received mediaUpdate");
      if (onMediaUpdate) onMediaUpdate(mediaList);
    },
  });

  useEffect(() => {
    if (connected && socket && wallSlug && wallSlug !== registeredSlug) {
      console.log("📡 Registering wallSlug:", wallSlug);
      socket.emit("register", wallSlug);
      setRegisteredSlug(wallSlug);
    }
  }, [connected, socket, wallSlug, registeredSlug]);

  return {
    connected,
    connectionError,
  };
};

export default useMosaicWallMediaSocket;
