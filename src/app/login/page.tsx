"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    router.push("/today");
    router.refresh();
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-zinc-100">Sign in</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded-lg bg-zinc-100 px-4 py-3 text-base font-medium text-zinc-950 disabled:opacity-50"
          >
            {status === "sending" ? "Signing in..." : "Sign in"}
          </button>
          {status === "error" && (
            <p className="text-sm text-red-400">{errorMessage}</p>
          )}
        </form>

        <div className="mt-6 flex justify-between text-sm">
          <Link href="/forgot-password" className="text-zinc-400 underline">
            Forgot password?
          </Link>
          <Link href="/signup" className="text-zinc-400 underline">
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
