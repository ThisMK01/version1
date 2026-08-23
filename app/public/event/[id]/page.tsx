"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getEvent, getEventRegistrations, type EventItem } from "../../../api/event/event";
import { ArrowLeft, CalendarDays, Flag, Trophy, Car, User } from "lucide-react";
import { Button, Avatar } from "@heroui/react";

function formatEventDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const day = date.getUTCDate();
  const suffix = day % 10 === 1 && day !== 11 ? "st" : day % 10 === 2 && day !== 12 ? "nd" : day % 10 === 3 && day !== 13 ? "rd" : "th";
  const monthYear = date.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
  const rawHours = date.getUTCHours();
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const ampm = rawHours >= 12 ? "PM" : "AM";
  const hours12 = rawHours % 12 === 0 ? 12 : rawHours % 12;

  return `${day}${suffix} ${monthYear} • ${hours12}:${minutes} ${ampm} UTC`;
}

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventItem | null>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!eventId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [eventData, regData] = await Promise.all([
          getEvent(eventId),
          getEventRegistrations(eventId),
        ]);
        setEvent(eventData);
        setRegistrations(regData.users || []);
        setError("");
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load event details");
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [eventId]);

  if (loading) {
    return (
      <main className="relative min-h-screen bg-[#0e131f] text-[#dee2f3] py-20 px-6 flex items-center justify-center">
        <div className="text-center font-mono-data text-sm text-cyan-400 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span>CONNECTING TO TELEMETRY GRID...</span>
        </div>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="relative min-h-screen bg-[#0e131f] text-[#dee2f3] py-12 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button
            onPress={() => router.push("/public/event")}
            variant="outline"
            className="rounded-full border border-white/20 text-zinc-100 hover:bg-white/10 font-mono-data text-xs px-4 py-2 font-semibold flex items-center gap-1.5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK TO EVENTS</span>
          </Button>
          <div className="p-6 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl font-mono-data text-xs">
            ⚠️ {error || "Event not found"}
          </div>
        </div>
      </main>
    );
  }

  const regCount = registrations.length;
  const maxDrivers = event.numberOfDrivers ?? 0;
  const isFull = maxDrivers > 0 && regCount >= maxDrivers;
  const fillPercent = maxDrivers > 0 ? Math.min(100, Math.round((regCount / maxDrivers) * 100)) : 0;

  return (
    <main className="relative min-h-screen bg-[#0e131f] text-[#dee2f3] py-12 px-6 lg:px-12">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#00d9ff_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-8">
        {/* Back Button */}
        <div>
          <Button
            onPress={() => router.push("/public/event")}
            variant="outline"
            className="rounded-full border border-white/20 text-zinc-100 hover:bg-white/10 font-mono-data text-xs px-4 py-2 font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK TO EVENTS</span>
          </Button>
        </div>

        {/* Event Header Banner Card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0e1628] p-6 sm:p-8 shadow-xl">
          <div className="grid gap-6 md:grid-cols-12 items-center">
            {event.cardimage && (
              <div className="h-40 md:h-48 w-full overflow-hidden rounded-2xl border border-white/10 md:col-span-4 shadow-xl">
                <img
                  src={event.cardimage}
                  alt={event.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className={`space-y-4 ${event.cardimage ? "md:col-span-8" : "md:col-span-12"}`}>
              <div>
                <span className="text-cyan-400 font-mono-data text-xs font-bold tracking-widest uppercase">
                  {event.gameName}
                </span>
                <h1 className="font-sora text-2xl sm:text-3xl font-extrabold text-white leading-tight mt-1">
                  {event.title}
                </h1>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono-data text-xs bg-white/5 p-3 rounded-xl border border-white/10">
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase font-bold block">TRACK</span>
                  <span className="text-white font-bold flex items-center gap-1.5 mt-0.5">
                    <Flag className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{event.track}</span>
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase font-bold block">START TIME (UTC)</span>
                  <span className="text-cyan-300 font-bold flex items-center gap-1.5 mt-0.5">
                    <CalendarDays className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{formatEventDate(event.startDate)}</span>
                  </span>
                </div>
                {event.prizePool && (
                  <div>
                    <span className="text-zinc-400 text-[10px] uppercase font-bold block">PRIZE POOL</span>
                    <span className="text-amber-400 font-bold flex items-center gap-1.5 mt-0.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{event.prizePool}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Drivers Grid Fill Indicator */}
        <div className="bg-[#0e1628] rounded-2xl border border-white/10 p-6 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <h2 className="font-sora text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
                <span>Registered Drivers</span>
                <span className="rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 px-2.5 py-0.5 font-mono-data text-xs">
                  {regCount} / {maxDrivers}
                </span>
              </h2>
              <p className="text-zinc-400 text-xs mt-1">
                Drivers currently checked-in to the telemetry entrylist.
              </p>
            </div>
            <div className="text-right font-mono-data text-xs">
              <span className="text-zinc-400 font-bold">GRID CAPACITY: </span>
              <span className={isFull ? "text-amber-400 font-black" : "text-cyan-400 font-black"}>
                {fillPercent}% FULL
              </span>
            </div>
          </div>
          {maxDrivers > 0 && (
            <div className="w-full h-3 bg-[#1b1f2b] rounded-full overflow-hidden border border-white/5">
              <div
                className={`h-full transition-all duration-300 ${
                  isFull ? "bg-amber-400 shadow-[0_0_12px_#f59e0b]" : "bg-cyan-400 shadow-[0_0_12px_#00d9ff]"
                }`}
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          )}
        </div>

        {/* Registered Racers Table */}
        <div className="bg-[#0e1628] rounded-2xl border border-white/10 overflow-hidden shadow-xl">
          {registrations.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <p className="font-mono-data text-zinc-400 text-sm">No drivers have registered for this event yet.</p>
              <p className="font-inter text-zinc-500 text-xs">Be the first to claim a spot on the grid!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-inter text-xs border-collapse">
                <thead>
                  <tr className="bg-white/5 font-mono-data text-[10px] text-zinc-400 uppercase border-b border-white/10">
                    <th className="p-4 font-bold text-center w-16">Slno.</th>
                    <th className="p-4 font-bold w-64">Profile Pic & Steam Name</th>
                    <th className="p-4 font-bold">Registered Name</th>
                    <th className="p-4 font-bold">Car</th>
                    <th className="p-4 font-bold text-center w-32">Car Number</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  {registrations.map((driver, index) => (
                    <tr key={`${driver.steamId}_${index}`} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-center font-bold font-mono-data text-zinc-500">
                        {index + 1}
                      </td>
                      <td className="p-4 font-bold text-white">
                        <div className="flex items-center gap-3">
                          <Avatar size="sm" className="ring-1 ring-cyan-400/40 shrink-0">
                            {driver.avatar ? (
                              <img src={driver.avatar} alt={driver.username} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              <div className="w-full h-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">
                                <User className="w-4 h-4" />
                              </div>
                            )}
                          </Avatar>
                          <span className="truncate max-w-[180px]">{driver.username || "Steam User"}</span>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-zinc-200">
                        {driver.name}
                      </td>
                      <td className="p-4 text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="truncate max-w-[160px]">{driver.carName || `Car Model #${driver.carModelId}`}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center font-mono-data font-black text-sm text-cyan-400">
                        #{driver.carNumber}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
