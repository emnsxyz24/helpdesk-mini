"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ErrorBox } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { useMe } from "@/lib/hooks";
import type { Priority, Ticket } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

const CATEGORIES = ["Billing", "Technical", "Account", "Other"];
const PRIORITIES: Priority[] = ["low", "medium", "high"];

export default function NewTicketPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [form, setForm] = useState({
    subject: "",
    category: "Technical",
    priority: "medium" as Priority,
    message: "",
  });
  useEffect(() => {
    if (me && me.role !== "customer") router.replace("/tickets");
  }, [me, router]);
  const create = useMutation({
    mutationFn: () =>
      apiFetch<Ticket>("/tickets", {
        method: "POST",
        body: JSON.stringify(form),
      }),
    onSuccess: (ticket) => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      router.push(`/tickets/${ticket.id}`);
    },
  });
  return (
    <div className="flex flex-col flex-1 items-center transition-all duration-300 animate-in fade-in slide-in-from-top-2">
      <div
        className="w-full max-w-2xl flex gap-1 items-center mb-3 cursor-pointer text-primary hover:text-primary/80"
        onClick={() => router.back()}
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
      <Card className="w-full max-w-2xl px-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
          className="flex w-full  flex-col gap-4 mx-auto"
        >
          <h1 className="text-xl font-semibold">New ticket</h1>
          <FieldGroup className="flex flex-col gap-3">
            <Field>
              <FieldLabel>Subject</FieldLabel>
              <Input
                placeholder="I got a problem with..."
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
                minLength={3}
              />
            </Field>
            <Field>
              <FieldLabel>Category</FieldLabel>
              <Select value={form.category} onValueChange={(value) => value && setForm({ ...form, category: value })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectGroup>
                    {CATEGORIES.map((c) => (
                      <SelectItem
                        key={c}
                        value={c}
                      >
                        {c}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Priority</FieldLabel>
              <Select value={form.priority} onValueChange={(value) => value && setForm({ ...form, priority: value as Priority })}>
                <SelectTrigger className="capitalize w-full">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectGroup>
                    {PRIORITIES.map((p) => (
                      <SelectItem
                        className="capitalize"
                        key={p}
                        value={p}
                      >
                        {p}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Message</FieldLabel>
              <Textarea
                rows={5}
                placeholder="Describe your problem"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
              />
            </Field>

            {create.error && <ErrorBox message={create.error.message} />}
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create ticket"}
            </Button>
          </FieldGroup>
        </form>
      </Card>
    </div>
  );
}
