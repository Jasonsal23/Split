"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setStatus("error");
      setErrorMessage("Passwords don't match.");
      return;
    }

    setStatus("saving");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

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
        <h1 className="text-2xl font-semibold text-zinc-100">Set a new password</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            type="password"
            required
            minLength={8}
            placeholder="New password (8+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={status === "saving"}
            className="w-full rounded-lg bg-zinc-100 px-4 py-3 text-base font-medium text-zinc-950 disabled:opacity-50"
          >
            {status === "saving" ? "Saving..." : "Update password"}
          </button>
          {status === "error" && (
            <p className="text-sm text-red-400">{errorMessage}</p>
          )}
        </form>
      </div>
    </main>
  );
}
