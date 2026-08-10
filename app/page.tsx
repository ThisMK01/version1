"use client";

import Link from "next/link";
import Image from "next/image";
import { Button, Card, CardContent } from "@heroui/react";
import { ArrowRight, Flag, ShieldCheck, Trophy, ChevronRight, Zap, Users, BarChart3 } from "lucide-react";
import { apiClient } from "@/lib/api.client";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0e131f] text-[#dee2f3]">
      
      {/* Hero Section */}
      <section className="relative min-h-[780px] flex items-center pt-8 pb-20 overflow-hidden">
        
        {/* Cinematic Background Image with Dark Vignette */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-35 scale-105 transition-transform duration-1000"
            style={{ backgroundImage: "url('/BACKGROUND2.jpg')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0e131f]/90 via-[#0e131f]/75 to-[#0e131f]" />
          <div className="absolute inset-0 bg-[radial-gradient(#00d9ff_1px,transparent_1px)] [background-size:32px_32px] opacity-15 pointer-events-none" />
        </div>

        {/* Animated Racing Light Streaks */}
        <div className="racing-lights">
          <div className="light-streak" style={{ top: "20%", animationDelay: "0s" }} />
          <div className="light-streak" style={{ top: "50%", animationDelay: "1.2s", width: "350px" }} />
          <div className="light-streak" style={{ top: "80%", animationDelay: "2.5s", width: "200px" }} />
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 w-full flex flex-col justify-center">
          
          <div className="max-w-3xl space-y-6">
            
            {/* Top Pulse Tag */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-[#0e1628] border border-white/10 rounded-full shadow-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-mono-data text-xs font-bold text-cyan-400 uppercase tracking-widest">
                NEXT-GEN SIM RACING PLATFORM
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="font-sora text-5xl sm:text-7xl font-black tracking-tighter leading-[1.05] text-white">
              RACE. COMPETE.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-500 drop-shadow-[0_0_25px_rgba(0,217,255,0.4)]">
                DOMINATE.
              </span>
            </h1>

            {/* Subtext */}
            <p className="font-inter text-zinc-300 text-lg sm:text-xl max-w-xl leading-relaxed">
              Organize races, manage driver registrations, and track championship standings. The definitive platform built for competitive sim racing leagues and drivers.
            </p>

            {/* Hero Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              
              {/* ENTER THE GRID Button */}
              <Link href="/public/event">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-cyan-400 text-slate-950 font-sora font-extrabold text-sm px-8 py-6 rounded-full glow-hover flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(0,217,255,0.4)]"
                >
                  <span>ENTER THE GRID</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              {/* JOIN DISCORD Button (Vibrant Purple) */}
              <Link
                href="https://discord.gg/cCSnjPXkK"
                target="_blank"
                rel="noreferrer"
              >
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-[#5865F2] hover:bg-[#4752C4] text-white font-mono-data font-bold text-sm px-8 py-6 rounded-full flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(88,101,242,0.5)] hover:shadow-[0_0_25px_rgba(88,101,242,0.7)] transition-all"
                >
                  <Image
                    src="/discord.png"
                    alt="Discord"
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                  <span>JOIN DISCORD</span>
                </Button>
              </Link>

            </div>

          </div>

        </div>
      </section>

      {/* Features Showcase Section */}
      <section className="py-24 max-w-7xl mx-auto px-6 lg:px-12 relative z-10 border-t border-white/5">
        
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="font-mono-data text-xs font-bold text-cyan-400 uppercase tracking-widest">
            ENGINEERED FOR RACERS
          </span>
          <h2 className="font-sora text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Built for High-Octane Competition
          </h2>
          <p className="font-inter text-zinc-400 text-sm">
            Everything you need to host, join, and govern competitive sim racing events.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Feature 1 */}
          <Card className="bg-[#0e1628] rounded-3xl border border-white/10 card-inner-border hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(0,217,255,0.2)] transition-all duration-300 p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,217,255,0.2)]">
                <Flag className="w-6 h-6" />
              </div>
              <h3 className="font-sora text-xl font-bold text-white">
                Race Control & Events
              </h3>
              <p className="font-inter text-zinc-300 text-xs leading-relaxed">
                Seamlessly configure race events across ACC, iRacing, and LMU. Set max grid capacity, car categories, and official track layouts.
              </p>
            </div>
            
            <Link href="/public/event">
              <Button
                variant="ghost"
                className="text-cyan-400 hover:text-cyan-300 font-mono-data text-xs p-0 flex items-center gap-1"
              >
                <span>EXPLORE EVENTS</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </Card>

          {/* Feature 2 */}
          <Card className="bg-[#0e1628] rounded-3xl border border-white/10 card-inner-border hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(147,51,234,0.2)] transition-all duration-300 p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(147,51,234,0.2)]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-sora text-xl font-bold text-white">
                Verified Steam Driver ID
              </h3>
              <p className="font-inter text-zinc-300 text-xs leading-relaxed">
                Connect your Steam profile to manage driver identity, claim car numbers, and verify grid entry credentials.
              </p>
            </div>

            <Button
              onPress={apiClient.auth.steamLogin}
              variant="ghost"
              className="text-purple-400 hover:text-purple-300 font-mono-data text-xs p-0 flex items-center gap-1 justify-start"
            >
              <span>STEAM LOGIN</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Card>

          {/* Feature 3 */}
          <Card className="bg-[#0e1628] rounded-3xl border border-white/10 card-inner-border hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(0,217,255,0.2)] transition-all duration-300 p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,217,255,0.2)]">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="font-sora text-xl font-bold text-white">
                Leaderboards & Polls
              </h3>
              <p className="font-inter text-zinc-300 text-xs leading-relaxed">
                Track league rankings, driver performance telemetry, and cast your vote on upcoming community race proposals.
              </p>
            </div>

            <Link href="/leaderboard">
              <Button
                variant="ghost"
                className="text-cyan-400 hover:text-cyan-300 font-mono-data text-xs p-0 flex items-center gap-1"
              >
                <span>VIEW LEADERBOARD</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </Card>

        </div>

      </section>

      {/* Call to Action Banner Section */}
      <section className="py-20 max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0e1628] via-[#141b30] to-[#1a1430] border border-white/10 p-10 sm:p-16 text-center space-y-8 shadow-2xl">
          
          {/* Radial Glow Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#5865f2_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

          <div className="max-w-2xl mx-auto space-y-4 relative z-10">
            <span className="font-mono-data text-xs font-bold text-purple-400 uppercase tracking-widest">
              JOIN THE COMMUNITY
            </span>
            <h2 className="font-sora text-3xl sm:text-5xl font-black text-white tracking-tight">
              Ready to Take the Green Flag?
            </h2>
            <p className="font-inter text-zinc-300 text-sm sm:text-base leading-relaxed">
              Connect with fellow drivers, arrange practice sessions, and get real-time race notifications on our official Discord server.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10 pt-2">
            <Link
              href="https://discord.gg/cCSnjPXkK"
              target="_blank"
              rel="noreferrer"
            >
              <Button
                size="lg"
                className="w-full sm:w-auto bg-[#5865F2] hover:bg-[#4752C4] text-white font-mono-data font-bold text-sm px-8 py-6 rounded-full shadow-[0_0_20px_rgba(88,101,242,0.5)] flex items-center justify-center gap-2"
              >
                <Image
                  src="/discord.png"
                  alt="Discord"
                  width={20}
                  height={20}
                  className="rounded-full"
                />
                <span>JOIN DISCORD COMMUNITY</span>
              </Button>
            </Link>

            <Link href="/public/event">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white/20 text-white font-sora font-bold text-xs px-8 py-6 rounded-full hover:bg-white/10"
              >
                <span>VIEW ALL RACES</span>
              </Button>
            </Link>
          </div>

        </div>
      </section>

    </main>
  );
}
