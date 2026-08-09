"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarDays, Gamepad2, Pencil, Plus, UserPlus, X } from "lucide-react";
import { Button, ListBox, TextArea } from "@heroui/react";
import { useAuth } from "../../context/authContext";
import { createEvent, getCarClasses, getCars, getEvents, registerForEvent, updateEvent, uploadEventImage, type Car, type CarClass, type EventForm, type EventItem } from "../../api/event/event";
import acctracks from "../../tracks/tracks";
import lmuTracks from "../../tracks/lmutracks";
import { ClassCheckboxes, FloatingInput, FloatingSelect } from "./components/EventFormControls";

const emptyForm: EventForm = { title: "", gameName: "", date: "", track: "", description: "", prizePool: "", cardimage: "", numberOfDrivers: 0, classes: [] };
function formatEventDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  const day = date.getDate();
  const suffix = day % 10 === 1 && day !== 11 ? "st" : day % 10 === 2 && day !== 12 ? "nd" : day % 10 === 3 && day !== 13 ? "rd" : "th";
  return `${day}${suffix} ${date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
}

function toDateInputValue(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString().slice(0, 10);
}

const gameLogos: Record<string, string> = {
  ACC: "/Game/acc.png",
  iRacing: "/Game/iracing.png",
  LMU: "/Game/tbm.png",
  AC: "/Game/ac.jpg",
};

export default function EventPage() {
  const { user, adminMode } = useAuth();
  const canManageEvents = user?.role === "admin" && adminMode;
  const [events, setEvents] = useState<EventItem[]>([]);
  const [form, setForm] = useState<EventForm>(emptyForm);
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
  const [carsByQuery, setCarsByQuery] = useState<Record<string, Car[]>>({});
  const [loadingCarsFor, setLoadingCarsFor] = useState("");
  const [registrationEvent, setRegistrationEvent] = useState<EventItem | null>(null);
  const [registration, setRegistration] = useState({ firstName: "", lastName: "", className: "", carNumber: "", car: "" });
  const [registered, setRegistered] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);

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
    const request = window.setTimeout(() => {
      void loadEvents();
    }, 0);

    return () => window.clearTimeout(request);
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

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
    setImagePreview("");
    setShowForm(true);
  };

  const openEditForm = (event: EventItem) => {
    setEditingId(event._id);
    setForm({ title: event.title, gameName: event.gameName || "", date: toDateInputValue(event.date), track: event.track, description: event.description, prizePool: event.prizePool || "", cardimage: event.cardimage || "", numberOfDrivers: event.numberOfDrivers || 0, classes: event.classes || [] });
    setImagePreview(event.cardimage || "");
    void loadClasses(event.gameName || "");
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
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const saveEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManageEvents) return;

    try {
      setSaving(true);
      if (uploadingImage) return;
      const eventData = { ...form };

      if (editingId) {
        await updateEvent(editingId, eventData);
      } else {
        await createEvent(eventData);
      }
      setShowForm(false);
      setError("");
      await loadEvents();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  const openRegistration = (event: EventItem) => {
    setRegistrationEvent(event);
    void loadCars(event.gameName, registration.className);
    setRegistration({ firstName: "", lastName: "", className: "", carNumber: "", car: "" });
    setRegistered(null);
  };

  const submitRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!registrationEvent || !registration.className || !registration.car) return;

    try {
      setRegistering(true);
      setError("");
      await registerForEvent({
        eventId: registrationEvent._id,
        firstName: registration.firstName,
        lastName: registration.lastName,
        carModelId: Number(registration.car),
        category: registration.className,
      });
      setRegistered(registrationEvent._id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to register for event");
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

  return (
    <main className="dark min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(139,92,246,0.15),transparent_28%)]" />
      <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="mb-14 flex flex-col gap-6 rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_-50px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Event page</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">Upcoming Race Events</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">Discover upcoming sim racing events, entries, and live championship progress.</p>
          </div>
          {canManageEvents && <button type="button" onClick={openCreateForm} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"><Plus className="h-4 w-4" /> Create event</button>}
        </div>

        {error && <p className="mb-6 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
        {loading ? <p className="text-slate-400">Loading events...</p> : events.length === 0 ? <p className="text-slate-400">No events have been created yet.</p> : <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => <article key={event._id} className="group overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-[0_20px_60px_-36px_rgba(0,0,0,0.8)] transition duration-300 hover:border-cyan-400/40 hover:shadow-cyan-950/30">
            <div className="relative h-44 overflow-hidden bg-gradient-to-br from-cyan-950 via-slate-900 to-indigo-950">
              {event.cardimage ? <img src={event.cardimage} alt="" className="h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-100" /> : <Gamepad2 className="absolute inset-0 m-auto h-12 w-12 text-cyan-300/30" />}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/70 px-2.5 py-1 text-[11px] font-bold text-cyan-100 backdrop-blur"><CalendarDays className="h-3 w-3 text-cyan-300" /> {formatEventDate(event.date)}</div>
              {gameLogos[event.gameName] && <div className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-white/90 p-1.5 shadow-lg shadow-black/30" title={event.gameName}><img src={gameLogos[event.gameName]} alt={`${event.gameName} logo`} className="h-full w-full object-contain" /></div>}
              <div className="absolute bottom-3 left-4 right-4"><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">{event.gameName || "Sim racing event"}</p><h2 className="mt-1 text-xl font-black text-white">{event.title}</h2></div>
            </div>
            <div className="p-4">
              <p className="min-h-[3.75rem] text-sm leading-6 text-slate-300">{event.description}</p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-3 text-xs">
                <div><span className="block uppercase tracking-wider text-slate-500">Track</span><span className="mt-1 block max-w-[12rem] truncate font-semibold text-slate-200">{event.track}</span></div>
                {event.prizePool && <div><span className="block uppercase tracking-wider text-slate-500">Prize pool</span><span className="mt-1 block font-semibold text-amber-300">{event.prizePool}</span></div>}
              </div>
              <div className="mt-5 flex items-center justify-between gap-3">
                {canManageEvents ? <button type="button" onClick={() => openEditForm(event)} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/50 hover:text-cyan-200"><Pencil className="h-3.5 w-3.5" /> Edit event</button> : <button type="button" onClick={() => openRegistration(event)} className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300"><UserPlus className="h-3.5 w-3.5" /> Register</button>}
              </div>
            </div>
          </article>)}
        </div>}

        {canManageEvents && showForm && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-sm sm:px-6 sm:py-8">
          <form onSubmit={saveEvent} className="mx-auto my-2 w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 p-5 shadow-2xl sm:my-4 sm:p-7">
            <div className="mb-7 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Race control</p><h2 className="mt-1 text-2xl font-bold">{editingId ? "Update event" : "Create event"}</h2></div><button type="button" onClick={() => setShowForm(false)} aria-label="Close form" className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"><X /></button></div>
            <div className="grid gap-4">
              <div className="border-b border-white/10 pb-3"><h3 className="text-sm font-semibold text-white">Event details</h3><p className="mt-1 text-xs text-slate-400">Set the race identity, schedule, and grid.</p></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FloatingInput required label="Event name" value={form.title} onChange={(event) => updateForm("title", event.target.value)} placeholder="Enter event name" />
                <FloatingSelect label="Game" selectedKey={form.gameName || null} onSelectionChange={(key) => { const game = String(key); setForm((current) => ({ ...current, gameName: game, track: "", classes: [] })); void loadClasses(game); }}>
                  <ListBox.Item id="ACC">ACC</ListBox.Item><ListBox.Item id="LMU">LMU</ListBox.Item><ListBox.Item id="iRacing">iRacing</ListBox.Item><ListBox.Item id="AC">AC</ListBox.Item>
                </FloatingSelect>
                <FloatingInput required type="date" label="Event date" value={form.date} onChange={(event) => updateForm("date", event.target.value)} />
                <FloatingSelect label="Track" isDisabled={!form.gameName || Object.keys(availableTracks).length === 0} selectedKey={form.track || null} onSelectionChange={(key) => updateForm("track", String(key))}>
                  {Object.entries(availableTracks).map(([value, label]) => <ListBox.Item key={value} id={value}>{label}</ListBox.Item>)}
                </FloatingSelect>
                <FloatingInput label="Prize pool" value={form.prizePool || ""} onChange={(event) => updateForm("prizePool", event.target.value)} placeholder="Optional" />
                <FloatingInput required type="number" min={1} label="Number of drivers" value={String(form.numberOfDrivers || "")} onChange={(event) => setForm((current) => ({ ...current, numberOfDrivers: Number(event.target.value) || 0 }))} placeholder="e.g. 30" />
              </div>
              <ClassCheckboxes
                classes={formClasses}
                value={form.classes || []}
                disabled={!form.gameName || loadingClassesFor === form.gameName || formClasses.length === 0}
                onChange={(values) => setForm((current) => ({ ...current, classes: values }))}
              />
              {loadingClassesFor === form.gameName && <p className="-mt-2 text-xs text-cyan-300">Loading classes for {form.gameName}...</p>}
              {!loadingClassesFor && form.gameName && formClasses.length === 0 && <p className="-mt-2 text-xs text-amber-300">No active classes are available for this game.</p>}
              <div className="border-b border-white/10 pb-3 pt-4"><h3 className="text-sm font-semibold text-white">Event presentation</h3><p className="mt-1 text-xs text-slate-400">Add the card image and a clear race description.</p></div>
              <label className="rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-3 text-sm text-slate-300">
                <span className="block font-semibold text-white">Event card image</span>
                <span className="mt-1 block text-xs text-slate-500">Choose an image to upload{form.cardimage ? " or keep the current image" : ""}.</span>
                <input type="file" accept="image/*" onChange={(event) => void handleImageChange(event.target.files?.[0])} className="mt-3 block w-full text-xs text-slate-400 file:mr-3 file:rounded-full file:border-0 file:bg-cyan-400 file:px-3 file:py-1.5 file:font-semibold file:text-slate-950" />
                {imagePreview && <img src={imagePreview} alt="Selected event card preview" className="mt-4 h-36 w-full rounded-xl border border-white/10 object-cover" />}
                {uploadingImage && <span className="mt-2 block text-xs text-cyan-300">Uploading image...</span>}
                {!uploadingImage && form.cardimage && <span className="mt-2 block truncate text-xs text-emerald-300">Image uploaded</span>}
              </label>
              <div><p className="mb-2 text-sm font-semibold text-slate-200">Description</p><TextArea className="w-full" required value={form.description} onChange={(event) => updateForm("description", event.target.value)} placeholder="Describe the event format, schedule, and requirements" rows={4} /></div>
            </div>
            <Button type="submit" isDisabled={saving || uploadingImage || formClasses.length === 0} className="mt-6 w-full">{uploadingImage ? "Uploading image..." : saving ? "Saving..." : editingId ? "Update event" : "Create event"}</Button>
          </form>
        </div>}

        {registrationEvent && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 py-8 backdrop-blur-sm">
          <form onSubmit={submitRegistration} className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-7 shadow-2xl">
            <div className="mb-6 flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Registration</p><h2 className="mt-1 text-2xl font-bold text-white">{registrationEvent.title}</h2></div><button type="button" onClick={() => setRegistrationEvent(null)} aria-label="Close registration"><X /></button></div>
            {registered === registrationEvent._id ? <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-sm text-emerald-200">Registration saved for this event.</div> : <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FloatingInput required label="First name" value={registration.firstName} onChange={(event) => setRegistration((current) => ({ ...current, firstName: event.target.value }))} />
                <FloatingInput required label="Last name" value={registration.lastName} onChange={(event) => setRegistration((current) => ({ ...current, lastName: event.target.value }))} />
              </div>
              <FloatingSelect label="Class" isDisabled={registrationClassOptions.length === 0} selectedKey={registration.className || null} onSelectionChange={(key) => { const selectedClass = String(key); setRegistration((current) => ({ ...current, className: selectedClass, car: "" })); void loadCars(registrationEvent.gameName, selectedClass); }}>
                {registrationClassOptions.map((item) => <ListBox.Item key={item} id={item}>{item}</ListBox.Item>)}
              </FloatingSelect>
              <FloatingInput required type="number" min={1} label="Car number" value={registration.carNumber} onChange={(event) => setRegistration((current) => ({ ...current, carNumber: event.target.value }))} />
              <FloatingSelect label={loadingCarsFor === registrationCarsKey ? "Loading cars..." : "Car"} isDisabled={!registration.className || loadingCarsFor === registrationCarsKey || registrationCars.length === 0} selectedKey={registration.car || null} onSelectionChange={(key) => setRegistration((current) => ({ ...current, car: String(key) }))}>
                {registrationCars.map((item) => <ListBox.Item key={item._id} id={String(item.carModelId)}>{item.name}</ListBox.Item>)}
              </FloatingSelect>
              {!loadingCarsFor && registration.className && registrationCars.length === 0 && <p className="-mt-2 text-xs text-amber-300">No cars are available for this class.</p>}
              <button type="submit" disabled={registering} className="mt-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-60">{registering ? "Registering..." : "Confirm registration"}</button>
            </div>}
          </form>
        </div>}
      </div>
    </main>
  );
}
