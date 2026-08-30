"use client";

import { useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";

type Props = Omit<ComponentProps<typeof Input>, "value" | "onChange" | "min" | "max"> & {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
};

export function PositiveNumberInput({ value, onValueChange, min = 1, max, onBlur, onFocus, onKeyDown, onClick, ...props }: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const displayValue = draft ?? String(value);
  const commit = () => {
    const parsed = Number(displayValue);
    const next = Math.min(max ?? Number.MAX_SAFE_INTEGER, Math.max(min, Number.isFinite(parsed) && displayValue !== "" ? parsed : min));
    setDraft(null);
    onValueChange(next);
  };
  return <Input {...props} type="text" inputMode="numeric" pattern="[0-9]*" role="spinbutton" aria-valuemin={min} aria-valuemax={max} aria-valuenow={Number(displayValue) || undefined} value={displayValue}
    onFocus={(event) => { event.currentTarget.select(); onFocus?.(event); }}
    onClick={(event) => { event.currentTarget.select(); onClick?.(event); }}
    onKeyDown={(event) => { if (["-", "+", "e", "E", "."].includes(event.key)) event.preventDefault(); onKeyDown?.(event); }}
    onChange={(event) => { const raw = event.target.value; if (raw === "") { setDraft(""); return; } const parsed = Number(raw); if (!Number.isInteger(parsed) || parsed < min || (max !== undefined && parsed > max)) return; setDraft(raw); onValueChange(parsed); }}
    onBlur={(event) => { commit(); onBlur?.(event); }} />;
}
