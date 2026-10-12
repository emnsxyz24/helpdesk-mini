"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AssignedStatusBadge,
  ErrorBox,
  PriorityBadge,
  Spinner,
  StatusBadge,
} from "@/components/ui";

import { apiFetch } from "@/lib/api";
import { useMe } from "@/lib/hooks";
import type { Status, Ticket } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buttonVariants } from "@/components/ui/button";

const STATUSES: Status[] = ["open", "in_progress", "resolved", "closed"];
const STATUS_LABELS: Record<Status, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export default function TicketsPage() {
  const { data: me } = useMe();
  const [status, setStatus] = useState<Status | "">("");
  const {
    data: tickets,
    isLoading,
    error,
  } = useQuery<Ticket[], Error>({
    queryKey: ["tickets", status],
    queryFn: () =>
      apiFetch<Ticket[]>(
        `/tickets?${status ? `status=${status}` : ""}`,
      ),
    refetchInterval: 5000,
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
          <path d="M13 5v2" />
          <path d="M13 17v2" />
          <path d="M13 11v2" />
        </svg>
        <h1 className="text-xl font-semibold">Tickets</h1>
      </div>
      <div className="flex flex-wrap justify-between items-center gap-2">
        <Select
          value={status || "all"}
          onValueChange={(value) => {
            setStatus(value === status ? "" : (value as Status));
          }}
        >
          <SelectTrigger>
            <SelectValue>
              {status ? STATUS_LABELS[status] : "All Statuses"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="start">
            <SelectGroup>
              <SelectLabel>Filter by Status</SelectLabel>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {me?.role === "customer" && (
          <Link href="/tickets/new" className={buttonVariants()}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12h8" />
              <path d="M12 8v8" />
            </svg>
            New ticket
          </Link>
        )}
      </div>
      {isLoading && <Spinner />} {error && <ErrorBox message={error.message} />}
      {tickets?.length === 0 && (
        <p className="text-sm text-gray-500">No tickets found.</p>
      )}
      {tickets?.map((t, index) => (
        <Link
          key={t.id}
          href={`/tickets/${t.id}`}
          style={{
            animationDelay: `${index * 60}ms`,
            animationFillMode: "backwards",
          }}
          className="rounded border focus-visible:border-ring focus-visible:ring-ring/50 text-card-foreground bg-card hover:bg-accent hover:text-accent-foreground p-3 transition-all duration-300 animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex gap-2 items-center">
              <span className="font-medium">{t.subject}</span>
              <AssignedStatusBadge assigned={!!t.assigned_agent} />
            </div>
            <div className="flex gap-2 items-center">
              <StatusBadge status={t.status} />
              <PriorityBadge priority={t.priority} />
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            #{t.id} · {t.customer.name}
            {t.assigned_agent
              ? ` · Assigned to: ${t.assigned_agent.name}`
              : ""}{" "}
            · Last activity: {new Date(t.updated_at).toLocaleString()}
          </p>
        </Link>
      ))}
    </div>
  );
}
