import ExcelJS from "exceljs";
import type { AdminReport, AdminReportBusiness } from "@booking/contracts";

type ColumnKind = "text" | "date" | "number" | "currency";
type ReportColumn = { key: string; header: string; width: number; kind: ColumnKind };

const currencyFormat = '"Rp" #,##0';
const dateFormat = "dd/mm/yyyy";

function columnsFor(business: AdminReportBusiness): ReportColumn[] {
  if (business === "accommodation") {
    return [
      { key: "no", header: "No", width: 6, kind: "number" },
      { key: "bookingCode", header: "Kode booking", width: 19, kind: "text" },
      { key: "bookingDate", header: "Tanggal booking", width: 16, kind: "date" },
      { key: "accommodationKindLabel", header: "Jenis", width: 13, kind: "text" },
      { key: "roomType", header: "Tipe kamar", width: 24, kind: "text" },
      { key: "guestName", header: "Nama tamu", width: 24, kind: "text" },
      { key: "checkInDate", header: "Check-in", width: 15, kind: "date" },
      { key: "checkOutDate", header: "Check-out", width: 15, kind: "date" },
      { key: "unitQuantity", header: "Jumlah unit", width: 12, kind: "number" },
      { key: "guestCount", header: "Jumlah tamu", width: 12, kind: "number" },
      { key: "bookingSourceLabel", header: "Sumber booking", width: 19, kind: "text" },
      { key: "bookingStatusLabel", header: "Status booking", width: 21, kind: "text" },
      { key: "paymentStatusLabel", header: "Status pembayaran", width: 21, kind: "text" },
      { key: "totalAmount", header: "Total", width: 18, kind: "currency" },
      { key: "paidAmount", header: "Sudah dibayar", width: 18, kind: "currency" },
      { key: "remainingAmount", header: "Sisa tagihan", width: 18, kind: "currency" },
    ];
  }
  return [
    { key: "no", header: "No", width: 6, kind: "number" },
    { key: "bookingCode", header: "Kode booking", width: 19, kind: "text" },
    { key: "bookingDate", header: "Tanggal booking", width: 16, kind: "date" },
    { key: "packageName", header: "Paket", width: 28, kind: "text" },
    { key: "customerName", header: "Nama customer", width: 24, kind: "text" },
    { key: "tourDate", header: "Tanggal tour", width: 16, kind: "date" },
    { key: "jeepQuantity", header: "Jumlah Jeep", width: 13, kind: "number" },
    { key: "guestCount", header: "Jumlah tamu", width: 12, kind: "number" },
    { key: "bookingSourceLabel", header: "Sumber booking", width: 19, kind: "text" },
    { key: "bookingStatusLabel", header: "Status booking", width: 21, kind: "text" },
    { key: "paymentStatusLabel", header: "Status pembayaran", width: 21, kind: "text" },
    { key: "totalAmount", header: "Total", width: 18, kind: "currency" },
    { key: "paidAmount", header: "Sudah dibayar", width: 18, kind: "currency" },
    { key: "remainingAmount", header: "Sisa tagihan", width: 18, kind: "currency" },
  ];
}

function columnLetter(number: number): string {
  let value = number;
  let result = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }
  return result;
}

function excelDate(value: unknown): Date | string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value == null ? "-" : String(value);
  return new Date(`${value}T00:00:00+07:00`);
}

function setCellFormat(cell: ExcelJS.Cell, kind: ColumnKind) {
  if (kind === "currency") cell.numFmt = currencyFormat;
  if (kind === "date") cell.numFmt = dateFormat;
  if (kind === "number" || kind === "currency") cell.alignment = { horizontal: "right", vertical: "middle" };
  else if (kind === "date") cell.alignment = { horizontal: "center", vertical: "middle" };
  else cell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
}

