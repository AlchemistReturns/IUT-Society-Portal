"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setError(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold">Reset password</h1>

      {status === "sent" ? (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          Check your email for a password reset link.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {status === "error" && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <label className="flex flex-col gap-1 text-sm">
            University email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white"
          >
            Send reset link
          </button>
        </form>
      )}

      <p className="text-sm text-gray-600">
        <Link href="/login" className="underline">
          Back to sign in
        </Link>
      </p>
    </main>
  );
}
