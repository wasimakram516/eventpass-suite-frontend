import { useRef, useEffect, useMemo } from "react";
import useSocket from "@/utils/useSocket";

export default function useDigiPassSocket({
    eventId,
    registrationId,
    onTaskCompletedUpdate,
}) {
    const handlersRef = useRef({
        onTaskCompletedUpdate,
    });

    useEffect(() => {
        handlersRef.current = {
            onTaskCompletedUpdate,
        };
    }, [onTaskCompletedUpdate]);

    const events = useMemo(() => {
        const eventIdStr = eventId?.toString();
        const registrationIdStr = registrationId?.toString();

        return {
            digipassTaskCompletedUpdate: (data) => {
                if (data.eventId?.toString() !== eventIdStr) return;
                if (data.registrationId?.toString() !== registrationIdStr) return;

                handlersRef.current.onTaskCompletedUpdate?.(data);
            },
        };
    }, [eventId, registrationId]);

    const { socket, connected, connectionError } = useSocket(events);

    return {
        socket,
        connected,
        connectionError,
    };
}

