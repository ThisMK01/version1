"use client";

import { useState } from "react";
import { Mail, LogOut, ShieldCheck, UserRound, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/authContext";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0b0d] text-sm text-zinc-400">
        Loading profile...
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0b0d] px-6 text-center text-white">
        <div>
          <UserRound className="mx-auto mb-4 h-10 w-10 text-zinc-500" />
          <h1 className="text-2xl font-bold">You are not signed in</h1>
          <p className="mt-2 text-sm text-zinc-400">Sign in with Steam to view your profile.</p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-6 rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Return home
          </button>
        </div>
      </main>
    );
  }

  const handleEmailSubmit = () => {
    if (!email.trim()) return;
    setEmailSubmitted(true);
    setEditingEmail(false);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0b0d] px-6 py-16 text-white sm:px-10 lg:px-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(34,211,238,0.13),transparent_32%),radial-gradient(circle_at_88%_82%,rgba(88,101,242,0.12),transparent_30%)]" />
      <div className="relative mx-auto max-w-5xl">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Account</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-zinc-100 sm:text-5xl">Your profile</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">Manage your identity and account details in one place.</p>
        </div>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="flex flex-col gap-8 border-b border-white/10 p-7 sm:flex-row sm:items-center sm:p-10">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-cyan-300/40 bg-zinc-800 shadow-[0_0_35px_rgba(34,211,238,0.2)]">
              {user.avatar ? (
                <img src={user.avatar} alt={user.username} className="h-full w-full object-cover" />
              ) : (
                <UserRound className="absolute inset-0 m-auto h-12 w-12 text-zinc-500" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Steam account</p>
              <h2 className="mt-2 truncate text-3xl font-bold text-zinc-100">{user.username}</h2>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                {user.role === "admin" ? "Administrator" : "Verified player"}
              </div>
            </div>
          </div>

          <div className="p-7 sm:p-10">
            <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-black/20 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-zinc-200">Email address</p>
                  {editingEmail ? (
                    <input
                      autoFocus
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@example.com"
                      className="mt-2 w-full max-w-sm rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-300/70"
                    />
                  ) : (
                    <p className="mt-1 truncate text-sm text-zinc-500">{emailSubmitted ? email : "No email added yet"}</p>
                  )}
                </div>
              </div>
              {editingEmail ? (
                <button
                  type="button"
                  onClick={handleEmailSubmit}
                  disabled={!email.trim()}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Check className="h-4 w-4" />
                  Verify email
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingEmail(true)}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-cyan-300/50 hover:bg-cyan-300/10 hover:text-cyan-200"
                >
                  <Mail className="h-4 w-4" />
                  Add email
                </button>
              )}
            </div>

          </div>
        </section>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            title="Log out"
            className="inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:border-red-400/60 hover:bg-red-500/20 hover:text-red-200"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </main>
  );
}
