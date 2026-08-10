"use client";

import { useState, type ChangeEvent, type Key, type ReactNode } from "react";
import { Checkbox, CheckboxGroup, Input, ListBox, Select } from "@heroui/react";
import { AlertCircle } from "lucide-react";

export function FloatingInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: number | string;
  max?: number | string;
}) {
  const [focused, setFocused] = useState(false);
  const isDateOrTime = type === "date" || type === "time" || type === "datetime-local";
  const floated = focused || value.length > 0 || isDateOrTime;

  return (
    <div className="relative">
      <Input
        className="w-full"
        required={required}
        type={type}
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={floated ? placeholder : ""}
        aria-label={label}
      />
      <span className={`pointer-events-none absolute left-2 transition-all duration-150 z-10 ${floated ? "-top-2 bg-[#0e1628] px-1 text-[11px] font-semibold text-cyan-300" : "top-1/2 -translate-y-1/2 text-sm text-slate-400"}`}>
        {label}
      </span>
    </div>
  );
}

export function FloatingSelect({
  label,
  selectedKey,
  onSelectionChange,
  children,
  isDisabled = false,
}: {
  label: string;
  selectedKey: string | null;
  onSelectionChange: (key: Key | null) => void;
  children: ReactNode;
  isDisabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const floated = focused || Boolean(selectedKey);

  return (
    <div className="relative">
      <Select
        className="w-full"
        aria-label={label}
        selectedKey={selectedKey}
        isDisabled={isDisabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSelectionChange={onSelectionChange}
      >
        <Select.Trigger><Select.Value className={!selectedKey ? "opacity-0" : ""} /></Select.Trigger>
        <Select.Popover><ListBox>{children}</ListBox></Select.Popover>
      </Select>
      <span className={`pointer-events-none absolute left-2 transition-all duration-150 ${floated ? "-top-2 bg-slate-900 px-1 text-[11px] font-semibold text-cyan-300" : "top-1/2 -translate-y-1/2 text-sm text-slate-400"}`}>
        {label}
      </span>
    </div>
  );
}

export function ClassCheckboxes({
  classes,
  value,
  disabled,
  onChange,
}: {
  classes: Array<{ code: string; name: string }>;
  value: string[];
  disabled: boolean;
  onChange: (values: string[]) => void;
}) {
  return (
    <div>
      <div className="mb-2">
        <p className="text-sm font-semibold text-slate-200">Eligible classes</p>
        <p className="mt-1 text-xs text-slate-400">Select one or more classes for this event.</p>
      </div>
      <CheckboxGroup value={value} isDisabled={disabled} onChange={onChange} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {classes.map((item) => (
            <Checkbox key={item.code} value={item.code} className="min-h-14 justify-center rounded-xl border border-white/10 bg-slate-950/35 px-4 py-3 transition hover:border-cyan-300/40 hover:bg-cyan-300/5">
              <Checkbox.Content className="flex w-full items-center gap-3 text-sm font-semibold text-slate-200">
                <Checkbox.Control className="size-5 rounded-md border-white/30">
                  <Checkbox.Indicator />
                </Checkbox.Control>
                {item.name}
              </Checkbox.Content>
            </Checkbox>
          ))}
        </div>
      </CheckboxGroup>
    </div>
  );
}

/** Convert HH:MM (24h) to { h12, minute, ampm } */
function to12(time24: string) {
  const [hStr, mStr] = (time24 || "20:00").split(":");
  const h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return { h12, minute: mStr ?? "00", ampm };
}

/** Convert { h12, minute, ampm } back to HH:MM (24h) */
function from12(h12: number, minute: string, ampm: string) {
  let h = h12 % 12;
  if (ampm === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${minute}`;
}

function TimePicker12({
  value,
  onChange,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const { h12, minute, ampm } = to12(value);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  return (
    <div className="relative pt-2">
      <div className="flex items-center gap-1.5">
        {/* Hour & Minute selects container */}
        <div className="flex items-center gap-1 bg-[#0a1020] border border-white/10 rounded-xl px-2 py-1.5 shadow-inner">
          <select
            required={required}
            value={h12}
            onChange={(e) => onChange(from12(Number(e.target.value), minute, ampm))}
            className="bg-transparent text-white font-mono-data text-sm font-bold focus:outline-none cursor-pointer text-center"
            aria-label="Hour"
          >
            {hours.map((h) => (
              <option key={h} value={h} className="bg-[#0e1628] text-white">
                {String(h).padStart(2, "0")}
              </option>
            ))}
          </select>

          <span className="text-cyan-400 font-bold text-xs select-none">:</span>

          <select
            value={minute}
            onChange={(e) => onChange(from12(h12, e.target.value, ampm))}
            className="bg-transparent text-white font-mono-data text-sm font-bold focus:outline-none cursor-pointer text-center"
            aria-label="Minute"
          >
            {minutes.map((m) => (
              <option key={m} value={m} className="bg-[#0e1628] text-white">
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* AM / PM toggle */}
        <div className="flex rounded-xl overflow-hidden border border-white/10 shrink-0">
          {(["AM", "PM"] as const).map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => onChange(from12(h12, minute, period))}
              className={`px-2.5 py-1.5 font-mono-data text-xs font-bold transition-all ${
                ampm === period
                  ? "bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(0,217,255,0.4)]"
                  : "bg-[#0a1020] text-zinc-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Floating label */}
      <span className="pointer-events-none absolute -top-1 left-2 bg-[#0e1628] px-1 text-[11px] font-semibold text-cyan-300 z-10">
        Time (Local)
      </span>
    </div>
  );
}

export function EventDateTimePicker({
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  label = "EVENT DATE & START TIME",
  previewLabel = "Race Start",
  required = true,
  isInvalid = false,
  errorMessage,
  minDate,
}: {
  dateValue: string;
  timeValue: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  label?: string;
  previewLabel?: string;
  required?: boolean;
  isInvalid?: boolean;
  errorMessage?: string;
  minDate?: string;
}) {

  const getUtcPreview = () => {
    if (!dateValue || !timeValue) return null;
    const localDateTimeStr = `${dateValue}T${timeValue}`;
    const dateObj = new Date(localDateTimeStr);
    if (Number.isNaN(dateObj.getTime())) return null;

    const day = dateObj.getUTCDate();
    const suffix = day % 10 === 1 && day !== 11 ? "st" : day % 10 === 2 && day !== 12 ? "nd" : day % 10 === 3 && day !== 13 ? "rd" : "th";
    const monthStr = dateObj.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
    const rawH = dateObj.getUTCHours();
    const ampm = rawH >= 12 ? "PM" : "AM";
    const h12 = rawH % 12 === 0 ? 12 : rawH % 12;
    const utcMins = String(dateObj.getUTCMinutes()).padStart(2, "0");

    return `${day}${suffix} ${monthStr} @ ${h12}:${utcMins} ${ampm} UTC`;
  };

  const utcPreview = getUtcPreview();
  const effectiveMinDate = minDate !== undefined ? minDate : new Date().toISOString().split("T")[0];

  return (
    <div
      className={`space-y-3 rounded-2xl border p-4 transition-all duration-200 ${
        isInvalid
          ? "border-red-500/80 bg-red-500/[0.08] shadow-[0_0_20px_rgba(239,68,68,0.25)]"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`font-mono-data text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            isInvalid ? "text-red-400" : "text-cyan-400"
          }`}
        >
          {isInvalid && <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
          <span>{label}</span>
        </span>
        <span className="text-[10px] font-mono-data text-zinc-400">AUTOMATIC UTC CONVERSION</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
        <FloatingInput
          required={required}
          type="date"
          min={effectiveMinDate}
          label="Date"
          value={dateValue}
          onChange={(e) => onDateChange(e.target.value)}
        />

        <TimePicker12
          required={required}
          value={timeValue}
          onChange={onTimeChange}
        />
      </div>

      {utcPreview && (
        <div
          className={`mt-2 rounded-xl border px-3.5 py-2 font-mono-data text-xs flex items-center gap-2 transition-all ${
            isInvalid
              ? "bg-red-500/20 border-red-500/50 text-red-300 font-bold"
              : "bg-cyan-500/10 border-cyan-500/20 text-cyan-300"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isInvalid ? "bg-red-500 animate-ping" : "bg-cyan-400 animate-pulse"
            }`}
          />
          <span>
            {previewLabel}: <strong className="text-white">{utcPreview}</strong>
          </span>
        </div>
      )}

      {isInvalid && errorMessage && (
        <div className="mt-2 rounded-xl bg-red-950/80 border border-red-500/60 px-3.5 py-2 font-mono-data text-[11px] font-bold text-red-300 flex items-center gap-2 animate-shake">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}

export function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return <p className="text-zinc-500 italic text-sm">No details provided.</p>;

  const lines = content.split("\n");

  return (
    <div className="space-y-2 text-zinc-300 text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (trimmed.startsWith("# ")) {
          return <h1 key={idx} className="text-xl font-bold text-white font-sora pt-2 pb-1 border-b border-white/10">{trimmed.slice(2)}</h1>;
        }
        if (trimmed.startsWith("## ")) {
          return <h2 key={idx} className="text-lg font-bold text-cyan-400 font-sora pt-2 pb-1">{trimmed.slice(3)}</h2>;
        }
        if (trimmed.startsWith("### ")) {
          return <h3 key={idx} className="text-base font-semibold text-cyan-300 font-sora pt-1">{trimmed.slice(4)}</h3>;
        }
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-cyan-400 font-bold">•</span>
              <span>{formatInlineMarkdown(trimmed.slice(2))}</span>
            </div>
          );
        }
        if (!trimmed) {
          return <div key={idx} className="h-2" />;
        }

        return <p key={idx}>{formatInlineMarkdown(trimmed)}</p>;
      })}
    </div>
  );
}

function formatInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i} className="italic text-cyan-200">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-cyan-300">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}
