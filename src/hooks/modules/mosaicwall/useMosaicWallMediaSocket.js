import env from "@/config/env";
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const useMediaSocket = ({ wallSlug, onMediaUpdate }) => {
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!wallSlug) return;

    const socketUrl = env.server.socket;
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      timeout: 30000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      setConnected(true);
      setConnectionError(null);

      socket.emit("register", wallSlug);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
      setConnected(false);
      setConnectionError(err.message);
    });

    socket.on("disconnect", (reason) => {
      console.warn("🔌 Socket disconnected:", reason);
      setConnected(false);
    });

    socket.on("mediaUpdate", (mediaList) => {
      console.log("Received mediaUpdate");
      if (onMediaUpdate) {
        onMediaUpdate(mediaList);
      }
    });

    return () => {
      if (socket) {
        console.log("Disconnecting socket:", socket.id);
        socket.disconnect();
      }
    };
  }, [wallSlug]);

  return {
    connected,
    connectionError,
  };
};

export default useMediaSocket;
