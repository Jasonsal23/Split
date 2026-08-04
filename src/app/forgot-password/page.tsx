"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-zinc-100">Reset password</h1>
        <p className="mt-2 text-sm text-zinc-400">
          We&apos;ll email you a link to set a new password.
        </p>

        {status === "sent" ? (
          <p className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-200">
            Check {email} for a reset link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full rounded-lg bg-zinc-100 px-4 py-3 text-base font-medium text-zinc-950 disabled:opacity-50"
            >
              {status === "sending" ? "Sending..." : "Send reset link"}
            </button>
            {status === "error" && (
              <p className="text-sm text-red-400">{errorMessage}</p>
            )}
          </form>
        )}

        <p className="mt-6 text-sm text-zinc-400">
          <Link href="/login" className="underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
