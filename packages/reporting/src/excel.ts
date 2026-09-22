import ExcelJS from "exceljs";
import type { AdminReport, AdminReportBusiness } from "@booking/contracts";

type ColumnKind = "text" | "date" | "number" | "currency";
type ReportColumn = {
  key: string;
  header: string;
  kind: ColumnKind;
  minWidth: number;
  maxWidth: number;
};

const currencyFormat = '"Rp" #,##0';
const dateFormat = "dd/mm/yyyy";

function columnsFor(business: AdminReportBusiness): ReportColumn[] {
  if (business === "accommodation") {
    return [
      { key: "no", header: "No", kind: "number", minWidth: 6, maxWidth: 8 },
      { key: "bookingCode", header: "Kode booking", kind: "text", minWidth: 18, maxWidth: 22 },
      { key: "bookingDate", header: "Tanggal booking", kind: "date", minWidth: 14, maxWidth: 17 },
      { key: "accommodationKindLabel", header: "Jenis", kind: "text", minWidth: 12, maxWidth: 18 },
      { key: "roomType", header: "Tipe kamar", kind: "text", minWidth: 14, maxWidth: 32 },
      { key: "guestName", header: "Nama tamu", kind: "text", minWidth: 16, maxWidth: 30 },
      { key: "checkInDate", header: "Check-in", kind: "date", minWidth: 12, maxWidth: 15 },
      { key: "checkOutDate", header: "Check-out", kind: "date", minWidth: 12, maxWidth: 15 },
      { key: "unitQuantity", header: "Jumlah unit", kind: "number", minWidth: 10, maxWidth: 14 },
      { key: "guestCount", header: "Jumlah tamu", kind: "number", minWidth: 10, maxWidth: 14 },
      { key: "bookingSourceLabel", header: "Sumber booking", kind: "text", minWidth: 14, maxWidth: 22 },
      { key: "bookingStatusLabel", header: "Status booking", kind: "text", minWidth: 18, maxWidth: 24 },
      { key: "paymentStatusLabel", header: "Status pembayaran", kind: "text", minWidth: 18, maxWidth: 24 },
      { key: "totalAmount", header: "Total", kind: "currency", minWidth: 16, maxWidth: 20 },
      { key: "paidAmount", header: "Sudah dibayar", kind: "currency", minWidth: 16, maxWidth: 20 },
      { key: "remainingAmount", header: "Sisa tagihan", kind: "currency", minWidth: 16, maxWidth: 20 },
    ];
  }
  return [
    { key: "no", header: "No", kind: "number", minWidth: 6, maxWidth: 8 },
    { key: "bookingCode", header: "Kode booking", kind: "text", minWidth: 18, maxWidth: 22 },
    { key: "bookingDate", header: "Tanggal booking", kind: "date", minWidth: 14, maxWidth: 17 },
    { key: "packageName", header: "Paket", kind: "text", minWidth: 12, maxWidth: 32 },
    { key: "customerName", header: "Nama customer", kind: "text", minWidth: 16, maxWidth: 30 },
    { key: "tourDate", header: "Tanggal tour", kind: "date", minWidth: 12, maxWidth: 15 },
    { key: "jeepQuantity", header: "Jumlah Jeep", kind: "number", minWidth: 10, maxWidth: 14 },
    { key: "guestCount", header: "Jumlah tamu", kind: "number", minWidth: 10, maxWidth: 14 },
    { key: "bookingSourceLabel", header: "Sumber booking", kind: "text", minWidth: 14, maxWidth: 22 },
    { key: "bookingStatusLabel", header: "Status booking", kind: "text", minWidth: 18, maxWidth: 24 },
    { key: "paymentStatusLabel", header: "Status pembayaran", kind: "text", minWidth: 18, maxWidth: 24 },
    { key: "totalAmount", header: "Total", kind: "currency", minWidth: 16, maxWidth: 20 },
    { key: "paidAmount", header: "Sudah dibayar", kind: "currency", minWidth: 16, maxWidth: 20 },
    { key: "remainingAmount", header: "Sisa tagihan", kind: "currency", minWidth: 16, maxWidth: 20 },
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

function formatRupiahForWidth(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return value == null ? "-" : String(value);
  return `Rp ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value)}`;
}

function displayValueForWidth(value: unknown, kind: ColumnKind): string {
  if (kind === "currency") return formatRupiahForWidth(value);
  if (kind === "date" && typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return "00/00/0000";
  return value == null ? "-" : String(value);
}

function fitReportColumns(
  sheet: ExcelJS.Worksheet,
  columns: ReportColumn[],
  reportRows: ReadonlyArray<Record<string, unknown>>,
) {
  columns.forEach((column, index) => {
    const longestValue = Math.max(
      column.header.length,
      ...reportRows.map((sourceRow, rowIndex) => {
        const value = column.key === "no" ? rowIndex + 1 : sourceRow[column.key];
        return displayValueForWidth(value, column.kind).length;
      }),
    );
    const fittedWidth = longestValue + 2;
    sheet.getColumn(index + 1).width = Math.min(column.maxWidth, Math.max(column.minWidth, fittedWidth));
  });
}

function rowHeightForData(
  columns: ReportColumn[],
  sourceRow: Record<string, unknown>,
  rowNumber: number,
  sheet: ExcelJS.Worksheet,
): number {
  const lineCount = columns.reduce((maxLines, column, index) => {
    if (column.kind !== "text") return maxLines;
    const value = column.key === "no" ? rowNumber : sourceRow[column.key];
    const textLength = displayValueForWidth(value, column.kind).length;
    const width = sheet.getColumn(index + 1).width ?? column.minWidth;
    return Math.max(maxLines, Math.ceil(textLength / Math.max(width - 2, 1)));
  }, 1);
  return Math.min(48, Math.max(24, lineCount * 15 + 6));
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
    properties: {
      tabColor: { argb: report.business === "accommodation" ? "FF2F7256" : "FFB86C31" },
      showGridLines: false,
    },
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
  const reportRows = report.rows as ReadonlyArray<Record<string, unknown>>;
  fitReportColumns(sheet, columns, reportRows);

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
    const row = sheet.addRow([]);
    sheet.mergeCells(`A${row.number}:B${row.number}`);
    sheet.mergeCells(`C${row.number}:${lastColumn}${row.number}`);
    row.getCell(1).value = label;
    row.getCell(3).value = value;
    row.getCell(1).font = { bold: true, color: { argb: "FF53655B" } };
    row.getCell(1).alignment = { vertical: "middle" };
    row.getCell(3).alignment = { vertical: "middle" };
    row.height = 20;
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
    const row = sheet.addRow([]);
    sheet.mergeCells(`A${row.number}:D${row.number}`);
    sheet.mergeCells(`E${row.number}:F${row.number}`);
    row.getCell(1).value = label;
    row.getCell(5).value = value;
    row.getCell(1).font = { color: { argb: "FF53655B" } };
    row.getCell(1).alignment = { vertical: "middle", wrapText: true };
    row.getCell(5).font = { bold: true, color: { argb: "FF18352A" } };
    setCellFormat(row.getCell(5), kind);
    row.height = label.length > 30 ? 30 : 22;
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

  reportRows.forEach((sourceRow, index) => {
    const row = sheet.addRow(
      columns.map((column) => {
        const value = column.key === "no" ? index + 1 : sourceRow[column.key];
        return column.kind === "date" ? excelDate(value) : value ?? "-";
      }),
    );
    row.height = rowHeightForData(columns, sourceRow, index + 1, sheet);
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
  // Keep the workbook in a normal scrollable view. The report has a large
  // summary block above the table, and frozen panes make Excel desktop treat
  // the generated sheet as a stuck split pane on some clients.
  sheet.views = [{ state: "normal" }];
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border ??= {};
      cell.border.bottom ??= { style: "hair", color: { argb: "FFE3E9E5" } };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}

export { columnsFor };
