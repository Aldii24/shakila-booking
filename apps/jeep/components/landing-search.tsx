"use client";

import { FormEvent, useState } from "react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { ArrowRight, CalendarDays } from "lucide-react";
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

export function JeepLandingSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tourDate, setTourDate] = useState(() => jakartaDate(1));
  const [guests, setGuests] = useState(4);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(
      `/availability?${new URLSearchParams({ tourDate, guestCount: String(guests) })}`,
    );
  }
  return (
    <form className="search-strip" onSubmit={submit}>
      <label>
        TANGGAL
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="landing-date-trigger"
            >
              <span>
                {format(parseISO(tourDate), "dd MMM yyyy", { locale: id })}
              </span>
              <CalendarDays />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="landing-calendar jeep-landing-calendar"
          >
            <Calendar
              mode="single"
              locale={id}
              labels={{
                labelDayButton: (date, modifiers) =>
                  `${modifiers.today ? "Hari ini, " : ""}${new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date)}`,
              }}
              selected={parseISO(tourDate)}
              disabled={{ before: parseISO(jakartaDate(0)) }}
              onSelect={(date) => {
                if (!date) return;
                setTourDate(format(date, "yyyy-MM-dd"));
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </label>
      <label>
        TAMU
        <Input
          className="landing-number"
          type="number"
          min="1"
          value={guests}
          onChange={(event) =>
            setGuests(Math.max(1, Number(event.target.value)))
          }
        />
      </label>
      <Button className="button landing-submit" type="submit">
        CEK JEEP TERSEDIA <ArrowRight />
      </Button>
    </form>
  );
}
