"use client";

import { FormEvent, useState } from "react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const jakartaDate = (offset: number) =>
  new Date(Date.now() + offset * 86_400_000).toLocaleDateString("en-CA", {
    timeZone: "Asia/Jakarta",
  });

function StayDate({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: string;
  min?: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <label>
      {label}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="landing-date-trigger"
          >
            <span>
              {format(parseISO(value), "dd MMM yyyy", { locale: id })}
            </span>
            <CalendarDays />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="landing-calendar">
          <Calendar
            mode="single"
            locale={id}
            labels={{
              labelDayButton: (date, modifiers) =>
                `${modifiers.today ? "Hari ini, " : ""}${new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date)}`,
            }}
            selected={parseISO(value)}
            disabled={min ? { before: parseISO(min) } : undefined}
            onSelect={(date) => {
              if (!date) return;
              onChange(format(date, "yyyy-MM-dd"));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </label>
  );
}

export function GlampingLandingSearch() {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState(() => jakartaDate(1));
  const [checkOut, setCheckOut] = useState(() => jakartaDate(2));
  const [guests, setGuests] = useState(2);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(
      `/availability?${new URLSearchParams({ checkInDate: checkIn, checkOutDate: checkOut, guestCount: String(guests) })}`,
    );
  }
  return (
    <form className="search-bar" onSubmit={submit}>
      <StayDate
        label="Check-in"
        value={checkIn}
        min={jakartaDate(0)}
        onChange={(next) => {
          setCheckIn(next);
          if (checkOut <= next)
            setCheckOut(
              format(
                new Date(`${next}T12:00:00+07:00`).getTime() + 86_400_000,
                "yyyy-MM-dd",
              ),
            );
        }}
      />
      <StayDate
        label="Check-out"
        value={checkOut}
        min={checkIn}
        onChange={setCheckOut}
      />
      <label>
        Tamu
        <Input
          className="landing-number"
          type="number"
          min="1"
          value={guests}
          onChange={(event) =>
            setGuests(Math.max(1, Number(event.target.value)))
          }
          required
        />
      </label>
      <Button className="button landing-submit" type="submit">
        Cek Ketersediaan
      </Button>
    </form>
  );
}
