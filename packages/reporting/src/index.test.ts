import ExcelJS from "exceljs";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import type { AdminReport } from "@booking/contracts";
import { renderReportExcel } from "./excel";
import { renderReportPdf } from "./pdf";
import { resolveReportPeriod } from "./period";

const sampleReport: AdminReport = {
  title: "Laporan Shakila Group",
  business: "accommodation",
  businessLabel: "Akomodasi (Glamping + Homestay)",
  period: {
    key: "custom",
    startDate: "2099-01-01",
    endDate: "2099-01-01",
    label: "01 Jan 2099",
  },
  exportedAt: "2099-01-01T04:00:00.000Z",
  summary: {
    totalBookings: 1,
    totalBookingValue: 850000,
    verifiedRevenue: 425000,
    remainingAmount: 425000,
    confirmedBookings: 1,
    completedBookings: 0,
    cancelledBookings: 0,
  },
  rows: [
    {
      bookingCode: "GLP-990101-0001",
      bookingDate: "2099-01-01",
      accommodationKindLabel: "Glamping",
      roomType: "Deluxe Dome",
      guestName: "Ayu Lestari",
      checkInDate: "2099-01-10",
      checkOutDate: "2099-01-11",
      unitQuantity: 1,
      guestCount: 2,
      bookingSourceLabel: "Online",
      bookingStatusLabel: "Dikonfirmasi",
      paymentStatusLabel: "DP terverifikasi",
      totalAmount: 850000,
      paidAmount: 425000,
      remainingAmount: 425000,
    },
  ],
  emptyMessage: null,
};

describe("report period resolution", () => {
  const afterMidnightJakarta = new Date("2026-09-21T17:30:00.000Z");

  it("uses Asia/Jakarta for today, week, and month boundaries", () => {
    expect(resolveReportPeriod({ period: "today" }, afterMidnightJakarta)).toMatchObject({
      startDate: "2026-09-22",
      endDate: "2026-09-22",
    });
    expect(resolveReportPeriod({ period: "this_week" }, afterMidnightJakarta)).toMatchObject({
      startDate: "2026-09-21",
      endDate: "2026-09-27",
    });
    expect(resolveReportPeriod({ period: "this_month" }, afterMidnightJakarta)).toMatchObject({
      startDate: "2026-09-01",
      endDate: "2026-09-30",
    });
  });

  it("keeps custom dates inclusive and rejects reversed ranges", () => {
    expect(resolveReportPeriod({ period: "custom", dateFrom: "2099-02-01", dateTo: "2099-02-03" })).toMatchObject({
      startDate: "2099-02-01",
      endDate: "2099-02-03",
    });
    expect(() => resolveReportPeriod({ period: "custom", dateFrom: "2099-02-03", dateTo: "2099-02-01" })).toThrow();
  });
});

describe("report exports", () => {
  it("creates a valid formatted XLSX workbook", async () => {
    const bytes = await renderReportExcel(sampleReport);
    expect(Array.from(bytes.slice(0, 2))).toEqual([80, 75]);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes as unknown as Parameters<typeof workbook.xlsx.load>[0]);
    const sheet = workbook.getWorksheet("Akomodasi");
    expect(sheet).toBeDefined();
    expect(sheet?.getCell("A1").value).toBe("Laporan Shakila Group");
    expect(sheet?.getRow(15).getCell(1).value).toBe("No");
    expect(sheet?.autoFilter).toBeDefined();
    expect(sheet?.views[0]?.state).toBe("frozen");
  });

  it("creates a printable PDF for data and empty reports", async () => {
    const bytes = await renderReportPdf(sampleReport);
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe("%PDF");
    const document = await PDFDocument.load(bytes);
    expect(document.getPageCount()).toBeGreaterThan(0);

    const empty = await renderReportPdf({ ...sampleReport, rows: [], emptyMessage: "Tidak ada data pada periode ini." });
    const emptyDocument = await PDFDocument.load(empty);
    expect(emptyDocument.getPageCount()).toBeGreaterThan(0);

    const emptyWorkbook = new ExcelJS.Workbook();
    await emptyWorkbook.xlsx.load(
      (await renderReportExcel({ ...sampleReport, rows: [], emptyMessage: "Tidak ada data pada periode ini." })) as unknown as Parameters<typeof emptyWorkbook.xlsx.load>[0],
    );
    expect(emptyWorkbook.getWorksheet("Akomodasi")?.getCell("A15").value).toBe("No");
    expect(emptyWorkbook.getWorksheet("Akomodasi")?.getCell("A16").value).toBe("Tidak ada data pada periode ini.");
  });
});
