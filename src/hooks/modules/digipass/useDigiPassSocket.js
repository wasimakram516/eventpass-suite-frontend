import { useRef, useEffect, useMemo } from "react";
import useSocket from "@/utils/useSocket";

export default function useDigiPassSocket({
    eventId,
    registrationId,
    onTaskCompletedUpdate,
    onNewRegistration,
    onWalkInNew,
}) {
    const handlersRef = useRef({
        onTaskCompletedUpdate,
        onNewRegistration,
        onWalkInNew,
    });

    useEffect(() => {
        handlersRef.current = {
            onTaskCompletedUpdate,
            onNewRegistration,
            onWalkInNew,
        };
    }, [onTaskCompletedUpdate, onNewRegistration, onWalkInNew]);

    const events = useMemo(() => {
        const eventIdStr = eventId?.toString();
        const registrationIdStr = registrationId?.toString();

        return {
            digipassTaskCompletedUpdate: (data) => {
                if (data.eventId?.toString() !== eventIdStr) return;
                if (registrationIdStr && data.registrationId?.toString() !== registrationIdStr) return;

                handlersRef.current.onTaskCompletedUpdate?.(data);
            },
            digipassRegistrationNew: (data) => {
                if (data.eventId?.toString() !== eventIdStr) return;

                handlersRef.current.onNewRegistration?.(data);
            },
            digipassWalkInNew: (data) => {
                if (data.eventId?.toString() !== eventIdStr) return;
                if (registrationIdStr && data.registrationId?.toString() !== registrationIdStr) return;

                handlersRef.current.onWalkInNew?.(data);
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

