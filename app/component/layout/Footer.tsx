"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@heroui/react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-[#0a1020]/90 backdrop-blur-md text-[#dee2f3] py-12 relative z-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Brand Column */}
        <div className="space-y-4 md:col-span-1">
          <Link href="/" className="font-sora text-2xl font-black tracking-tight text-cyan-400 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#00d9ff]" />
            ASRT<span className="text-zinc-500">.CO</span>
          </Link>
          <p className="text-xs text-zinc-400 font-inter leading-relaxed max-w-sm">
            The definitive platform for competitive sim racing leagues and drivers. Organize races, manage drivers, and track championship standings.
          </p>
        </div>

        {/* Navigation Links */}
        <div>
          <h4 className="font-sora text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Platform</h4>
          <ul className="space-y-2 text-sm font-inter text-zinc-300">
            <li><Link href="/public/event" className="hover:text-cyan-400 transition-colors">Events & Races</Link></li>
            <li><Link href="/leaderboard" className="hover:text-cyan-400 transition-colors">Leaderboards</Link></li>
            <li><Link href="/poll" className="hover:text-cyan-400 transition-colors">Community Polls</Link></li>
          </ul>
        </div>

        {/* Community / Join Discord */}
        <div className="space-y-4">
          <h4 className="font-sora text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Community</h4>
          <p className="text-xs text-zinc-400 font-inter leading-relaxed">
            Connect with league organizers, drivers, and race stewards on our Discord server.
          </p>
          <Link
            href="https://discord.gg/cCSnjPXkK"
            target="_blank"
            rel="noreferrer"
            className="inline-block pt-1"
          >
            <Button
              size="sm"
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-mono-data font-bold text-xs px-5 py-2.5 rounded-full shadow-[0_0_15px_rgba(88,101,242,0.4)] flex items-center gap-2"
            >
              <Image
                src="/discord.png"
                alt="Discord"
                width={16}
                height={16}
                className="rounded-full"
              />
              <span>JOIN DISCORD COMMUNITY</span>
            </Button>
          </Link>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center text-xs text-zinc-500 font-mono-data">
        <p>© {new Date().getFullYear()} ASRT.CO Sim Racing Platform. All rights reserved.</p>
        <p className="mt-2 sm:mt-0">Built for drivers who chase tenths.</p>
      </div>
    </footer>
  );
}
