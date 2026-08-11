"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Shield, ShieldAlert } from "lucide-react";
import Image from "next/image";
import { Button, Avatar, AvatarImage, AvatarFallback } from "@heroui/react";
import { useAuth } from "../../context/authContext";
import { apiClient } from "@/lib/api.client";

const LINKS = [
  { label: "EVENT", href: "/public/event" },
  { label: "LEADERBOARD", href: "/leaderboard" },
  { label: "POLL", href: "/poll" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, adminMode, setAdminMode } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDevOrAdmin = mounted && user?.role === "admin";

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0a1020]/90 backdrop-blur-md border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-[68px] px-6 lg:px-12">
        
        {/* Brand Logo */}
        <Link
          href="/"
          className="font-sora text-2xl font-black tracking-tight text-white flex items-center gap-2 group"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_12px_#00d9ff]" />
          <span className="text-cyan-400 group-hover:text-cyan-300 transition-colors">ASRT</span>
          <span className="text-zinc-500 font-normal">.CO</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-4">
          {LINKS.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`font-mono-data text-xs font-bold tracking-wider px-3 py-2 rounded-md transition-all duration-200 ${
                  isActive
                    ? "text-cyan-400 bg-white/5 border-b-2 border-cyan-400 shadow-[0_0_15px_rgba(0,217,255,0.2)]"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons & Profile */}
        <div className="hidden md:flex items-center space-x-3">
          
          {/* Steam Login Button (Only if not logged in) */}
          {!user && (
            <Button
              size="sm"
              onPress={apiClient.auth.steamLogin}
              className="bg-cyan-400 text-slate-950 font-sora font-bold text-xs px-4 py-2 rounded-full shadow-[0_0_15px_rgba(0,217,255,0.4)] hover:bg-cyan-300 hover:shadow-[0_0_20px_rgba(0,217,255,0.6)] transition-all flex items-center gap-2"
            >
              <Image
                src="/LOGIN/steam-icon-14867.png"
                alt="Steam"
                width={18}
                height={18}
                className="rounded-full"
              />
              <span>STEAM LOGIN</span>
            </Button>
          )}

          {/* Discord Button — hidden once Discord is linked */}
          {!user?.discordId && (
            <Button
              size="sm"
              onPress={apiClient.auth.discordConnect}
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-mono-data font-bold text-xs px-4 rounded-full shadow-[0_0_15px_rgba(88,101,242,0.4)] hover:shadow-[0_0_20px_rgba(88,101,242,0.6)] transition-all flex items-center gap-2"
            >
              <Image
                src="/discord.png"
                alt="Discord"
                width={16}
                height={16}
                className="rounded-full"
              />
              <span>JOIN DISCORD</span>
            </Button>
          )}

          {/* Admin / User Mode Button */}
          {isDevOrAdmin && (
            <Button
              size="sm"
              onPress={() => setAdminMode(!adminMode)}
              className={`font-mono-data font-bold text-xs px-4 py-2 rounded-full border transition-all flex items-center gap-2 ${
                adminMode
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:bg-amber-500/30"
                  : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_12px_rgba(0,217,255,0.2)] hover:bg-cyan-500/20"
              }`}
            >
              {adminMode ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>ADMIN MODE</span>
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  <span>USER MODE</span>
                </>
              )}
            </Button>
          )}

          {/* User Profile (Only if logged in) */}
          {user && (
            <Link href="/profile" className="pl-1">
              <Avatar size="sm" className="ring-2 ring-cyan-400/50 hover:ring-cyan-400 transition-all cursor-pointer">
                {user?.avatar ? (
                  <AvatarImage src={user.avatar} />
                ) : (
                  <AvatarFallback className="bg-cyan-500/20 text-cyan-400 font-mono-data text-xs">
                    {user?.username?.[0]?.toUpperCase() || "D"}
                  </AvatarFallback>
                )}
              </Avatar>
            </Link>
          )}

        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-zinc-300 border border-white/10 rounded-md hover:bg-white/5"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle Navigation Menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0e131f] px-6 py-4 space-y-3">
          {LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block font-mono-data text-sm font-semibold text-zinc-300 hover:text-cyan-400 py-2 border-b border-white/5"
            >
              {link.label}
            </Link>
          ))}

          {/* Mobile Admin / User Mode Button */}
          {isDevOrAdmin && (
            <Button
              onPress={() => setAdminMode(!adminMode)}
              className={`w-full font-mono-data font-bold text-xs py-2.5 rounded-full border transition-all flex items-center justify-center gap-2 ${
                adminMode
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                  : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_12px_rgba(0,217,255,0.2)]"
              }`}
            >
              {adminMode ? (
                <>
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>SWITCH TO USER MODE</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>SWITCH TO ADMIN MODE</span>
                </>
              )}
            </Button>
          )}

          <div className="pt-2 flex flex-col space-y-2">
            {!user ? (
              <Button
                onPress={() => {
                  setMobileOpen(false);
                  apiClient.auth.steamLogin();
                }}
                className="w-full bg-cyan-400 text-slate-950 font-sora font-bold text-xs py-2 rounded-full shadow-[0_0_15px_rgba(0,217,255,0.4)] flex items-center justify-center gap-2"
              >
                <Image
                  src="/LOGIN/steam-icon-14867.png"
                  alt="Steam"
                  width={18}
                  height={18}
                  className="rounded-full"
                />
                <span>STEAM LOGIN</span>
              </Button>
            ) : (
              <Link href="/profile" onClick={() => setMobileOpen(false)}>
                <Button className="w-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-sora font-bold text-xs py-2 rounded-full flex items-center justify-center gap-2">
                  <Avatar size="sm" className="w-5 h-5">
                    {user?.avatar ? (
                      <AvatarImage src={user.avatar} />
                    ) : (
                      <AvatarFallback className="text-[10px]">
                        {user?.username?.[0]?.toUpperCase() || "D"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span>PROFILE ({user.username})</span>
                </Button>
              </Link>
            )}

            {/* Mobile Discord Button — hidden once Discord is linked */}
            {!user?.discordId && (
              <Button
                onPress={() => {
                  setMobileOpen(false);
                  apiClient.auth.discordConnect();
                }}
                className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-mono-data font-bold text-xs py-2 rounded-full shadow-[0_0_15px_rgba(88,101,242,0.4)] flex items-center justify-center gap-2"
              >
                <Image
                  src="/discord.png"
                  alt="Discord"
                  width={16}
                  height={16}
                  className="rounded-full"
                />
                <span>JOIN DISCORD</span>
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
