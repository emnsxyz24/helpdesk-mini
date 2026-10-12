"use client";

import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import TicketInfoPanel from "@/components/TicketInfoPanel";
import { ErrorBox, Spinner } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useMe } from "@/lib/hooks";
import type { Message, Status, Ticket } from "@/lib/types";
import { useTicketSocket } from "@/lib/useTicketSocket";
import { Input } from "@/components/ui/input";

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = Number(params.id);
  const qc = useQueryClient();
  const { data: me } = useMe();

  const [inputBody, setInputBody] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const {
    data: ticket,
    isLoading: loadingTicket,
    error: errorTicket,
  } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: () => apiFetch<Ticket>(`/tickets/${ticketId}`),
    enabled: !isNaN(ticketId),
  });

  const {
    data: messages,
    isLoading: loadingMessages,
    error: errorMessages,
  } = useQuery({
    queryKey: ["ticket_messages", ticketId],
    queryFn: () => apiFetch<Message[]>(`/tickets/${ticketId}/messages`),
    enabled: !isNaN(ticketId),
  });

  const {
    isConnected,
    error: wsError,
    sendMessage,
    sendTyping,
    typingUser,
  } = useTicketSocket({
    ticketId,
    currentUserId: me?.id,
    onNewMessage: (newMsg) => {
      qc.setQueryData<Message[]>(["ticket_messages", ticketId], (old = []) => {
        if (old.some((m) => m.id === newMsg.id)) return old;
        return [...old, newMsg];
      });
      qc.invalidateQueries({ queryKey: ["tickets"] });
    },
    onTicketUpdated: (updatedTicket) => {
      qc.setQueryData(["ticket", ticketId], updatedTicket);
      qc.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, typingUser]);

  const updateMutation = useMutation({
    mutationFn: (data: {
      status?: Status;
      assigned_agent_id?: number | null;
    }) =>
      apiFetch<Ticket>(`/tickets/${ticketId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (updated) => {
      qc.setQueryData(["ticket", ticketId], updated);
      qc.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  function onSendMessage(e: FormEvent) {
    e.preventDefault();
    const text = inputBody.trim();
    if (!text || ticket?.status === "closed") return;

    const ok = sendMessage(text);
    if (ok) {
      setInputBody("");
    }
  }

  if (loadingTicket || loadingMessages || !me) return <Spinner />;
  if (errorTicket || !ticket) {
    return <ErrorBox message={errorTicket?.message ?? "Ticket not found"} />;
  }

  function formatMessageTime(iso: string) {
    const date = new Date(iso);
    const isToday = date.toDateString() === new Date().toDateString();
    return date.toLocaleString([], {
      ...(isToday ? {} : { day: "2-digit", month: "short" }),
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  
  const isClosed = ticket.status === "closed";
  const isAssignedAgent = ticket.assigned_agent?.id === me.id;

  const canSendMessage =
    !isClosed &&
    isConnected &&
    me.role !== "admin" &&
    !!ticket.assigned_agent &&
    (me.role !== "agent" || isAssignedAgent);

  return (
    <div className="transition-all duration-300 animate-in fade-in slide-in-from-top-2">
      <div
        className="flex gap-1 items-center mb-3 cursor-pointer text-primary hover:text-primary/80"
        onClick={() => router.replace("/tickets")}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 inline-block"
        >
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
        <h1>Back to home</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <section className="flex flex-col h-[75vh] min-w-0 md:flex-1 rounded-xl border bg-white shadow-xs overflow-hidden">
          <div className="border-b p-3.5 bg-gray-50/50">
            <h1 className="font-semibold text-gray-900 text-base">
              {ticket.subject}
            </h1>
            <p className="text-xs text-gray-500">
              Ticket #{ticket.id} · {ticket.category}
            </p>
          </div>

          {(errorMessages || wsError) && (
            <div className="p-2">
              <ErrorBox
                message={errorMessages?.message ?? wsError ?? "Error occurred"}
              />
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages?.map((msg) => {
              const isMe = msg.sender_id === me.id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[80%] ${
                    isMe ? "self-end items-end" : "self-start items-start"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-xs text-primary">
                    <span className="rounded border bg-background px-1 py-0.5 text-[10px] font-bold text-primary capitalize">
                      {msg.sender_role}
                    </span>
                    <span className="font-semibold text-gray-800">
                      {msg.sender_name}
                    </span>
                  </div>

                  <div
                    className={`flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`flex flex-col rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                        isMe
                          ? "bg-primary text-background rounded-br-xs"
                          : "bg-muted text-foreground rounded-bl-xs"
                      }`}
                    >
                      {msg.body}
                    </div>
                    <span className="text-[10px] px-1 py-0.5 text-primary border rounded-lg bg-background">
                      {formatMessageTime(msg.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
            {typingUser && typingUser.id !== me.id && (
              <div className="py-1 text-xs italic text-gray-500 animate-pulse">
                {typingUser.name} is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={onSendMessage}
            className="border-t p-3 bg-white flex gap-2"
          >
            <Input
              placeholder={
                isClosed
                  ? "This ticket is closed. No more messages allowed."
                  : "Type a message…"
              }
              value={inputBody}
              onChange={(e) => {
                setInputBody(e.target.value);
                sendTyping();
              }}
              disabled={!canSendMessage}
            />
            <Button
              type="submit"
              disabled={!canSendMessage || !inputBody.trim()}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
              >
                <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
                <path d="m21.854 2.147-10.94 10.939" />
              </svg>
            </Button>
          </form>
        </section>

        <section className="w-full md:w-80 md:shrink-0">
          <TicketInfoPanel
            ticket={ticket}
            currentUser={me}
            onUpdate={(data) => updateMutation.mutate(data)}
            isUpdating={updateMutation.isPending}
          />
        </section>
      </div>
    </div>
  );
}
