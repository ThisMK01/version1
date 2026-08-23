"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getEvent, getEventRegistrations, getRaceResults, type EventItem } from "../../../../api/event/event";
import { ArrowLeft, CalendarDays, Flag, Trophy, Car, User, ChevronUp, ChevronDown, Minus } from "lucide-react";
import { Button } from "@heroui/react";

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

function formatLapTime(ms: number | null | undefined) {
  if (ms === null || ms === undefined || ms === 0) return "-";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
}

function PositionDelta({ start, finish }: { start: number | null; finish: number | null }) {
  if (start === null || finish === null) return <span className="text-zinc-500 font-mono-data text-xs">—</span>;
  const diff = start - finish;
  if (diff > 0) {
    return (
      <div className="flex items-center gap-1 text-emerald-400 font-mono-data text-xs font-bold">
        <ChevronUp className="w-3.5 h-3.5" />
        <span>P{start} → P{finish}</span>
        <span className="text-emerald-300 text-[10px]">(+{diff})</span>
      </div>
    );
  } else if (diff < 0) {
    return (
      <div className="flex items-center gap-1 text-red-400 font-mono-data text-xs font-bold">
        <ChevronDown className="w-3.5 h-3.5" />
        <span>P{start} → P{finish}</span>
        <span className="text-red-300 text-[10px]">({diff})</span>
      </div>
    );
  } else {
    return (
      <div className="flex items-center gap-1 text-zinc-400 font-mono-data text-xs font-bold">
        <Minus className="w-3.5 h-3.5" />
        <span>P{start} → P{finish}</span>
      </div>
    );
  }
}

