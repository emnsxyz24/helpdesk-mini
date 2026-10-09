"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { ErrorBox, Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { clearTokens } from "@/lib/auth";
import { useMe } from "@/lib/hooks";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: me, isLoading, error } = useMe();
  const unauthorized = error instanceof ApiError && error.status === 401;

  useEffect(() => {
    if (unauthorized) {
      clearTokens();
      router.replace("/login");
    }
  }, [unauthorized, router]);
  if (isLoading || unauthorized) return <Spinner />;
  if (error || !me)
    return (
      <ErrorBox message="Could not reach the server. Please refresh the page." />
    );

  function logout() {
    clearTokens();
    qc.clear();
    router.replace("/login");
  }
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 p-3 text-sm">
          <span className="font-semibold">{me.business.name}</span>
          <Link href="/tickets" className="text-blue-600">
            Tickets
          </Link>
          {me.role === "customer" && (
            <Link href="/tickets/new" className="text-blue-600">
              New ticket
            </Link>
          )}
          {me.role === "admin" && (
            <Link href="/admin/users" className="text-blue-600">
              Users
            </Link>
          )}
          <span className="ml-auto text-gray-500">
            {me.name} · {me.role}
          </span>
          <button onClick={logout} className="text-red-600">
            Logout
          </button>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl p-3 sm:p-4">{children}</main>
    </div>
  );
}
