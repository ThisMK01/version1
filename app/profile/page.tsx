"use client";

import { useState } from "react";
import { Mail, LogOut, ShieldCheck, UserRound, Check } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback, Button, Card, CardContent, Chip, Input } from "@heroui/react";
import { useAuth } from "../context/authContext";
import { apiClient } from "@/lib/api.client";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0e131f] text-sm font-mono-data text-cyan-400">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping mr-2" />
        LOADING DRIVER TELEMETRY...
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0e131f] px-6 text-center text-white">
        <Card className="bg-[#0e1628] border border-white/10 p-8 max-w-md w-full">
          <CardContent className="space-y-4 items-center">
            <UserRound className="h-12 w-12 text-zinc-500" />
            <h1 className="font-sora text-2xl font-bold">DRIVER NOT AUTHENTICATED</h1>
            <p className="text-sm font-inter text-zinc-400">Sign in with Steam to access your driver profile and race history.</p>
            <Button
              onPress={() => router.push("/")}
              className="mt-4 bg-cyan-400 text-slate-950 font-sora font-bold text-xs px-6 py-3 rounded-lg glow-hover"
            >
              RETURN HOME
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const handleEmailSubmit = () => {
    if (!email.trim()) return;
    setEmailSubmitted(true);
    setEditingEmail(false);
  };

  return (
    <main className="relative min-h-screen bg-[#0e131f] px-6 py-16 text-[#dee2f3] lg:px-16">
      
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#00d9ff_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="space-y-2 border-b border-white/10 pb-6">
          <Chip size="sm" variant="soft" className="bg-cyan-500/10 text-cyan-400 font-mono-data text-xs border border-cyan-500/20">
            DRIVER TELEMETRY & PROFILE
          </Chip>
          <h1 className="font-sora text-4xl font-black text-white tracking-tight sm:text-5xl">
            Driver Profile
          </h1>
          <p className="font-inter text-zinc-400 text-sm max-w-xl">
            Manage your competitive identity, connected Steam credentials, and notifications.
          </p>
        </div>

        {/* Profile Card */}
        <Card className="bg-[#0e1628] border border-white/10 card-inner-border shadow-2xl overflow-hidden">
          <CardContent className="p-8 sm:p-10 space-y-8">
            
            {/* User Identity Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 border-b border-white/10 pb-8">
              <Avatar className="w-24 h-24 ring-4 ring-cyan-400/40 shadow-[0_0_30px_rgba(0,217,255,0.3)]">
                {user.avatar ? (
                  <AvatarImage src={user.avatar} />
                ) : (
                  <AvatarFallback className="bg-cyan-500/20 text-cyan-400 font-sora text-2xl">
                    {user.username?.[0]?.toUpperCase() || "D"}
                  </AvatarFallback>
                )}
              </Avatar>

              <div className="space-y-2">
                <span className="font-mono-data text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  CONNECTED STEAM ACCOUNT
                </span>
                <h2 className="font-sora text-3xl font-bold text-white truncate">
                  {user.username}
                </h2>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Chip
                    size="sm"
                    variant="soft"
                    className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono-data text-xs flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{user.role === "admin" ? "ADMINISTRATOR" : "VERIFIED DRIVER"}</span>
                  </Chip>

                  {user.discordUsername ? (
                    <Chip
                      size="sm"
                      variant="soft"
                      className="bg-[#5865F2]/10 border border-[#5865F2]/40 text-[#5865F2] font-mono-data text-xs flex items-center gap-1.5"
                    >
                      <span>DISCORD: @{user.discordUsername}</span>
                    </Chip>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Connected Discord Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 bg-[#0a1020] p-6 rounded-xl border border-white/5">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 bg-[#5865F2]/10 text-[#5865F2] rounded-lg">
                  <Image
                    src="/discord.png"
                    alt="Discord"
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                </div>
                <div className="space-y-1">
                  <p className="font-sora text-sm font-bold text-white">Discord Integration</p>
                  {user.discordUsername ? (
                    <p className="font-mono-data text-xs text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Connected as @{user.discordUsername}</span>
                    </p>
                  ) : (
                    <p className="font-mono-data text-xs text-zinc-400">
                      No Discord account linked. Connect to receive race notifications and stewarding pings.
                    </p>
                  )}
                </div>
              </div>

              <Button
                size="sm"
                onPress={() => apiClient.auth.discordConnect()}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-sora font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-[0_0_15px_rgba(88,101,242,0.4)]"
              >
                <span>{user.discordUsername ? "RECONNECT DISCORD" : "CONNECT DISCORD"}</span>
              </Button>
            </div>

            {/* Email Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 bg-[#0a1020] p-6 rounded-xl border border-white/5">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-lg">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="font-sora text-sm font-bold text-white">Contact Email</p>
                  {editingEmail ? (
                    <Input
                      autoFocus
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@example.com"
                      className="mt-2 max-w-sm bg-[#0e1628] border border-white/15 text-zinc-200 font-mono-data text-xs h-10 rounded-lg px-3"
                    />
                  ) : (
                    <p className="font-mono-data text-xs text-zinc-400">
                      {emailSubmitted ? email : "No email linked for notifications"}
                    </p>
                  )}
                </div>
              </div>

              {editingEmail ? (
                <Button
                  size="sm"
                  onPress={handleEmailSubmit}
                  isDisabled={!email.trim()}
                  className="bg-cyan-400 text-slate-950 font-sora font-bold text-xs px-4 py-2 glow-hover flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>VERIFY EMAIL</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onPress={() => setEditingEmail(true)}
                  className="border-white/15 text-zinc-200 font-mono-data text-xs hover:bg-white/10"
                >
                  <Mail className="w-4 h-4 mr-1" />
                  <span>ADD EMAIL</span>
                </Button>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Logout Button */}
        <div className="flex justify-end">
          <Button
            variant="danger-soft"
            onPress={handleLogout}
            className="bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 font-mono-data text-xs px-6 py-2 rounded-lg flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>LOGOUT SESSION</span>
          </Button>
        </div>

      </div>
    </main>
  );
}
