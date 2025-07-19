import env from "@/config/env";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const WS_HOST = env.server.socket;
let socketInstance = null;

const useSocket = (events = {}) => {
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!WS_HOST) {
      console.error("❌ WebSocket Host is not defined.");
      return;
    }

    if (!socketInstance) {
      socketInstance = io(WS_HOST, {
        transports: ["websocket"],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });
    }

    socketRef.current = socketInstance;

    socketInstance.on("connect", () => {
      console.log("✅ Socket connected:", socketInstance.id);
      setConnected(true);
      setConnectionError(null);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("❌ Socket error:", err.message);
      setConnected(false);
      setConnectionError(err.message);
    });

    socketInstance.on("disconnect", (reason) => {
      console.warn("🔌 Socket disconnected:", reason);
      setConnected(false);
    });

    // Register event listeners
    for (const [event, handler] of Object.entries(events)) {
      socketInstance.on(event, handler);
    }

    return () => {
      for (const event of Object.keys(events)) {
        socketInstance.off(event, events[event]);
      }
    };
  }, [events]);

  return { socket: socketRef.current, connected, connectionError };
};

export default useSocket;
