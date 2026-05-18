import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "@/components/portal/LoginForm";

export const metadata: Metadata = {
  title: "Sign in — Urayf Portal",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-2xl font-semibold tracking-[0.3em] text-white"
          >
            URAYF
          </Link>
          <p className="mt-2 text-sm text-zinc-500">Client portal</p>
        </div>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
