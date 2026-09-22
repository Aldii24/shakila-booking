import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { AdminReport } from "@booking/contracts";
import { formatDateOnly, formatDisplayDate } from "./period";
import { columnsFor } from "./excel";

const PAGE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;
const MARGIN = 24;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BODY_FONT_SIZE = 5.25;
const BODY_LINE_HEIGHT = 6.5;

type PdfColumn = ReturnType<typeof columnsFor>[number] & { width: number };

function pdfColumns(report: AdminReport): PdfColumn[] {
  const base = columnsFor(report.business);
  const widths =
    report.business === "accommodation"
      ? [20, 65, 45, 45, 60, 70, 43, 43, 24, 24, 48, 57, 56, 58, 58, 58]
      : [20, 65, 45, 75, 78, 45, 28, 28, 54, 62, 60, 62, 62, 62];
  const scale = CONTENT_WIDTH / widths.reduce((total, width) => total + width, 0);
  return base.map((column, index) => ({ ...column, width: widths[index]! * scale }));
}

function money(value: unknown): string {
  return `Rp${new Intl.NumberFormat("id-ID").format(Number(value ?? 0))}`;
}

function valueFor(row: Record<string, unknown>, column: PdfColumn, index: number): string {
  const value = column.key === "no" ? index + 1 : row[column.key];
  if (column.kind === "currency") return money(value);
  if (column.kind === "date") return typeof value === "string" && value !== "-" ? formatDisplayDate(value) : "-";
  return value == null || value === "" ? "-" : String(value);
}

function splitText(value: string, font: Pick<PDFFont, "widthOfTextAtSize">, size: number, width: number, maxLines = 3): string[] {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (!current || font.widthOfTextAtSize(candidate, size) <= width) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
  }
  if (current) lines.push(current);
  if (lines.length <= maxLines) return lines;
  const clipped = lines.slice(0, maxLines);
  let last = clipped[maxLines - 1] ?? "";
  while (last && font.widthOfTextAtSize(`${last}...`, size) > width) last = last.slice(0, -1);
  clipped[maxLines - 1] = `${last}...`;
  return clipped;
}

async function logoBytes(): Promise<Uint8Array | null> {
  const candidates = [
    process.env.SHAKILA_REPORT_LOGO_PATH,
    path.resolve(process.cwd(), "packages/reporting/assets/shakila-logo-transparent.png"),
    path.resolve(process.cwd(), "apps/api/public/shakila-logo-transparent.png"),
    path.resolve(process.cwd(), "apps/admin/public/shakila-logo-transparent.png"),
    fileURLToPath(new URL("../assets/shakila-logo-transparent.png", import.meta.url)),
  ].filter((value): value is string => Boolean(value));
  for (const candidate of candidates) {
    try {
      return new Uint8Array(await readFile(candidate));
    } catch {
      // The wordmark fallback keeps exports usable when a deployment omits optional static assets.
    }
  }
  return null;
}

function drawFooter(page: PDFPage, regular: PDFFont, muted: ReturnType<typeof rgb>, pageNumber: number, pageCount: number) {
  page.drawLine({ start: { x: MARGIN, y: 23 }, end: { x: PAGE_WIDTH - MARGIN, y: 23 }, thickness: 0.5, color: muted });
  page.drawText("Shakila Group - Laporan Admin", { x: MARGIN, y: 12, size: 6.5, font: regular, color: muted });
  const label = `Halaman ${pageNumber} / ${pageCount}`;
  page.drawText(label, { x: PAGE_WIDTH - MARGIN - regular.widthOfTextAtSize(label, 6.5), y: 12, size: 6.5, font: regular, color: muted });
}

