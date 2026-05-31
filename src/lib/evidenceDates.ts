export type EvidenceDatePrecision = "day" | "month";

export type ParsedEvidenceDate = {
  date: Date;
  precision: EvidenceDatePrecision;
};

const monthNames = new Map([
  ["jan", 0],
  ["january", 0],
  ["feb", 1],
  ["february", 1],
  ["mar", 2],
  ["march", 2],
  ["apr", 3],
  ["april", 3],
  ["may", 4],
  ["jun", 5],
  ["june", 5],
  ["jul", 6],
  ["july", 6],
  ["aug", 7],
  ["august", 7],
  ["sep", 8],
  ["sept", 8],
  ["september", 8],
  ["oct", 9],
  ["october", 9],
  ["nov", 10],
  ["november", 10],
  ["dec", 11],
  ["december", 11]
]);

export function parseEvidenceDate(value: string | undefined): ParsedEvidenceDate | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const isoDayMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDayMatch) {
    return buildUtcDate(isoDayMatch[1], isoDayMatch[2], isoDayMatch[3], "day");
  }

  const isoMonthMatch = trimmed.match(/^(\d{4})-(\d{2})$/);
  if (isoMonthMatch) {
    return buildUtcDate(isoMonthMatch[1], isoMonthMatch[2], "01", "month");
  }

  const ukDayMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ukDayMatch) {
    return buildUtcDate(ukDayMatch[3], ukDayMatch[2], ukDayMatch[1], "day");
  }

  const monthNameMatch = trimmed.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthNameMatch) {
    const monthIndex = monthNames.get(monthNameMatch[1].toLowerCase());
    if (monthIndex !== undefined) {
      return {
        date: new Date(Date.UTC(Number(monthNameMatch[2]), monthIndex, 1)),
        precision: "month"
      };
    }
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return {
    date: new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate())),
    precision: "day"
  };
}

export function formatEvidenceDate(value: string | undefined): string {
  const parsed = parseEvidenceDate(value);
  if (!parsed) return "Unknown";

  return new Intl.DateTimeFormat("en-GB", {
    day: parsed.precision === "day" ? "numeric" : undefined,
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(parsed.date);
}

export function formatEvidenceDateRange(start: string, end: string): string {
  return `${formatEvidenceDate(start)} to ${formatEvidenceDate(end)}`;
}

function buildUtcDate(
  year: string,
  month: string,
  day: string,
  precision: EvidenceDatePrecision
): ParsedEvidenceDate | null {
  const numericYear = Number(year);
  const numericMonth = Number(month);
  const numericDay = Number(day);
  const date = new Date(Date.UTC(numericYear, numericMonth - 1, numericDay));

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== numericYear ||
    date.getUTCMonth() !== numericMonth - 1 ||
    date.getUTCDate() !== numericDay
  ) {
    return null;
  }

  return { date, precision };
}
