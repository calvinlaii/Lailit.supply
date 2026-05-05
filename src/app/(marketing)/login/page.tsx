import type { Metadata } from "next";
import { LoginForm } from "@/components/marketing/login-form";

export const metadata: Metadata = {
  title: "Masuk — lailit.supply",
  description: "Masuk ke lailit.supply. Kami akan kirim magic link ke emailmu.",
};

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4 py-20">
      <LoginForm />
    </div>
  );
}