export async function renderReportPdf(report: AdminReport): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.08, 0.13, 0.1);
  const muted = rgb(0.35, 0.41, 0.38);
  const line = rgb(0.78, 0.82, 0.79);
  const green = rgb(0.11, 0.28, 0.2);
  const pale = rgb(0.95, 0.97, 0.95);
  const orange = rgb(0.63, 0.34, 0.16);
  const accent = report.business === "accommodation" ? green : orange;
  const logo = await logoBytes();
  const embeddedLogo = logo ? await pdf.embedPng(logo) : null;
  const columns = pdfColumns(report);
  const reportRows = report.rows as ReadonlyArray<Record<string, unknown>>;

  const drawHeader = (page: ReturnType<PDFDocument["addPage"]>, continued: boolean) => {
    const logoY = PAGE_HEIGHT - 55;
    if (embeddedLogo) {
      const dimensions = embeddedLogo.scale(1);
      const scale = Math.min(78 / dimensions.width, 34 / dimensions.height);
      page.drawImage(embeddedLogo, { x: MARGIN, y: logoY, width: dimensions.width * scale, height: dimensions.height * scale });
    } else {
      page.drawRectangle({ x: MARGIN, y: logoY + 2, width: 30, height: 30, color: accent });
      page.drawText("S", { x: MARGIN + 10, y: logoY + 11, size: 15, font: bold, color: rgb(1, 1, 1) });
    }
    page.drawText("Shakila Group", { x: MARGIN + 90, y: PAGE_HEIGHT - 37, size: 15, font: bold, color: ink });
    page.drawText(continued ? "Laporan Admin - lanjutan" : report.title, { x: MARGIN + 90, y: PAGE_HEIGHT - 54, size: 8, font: regular, color: muted });
    const businessText = `${report.businessLabel}  |  Periode: ${report.period.label}`;
    page.drawText(businessText, { x: MARGIN + 90, y: PAGE_HEIGHT - 69, size: 7, font: regular, color: accent });
  };

  const firstPage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawHeader(firstPage, false);
  firstPage.drawText(`Diekspor: ${formatDisplayDate(formatDateOnly(new Date(report.exportedAt)))}`, { x: PAGE_WIDTH - MARGIN - 155, y: PAGE_HEIGHT - 37, size: 6.5, font: regular, color: muted });

  const metrics: Array<[string, string]> = [
    ["Total booking", new Intl.NumberFormat("id-ID").format(report.summary.totalBookings)],
    ["Total nilai booking", money(report.summary.totalBookingValue)],
    ["Pendapatan diterima", money(report.summary.verifiedRevenue)],
    ["Sisa tagihan", money(report.summary.remainingAmount)],
    ["Dikonfirmasi", new Intl.NumberFormat("id-ID").format(report.summary.confirmedBookings)],
    ["Selesai / check-out", new Intl.NumberFormat("id-ID").format(report.summary.completedBookings)],
    ["Dibatalkan", new Intl.NumberFormat("id-ID").format(report.summary.cancelledBookings)],
  ];
  const metricGap = 6;
  const metricWidth = (CONTENT_WIDTH - metricGap * 3) / 4;
  metrics.forEach(([label, value], index) => {
    const row = Math.floor(index / 4);
    const column = index % 4;
    const x = MARGIN + column * (metricWidth + metricGap);
    const y = PAGE_HEIGHT - 118 - row * 41;
    firstPage.drawRectangle({ x, y, width: metricWidth, height: 32, color: pale, borderColor: line, borderWidth: 0.5 });
    firstPage.drawText(label, { x: x + 7, y: y + 19, size: 5.6, font: regular, color: muted });
    firstPage.drawText(value, { x: x + 7, y: y + 7, size: 8.2, font: bold, color: ink });
  });

  const drawTableHeader = (page: ReturnType<PDFDocument["addPage"]>, top: number) => {
    const headerHeight = 25;
    let x = MARGIN;
    columns.forEach((column) => {
      page.drawRectangle({ x, y: top - headerHeight, width: column.width, height: headerHeight, color: accent });
      const lines = splitText(column.header, regular, 5.1, column.width - 5, 3);
      lines.forEach((lineText, index) => page.drawText(lineText, { x: x + 2.5, y: top - 8 - index * 6, size: 5.1, font: regular, color: rgb(1, 1, 1) }));
      x += column.width;
    });
    return top - headerHeight;
  };

  let page = firstPage;
  let cursor = drawTableHeader(page, PAGE_HEIGHT - 198);
  if (!reportRows.length && report.emptyMessage) {
    page.drawText(report.emptyMessage, { x: MARGIN + 6, y: cursor - 18, size: 8, font: regular, color: muted });
  }

  reportRows.forEach((row, rowIndex) => {
    const values = columns.map((column) => valueFor(row, column, rowIndex));
    const lines = values.map((value, index) => splitText(value, regular, BODY_FONT_SIZE, columns[index]!.width - 5, 3));
    const rowHeight = Math.max(18, Math.max(...lines.map((value) => value.length)) * BODY_LINE_HEIGHT + 6);
    if (cursor - rowHeight < 35) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      drawHeader(page, true);
      cursor = drawTableHeader(page, PAGE_HEIGHT - 91);
    }
    let x = MARGIN;
    lines.forEach((cellLines, columnIndex) => {
      const column = columns[columnIndex]!;
      page.drawRectangle({ x, y: cursor - rowHeight, width: column.width, height: rowHeight, color: rowIndex % 2 === 0 ? rgb(1, 1, 1) : pale, borderColor: line, borderWidth: 0.35 });
      cellLines.forEach((lineText, lineIndex) => page.drawText(lineText, { x: x + 2.5, y: cursor - 8 - lineIndex * BODY_LINE_HEIGHT, size: BODY_FONT_SIZE, font: regular, color: ink }));
      x += column.width;
    });
    cursor -= rowHeight;
  });

  const pages = pdf.getPages();
  pages.forEach((current, index) => drawFooter(current, regular, line, index + 1, pages.length));
  return pdf.save();
}
