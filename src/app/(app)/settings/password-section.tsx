"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { inputClass } from "@/lib/run-form";

export default function PasswordSection({
  accentBorderClass,
}: {
  accentBorderClass?: string;
}) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setStatus("error");
      setMessage("Passwords don't match.");
      return;
    }
    setStatus("saving");
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    setPassword("");
    setConfirm("");
    setMode("view");
  }

  function handleCancel() {
    setPassword("");
    setConfirm("");
    setStatus("idle");
    setMessage("");
    setMode("view");
  }

  return (
    <section
      className={`rounded-lg border border-zinc-800 border-l-4 bg-zinc-900 p-4 ${
        accentBorderClass ?? "border-l-zinc-800"
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Password
        </h2>
        {mode === "view" && (
          <button
            type="button"
            onClick={() => setMode("edit")}
            className="text-xs font-medium text-zinc-400 underline"
          >
            Update password
          </button>
        )}
      </div>

      {mode === "edit" && (
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <input
            type="password"
            placeholder="New password (8+ characters)"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClass} w-full`}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            minLength={8}
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={`${inputClass} w-full`}
          />
          {message && <p className="text-sm text-red-400">{message}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="min-h-[44px] flex-1 rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === "saving"}
              className="min-h-[44px] flex-1 rounded-lg bg-zinc-100 text-sm font-medium text-zinc-950 disabled:opacity-50"
            >
              {status === "saving" ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
