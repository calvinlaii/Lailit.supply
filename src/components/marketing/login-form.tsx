"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function isValidEmail(email: string): boolean {
  // RFC 5322 simplified: must have local@domain.tld pattern
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); // No-op — wired in Phase 2

    // Client-side validation
    if (!email.trim()) {
      setErrorMessage("Masukkan email kamu dulu.");
      return;
    }
    if (!isValidEmail(email)) {
      setErrorMessage("Format email belum benar. Coba cek lagi.");
      return;
    }

    // Valid email — clear error (form does nothing in Phase 1)
    setErrorMessage(null);
  }

  return (
    <div className="w-full max-w-[420px] bg-neutral-50 border border-neutral-200 rounded-[12px] p-8 shadow-[0_1px_2px_rgba(10,10,10,0.04),0_4px_12px_rgba(10,10,10,0.04)]">
      <h1 className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-neutral-950 text-center">
        Masuk ke lailit.supply
      </h1>
      <p className="mt-2 text-base font-normal leading-[1.5] text-neutral-500 text-center">
        Kami akan kirim link masuk ke emailmu.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-8">
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="email"
            className="text-sm font-normal leading-[1.45] text-neutral-950"
          >
            Email
          </Label>
          <Input
            id="email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errorMessage) setErrorMessage(null); // clear error on change
            }}
            placeholder="kamu@email.com"
            autoComplete="email"
            aria-describedby={errorMessage ? "email-error" : undefined}
            aria-invalid={!!errorMessage}
            className={`h-11 text-base ${
              errorMessage
                ? "border-red-600 focus-visible:ring-red-600/15"
                : "border-neutral-200 hover:border-neutral-300 focus-visible:border-neutral-950"
            }`}
          />
          {errorMessage && (
            <p
              id="email-error"
              role="alert"
              className="text-sm font-normal leading-[1.45] text-red-600"
            >
              {errorMessage}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="mt-4 w-full inline-flex items-center justify-center bg-neutral-950 text-white px-6 py-3 rounded-lg text-base font-semibold hover:bg-neutral-800 active:bg-neutral-900 transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
        >
          Kirim Magic Link
        </button>

        <p className="mt-3 text-sm font-normal leading-[1.45] text-neutral-500 text-center">
          Belum punya akun? Magic link akan otomatis bikin akun baru.
        </p>
      </form>
    </div>
  );
}
