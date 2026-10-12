"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ErrorBox } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { setTokens } from "@/lib/auth";
import type { TokenPair } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      apiFetch<TokenPair>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (tokens) => {
      setTokens(tokens.access_token, tokens.refresh_token);
      qc.clear();
      router.replace("/tickets");
    },
  });

  return (
    <main className="flex min-h-screen w-full items-center justify-center">
      <Card className="relative w-full max-w-md gap-6 px-6 py-8 sm:p-12">
        <CardHeader className="text-center gap-6">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-2xl font-medium">
              Welcome to SVO Helpdesk
            </CardTitle>
            <CardDescription className="text-sm">
              Login to your account now
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              login.mutate({email, password });
            }}
          >
            <FieldGroup>
              <div className="flex flex-col gap-4">
                <Field className="gap-1.5">
                  <FieldLabel
                    htmlFor="email"
                    className="text-sm text-muted-foreground font-normal"
                  >
                    Email
                  </FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@svo.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (login.isError) login.reset();
                    }}
                    required
                    className="dark:bg-background h-9 shadow-xs"
                  />
                </Field>
                <Field className="gap-1.5">
                  <FieldLabel
                    htmlFor="password"
                    className="text-sm text-muted-foreground font-normal"
                  >
                    Password
                  </FieldLabel>

                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (login.isError) login.reset();
                    }}
                    required
                    className="dark:bg-background h-9 shadow-xs"
                  />
                </Field>
              </div>
              <Field className="gap-4">
                {login.error && <ErrorBox message={login.error.message} />}
                <Button type="submit" disabled={login.isPending}>
                  {login.isPending ? "Signing in…" : "Sign in"}
                </Button>
                <FieldDescription className="text-center text-sm font-normal text-muted-foreground">
                  New business?{" "}
                  <Link
                    href="/register"
                    className="font-medium text-card-foreground no-underline!"
                  >
                    Create an account
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
