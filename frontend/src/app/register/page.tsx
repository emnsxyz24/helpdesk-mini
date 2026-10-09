"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { ErrorBox, btnCls, inputCls } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { setTokens } from "@/lib/auth";
import type { TokenPair } from "@/lib/types";

const FIELDS = [
  ["business_name", "Business name", "text"],
  ["name", "Your name", "text"],
  ["email", "Email", "email"],
  ["password", "Password (min 8 characters)", "password"],
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    business_name: "",
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const tokens = await apiFetch<TokenPair>("/auth/register-business", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setTokens(tokens.access_token, tokens.refresh_token);
      qc.clear();
      router.replace("/tickets");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justifycenter gap-4 p-4">
      {" "}
      <h1 className="text-2xl font-semibold">Register your business</h1>{" "}
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        {" "}
        {FIELDS.map(([key, label, type]) => (
          <input
            key={key}
            className={inputCls}
            type={type}
            placeholder={label}
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            required
          />
        ))}{" "}
        {error && <ErrorBox message={error} />}{" "}
        <button className={btnCls} disabled={loading}>
          {loading ? "Creating…" : "Create business"}{" "}
        </button>{" "}
      </form>{" "}
      <p className="text-sm">
        {" "}
        Already registered?{" "}
        <Link href="/login" className="text-blue-600 underline">
          {" "}
          Sign in{" "}
        </Link>{" "}
      </p>{" "}
    </main>
  );
}
