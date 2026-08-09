"use client";

import { useState, type ChangeEvent, type Key, type ReactNode } from "react";
import { Checkbox, CheckboxGroup, Input, ListBox, Select } from "@heroui/react";

export function FloatingInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  min,
}: {
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
}) {
  const [focused, setFocused] = useState(false);
  const floated = focused || value.length > 0;

  return (
    <div className="relative">
      <Input
        className="w-full"
        required={required}
        type={type}
        min={min}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={floated ? placeholder : ""}
        aria-label={label}
      />
      <span className={`pointer-events-none absolute left-2 transition-all duration-150 ${floated ? "-top-2 bg-slate-900 px-1 text-[11px] font-semibold text-cyan-300" : "top-1/2 -translate-y-1/2 text-sm text-slate-400"}`}>
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