export default function EventResultsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventItem | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [regUsers, setRegUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!eventId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [eventData, resData, regData] = await Promise.all([
          getEvent(eventId),
          getRaceResults(eventId),
          getEventRegistrations(eventId),
        ]);
        setEvent(eventData);
        setRegUsers(regData.users || []);

        const rawResults = resData.results || [];
        const sorted = [...rawResults].sort((a, b) => {
          if (a.finishPosition !== null && b.finishPosition === null) return -1;
          if (a.finishPosition === null && b.finishPosition !== null) return 1;
          if (a.finishPosition !== null && b.finishPosition !== null) return a.finishPosition - b.finishPosition;
          const statusOrder: Record<string, number> = { FINISHED: 1, DNF: 2, DNS: 3 };
          const aOrder = statusOrder[a.status] || 4;
          const bOrder = statusOrder[b.status] || 4;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return (b.lapCount || 0) - (a.lapCount || 0);
        });

        setResults(sorted);
        setError("");
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load race results");
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
          <span>RETRIEVING RACE RESULTS FROM DATABASE...</span>
        </div>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="relative min-h-screen bg-[#0e131f] text-[#dee2f3] py-12 px-6 lg:px-12">
        <div className="max-w-5xl mx-auto space-y-6">
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

  return (
    <main className="relative min-h-screen bg-[#0e131f] text-[#dee2f3] py-12 px-6 lg:px-12">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#00d9ff_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
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
                <img src={event.cardimage} alt={event.title} className="h-full w-full object-cover" />
              </div>
            )}
            <div className={`space-y-4 ${event.cardimage ? "md:col-span-8" : "md:col-span-12"}`}>
              <div className="flex items-center gap-3">
                <Trophy className="w-7 h-7 text-amber-400 shrink-0" />
                <div>
                  <span className="text-cyan-400 font-mono-data text-xs font-bold tracking-widest uppercase">
                    RACE RESULTS — {event.gameName}
                  </span>
                  <h1 className="font-sora text-2xl sm:text-3xl font-extrabold text-white leading-tight mt-0.5">
                    {event.title}
                  </h1>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono-data text-xs bg-white/5 p-3 rounded-xl border border-white/10">
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase font-bold block">TRACK</span>
                  <span className="text-white font-bold flex items-center gap-1.5 mt-0.5">
                    <Flag className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{event.track}</span>
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase font-bold block">RACE DATE (UTC)</span>
                  <span className="text-cyan-300 font-bold flex items-center gap-1.5 mt-0.5">
                    <CalendarDays className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{formatEventDate(event.startDate)}</span>
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase font-bold block">FINISHERS</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
                    <span>{results.filter((r) => r.status === "FINISHED").length} / {results.length}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-[#0e1628] rounded-2xl border border-white/10 overflow-hidden shadow-xl">
          {results.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <p className="font-mono-data text-zinc-400 text-sm">No race results recorded for this event yet.</p>
              <p className="font-inter text-zinc-500 text-xs">Results will be available once the server session concludes.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-inter text-xs border-collapse">
                <thead>
                  <tr className="bg-white/5 font-mono-data text-[10px] text-zinc-400 uppercase border-b border-white/10">
                    <th className="p-4 font-bold text-center w-14">Slno.</th>
                    <th className="p-4 font-bold w-60">Profile & Steam Name</th>
                    <th className="p-4 font-bold">Registered Name</th>
                    <th className="p-4 font-bold">Car</th>
                    <th className="p-4 font-bold text-center w-24">Car #</th>
                    <th className="p-4 font-bold">Best Lap</th>
                    <th className="p-4 font-bold min-w-[180px]">Grid → Finish</th>
                    <th className="p-4 font-bold text-center w-20">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  {results.map((res, index) => {
                    const regUser = regUsers.find((u) => u.steamId === res.steamId);
                    const driverName = res.name || (regUser ? regUser.name : `Steam ID: ${res.steamId}`);
                    const steamUsername = res.username || (regUser ? regUser.username : "");
                    const avatar = res.avatar || (regUser ? regUser.avatar : "");
                    const carName = res.carName || (regUser ? regUser.carName : `Car #${res.carNumber}`);
                    const pos = res.finishPosition || index + 1;
                    const isMedal = pos === 1 || pos === 2 || pos === 3;
                    const medalColor = pos === 1 ? "text-amber-400" : pos === 2 ? "text-zinc-300" : "text-amber-700";

                    return (
                      <tr
                        key={`${res.steamId}_${res.carNumber}`}
                        className={`hover:bg-white/5 transition-colors ${pos === 1 ? "bg-amber-400/5" : pos === 2 ? "bg-zinc-400/5" : pos === 3 ? "bg-amber-900/10" : ""}`}
                      >
                        {/* Slno / Finish Position */}
                        <td className="p-4 text-center">
                          {res.status === "DNS" ? (
                            <span className="font-mono-data text-zinc-500 font-bold text-sm">—</span>
                          ) : res.status === "DNF" ? (
                            <span className="font-mono-data text-red-400 font-bold text-xs">DNF</span>
                          ) : (
                            <span className={`font-mono-data font-black text-sm ${isMedal ? medalColor : "text-zinc-200"}`}>
                              {pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : `P${pos}`}
                            </span>
                          )}
                        </td>

                        {/* Profile & Steam Name */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-1 ring-cyan-400/40 bg-cyan-500/20 flex items-center justify-center">
                              {avatar ? (
                                <img src={avatar} alt={steamUsername} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-4 h-4 text-cyan-400" />
                              )}
                            </div>
                            <span className="font-bold text-white truncate max-w-[160px]">
                              {steamUsername || "Steam User"}
                            </span>
                          </div>
                        </td>

                        {/* Registered Name */}
                        <td className="p-4 font-semibold text-zinc-200 max-w-[160px]">
                          <span className="truncate block">{driverName}</span>
                        </td>

                        {/* Car */}
                        <td className="p-4 text-zinc-400">
                          <div className="flex items-center gap-1.5">
                            <Car className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span className="truncate max-w-[140px]">{carName}</span>
                          </div>
                        </td>

                        {/* Car Number */}
                        <td className="p-4 text-center font-mono-data font-black text-sm text-cyan-400">
                          #{res.carNumber}
                        </td>

                        {/* Best Lap */}
                        <td className="p-4 font-mono-data text-emerald-400 font-semibold">
                          {formatLapTime(res.bestLapTime)}
                        </td>

                        {/* Position Started ↔ Finished */}
                        <td className="p-4">
                          <PositionDelta start={res.startPosition} finish={res.finishPosition} />
                        </td>

                        {/* Status Badge */}
                        <td className="p-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono-data font-bold ${
                            res.status === "FINISHED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : res.status === "DNF"
                              ? "bg-red-500/10 text-red-400 border border-red-500/30"
                              : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/30"
                          }`}>
                            {res.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
