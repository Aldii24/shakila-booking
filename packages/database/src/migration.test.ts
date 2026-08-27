import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe,expect,it } from "vitest";
const migration=fileURLToPath(new URL("../drizzle/0000_sharp_triathlon.sql",import.meta.url));
describe("PostgreSQL inventory guards",()=>{it("uses an exclusion constraint with checkout-exclusive ranges",async()=>{const sql=await readFile(migration,"utf8");expect(sql).toContain("accommodation_reservations_no_active_overlap");expect(sql).toContain("daterange(\"check_in_date\", \"check_out_date\", '[)')");});it("uniquely guards active Jeep date and slot allocation",async()=>{const sql=await readFile(migration,"utf8");expect(sql).toContain("jeep_reservations_active_unique");expect(sql).toContain("\"jeep_unit_id\",\"tour_date\",\"departure_slot_id\"");});});
