"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { enUS, id } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAdminLanguage } from "./admin-i18n";

type Option = { value: string; label: string };

export function AdminSelect({
  value,
  defaultValue,
  onValueChange,
  options,
  placeholder,
  ariaLabel,
  name,
  required,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: Option[];
  placeholder: string;
  ariaLabel?: string;
  name?: string;
  required?: boolean;
}) {
  const [internal, setInternal] = useState(defaultValue ?? "");
  const current = value === undefined ? internal : value;
  return (
    <div className="admin-select-control">
      {name ? (
        <input type="hidden" name={name} value={current} required={required} />
      ) : null}
      <Select
        value={current || "__empty"}
        onValueChange={(next) => {
          const normalized = next === "__empty" ? "" : next;
          if (value === undefined) setInternal(normalized);
          onValueChange?.(normalized);
        }}
      >
        <SelectTrigger aria-label={ariaLabel ?? placeholder}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="__empty">{placeholder}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function AdminDatePicker({
  value,
  defaultValue = "",
  onChange,
  name,
  placeholder,
  ariaLabel,
  required,
  disabled = false,
}: {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  placeholder?: string;
  ariaLabel?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const { language } = useAdminLanguage();
  const [internal, setInternal] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const current = value === undefined ? internal : value;
  const selected = current ? parseISO(current) : undefined;
  const label =
    placeholder ?? (language === "id" ? "Pilih tanggal" : "Choose date");
  return (
    <div className="admin-date-control">
      {name ? (
        <input type="hidden" name={name} value={current} required={required} />
      ) : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn("date-trigger", !selected && "date-placeholder")}
            aria-label={ariaLabel ?? label}
            disabled={disabled}
          >
            <span>
              {selected
                ? format(selected, "dd MMM yyyy", {
                    locale: language === "id" ? id : enUS,
                  })
                : label}
            </span>
            <CalendarIcon size={16} />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="calendar-popover">
          <Calendar
            mode="single"
            selected={selected}
            locale={language === "id" ? id : enUS}
            labels={
              language === "id"
                ? {
                    labelDayButton: (date, modifiers) =>
                      `${modifiers.today ? "Hari ini, " : ""}${new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date)}`,
                  }
                : undefined
            }
            onSelect={(date) => {
              const next = date ? format(date, "yyyy-MM-dd") : "";
              if (value === undefined) setInternal(next);
              onChange?.(next);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
