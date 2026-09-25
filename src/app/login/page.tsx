"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageViewTracker } from "@/components/analytics/trackers";
import { trackEvent } from "@/lib/analytics";

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
    trackEvent("login_submitted", { success: res.ok });

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
      className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl shadow-blue-950/10 flex flex-col gap-4"
    >
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-5 text-blue-600" />
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
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-white p-4">
      <PageViewTracker surface="auth" />
      {/* Same diagonal navy/blue treatment as the marketing landing page */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-y-0 right-0 w-full sm:w-[70%]"
          style={{
            clipPath: "polygon(30% 0, 100% 0, 100% 100%, 0% 100%)",
            background: "linear-gradient(160deg, #0B1330 0%, #142257 55%, #1E3A8A 100%)",
          }}
        />
        <div
          className="absolute inset-y-0 right-0 w-full opacity-70 sm:w-[70%]"
          style={{
            clipPath: "polygon(58% 0, 100% 0, 100% 100%, 42% 100%)",
            background: "linear-gradient(160deg, #1D4ED8 0%, #2563EB 100%)",
          }}
        />
        <div
          className="absolute right-8 top-10 hidden size-32 sm:block"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,.3) 1px, transparent 1px)",
            backgroundSize: "14px 14px",
          }}
        />
        <div
          className="absolute left-6 bottom-6 size-32"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(0,0,0,.08) 1px, transparent 1px)",
            backgroundSize: "14px 14px",
          }}
        />
      </div>

      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