export async function renderReportExcel(report: AdminReport): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Shakila Group";
  workbook.lastModifiedBy = "Shakila Group Admin";
  workbook.created = new Date(report.exportedAt);
  workbook.modified = new Date(report.exportedAt);

  const columns = columnsFor(report.business);
  const sheet = workbook.addWorksheet(report.business === "accommodation" ? "Akomodasi" : "Jeep", {
    properties: { tabColor: { argb: report.business === "accommodation" ? "FF2F7256" : "FFB86C31" } },
    pageSetup: {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
  });
  const lastColumn = columnLetter(columns.length);
  columns.forEach((column, index) => {
    sheet.getColumn(index + 1).width = column.width;
  });

  sheet.mergeCells(`A1:${lastColumn}1`);
  const titleCell = sheet.getCell("A1");
  titleCell.value = report.title;
  titleCell.font = { name: "Aptos Display", size: 18, bold: true, color: { argb: "FF18352A" } };
  titleCell.alignment = { horizontal: "left", vertical: "middle" };
  sheet.getRow(1).height = 30;

  const metaRows = [
    ["Jenis laporan", report.businessLabel],
    ["Periode", report.period.label],
    ["Tanggal export", new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(new Date(report.exportedAt))],
  ];
  metaRows.forEach(([label, value]) => {
    const row = sheet.addRow([label, value]);
    row.getCell(1).font = { bold: true, color: { argb: "FF53655B" } };
    row.getCell(1).alignment = { vertical: "middle" };
    row.getCell(2).alignment = { vertical: "middle" };
  });

  sheet.addRow([]);
  const summaryTitleRow = sheet.addRow(["Ringkasan"]);
  sheet.mergeCells(`A${summaryTitleRow.number}:${lastColumn}${summaryTitleRow.number}`);
  const summaryTitle = summaryTitleRow.getCell(1);
  summaryTitle.font = { bold: true, color: { argb: "FFFFFFFF" } };
  summaryTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2F7256" } };
  summaryTitle.alignment = { vertical: "middle" };
  const summaryRows: Array<[string, number, ColumnKind]> = [
    ["Total booking", report.summary.totalBookings, "number"],
    ["Total nilai booking", report.summary.totalBookingValue, "currency"],
    ["Pembayaran terverifikasi / pendapatan diterima", report.summary.verifiedRevenue, "currency"],
    ["Sisa tagihan", report.summary.remainingAmount, "currency"],
    ["Booking dikonfirmasi", report.summary.confirmedBookings, "number"],
    ["Booking selesai / check-out", report.summary.completedBookings, "number"],
    ["Booking dibatalkan", report.summary.cancelledBookings, "number"],
  ];
  summaryRows.forEach(([label, value, kind]) => {
    const row = sheet.addRow([label, value]);
    row.getCell(1).font = { color: { argb: "FF53655B" } };
    row.getCell(2).font = { bold: true, color: { argb: "FF18352A" } };
    setCellFormat(row.getCell(2), kind);
  });

  sheet.addRow([]);
  const headerRow = sheet.addRow(columns.map((column) => column.header));
  headerRow.height = 32;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF18352A" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = { bottom: { style: "medium", color: { argb: "FFB7C9BD" } } };
  });

  const reportRows = report.rows as ReadonlyArray<Record<string, unknown>>;
  reportRows.forEach((sourceRow, index) => {
    const row = sheet.addRow(
      columns.map((column) => {
        const value = column.key === "no" ? index + 1 : sourceRow[column.key];
        return column.kind === "date" ? excelDate(value) : value ?? "-";
      }),
    );
    row.height = 24;
    row.eachCell((cell, columnNumber) => setCellFormat(cell, columns[columnNumber - 1]!.kind));
  });

  if (report.emptyMessage) {
    const emptyRow = sheet.addRow([report.emptyMessage]);
    sheet.mergeCells(`A${emptyRow.number}:${lastColumn}${emptyRow.number}`);
    emptyRow.getCell(1).font = { italic: true, color: { argb: "FF6B756F" } };
    emptyRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
  }

  sheet.autoFilter = {
    from: { row: headerRow.number, column: 1 },
    to: { row: headerRow.number + Math.max(reportRows.length, 1), column: columns.length },
  };
  sheet.views = [{ state: "frozen", ySplit: headerRow.number }];
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border ??= {};
      cell.border.bottom = { style: "hair", color: { argb: "FFE3E9E5" } };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}

export { columnsFor };
