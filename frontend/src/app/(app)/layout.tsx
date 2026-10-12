"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { ErrorBox, Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { clearTokens } from "@/lib/auth";
import { useMe } from "@/lib/hooks";
import Navbar from "@/components/ui/navbar";

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
  if (unauthorized) return null;
  if (isLoading) return <Spinner />;
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
    <div className="flex min-h-dvh flex-col">
      <Navbar user={me} onLogout={logout} />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col p-3 sm:p-4 ">
        {children}
      </main>
    </div>
  );
}
