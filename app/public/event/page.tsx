"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarDays, Gamepad2, Pencil, Plus, UserPlus, X, Flag, Trophy, ShieldCheck, Car, ChevronRight, Info, Eye, FileText, FileUp, Download, FileJson, Search, Filter, AlertCircle } from "lucide-react";
import { Button, Card, CardContent, Chip, ListBox, TextArea } from "@heroui/react";
import { useAuth } from "../../context/authContext";
import { createEvent, getCarClasses, getCars, getEvents, getAccEntryList, getEventRegistrations, registerForEvent, updateEvent, uploadEventImage, type Car as CarType, type CarClass, type EventForm, type EventItem } from "../../api/event/event";
import { getNationalitiesForGame } from "../../data/nationalities";
import acctracks from "../../tracks/tracks";
import lmuTracks from "../../tracks/lmutracks";
import { ClassCheckboxes, FloatingInput, FloatingSelect, EventDateTimePicker, MarkdownRenderer } from "./components/EventFormControls";

const emptyForm: EventForm = { title: "", gameName: "", startDate: "", endDate: "", track: "", description: "", prizePool: "", cardimage: "", numberOfDrivers: 0, classes: [] };

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

function getDatePart(isoString: string) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

function getTimePart(isoString: string) {
  if (!isoString) return "20:00";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "20:00";
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function convertLocalToUtcIso(localDateTimeStr: string) {
  if (!localDateTimeStr) return "";
  const d = new Date(localDateTimeStr);
  if (Number.isNaN(d.getTime())) return localDateTimeStr;
  return d.toISOString();
}

const gameLogos: Record<string, string> = {
  ACC: "/Game/acc.png",
  iRacing: "/Game/iracing.png",
  LMU: "/Game/tbm.png",
  AC: "/Game/ac.jpg",
};

export default function EventPage() {
  const { user, adminMode } = useAuth();
  const canManageEvents = adminMode;
  const [events, setEvents] = useState<EventItem[]>([]);
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [formStep, setFormStep] = useState<1 | 2 | 3 | 4>(1);
  const [mdTab, setMdTab] = useState<"write" | "preview">("write");
  const [detailModalEvent, setDetailModalEvent] = useState<EventItem | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [datePart, setDatePart] = useState("");
  const [timePart, setTimePart] = useState("20:00");
  const [endDatePart, setEndDatePart] = useState("");
  const [endTimePart, setEndTimePart] = useState("22:00");

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const availableTracks: Record<string, string> = form.gameName === "ACC" ? acctracks : form.gameName === "LMU" ? lmuTracks : {};
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [classesByGame, setClassesByGame] = useState<Record<string, CarClass[]>>({});
  const [loadingClassesFor, setLoadingClassesFor] = useState("");
  const [carsByQuery, setCarsByQuery] = useState<Record<string, CarType[]>>({});
  const [loadingCarsFor, setLoadingCarsFor] = useState("");
  const [registrationEvent, setRegistrationEvent] = useState<EventItem | null>(null);
  const [registration, setRegistration] = useState({ firstName: "", lastName: "", className: "", carNumber: "", car: "", nationality: "" });
  const [takenCarNumbers, setTakenCarNumbers] = useState<number[]>([]);
  const [registered, setRegistered] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [gameFilter, setGameFilter] = useState("All");
  const [trackFilter, setTrackFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const loadEvents = async () => {
    try {
      setLoading(true);
      setEvents(await getEvents());
      setError("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Lock body scroll whenever any modal is open
  useEffect(() => {
    const anyModalOpen = showForm || !!registrationEvent || !!detailModalEvent;
    if (anyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showForm, registrationEvent, detailModalEvent]);

  const handleDownloadEntryList = async (eventId: string, title: string) => {
    try {
      const entryList = await getAccEntryList(eventId);
      const jsonString = JSON.stringify(entryList, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "_");
      link.download = `${safeTitle}_entrylist.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setToast({ message: "Downloaded entrylist.json successfully!", type: "success" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to download entrylist.json";
      setToast({ message: msg, type: "error" });
    }
  };

  const updateForm = (field: keyof EventForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const loadClasses = async (game: string) => {
    if (!game || classesByGame[game] || loadingClassesFor === game) return;

    try {
      setLoadingClassesFor(game);
      setError("");
      const classes = await getCarClasses(game);
      setClassesByGame((current) => ({ ...current, [game]: classes.filter((item) => item.active !== false) }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load classes");
    } finally {
      setLoadingClassesFor("");
    }
  };

  const loadCars = async (game: string, carClass: string) => {
    const queryKey = `${game}:${carClass}`;
    if (!game || !carClass || carsByQuery[queryKey] || loadingCarsFor === queryKey) return;

    try {
      setLoadingCarsFor(queryKey);
      setError("");
      const cars = await getCars(game, carClass);
      setCarsByQuery((current) => ({ ...current, [queryKey]: cars }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load cars");
    } finally {
      setLoadingCarsFor("");
    }
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDatePart("");
    setTimePart("20:00");
    setEndDatePart("");
    setEndTimePart("22:00");
    setImagePreview("");
    setError("");
    setFormStep(1);
    setMdTab("write");
    setShowForm(true);
  };

  const openEditForm = (event: EventItem) => {
    setEditingId(event._id);
    setForm({ title: event.title, gameName: event.gameName || "", startDate: event.startDate, endDate: event.endDate || "", track: event.track, description: event.description, prizePool: event.prizePool || "", cardimage: event.cardimage || "", numberOfDrivers: event.numberOfDrivers || 0, classes: event.classes || [] });
    setDatePart(getDatePart(event.startDate));
    setTimePart(getTimePart(event.startDate));
    setEndDatePart(event.endDate ? getDatePart(event.endDate) : "");
    setEndTimePart(event.endDate ? getTimePart(event.endDate) : "22:00");
    setImagePreview(event.cardimage || "");
    setError("");
    void loadClasses(event.gameName || "");
    setFormStep(1);
    setMdTab("write");
    setShowForm(true);
  };

  const handleImageChange = async (file: File | undefined) => {
    if (!file) return;

    try {
      setImagePreview(URL.createObjectURL(file));
      setUploadingImage(true);
      setError("");
      const imageUrl = await uploadEventImage(file);
      setForm((current) => ({ ...current, cardimage: imageUrl }));
      setToast({ message: "Banner image uploaded successfully!", type: "success" });
    } catch (requestError) {
      const msg = requestError instanceof Error ? requestError.message : "Failed to upload image";
      setError(msg);
      setForm((current) => ({ ...current, cardimage: "" }));
      setImagePreview("");
      setToast({ message: `Image upload failed: ${msg}`, type: "error" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleMdFileUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        updateForm("description", text);
        setToast({ message: "Rules markdown file loaded successfully!", type: "success" });
      }
    };
    reader.readAsText(file);
  };

  const validateEventDates = (): boolean => {
    if (!datePart || !timePart) {
      const msg = "Please select a race start date and start time.";
      setError(msg);
      setToast({ message: msg, type: "error" });
      return false;
    }

    const startMs = new Date(`${datePart}T${timePart}`).getTime();
    if (isNaN(startMs)) {
      const msg = "Invalid race start date or time format.";
      setError(msg);
      setToast({ message: msg, type: "error" });
      return false;
    }

    // 1. Prevent past start dates when creating a new event
    if (!editingId && startMs < Date.now() - 5 * 60 * 1000) {
      const msg = "Race start date and time cannot be in the past.";
      setError(msg);
      setToast({ message: msg, type: "error" });
      return false;
    }

    // 2. Validate end date/time if either is provided
    if (endDatePart || endTimePart) {
      if (!endDatePart || !endTimePart) {
        const msg = "Please select both end date and end time, or leave both empty.";
        setError(msg);
        setToast({ message: msg, type: "error" });
        return false;
      }

      const endMs = new Date(`${endDatePart}T${endTimePart}`).getTime();
      if (isNaN(endMs)) {
        const msg = "Invalid race end date or time format.";
        setError(msg);
        setToast({ message: msg, type: "error" });
        return false;
      }

      if (endMs <= startMs) {
        const msg = "Race end date and time must be strictly after the start date and time.";
        setError(msg);
        setToast({ message: msg, type: "error" });
        return false;
      }
    }

    setError("");
    return true;
  };

  const saveEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManageEvents) return;

    if (!validateEventDates()) {
      setFormStep(1);
      return;
    }

    if (uploadingImage) {
      setToast({ message: "Please wait for banner image upload to finish.", type: "error" });
      return;
    }

    if (!form.cardimage) {
      setFormStep(3);
      const msg = "Event banner image is required. Please upload an image in Step 3.";
      setError(msg);
      setToast({ message: msg, type: "error" });
      return;
    }

    try {
      setSaving(true);
      const localDateTimeStr = `${datePart}T${timePart}`;
      const localEndDateTimeStr = endDatePart && endTimePart ? `${endDatePart}T${endTimePart}` : "";
      const eventData = {
        ...form,
        startDate: convertLocalToUtcIso(localDateTimeStr),
        ...(localEndDateTimeStr ? { endDate: convertLocalToUtcIso(localEndDateTimeStr) } : {}),
      };

      if (editingId) {
        await updateEvent(editingId, eventData);
        setToast({ message: "Event updated successfully!", type: "success" });
      } else {
        await createEvent(eventData);
        setToast({ message: "Event created successfully!", type: "success" });
      }
      setShowForm(false);
      setError("");
      await loadEvents();
    } catch (requestError) {
      const msg = requestError instanceof Error ? requestError.message : "Failed to save event";
      setError(msg);
      setToast({ message: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const openRegistration = async (event: EventItem) => {
    const regCount = event.numberOfregistrations ?? 0;
    const maxDrivers = event.numberOfDrivers ?? 0;
    if (maxDrivers > 0 && regCount >= maxDrivers) {
      setToast({ message: `Grid is full for ${event.title} (${regCount}/${maxDrivers} drivers registered).`, type: "error" });
      return;
    }

    const checkEnd = event.endDate || event.startDate;
    if (new Date(checkEnd).getTime() < Date.now()) {
      setToast({ message: "Registration is closed because this event has already ended.", type: "error" });
      return;
    }

    setRegistrationEvent(event);
    void loadCars(event.gameName, registration.className);
    setRegistration({ firstName: "", lastName: "", className: "", carNumber: "", car: "", nationality: "" });
    setRegistered(null);
    try {
      const regData = await getEventRegistrations(event._id);
      setTakenCarNumbers(regData.takenCarNumbers || []);
    } catch {
      setTakenCarNumbers([]);
    }
  };

  const submitRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!registrationEvent || !registration.className || !registration.car || !registration.nationality || !registration.carNumber) {
      setToast({ message: "Please fill out all required fields including Car Number and Nationality.", type: "error" });
      return;
    }

    const carNum = Number(registration.carNumber);
    if (!Number.isInteger(carNum) || carNum < 1 || carNum > 999) {
      setToast({ message: "Car Number must be between 1 and 999.", type: "error" });
      return;
    }

    if (takenCarNumbers.includes(carNum)) {
      setToast({ message: `Car #${carNum} is already claimed by another driver for this event.`, type: "error" });
      return;
    }

    try {
      setRegistering(true);
      setError("");
      const parsedNat = registrationEvent.gameName === "ACC"
        ? Number(registration.nationality)
        : registration.nationality;

      await registerForEvent({
        eventId: registrationEvent._id,
        firstName: registration.firstName,
        lastName: registration.lastName,
        carModelId: Number(registration.car),
        carNumber: carNum,
        category: registration.className,
        nationality: parsedNat,
      });

      // Instant local state update of grid fill count
      setEvents((prevEvents) =>
        prevEvents.map((item) =>
          item._id === registrationEvent._id
            ? { ...item, numberOfregistrations: (item.numberOfregistrations || 0) + 1 }
            : item
        )
      );

      setTakenCarNumbers((prev) => [...prev, carNum]);
      setRegistered(registrationEvent._id);
      setToast({ message: "Registration confirmed!", type: "success" });
    } catch (requestError) {
      const msg = requestError instanceof Error ? requestError.message : "Failed to register for event";
      setError(msg);
      setToast({ message: msg, type: "error" });
    } finally {
      setRegistering(false);
    }
  };

  const formClasses = form.gameName ? classesByGame[form.gameName] || [] : [];
  const registrationClassOptions = registrationEvent?.classes || [];
  const registrationCarsKey = registrationEvent && registration.className
    ? `${registrationEvent.gameName}:${registration.className}`
    : "";
  const registrationCars = registrationCarsKey
    ? carsByQuery[registrationCarsKey] || []
    : [];
  const carSelectLabel = !registration.className
    ? "Select Class First"
    : loadingCarsFor && loadingCarsFor === registrationCarsKey
    ? "Loading Cars..."
    : "Car Model";

  const filteredEvents = events.filter((ev) => gameFilter === "All" || ev.gameName === gameFilter);

  const now = Date.now();
  const strictLiveEvents = filteredEvents.filter((ev) => {
    const startStr = ev.startDate || (ev as any).date || "";
    const evDate = new Date(startStr).getTime();
    const evEnd = ev.endDate ? new Date(ev.endDate).getTime() : evDate + 4 * 3600 * 1000;
    return evDate <= now && now <= evEnd;
  });

  const liveEvent = strictLiveEvents[0] || null;
  const upcomingEvents = filteredEvents;

  return (
    <main className="relative min-h-screen bg-[#0e131f] text-[#dee2f3] py-12 px-6 lg:px-12">
      {/* Floating Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl border font-mono-data text-xs shadow-2xl backdrop-blur-md transition-all duration-300 ${
          toast.type === "error"
            ? "bg-red-950/90 border-red-500/50 text-red-200"
            : "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
        }`}>
          <span className={`w-2.5 h-2.5 rounded-full ${toast.type === "error" ? "bg-red-400 animate-ping" : "bg-emerald-400"}`} />
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} className="ml-2 text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#00d9ff_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/10 pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2">
              <Chip size="sm" variant="soft" className="bg-cyan-500/10 text-cyan-400 font-mono-data text-xs border border-cyan-500/20">
                OFFICIAL LEAGUE EVENTS
              </Chip>
            </div>
            <h1 className="font-sora text-3xl sm:text-4xl font-black text-white tracking-tight">
              Upcoming Race Events
            </h1>
            <p className="font-inter text-zinc-300 text-sm max-w-2xl">
              Discover upcoming sim racing championships, driver entries, and live server registrations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canManageEvents && (
              <Button
                onPress={openCreateForm}
                className="bg-cyan-400 text-slate-950 font-sora font-bold text-xs px-5 py-2.5 rounded-full glow-hover shadow-[0_0_15px_rgba(0,217,255,0.4)] flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>CREATE EVENT</span>
              </Button>
            )}
          </div>
        </div>

        {/* Big Featured Live Event Banner Card */}
        {liveEvent && (
          <div className="relative overflow-hidden rounded-3xl border-2 border-red-500/50 bg-gradient-to-br from-[#180a18] via-[#0e1628] to-[#0a1020] p-6 sm:p-8 shadow-[0_0_50px_rgba(239,68,68,0.25)] transition-all">
            {/* Live Glows */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-red-600/20 blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 grid gap-6 lg:grid-cols-12 items-center">
              {/* Banner Image */}
              <div className="relative h-56 lg:h-64 w-full overflow-hidden rounded-2xl border border-white/10 lg:col-span-5 shadow-2xl">
                {liveEvent.cardimage ? (
                  <img
                    src={liveEvent.cardimage}
                    alt={liveEvent.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-cyan-950/40">
                    <Gamepad2 className="h-16 w-16 text-cyan-400/40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                {/* Live Indicator */}
                <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-red-600 px-3.5 py-1 font-mono-data text-xs font-black uppercase text-white shadow-xl tracking-wider animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                  <span>🔴 LIVE EVENT NOW</span>
                </div>

                {/* Game Logo */}
                {gameLogos[liveEvent.gameName] && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/70 backdrop-blur-md px-2.5 py-1 border border-white/20">
                    <img
                      src={gameLogos[liveEvent.gameName]}
                      alt={liveEvent.gameName}
                      className="w-5 h-5 object-contain"
                    />
                    <span className="font-mono-data text-xs font-bold text-cyan-400">{liveEvent.gameName}</span>
                  </div>
                )}
              </div>

              {/* Details & Action */}
              <div className="space-y-4 lg:col-span-7 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-red-400 font-mono-data text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                    <span>FEATURED RACE BROADCAST</span>
                  </span>
                  <h2 className="font-sora text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                    {liveEvent.title}
                  </h2>
                </div>

                {/* Telemetry Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono-data text-xs bg-white/5 p-3.5 rounded-xl border border-white/10">
                  <div>
                    <span className="text-zinc-400 text-[10px] uppercase font-bold block">TRACK</span>
                    <span className="text-white font-bold flex items-center gap-1.5 mt-0.5">
                      <Flag className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{liveEvent.track}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 text-[10px] uppercase font-bold block">START TIME (UTC)</span>
                    <span className="text-cyan-300 font-bold flex items-center gap-1.5 mt-0.5">
                      <CalendarDays className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{formatEventDate(liveEvent.startDate || (liveEvent as any).date)}</span>
                    </span>
                  </div>
                  {liveEvent.prizePool && (
                    <div>
                      <span className="text-zinc-400 text-[10px] uppercase font-bold block">PRIZE POOL</span>
                      <span className="text-amber-400 font-bold flex items-center gap-1.5 mt-0.5">
                        <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{liveEvent.prizePool}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Discord Stream Action Button */}
                <div className="pt-2">
                  <a
                    href="https://discord.gg/simsports"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 rounded-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-sora font-extrabold text-xs sm:text-sm py-3.5 px-7 shadow-[0_0_25px_rgba(88,101,242,0.5)] transition-all duration-300 transform hover:scale-[1.02] w-full sm:w-auto text-center"
                  >
                    <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 127.14 96.36">
                      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a73.57,73.57,0,0,0,64.32,0c.87.68,1.76,1.36,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.64-27.38-4.51-51.11-18.91-72.13ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.91,53.87,53,48.8,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5.08-12.74,11.44-12.74S96.23,45.91,96.1,53,91,65.69,84.69,65.69Z" />
                    </svg>
                    <span>JOIN DISCORD TO WATCH THE RACE</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Control Bar */}
        <div className="bg-[#0e1628] p-4 rounded-2xl border border-white/10 shadow-xl space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Game Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <span className="font-mono-data text-xs font-bold text-zinc-400 uppercase mr-1 flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5 text-cyan-400" />
                <span>GAME:</span>
              </span>
              {["All", "ACC", "iRacing", "LMU", "AC"].map((game) => (
                <button
                  key={game}
                  type="button"
                  onClick={() => setGameFilter(game)}
                  className={`px-3 py-1.5 text-xs font-mono-data rounded-full border transition-all duration-200 shrink-0 flex items-center gap-1.5 ${
                    gameFilter === game
                      ? "bg-cyan-400 text-slate-950 border-cyan-400 font-bold shadow-[0_0_12px_rgba(0,217,255,0.4)]"
                      : "bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {gameLogos[game] && (
                    <img src={gameLogos[game]} alt={game} className="w-3.5 h-3.5 object-contain" />
                  )}
                  <span>{game === "All" ? "ALL GAMES" : game}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section Header: Upcoming Events */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 pt-2">
          <h2 className="font-sora text-xl font-bold text-white flex items-center gap-2">
            <span>🏁 UPCOMING RACE EVENTS</span>
            <span className="rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 px-2.5 py-0.5 font-mono-data text-xs">
              {upcomingEvents.length}
            </span>
          </h2>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg font-mono-data text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Event Grid - Compact Card Width (max-w-[330px]) */}
        {loading ? (
          <div className="py-20 text-center font-mono-data text-sm text-cyan-400 flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span>CONNECTING TO TELEMETRY GRID...</span>
          </div>
        ) : upcomingEvents.length === 0 ? (
          <Card className="bg-[#0e1628] border border-white/10 p-12 text-center rounded-2xl">
            <p className="font-mono-data text-zinc-400 text-sm">No scheduled upcoming events match your filter criteria.</p>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 justify-items-center">
            {upcomingEvents.map((event) => {
              const regCount = event.numberOfregistrations ?? 0;
              const maxDrivers = event.numberOfDrivers ?? 0;
              const isFull = maxDrivers > 0 && regCount >= maxDrivers;
              const eventStartDate = event.startDate || (event as any).date || "";
              const checkEndDate = event.endDate || eventStartDate;
              const isPast = new Date(checkEndDate).getTime() < Date.now();
              const isLive = new Date(eventStartDate).getTime() <= Date.now() && !isPast;
              const fillPercent = maxDrivers > 0 ? Math.min(100, Math.round((regCount / maxDrivers) * 100)) : 0;

              return (
                <Card
                  key={event._id}
                  className="group bg-[#0e1628] rounded-2xl border border-white/10 card-inner-border hover:border-cyan-400/60 hover:shadow-[0_0_25px_rgba(0,217,255,0.25)] transition-all duration-300 flex flex-col justify-between overflow-hidden p-3 max-w-[330px] w-full"
                >
                  {/* Header Inset Image Banner */}
                  <div className="relative h-40 w-full overflow-hidden rounded-xl bg-[#0a1020]">
                    {event.cardimage ? (
                      <img
                        src={event.cardimage}
                        alt={event.title}
                        className="h-full w-full object-cover opacity-90 transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-cyan-950/30">
                        <Gamepad2 className="h-10 w-10 text-cyan-400/40" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-[#0e1628] via-[#0e1628]/40 to-black/60" />

                    {/* Date Pill (Top Left) */}
                    <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[#0a1020]/90 border border-white/20 px-2.5 py-0.5 font-mono-data text-[11px] font-bold text-cyan-400 backdrop-blur-md shadow-md z-10">
                      <CalendarDays className="h-3.5 w-3.5 text-cyan-400" />
                      <span>{formatEventDate(eventStartDate)}</span>
                    </div>

                    {/* Status Badge (Top Right) */}
                    {isPast ? (
                      <div className="absolute right-3 top-3 rounded-full bg-red-950/90 border border-red-500/50 text-red-400 px-2.5 py-0.5 font-mono-data text-[10px] font-bold z-10 shadow-lg">
                        SESSION ENDED
                      </div>
                    ) : isLive ? (
                      <div className="absolute right-3 top-3 rounded-full bg-red-600/90 border border-red-400/70 text-white px-2.5 py-0.5 font-mono-data text-[10px] font-bold z-10 shadow-lg animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
                        LIVE
                      </div>
                    ) : isFull ? (
                      <div className="absolute right-3 top-3 rounded-full bg-amber-950/90 border border-amber-500/50 text-amber-400 px-2.5 py-0.5 font-mono-data text-[10px] font-bold z-10 shadow-lg animate-pulse">
                        GRID FULL
                      </div>
                    ) : gameLogos[event.gameName] ? (
                      <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white p-1 shadow-lg z-10">
                        <img src={gameLogos[event.gameName]} alt={event.gameName} className="h-full w-full object-contain" />
                      </div>
                    ) : null}

                    {/* Overlay Game tag & Clear Title */}
                    <div className="absolute bottom-2.5 left-3 right-3 z-10">
                      <span className="font-mono-data text-[11px] font-bold uppercase tracking-wider text-cyan-400 drop-shadow">
                        {event.gameName || "SIM RACING"}
                      </span>
                      <h2 className="font-sora text-base font-bold text-white leading-snug drop-shadow-md truncate">
                        {event.title}
                      </h2>
                    </div>
                  </div>

                  <CardContent className="p-3.5 space-y-3">
                    <div className="pt-0.5 grid grid-cols-2 gap-2 text-xs font-inter">
                      <div>
                        <span className="block font-mono-data text-[10px] text-zinc-400 uppercase font-bold">Track</span>
                        <span className="font-bold text-white flex items-center gap-1 truncate">
                          <Flag className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="truncate">{event.track}</span>
                        </span>
                      </div>

                      {event.prizePool ? (
                        <div>
                          <span className="block font-mono-data text-[10px] text-zinc-400 uppercase font-bold">Prize Pool</span>
                          <span className="font-bold text-amber-400 flex items-center gap-1 truncate">
                            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">{event.prizePool}</span>
                          </span>
                        </div>
                      ) : event.classes && event.classes.length > 0 ? (
                        <div>
                          <span className="block font-mono-data text-[10px] text-zinc-400 uppercase font-bold">Class</span>
                          <span className="font-bold text-white flex items-center gap-1 truncate">
                            <Car className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span className="truncate">{event.classes.join(", ")}</span>
                          </span>
                        </div>
                      ) : null}
                    </div>

                    {/* Drivers / Grid Capacity Bar */}
                    {maxDrivers > 0 && (
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[11px] font-mono-data text-zinc-300">
                          <span className={`uppercase font-bold ${isFull ? "text-amber-400" : "text-zinc-400"}`}>
                            {isFull ? "GRID FULL" : "GRID FILL"}
                          </span>
                          <span className={`font-bold ${isFull ? "text-amber-400" : "text-white"}`}>
                            {regCount} / {maxDrivers} DRIVERS
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#1b1f2b] rounded-full overflow-hidden border border-white/5">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isFull ? "bg-amber-400 shadow-[0_0_8px_#f59e0b]" : "bg-cyan-400 shadow-[0_0_8px_#00d9ff]"
                            }`}
                            style={{ width: `${fillPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-end gap-2">
                      {canManageEvents ? (
                        <>
                          <Button
                            size="sm"
                            onPress={() => void handleDownloadEntryList(event._id, event.title)}
                            variant="outline"
                            className="rounded-full border border-cyan-400/40 text-cyan-300 hover:bg-cyan-400 hover:text-slate-950 font-mono-data text-xs px-3 py-1.5 font-semibold flex items-center gap-1.5 transition-all"
                          >
                            <Download className="h-3.5 w-3.5 shrink-0" />
                            <span>entrylist.json</span>
                          </Button>

                          <Button
                            size="sm"
                            onPress={() => openEditForm(event)}
                            variant="outline"
                            className="rounded-full border border-white/20 text-zinc-100 hover:bg-white/10 font-mono-data text-xs px-3.5 py-1.5 font-semibold flex items-center gap-1"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span>EDIT EVENT</span>
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            onPress={() => setDetailModalEvent(event)}
                            variant="outline"
                            className="rounded-full border border-white/20 text-zinc-100 hover:bg-white/10 font-mono-data text-xs px-3.5 py-1.5 font-semibold flex items-center gap-1"
                          >
                            <Info className="h-3.5 w-3.5 text-cyan-400" />
                            <span>DETAILS</span>
                          </Button>

                          {isPast ? (
                            <Button
                              size="sm"
                              isDisabled
                              variant="outline"
                              className="rounded-full border border-red-500/30 bg-red-500/10 text-red-400 font-mono-data text-xs px-3.5 py-1.5 font-bold cursor-not-allowed"
                            >
                              <span>ENDED</span>
                            </Button>
                          ) : isFull ? (
                            <Button
                              size="sm"
                              isDisabled
                              variant="outline"
                              className="rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 font-mono-data text-xs px-3.5 py-1.5 font-bold cursor-not-allowed"
                            >
                              <span>FULL</span>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onPress={() => openRegistration(event)}
                              className="rounded-full bg-cyan-400 text-slate-950 font-sora font-extrabold text-xs px-5 py-1.5 glow-hover shadow-[0_0_15px_rgba(0,217,255,0.4)] flex items-center gap-1.5"
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                              <span>REGISTER</span>
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal for Creating / Editing Event */}
        {canManageEvents && showForm && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="flex min-h-full items-start justify-center px-4 py-8">
              <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0e1628] p-6 shadow-2xl space-y-5 my-auto">
              
              {/* Header & Close Button */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
                <div>
                  <span className="font-mono-data text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                    STEP {formStep} OF 4
                  </span>
                  <h2 className="font-sora text-xl font-bold text-white">
                    {editingId ? "Update Event" : "Create Event"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stepper Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono-data text-zinc-400 font-bold uppercase tracking-wider">
                  <span className={formStep === 1 ? "text-cyan-400" : ""}>1. Details</span>
                  <span className={formStep === 2 ? "text-cyan-400" : ""}>2. Grid</span>
                  <span className={formStep === 3 ? "text-cyan-400" : ""}>3. Banner</span>
                  <span className={formStep === 4 ? "text-cyan-400" : ""}>4. Rules (.md)</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-300 shadow-[0_0_8px_#00d9ff]"
                    style={{ width: `${(formStep / 4) * 100}%` }}
                  />
                </div>
              </div>

              {/* In-form error message banner */}
              {error && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-red-300 text-xs font-mono-data flex items-center justify-between gap-2.5 shadow-lg animate-pulse">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setError("")}
                    className="text-red-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <form onSubmit={saveEvent} className="space-y-4 pt-1">
                {/* Step 1: Basic Event Details */}
                {formStep === 1 && (
                  <div className="space-y-3.5">
                    <FloatingInput
                      required
                      label="Event Name"
                      value={form.title}
                      onChange={(e) => updateForm("title", e.target.value)}
                      placeholder="e.g. Endurance Championship Round 1"
                    />
                    <FloatingSelect
                      label="Game"
                      selectedKey={form.gameName || null}
                      onSelectionChange={(key) => {
                        const game = String(key);
                        setForm((current) => ({ ...current, gameName: game, track: "", classes: [] }));
                        void loadClasses(game);
                      }}
                    >
                      <ListBox.Item id="ACC">ACC</ListBox.Item>
                      <ListBox.Item id="LMU">LMU</ListBox.Item>
                      <ListBox.Item id="iRacing">iRacing</ListBox.Item>
                      <ListBox.Item id="AC">AC</ListBox.Item>
                    </FloatingSelect>
                    {(() => {
                      const startMs = datePart && timePart ? new Date(`${datePart}T${timePart}`).getTime() : NaN;
                      const endMs = endDatePart && endTimePart ? new Date(`${endDatePart}T${endTimePart}`).getTime() : NaN;
                      const isStartPast = !editingId && !isNaN(startMs) && startMs < Date.now() - 5 * 60 * 1000;
                      const isEndBeforeStart = !isNaN(startMs) && !isNaN(endMs) && endMs <= startMs;

                      return (
                        <>
                          <EventDateTimePicker
                            dateValue={datePart}
                            timeValue={timePart}
                            onDateChange={(d) => setDatePart(d)}
                            onTimeChange={(t) => setTimePart(t)}
                            label="RACE START DATE & TIME"
                            minDate={new Date().toISOString().split("T")[0]}
                            isInvalid={isStartPast}
                            errorMessage={isStartPast ? "Start date and time cannot be in the past" : undefined}
                          />
                          <EventDateTimePicker
                            dateValue={endDatePart}
                            timeValue={endTimePart}
                            onDateChange={(d) => setEndDatePart(d)}
                            onTimeChange={(t) => setEndTimePart(t)}
                            label="RACE END DATE & TIME"
                            previewLabel="Race End"
                            required={false}
                            minDate={datePart || new Date().toISOString().split("T")[0]}
                            isInvalid={isEndBeforeStart}
                            errorMessage={isEndBeforeStart ? "Race end date/time must be strictly after race start date/time" : undefined}
                          />
                        </>
                      );
                    })()}
                    <FloatingSelect
                      label="Track"
                      isDisabled={!form.gameName || Object.keys(availableTracks).length === 0}
                      selectedKey={form.track || null}
                      onSelectionChange={(key) => updateForm("track", String(key))}
                    >
                      {Object.entries(availableTracks).map(([val, label]) => (
                        <ListBox.Item key={val} id={val}>{label}</ListBox.Item>
                      ))}
                    </FloatingSelect>

                    {(() => {
                      const startMs = datePart && timePart ? new Date(`${datePart}T${timePart}`).getTime() : NaN;
                      const endMs = endDatePart && endTimePart ? new Date(`${endDatePart}T${endTimePart}`).getTime() : NaN;
                      const isStartPast = !editingId && !isNaN(startMs) && startMs < Date.now() - 5 * 60 * 1000;
                      const isEndBeforeStart = !isNaN(startMs) && !isNaN(endMs) && endMs <= startMs;

                      return (
                        <Button
                          type="button"
                          isDisabled={
                            !form.title.trim() ||
                            !form.gameName ||
                            !datePart ||
                            !timePart ||
                            !form.track ||
                            isStartPast ||
                            isEndBeforeStart
                          }
                          onPress={() => {
                            if (validateEventDates()) {
                              setFormStep(2);
                            }
                          }}
                          className="w-full bg-cyan-400 text-slate-950 font-sora font-bold text-xs py-3 rounded-full glow-hover flex items-center justify-center gap-1.5"
                        >
                          <span>NEXT: GRID & CLASSES</span>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      );
                    })()}
                  </div>
                )}

                {/* Step 2: Grid Capacity & Car Classes */}
                {formStep === 2 && (
                  <div className="space-y-3.5">
                    <FloatingInput
                      required
                      type="number"
                      min={1}
                      label="Max Drivers Grid"
                      value={String(form.numberOfDrivers || "")}
                      onChange={(e) => setForm((curr) => ({ ...curr, numberOfDrivers: Number(e.target.value) || 0 }))}
                      placeholder="e.g. 30"
                    />
                    <FloatingInput
                      label="Prize Pool"
                      value={form.prizePool || ""}
                      onChange={(e) => updateForm("prizePool", e.target.value)}
                      placeholder="Optional e.g. $500 Pool"
                    />

                    <ClassCheckboxes
                      classes={formClasses}
                      value={form.classes || []}
                      disabled={!form.gameName || loadingClassesFor === form.gameName || formClasses.length === 0}
                      onChange={(values) => setForm((curr) => ({ ...curr, classes: values }))}
                    />

                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onPress={() => setFormStep(1)}
                        className="w-1/3 border-white/20 text-zinc-300 font-mono-data text-xs py-3 rounded-full hover:bg-white/10"
                      >
                        BACK
                      </Button>
                      <Button
                        type="button"
                        isDisabled={!form.numberOfDrivers || form.numberOfDrivers <= 0 || (form.classes?.length || 0) === 0}
                        onPress={() => setFormStep(3)}
                        className="w-2/3 bg-cyan-400 text-slate-950 font-sora font-bold text-xs py-3 rounded-full glow-hover flex items-center justify-center gap-1.5"
                      >
                        <span>NEXT: BANNER IMAGE</span>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Banner Image */}
                {formStep === 3 && (
                  <div className="space-y-3.5">
                    <label className="block rounded-2xl border border-dashed border-white/15 bg-white/5 p-3.5 text-xs cursor-pointer hover:bg-white/10 transition-colors">
                      <span className="block font-bold text-white mb-1">Event Card Banner Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => void handleImageChange(e.target.files?.[0])}
                        className="block w-full text-xs text-zinc-400 file:mr-3 file:rounded-full file:border-0 file:bg-cyan-400 file:px-3 file:py-1 file:font-bold file:text-slate-950 cursor-pointer"
                      />
                      {uploadingImage && (
                        <div className="mt-3 flex items-center justify-center gap-2 text-cyan-400 font-mono-data text-xs py-4 bg-black/30 rounded-xl border border-cyan-400/30">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                          <span>Uploading image to server...</span>
                        </div>
                      )}
                      {imagePreview && !uploadingImage && (
                        <div className="relative mt-3">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="h-36 w-full rounded-xl object-cover border border-white/10"
                          />
                          {form.cardimage ? (
                            <span className="absolute top-2 right-2 rounded-full bg-emerald-500/90 text-slate-950 px-2.5 py-0.5 font-mono-data text-[10px] font-bold shadow-md">
                              ✓ Uploaded
                            </span>
                          ) : (
                            <span className="absolute top-2 right-2 rounded-full bg-red-500/90 text-white px-2.5 py-0.5 font-mono-data text-[10px] font-bold shadow-md">
                              ✕ Upload Failed
                            </span>
                          )}
                        </div>
                      )}
                    </label>

                    {error && (
                      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 font-mono-data flex items-center justify-between">
                        <span>⚠️ {error}</span>
                        <button type="button" onClick={() => setError("")} className="text-red-400 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onPress={() => setFormStep(2)}
                        className="w-1/3 border-white/20 text-zinc-300 font-mono-data text-xs py-3 rounded-full hover:bg-white/10"
                      >
                        BACK
                      </Button>
                      <Button
                        type="button"
                        isDisabled={uploadingImage || !form.cardimage}
                        onPress={() => {
                          if (uploadingImage) {
                            setToast({ message: "Please wait for banner image upload to finish.", type: "error" });
                            return;
                          }
                          if (!form.cardimage) {
                            setToast({ message: "Image upload failed or missing. Please select a valid image.", type: "error" });
                            return;
                          }
                          setFormStep(4);
                        }}
                        className="w-2/3 bg-cyan-400 text-slate-950 font-sora font-bold text-xs py-3 rounded-full glow-hover flex items-center justify-center gap-1.5"
                      >
                        {uploadingImage ? (
                          <span>UPLOADING IMAGE...</span>
                        ) : (
                          <>
                            <span>NEXT: RULES & DETAILS (.MD)</span>
                            <ChevronRight className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 4: Rules & Details (.md) */}
                {formStep === 4 && (
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="font-mono-data text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        <span>RULES EDITOR (.MD)</span>
                      </span>
                      <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10">
                        <button
                          type="button"
                          onClick={() => setMdTab("write")}
                          className={`px-2.5 py-1 text-[10px] font-mono-data rounded-md transition-colors ${
                            mdTab === "write" ? "bg-cyan-400 text-slate-950 font-bold" : "text-zinc-400 hover:text-white"
                          }`}
                        >
                          Write
                        </button>
                        <button
                          type="button"
                          onClick={() => setMdTab("preview")}
                          className={`px-2.5 py-1 text-[10px] font-mono-data rounded-md transition-colors flex items-center gap-1 ${
                            mdTab === "preview" ? "bg-cyan-400 text-slate-950 font-bold" : "text-zinc-400 hover:text-white"
                          }`}
                        >
                          <Eye className="w-3 h-3" />
                          <span>Preview</span>
                        </button>
                      </div>
                    </div>

                    {/* File Upload Box */}
                    <label className="block rounded-xl border border-dashed border-cyan-400/30 bg-cyan-400/5 p-3 text-xs hover:bg-cyan-400/10 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileUp className="w-4 h-4 text-cyan-400 shrink-0" />
                          <div>
                            <span className="block font-bold text-white">Upload Rules Document (.md)</span>
                            <span className="block text-[10px] text-zinc-400">Select a .md or .txt file to auto-fill rules & format</span>
                          </div>
                        </div>
                        <span className="rounded-full bg-cyan-400 text-slate-950 px-3 py-1 text-[11px] font-bold shrink-0">Browse .md</span>
                      </div>
                      <input
                        type="file"
                        accept=".md,.markdown,text/markdown,text/plain"
                        onChange={(e) => handleMdFileUpload(e.target.files?.[0])}
                        className="hidden"
                      />
                    </label>

                    {mdTab === "write" ? (
                      <div>
                        <TextArea
                          required
                          value={form.description}
                          onChange={(e) => updateForm("description", e.target.value)}
                          placeholder="# Event Rules & Format&#10;- Mandatory 1 pitstop (refuel)&#10;- **Weather**: Dry (24°C)&#10;- Server: SimSports Racing ACC"
                          rows={6}
                          className="w-full font-mono text-xs"
                        />
                        <span className="block mt-1 text-[10px] font-mono-data text-zinc-400">
                          Supports Markdown (# Headings, **Bold**, - Lists, `Code`)
                        </span>
                      </div>
                    ) : (
                      <div className="bg-black/40 p-4 rounded-xl border border-white/10 min-h-36 max-h-60 overflow-y-auto">
                        <MarkdownRenderer content={form.description} />
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onPress={() => setFormStep(3)}
                        className="w-1/3 border-white/20 text-zinc-300 font-mono-data text-xs py-3 rounded-full hover:bg-white/10"
                      >
                        BACK
                      </Button>
                      <Button
                        type="submit"
                        isDisabled={saving || uploadingImage || !form.description.trim()}
                        className="w-2/3 bg-cyan-400 text-slate-950 font-sora font-bold text-xs py-3 rounded-full glow-hover"
                      >
                        {uploadingImage ? "Uploading Image..." : saving ? "Saving Event..." : editingId ? "UPDATE EVENT" : "CREATE EVENT"}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
          </div>
        )}

        {/* Event Details Modal */}
        {detailModalEvent && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="flex min-h-full items-start justify-center px-4 py-8">
              <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0e1628] p-6 sm:p-8 shadow-2xl space-y-5 my-auto">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={gameLogos[detailModalEvent.gameName] || "/Game/acc.png"}
                    alt={detailModalEvent.gameName}
                    className="w-8 h-8 object-contain rounded"
                  />
                  <div>
                    <span className="font-mono-data text-[11px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>EVENT RULES & DETAILS </span>
                    </span>
                    <h2 className="font-sora text-2xl font-bold text-white">{detailModalEvent.title}</h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailModalEvent(null)}
                  className="rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Pure Markdown Description Container */}
              <div className="bg-black/40 p-6 rounded-2xl border border-white/10 min-h-60 max-h-[60vh] overflow-y-auto leading-relaxed">
                <MarkdownRenderer content={detailModalEvent.description} />
              </div>

              {/* Action Footer */}
              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onPress={() => setDetailModalEvent(null)}
                  className="border-white/20 text-zinc-300 font-mono-data text-xs py-2.5 px-6 rounded-full hover:bg-white/10"
                >
                  CLOSE
                </Button>

                {!canManageEvents && (
                  <Button
                    type="button"
                    onPress={() => {
                      const ev = detailModalEvent;
                      setDetailModalEvent(null);
                      openRegistration(ev);
                    }}
                    className="bg-cyan-400 text-slate-950 font-sora font-extrabold text-xs py-2.5 px-6 rounded-full glow-hover shadow-[0_0_15px_rgba(0,217,255,0.4)] flex items-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>REGISTER FOR EVENT</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
          </div>
        )}

        {/* Registration Modal */}
        {registrationEvent && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="flex min-h-full items-start justify-center px-6 py-8">
              <form onSubmit={submitRegistration} className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0e1628] p-6 sm:p-8 shadow-2xl space-y-6 my-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="font-mono-data text-xs font-bold text-cyan-400 uppercase">DRIVER REGISTRATION</span>
                  <h2 className="font-sora text-xl font-bold text-white">{registrationEvent.title}</h2>
                </div>
                <button type="button" onClick={() => setRegistrationEvent(null)} className="rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {registered === registrationEvent._id ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl font-mono-data text-xs">
                  🎉 Registration confirmed! Your entry has been saved for this event.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FloatingInput required label="First Name" value={registration.firstName} onChange={(event) => setRegistration((current) => ({ ...current, firstName: event.target.value }))} />
                    <FloatingInput required label="Last Name" value={registration.lastName} onChange={(event) => setRegistration((current) => ({ ...current, lastName: event.target.value }))} />
                  </div>
                  <FloatingSelect
                    label="Nationality"
                    selectedKey={registration.nationality || null}
                    onSelectionChange={(key) => setRegistration((current) => ({ ...current, nationality: String(key) }))}
                  >
                    {getNationalitiesForGame(registrationEvent.gameName).map((nat) => (
                      <ListBox.Item key={nat.id} id={nat.id} textValue={nat.name}>
                        <div className="flex items-center gap-2.5 py-0.5">
                          <img
                            src={nat.flagUrl}
                            alt={nat.name}
                            className="w-5 h-3.5 object-cover rounded-[2px] border border-white/20 shrink-0 shadow-sm"
                          />
                          <span className="font-inter text-xs text-white">{nat.name}</span>
                        </div>
                      </ListBox.Item>
                    ))}
                  </FloatingSelect>
                  <FloatingSelect label="Car Class" isDisabled={registrationClassOptions.length === 0} selectedKey={registration.className || null} onSelectionChange={(key) => { const selectedClass = String(key); setRegistration((current) => ({ ...current, className: selectedClass, car: "" })); void loadCars(registrationEvent.gameName, selectedClass); }}>
                    {registrationClassOptions.map((item) => <ListBox.Item key={item} id={item}>{item}</ListBox.Item>)}
                  </FloatingSelect>
                  <div className="space-y-1">
                    <FloatingInput required type="number" min={1} max={999} label="Car Number (#)" value={registration.carNumber} onChange={(event) => setRegistration((current) => ({ ...current, carNumber: event.target.value }))} />
                    {registration.carNumber.trim() !== "" && (
                      <div className="text-[11px] font-mono-data px-1">
                        {(() => {
                          const num = Number(registration.carNumber);
                          const valid = Number.isInteger(num) && num >= 1 && num <= 999;
                          if (!valid) return <span className="text-amber-400">⚠️ Number must be between 1 and 999</span>;
                          if (takenCarNumbers.includes(num)) {
                            return (
                              <span className="text-red-400 font-bold flex items-center gap-1">
                                <X className="w-3.5 h-3.5" />
                                <span>Car #{num} is taken! Pick another number.</span>
                              </span>
                            );
                          }
                          return (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <span>✓ Car #{num} is available</span>
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  <FloatingSelect label={carSelectLabel} isDisabled={!registration.className || (loadingCarsFor !== "" && loadingCarsFor === registrationCarsKey) || registrationCars.length === 0} selectedKey={registration.car || null} onSelectionChange={(key) => setRegistration((current) => ({ ...current, car: String(key) }))}>
                    {registrationCars.map((item) => <ListBox.Item key={item._id} id={String(item.carModelId)}>{item.name}</ListBox.Item>)}
                  </FloatingSelect>
                  <Button
                    type="submit"
                    isDisabled={
                      registering ||
                      !registration.firstName.trim() ||
                      !registration.lastName.trim() ||
                      !registration.nationality ||
                      !registration.className ||
                      !registration.car ||
                      !registration.carNumber.trim() ||
                      !Number.isInteger(Number(registration.carNumber)) ||
                      Number(registration.carNumber) < 1 ||
                      Number(registration.carNumber) > 999 ||
                      takenCarNumbers.includes(Number(registration.carNumber))
                    }
                    className="w-full bg-cyan-400 text-slate-950 font-sora font-bold text-xs py-3 rounded-full glow-hover"
                  >
                    {registering ? "Registering Driver..." : "CONFIRM REGISTRATION"}
                  </Button>
                </div>
              )}
            </form>
          </div>
          </div>
        )}

      </div>
    </main>
  );
}
