"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { LoaderCircle, Radio } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function AuthCallbackContent() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const exchangeCode = async () => {
            const code = searchParams.get("code");

            if (!code) {
                console.error("❌ No authentication code");
                window.location.replace("/");
                return;
            }

            if (!API_URL) {
                console.error("❌ NEXT_PUBLIC_API_URL is missing");
                window.location.replace("/");
                return;
            }

            try {
                console.log("🔥 Exchanging authentication code...");

                const response = await fetch(
                    `${API_URL}/auth/exchange?code=${encodeURIComponent(code)}`,
                    {
                        method: "GET",
                        credentials: "include",
                    }
                );

                if (!response.ok) {
                    console.error(
                        "❌ Authentication exchange failed:",
                        response.status
                    );

                    window.location.replace("/");
                    return;
                }

                const data = await response.json();

                if (data.token) {
                    localStorage.setItem("auth_token", data.token);
                }

                console.log("✅ LOGIN SUCCESS");
                console.log("User:", data.user);

                // Force a complete navigation so AuthProvider
                // mounts again and calls /auth/me with the token or cookie.
                window.location.replace("/");
            } catch (error) {
                console.error("❌ Authentication error:", error);
                window.location.replace("/");
            }
        };

        exchangeCode();
    }, [searchParams]);

    return (
        <main className="relative flex min-h-[calc(100vh-73px)] items-center justify-center overflow-hidden bg-[#090a0d] px-5 py-12 text-zinc-100">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-30"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
                    backgroundSize: "48px 48px",
                    maskImage:
                        "linear-gradient(to bottom, black, transparent 82%)",
                }}
            />

            <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl"
            />

            <section className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#111318]/95 p-8 shadow-2xl shadow-black/40 sm:p-10">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />

                <div className="mb-10 flex items-center justify-between border-b border-white/10 pb-5">
                    <div className="flex items-center gap-2 font-semibold tracking-[0.22em] text-zinc-200">
                        <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.9)]" />
                        ASRT<span className="text-zinc-500">.CO</span>
                    </div>

                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                        Auth / 01
                    </span>
                </div>

                <div className="flex flex-col items-center text-center">
                    <div className="relative mb-7 flex h-20 w-20 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/5 text-cyan-200">
                        <div className="absolute inset-1 rounded-full border border-dashed border-cyan-200/30" />

                        <LoaderCircle
                            className="h-8 w-8 animate-spin"
                            strokeWidth={1.5}
                        />
                    </div>

                    <p className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-cyan-300">
                        <Radio className="h-3.5 w-3.5" />
                        Secure handshake
                    </p>

                    <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                        Signing you in
                    </h1>

                    <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-400">
                        Verifying your credentials and preparing your racing
                        dashboard.
                    </p>
                </div>

                <div className="mt-10 flex items-center gap-3 border-t border-white/10 pt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    Connection encrypted

                    <span className="ml-auto text-zinc-600">
                        Please wait
                    </span>
                </div>
            </section>
        </main>
    );
}

function AuthCallbackLoading() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-[#090a0d] text-zinc-100">
            <LoaderCircle
                className="h-8 w-8 animate-spin text-cyan-300"
                strokeWidth={1.5}
            />
        </main>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={<AuthCallbackLoading />}>
            <AuthCallbackContent />
        </Suspense>
    );
}