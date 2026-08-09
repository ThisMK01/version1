"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { Switch } from '@heroui/react';
import {useAuth} from "../../context/authContext";
import { apiClient } from "@/lib/api.client";


const LINKS = [
  { label: "Event", href: "/public/event" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Poll", href: "/poll" },
];

type AnchorRefs = Record<string, HTMLAnchorElement | null>;

export default function Navbar() {
  const [active, setActive] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const itemRefs = useRef<AnchorRefs>({});
  const railRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = itemRefs.current[active];
    const rail = railRef.current;
    if (el && rail) {
      const elRect = el.getBoundingClientRect();
      const railRect = rail.getBoundingClientRect();
      setIndicator({
        left: elRect.left - railRect.left,
        width: elRect.width,
      });
    }
  }, [active, mobileOpen]);

  const { user, adminMode, setAdminMode } = useAuth();
 
  console.log("User in Navbar:", user); // Debugging line

  return (
    <nav
      className="sticky top-0 z-50 w-full"
      style={{
        background:
          "linear-gradient(180deg, rgba(10,10,12,0.97) 0%, rgba(14,14,17,0.97) 100%)",
        borderBottom: "1px solid rgba(161,161,170,0.14)",
        boxShadow: "0 1px 24px rgba(0,0,0,0.55)",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .sim-brand { font-family: 'Rajdhani', sans-serif; }
        .sim-nav-font { font-family: 'Inter', sans-serif; }
        @keyframes sim-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(212,212,216,0.55); }
          50% { opacity: 0.55; box-shadow: 0 0 0 4px rgba(212,212,216,0); }
        }
        .sim-pulse-dot { animation: sim-pulse 2s ease-in-out infinite; }
        .sim-link { position: relative; transition: color 0.2s ease; }
        .sim-link:focus-visible {
          outline: 2px solid rgba(212,212,216,0.8);
          outline-offset: 4px;
          border-radius: 4px;
        }
      `}</style>

      <div className="relative flex w-full items-center gap-4 px-6 py-4">
        {/* Brand */}
        <Link
          href="/"
          className="sim-brand flex shrink-0 items-center gap-2 text-xl font-bold tracking-wide"
          style={{
            color: "#e4e4e7",
            textShadow: "0 0 18px rgba(161,161,170,0.45)",
          }}
        >
          <span
            className="sim-pulse-dot inline-block h-2 w-2 rounded-full"
            style={{ background: "#d4d4d8" }}
          />
          ASRT<span style={{ color: "#71717a" }}>.CO</span>
        </Link>

        {/* Centered desktop links */}
        <div className="relative hidden min-w-0 flex-1 justify-center md:flex">
          <div
            ref={railRef}
            className="sim-nav-font relative flex items-center gap-2 lg:gap-4"
          >
            {/* sliding glow indicator */}
            <span
              className="pointer-events-none absolute -bottom-[21px] h-[2px] rounded-full transition-all duration-300 ease-out"
              style={{
                left: indicator.left,
                width: indicator.width,
                background:
                  "linear-gradient(90deg, transparent, #d4d4d8, transparent)",
                boxShadow: "0 0 12px 2px rgba(212,212,216,0.65)",
              }}
            />
            {LINKS.map((link) => {
              const isActive = active === link.label;
              return (
                <Link
                  key={link.label}
                  ref={(el) => {
                    if (el) itemRefs.current[link.label] = el;
                  }}
                  href={link.href}
                  onClick={() => {
                    setActive(link.label);
                  }}
                  className="sim-link inline-flex items-center rounded-full px-2 py-2 text-sm font-semibold tracking-[0.1em] transition duration-300 ease-out hover:text-[#e2e8f0] hover:bg-white/5 lg:px-3 lg:tracking-[0.14em]"
                  style={{
                    color: isActive ? "#f4f4f5" : "#9ca3af",
                    textShadow: isActive
                      ? "0 0 10px rgba(212,212,216,0.5)"
                      : "none",
                    background: isActive ? "rgba(255,255,255,0.06)" : "transparent",
                    boxShadow: isActive
                      ? "0 0 24px rgba(212,212,216,0.08)"
                      : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = "#e2e8f0";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = "#9ca3af";
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right buttons and profile */}
        <div className="hidden shrink-0 items-center gap-2 md:flex lg:gap-3">
          <button
             onClick={apiClient.auth.steamLogin}
            className="sim-nav-font inline-flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full bg-cyan-400 px-2 py-1.5 text-xs font-semibold text-slate-950 transition duration-200 hover:bg-cyan-300 hover:text-slate-950 shadow-[0_14px_40px_-22px_rgba(56,189,248,0.85)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200 focus-visible:outline-offset-2 lg:px-3"
            style={{
              boxShadow: "0 12px 40px -24px rgba(56,189,248,0.9)",
            }}
          >
            <Image
              src="/LOGIN/steam-icon-14867.png"
              alt="Steam"
              width={24}
              height={24}
              className="h-6 w-6 rounded-full border border-white/20 bg-slate-950"
            />
            Sign in with Steam
          </button>
          <Link
            href="/api/auth/discord/connect"
            className="sim-nav-font inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-[#5865F2] px-2 py-1.5 text-xs font-semibold text-white transition duration-200 hover:bg-[#4550C1] hover:text-white lg:px-3"
            style={{
              boxShadow: "0 12px 40px -24px rgba(88,101,242,0.9)",
            }}
          >
            <Image
              src="/discord.png"
              alt="Discord"
              width={24}
              height={24}
              className="h-6 w-6 rounded-full border border-white/20 bg-white"
            />
            Join Discord
          </Link>
          
          {user && user.role === "admin" && (
            
            <Switch
              isSelected={adminMode}
              onChange={setAdminMode}
              aria-label="Toggle admin mode"
              className="sim-nav-font shrink-0"
            >
              <Switch.Content className="flex items-center gap-2 text-xs font-semibold text-white">
                <span>{adminMode ? "Admin Mode" : "User Mode"}</span>
                <Switch.Control className="h-6 w-11 overflow-hidden rounded-full bg-white/20 p-1 data-[selected=true]:bg-blue-600">
                  <Switch.Thumb
                    className="!m-0 !shrink-0 rounded-full"
                    style={{
                      width: "16px",
                      minWidth: "16px",
                      height: "16px",
                      minHeight: "16px",
                      display: "block",
                      flexShrink: 0,
                      borderRadius: "9999px",
                      backgroundColor: "#ffffff",
                      transform: adminMode ? "translateX(20px)" : "translateX(0)",
                      transition: "transform 200ms ease",
                      zIndex: 1,
                    }}
                  />
                </Switch.Control>
              </Switch.Content>
            </Switch>
          )}

          <Link
            href="/profile"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 text-white transition duration-200 hover:bg-white/20"
            aria-label="Open profile"
          >
            {user?.avatar ? (
              <Image
                src={user.avatar}
                alt={user.username}
                width={40}
                height={40}
                unoptimized
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
            
          </Link>
        </div>
        <button
          className="flex items-center justify-center rounded-md p-2 md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          style={{
            color: "#e4e4e7",
            border: "1px solid rgba(161,161,170,0.2)",
            boxShadow: mobileOpen
              ? "0 0 14px rgba(161,161,170,0.35)"
              : "none",
          }}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile panel */}
      <div
        className="sim-nav-font overflow-hidden transition-all duration-300 ease-out md:hidden"
        style={{
          maxHeight: mobileOpen ? "320px" : "0px",
          borderTop: mobileOpen
            ? "1px solid rgba(161,161,170,0.14)"
            : "1px solid transparent",
        }}
      >
        <div className="flex flex-col gap-1 px-6 py-3">
          {LINKS.map((link) => {
            const isActive = active === link.label;
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => {
                  setActive(link.label);
                  setMobileOpen(false);
                }}
                className="rounded-md px-3 py-2.5 text-sm font-medium"
                style={{
                  color: isActive ? "#f4f4f5" : "#8a8a92",
                  background: isActive
                    ? "rgba(212,212,216,0.08)"
                    : "transparent",
                  boxShadow: isActive
                    ? "inset 0 0 0 1px rgba(212,212,216,0.25)"
                    : "none",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
