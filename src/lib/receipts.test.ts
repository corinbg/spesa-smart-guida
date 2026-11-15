import { describe, expect, test } from "bun:test";
import { monthlyTotal, parseReceiptTotal } from "./receipts";

describe("Totale finale dello scontrino", () => {
  test("il totale è facoltativo", () => expect(parseReceiptTotal(" ")).toBeNull());
  test("64,80 viene salvato come 6480 centesimi", () => expect(parseReceiptTotal("64,80")).toBe(6480));
  test("accetta anche il punto e lo zero", () => {
    expect(parseReceiptTotal("64.8")).toBe(6480);
    expect(parseReceiptTotal("0")).toBe(0);
  });
  test("rifiuta negativi e frazioni di centesimo", () => {
    expect(() => parseReceiptTotal("-1")).toThrow();
    expect(() => parseReceiptTotal("1,234")).toThrow();
  });
  test("il riepilogo include soltanto importi del mese corrente", () => {
    expect(monthlyTotal([
      { archived_at: "2026-11-15T12:00:00Z", total_cents: 6480 },
      { archived_at: "2026-11-16T12:00:00Z", total_cents: 2000 },
      { archived_at: "2026-11-17T12:00:00Z", total_cents: null },
      { archived_at: "2026-10-15T12:00:00Z", total_cents: 9000 },
      { archived_at: "2025-11-15T12:00:00Z", total_cents: 9000 },
    ], new Date("2026-11-15T12:00:00Z"))).toBe(8480);
  });
});