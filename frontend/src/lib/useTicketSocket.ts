import { useEffect, useRef, useState } from "react";
import { getAccessToken } from "./auth";
import type { Message, Ticket } from "./types";

interface UseTicketSocketOptions {
  ticketId: number;
  currentUserId?: number;
  onNewMessage: (msg: Message) => void;
  onTicketUpdated: (ticket: Ticket) => void;
}

export function useTicketSocket({
  currentUserId,
  ticketId,
  onNewMessage,
  onTicketUpdated,
}: UseTicketSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUser, setTypingUser] = useState<{
    name: string;
    id: number;
  } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypedSentRef = useRef<number>(0);

  const onNewMessageRef = useRef(onNewMessage);
  const onTicketUpdatedRef = useRef(onTicketUpdated);
  const currentuserRef = useRef(currentUserId);

  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
    onTicketUpdatedRef.current = onTicketUpdated;
    currentuserRef.current = currentUserId;
  }, [onNewMessage, onTicketUpdated, currentUserId]);
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      let cancelled = false;

      queueMicrotask(() => {
        if (!cancelled) {
          setError("Token not found");
        }
      });

      return () => {
        cancelled = true;
      };
    }

    const apiBase =
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
    const wsBase = apiBase.replace(/^http/, "ws");
    const wsUrl = `${wsBase}/ws/tickets/${ticketId}?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "message") {
          setTypingUser(null);
          onNewMessageRef.current(payload.data);
        } else if (payload.type === "ticket_updated") {
          onTicketUpdatedRef.current(payload.data);
        } else if (payload.type === "typing") {
          if (payload.sender_id === currentuserRef.current) return;
          setTypingUser({ name: payload.sender_name, id: payload.sender_id });
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setTypingUser(null);
          }, 2000);
        } else if (payload.type === "error") {
          setError(payload.message);
        }
      } catch {
      }
    };

    ws.onerror = () => {
      setError("WebSocket connection failed");
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [ticketId]);

  function sendMessage(body: string) {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ body }));
      return true;
    }
    return false;
  }
  function sendTyping() {
    const now = Date.now();
    if (now - lastTypedSentRef.current < 1000) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      lastTypedSentRef.current = now;
      wsRef.current.send(JSON.stringify({ type: "typing" }));
    }
  }

  return { isConnected, error, typingUser, sendMessage, sendTyping };
}
