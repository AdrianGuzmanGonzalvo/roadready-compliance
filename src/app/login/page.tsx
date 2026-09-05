"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [codes, setCodes] = React.useState<string[]>([]);
  const [tenantsError, setTenantsError] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/auth/tenants")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setCodes(data.codes ?? []))
      .catch(() => setTenantsError(true));
  }, []);

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
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoFocus
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

      <div className="space-y-1.5">
        <Label htmlFor="code">Company code</Label>
        <Select value={code} onValueChange={setCode}>
          <SelectTrigger id="code" className="w-full">
            <SelectValue placeholder={tenantsError ? "Couldn't load companies" : "Select your company..."} />
          </SelectTrigger>
          <SelectContent>
            {codes.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-neutral-50 p-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
      <a href="/privacy" className="text-xs text-neutral-400 hover:text-neutral-600 hover:underline">
        Privacy Policy
      </a>
    </div>
  );
}
