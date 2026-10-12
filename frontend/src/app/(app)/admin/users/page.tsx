"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ErrorBox, Spinner } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { useMe } from "@/lib/hooks";
import type { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

export default function AdminUsersPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: me } = useMe();
  const isAdmin = me?.role === "admin";
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "agent",
  });
  const [openDialog, setOpenDialog] = useState(false);
  useEffect(() => {
    if (me && me.role !== "admin") router.replace("/tickets");
  }, [me, router]);
  const {
    data: users,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiFetch<User[]>("/users"),
    enabled: isAdmin,
  });
  const create = useMutation({
    mutationFn: () =>
      apiFetch<User>("/users", { method: "POST", body: JSON.stringify(form) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setForm({ ...form, name: "", email: "", password: "" });
      setOpenDialog(false);
    },
  });
  if (!isAdmin) return <Spinner />;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <div className="flex gap-2 items-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <path d="M16 3.128a4 4 0 0 1 0 7.744" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <circle cx="9" cy="7" r="4" />
          </svg>
          <h1 className="text-xl font-semibold">Users</h1>
        </div>
        <Dialog
          open={openDialog}
          onOpenChange={(open) => {
            setOpenDialog(open);
            if (!open) {
              setForm({ ...form, name: "", email: "", password: "" });
            }
          }}
        >
          <DialogTrigger
            render={
              <Button className="active:translate-y-px">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6"
                >
                  <path d="M2 21a8 8 0 0 1 13.292-6" />
                  <circle cx="10" cy="8" r="5" />
                  <path d="M19 16v6" />
                  <path d="M22 19h-6" />
                </svg>
                Add User
              </Button>
            }
          />
          <DialogContent className="">
            <DialogHeader>
              <DialogTitle>Add new user</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                create.mutate();
              }}
              className="flex flex-col gap-3 rounded"
            >
              <FieldGroup className="flex flex-col gap-3">
                <Field className="gap-1.5">
                  <FieldLabel className="text-sm text-muted-foreground font-normal">
                    Name
                  </FieldLabel>
                  <Input
                    placeholder="Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </Field>
                <Field className="gap-1.5">
                  <FieldLabel className="text-sm text-muted-foreground font-normal">
                    Email
                  </FieldLabel>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    required
                  />
                </Field>
                <Field className="gap-1.5">
                  <FieldLabel className="text-sm text-muted-foreground font-normal">
                    Password
                  </FieldLabel>
                  <Input
                    type="password"
                    placeholder="Password (min 8 characters)"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    required
                    minLength={8}
                  />
                </Field>
                <Field className="gap-1.5">
                  <FieldLabel className="text-sm text-muted-foreground font-normal">
                    Role
                  </FieldLabel>
                  <Select
                    value={form.role}
                    onValueChange={(value) => {
                      setForm({ ...form, role: value ?? "agent" });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {form.role === "agent" ? "Agent" : "Customer"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      <SelectGroup>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
              {create.error && <ErrorBox message={create.error.message} />}
              <DialogFooter>
                <DialogClose
                  render={<Button variant="outline">Cancel</Button>}
                />
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? "Adding…" : "Add user"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading && <Spinner />}
      {error && <ErrorBox message={error.message} />}
      {users?.map((u, index) => (
        <div
          key={u.id}
          style={{
            animationDelay: `${index * 60}ms`,
            animationFillMode: "backwards",
          }}
          className="rounded border bg-white p-3 text-sm hover:border-blue-400 transition-all duration-300 animate-in fade-in slide-in-from-top-2"
        >
          <div className="font-medium">
            {u.name}
            <span className="ml-1 rounded bg-gray-100 px-2 py-0.5 text-xs capitalize">
              {u.role}
            </span>
          </div>
          <div className="text-gray-500">{u.email}</div>
        </div>
      ))}
    </div>
  );
}
