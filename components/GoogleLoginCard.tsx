"use client";

import { signIn } from "next-auth/react";

export interface GoogleLoginCardProps {
  redirectTo?: string;
}

export function GoogleLoginCard({
  redirectTo = "/dashboard",
}: GoogleLoginCardProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f5f7] px-5 py-12 text-slate-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-40 h-96 w-96 rounded-full bg-blue-200/35 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -right-24 h-[28rem] w-[28rem] rounded-full bg-violet-200/30 blur-3xl"
      />

      <section className="relative w-full max-w-[420px] rounded-[30px] border border-white/80 bg-white/90 p-8 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.24)] backdrop-blur sm:p-10">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold tracking-tight text-white shadow-sm">
            CC
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-slate-800">
            CampusCore
          </span>
        </div>

        <div className="mb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
            University portal
          </p>
          <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.04em] text-slate-950">
            Welcome back.
          </h1>
          <p className="mt-3 text-[15px] leading-6 text-slate-500">
            Sign in with your university Google account to continue to CampusCore.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void signIn("google", { redirectTo })}
          className="group flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
        >
          <GoogleMark />
          <span>Continue with Google</span>
        </button>

        <div className="mt-7 flex items-center gap-3 text-xs leading-5 text-slate-400">
          <span className="h-px flex-1 bg-slate-100" />
          <span>Secure sign-in</span>
          <span className="h-px flex-1 bg-slate-100" />
        </div>
        <p className="mt-5 text-center text-xs leading-5 text-slate-400">
          You’ll be redirected to Google to authenticate.
        </p>
      </section>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v2.79h3.87c2.26-2.08 3.57-5.15 3.57-8.43Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.95-2.93l-3.87-2.99c-1.08.72-2.45 1.15-4.08 1.15-3.13 0-5.78-2.11-6.73-4.95H1.27v3.08A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56V6.64H1.27a12 12 0 0 0 0 10.72l4-3.08Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.77 0 3.36.61 4.61 1.82l3.45-3.45C17.95 1.17 15.24 0 12 0A12 12 0 0 0 1.27 6.64l4 3.08C6.22 6.88 8.87 4.77 12 4.77Z"
      />
    </svg>
  );
}
