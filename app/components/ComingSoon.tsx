"use client";

import { useState } from "react";
import { Card, CardContent, Button, Input, Chip } from "@heroui/react";
import { ArrowRight, Bell, Sparkles } from "lucide-react";
import Link from "next/link";

interface ComingSoonProps {
  title: string;
  subtitle?: string;
  category?: string;
}

export default function ComingSoon({
  title,
  subtitle = "This telemetry module is currently undergoing high-speed development and safety checks for the upcoming season.",
  category = "MODULE STATUS: IN DEVELOPMENT",
}: ComingSoonProps) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
    }
  };

  return (
    <main className="relative min-h-[calc(100vh-136px)] flex items-center justify-center overflow-hidden bg-[#0e131f] text-[#dee2f3] py-20 px-6">
      
      {/* Animated Light Streaks */}
      <div className="racing-lights">
        <div className="light-streak" style={{ top: "25%", animationDelay: "0s" }} />
        <div className="light-streak" style={{ top: "55%", animationDelay: "1.5s", width: "350px" }} />
        <div className="light-streak" style={{ top: "80%", animationDelay: "2.8s", width: "200px" }} />
      </div>

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#00d9ff_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none" />

      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-3xl w-full mx-auto text-center space-y-8">
        
        {/* Header Chip */}
        <div className="inline-flex items-center justify-center">
          <Chip
            size="md"
            variant="soft"
            className="bg-[#0e1628] border border-cyan-500/30 text-cyan-400 font-mono-data text-xs px-4 py-1 shadow-[0_0_15px_rgba(0,217,255,0.2)] flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
            <span>{category}</span>
          </Chip>
        </div>

        {/* Main Title */}
        <div className="space-y-4">
          <h1 className="font-sora text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            {title.toUpperCase()}
          </h1>
          <p className="font-inter text-zinc-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* HeroUI Telemetry Card */}
        <Card className="bg-[#0e1628]/80 border border-white/10 backdrop-blur-md shadow-2xl p-6 sm:p-8 card-inner-border">
          <CardContent className="space-y-6">
            
            {/* Live Telemetry Progress */}
            <div className="space-y-2 text-left">
              <div className="flex justify-between items-center font-mono-data text-xs text-zinc-400">
                <span>MODULE COMPILATION</span>
                <span className="text-cyan-400 font-bold">84% READY</span>
              </div>
              <div className="w-full h-2 bg-[#1b1f2b] rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-cyan-400 w-[84%] shadow-[0_0_12px_#00d9ff]" />
              </div>
            </div>

            {/* Subscription Form */}
            {!subscribed ? (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 pt-2">
                <Input
                  type="email"
                  placeholder="Enter your driver email for early access"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-[#0a1020] border border-white/10 text-zinc-200 placeholder:text-zinc-500 font-mono-data text-xs h-12 rounded-lg px-4"
                />
                <Button
                  type="submit"
                  className="bg-cyan-400 text-slate-950 font-sora font-bold text-xs h-12 px-6 rounded-lg glow-hover flex items-center justify-center gap-2"
                >
                  <span>NOTIFY ME</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            ) : (
              <div className="p-4 bg-cyan-500/10 border border-cyan-400/30 rounded-lg text-cyan-400 font-mono-data text-xs flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>You're on the early access telemetry grid! We'll ping you when this module goes live.</span>
              </div>
            )}

          </CardContent>
        </Card>

        {/* Action button to return home */}
        <div className="pt-4">
          <Link href="/public/event">
            <Button
              variant="outline"
              className="border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 font-mono-data text-xs px-6"
            >
              EXPLORE ACTIVE RACES & EVENTS
            </Button>
          </Link>
        </div>

      </div>

    </main>
  );
}
