"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [code, setCode] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, username, password }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Incorrect company code, username, or password.");
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-sm flex flex-col gap-4"
    >
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-5 text-neutral-900" />
        <div>
          <p className="font-semibold text-neutral-900 text-sm leading-tight">RoadReady</p>
          <p className="text-[11px] text-neutral-400 leading-tight">19-A Compliance</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="code">Company code</Label>
        <Input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
          inputMode="numeric"
          autoComplete="off"
          placeholder="0000"
          maxLength={4}
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={loading || code.length !== 4 || !username || !password}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : "Sign in"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
