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
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    business_name: "",
    name: "",
    email: "",
    password: "",
  });

  const register = useMutation({
      mutationFn: () =>
        apiFetch<TokenPair>("/auth/register-business", {
          method: "POST",
          body: JSON.stringify(form),
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
              Register your business and create your first account to get started.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={(e) => {
              e.preventDefault();
              register.mutate();
              
            }}>
            <FieldGroup>
              <div className="flex flex-col gap-4">
                <Field className="gap-1.5">
                  <FieldLabel
                    htmlFor="business_name"
                    className="text-sm text-muted-foreground font-normal"
                  >
                    Business Name
                  </FieldLabel>
                  <Input
                    id="business_name"
                    type="text"
                    placeholder="Enter your business name"
                    value={form.business_name}
                    onChange={(e) => {
                      setForm({ ...form, business_name: e.target.value });
                      if (register.error) register.reset();
                    }}
                    required
                    className="dark:bg-background h-9 shadow-xs"
                  />
                </Field>
                <Field className="gap-1.5">
                  <FieldLabel
                    htmlFor="name"
                    className="text-sm text-muted-foreground font-normal"
                  >
                    Name
                  </FieldLabel>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Edy Mikhael"
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      if (register.error) register.reset();
                    }}
                    required
                    className="dark:bg-background h-9 shadow-xs"
                  />
                </Field>
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
                    value={form.email}
                    onChange={(e) => {
                      setForm({ ...form, email: e.target.value });
                      if (register.error) register.reset();
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
                    value={form.password}
                    minLength={8}
                    onChange={(e) => {
                      setForm({ ...form, password: e.target.value });
                      if (register.error) register.reset();
                    }}
                    required
                    className="dark:bg-background h-9 shadow-xs"
                  />
                </Field>
              </div>
              <Field className="gap-4">
                {register.error && <ErrorBox message={register.error.message}/>}
                <Button type="submit" disabled={register.isPending}>
                  {register.isPending ? "Signing up…" : "Sign up"}
                </Button>
                <FieldDescription className="text-center text-sm font-normal text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-card-foreground no-underline!"
                  >
                    Login
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
