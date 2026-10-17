/**
 * AD ↔ BS (Bikram Sambat) date conversion.
 *
 * This is the ONE canonical copy of the BS calendar table and conversion
 * logic in the app — every screen, form, and API route that needs to
 * convert or validate a BS date should import from here. Do not copy this
 * table elsewhere (a previous standalone tool duplicated it and the two
 * copies had already drifted after independent bug fixes).
 *
 * Has zero browser dependency (no `document`/`window`), so it's safe to
 * import both client-side (e.g. NepaliDatePicker) and server-side (API
 * routes) — the same function runs in both places, so there's no risk of
 * client and server disagreeing on what a BS date converts to. API routes
 * should still always re-run the conversion server-side rather than
 * trusting an AD string sent from the client as-is.
 *
 * Epoch: 1 Baisakh 2000 BS = 14 April 1943 AD.
 * Supported range: BS 2000–2090 (≈ AD 1943–2033). All arithmetic uses UTC
 * to avoid Nepal's UTC+5:45 offset causing off-by-one-day errors.
 */

export type BSDate = {
  year: number;
  /** 1–12 */
  month: number;
  day: number;
};

export type BSDateFormatted = BSDate & {
  /** "YYYY-MM-DD", zero-padded */
  formatted: string;
};

// BS month-length table. Format: [Baisakh, Jestha, Ashad, Shrawan, Bhadra,
// Ashwin, Kartik, Mangsir, Poush, Magh, Falgun, Chaitra]
// Source: verified against blog.sajilonepal.dev/tools/date-converter.
export const BS_CALENDAR_DATA: Record<number, number[]> = {
  2000: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2001: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2002: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2003: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2004: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2005: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2006: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2007: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2008: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  2009: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2010: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2011: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2012: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2013: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2014: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2015: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2016: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2017: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2018: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2019: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2020: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2021: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2022: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2023: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2024: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2025: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2026: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2027: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2028: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2029: [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30],
  2030: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2031: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2032: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2033: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2034: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2035: [30, 32, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  2036: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2037: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2038: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2039: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2040: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2041: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2042: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2043: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2044: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2045: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2046: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2047: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2048: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2049: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2050: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2051: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2052: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2053: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2054: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2055: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2056: [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30],
  2057: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2058: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2059: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2060: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2061: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2062: [31, 31, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
  2063: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2064: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2065: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2066: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  2067: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2068: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2069: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2070: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2071: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2072: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2073: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2074: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2075: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2076: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2077: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2078: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2079: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2081: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2082: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2083: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2084: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2085: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2086: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2087: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2088: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2089: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2090: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
};

export const BS_MONTHS = [
  "Baisakh", "Jestha", "Ashad", "Shrawan", "Bhadra", "Ashwin",
  "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra",
] as const;

export const BS_MIN_YEAR = 2000;
export const BS_MAX_YEAR = 2090;

/** 1 Baisakh 2000 BS = 14 April 1943 AD (UTC midnight). */
const REF_UTC_MS = Date.UTC(1943, 3, 14);
const REF_BS: BSDate = { year: 2000, month: 1, day: 1 };

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatBSDate(d: BSDate): string {
  return `${d.year}-${pad2(d.month)}-${pad2(d.day)}`;
}

/**
 * Converts an AD date to BS. Accepts a Date object or an "YYYY-MM-DD"
 * string. Throws if the date falls outside BS_MIN_YEAR–BS_MAX_YEAR — the
 * caller decides how to surface that (form validation error, etc.); this
 * function does not silently clamp or guess.
 */
export function adToBs(adDate: Date | string): BSDateFormatted {
  const targetUTC =
    typeof adDate === "string"
      ? (() => {
          const [y, m, d] = adDate.split("-").map(Number);
          if (!y || !m || !d) {
            throw new Error(`nepaliDate.adToBs: invalid date string "${adDate}"`);
          }
          return Date.UTC(y, m - 1, d);
        })()
      : Date.UTC(adDate.getUTCFullYear(), adDate.getUTCMonth(), adDate.getUTCDate());

  let daysDiff = Math.round((targetUTC - REF_UTC_MS) / 86_400_000);

  if (daysDiff < 0) {
    throw new Error(
      `nepaliDate.adToBs: date is before the minimum supported date (1943-04-14 AD = 2000-01-01 BS).`
    );
  }

  let year = REF_BS.year;
  let month = 0; // 0-based while iterating
  let day = 1;

  while (daysDiff > 0) {
    const daysInMonth = BS_CALENDAR_DATA[year]?.[month];
    if (daysInMonth === undefined) {
      throw new Error(
        `nepaliDate.adToBs: BS year ${year} is outside the supported range (${BS_MIN_YEAR}-${BS_MAX_YEAR}). Extend BS_CALENDAR_DATA to cover it.`
      );
    }
    const remaining = daysInMonth - day + 1;
    if (daysDiff < remaining) {
      day += daysDiff;
      daysDiff = 0;
    } else {
      daysDiff -= remaining;
      day = 1;
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }
  }

  const result: BSDate = { year, month: month + 1, day };
  return { ...result, formatted: formatBSDate(result) };
}

/** Converts a BS date to an AD Date (UTC midnight). Throws if out of range. */
export function bsToAd(bsDate: BSDate): Date {
  if (!bsDate?.year || !bsDate.month || !bsDate.day) {
    throw new Error("nepaliDate.bsToAd: invalid bsDate object");
  }
  if (bsDate.year < BS_MIN_YEAR || bsDate.year > BS_MAX_YEAR) {
    throw new Error(
      `nepaliDate.bsToAd: BS year ${bsDate.year} is outside the supported range (${BS_MIN_YEAR}-${BS_MAX_YEAR}).`
    );
  }

  const yearData = BS_CALENDAR_DATA[bsDate.year];
  if (!yearData) {
    throw new Error(`nepaliDate.bsToAd: BS year ${bsDate.year} not found in BS_CALENDAR_DATA.`);
  }
  if (bsDate.month < 1 || bsDate.month > 12) {
    throw new Error(`nepaliDate.bsToAd: month must be 1-12, got ${bsDate.month}.`);
  }
  const maxDay = yearData[bsDate.month - 1];
  if (bsDate.day < 1 || bsDate.day > maxDay) {
    throw new Error(
      `nepaliDate.bsToAd: day must be 1-${maxDay} for ${BS_MONTHS[bsDate.month - 1]} ${bsDate.year}, got ${bsDate.day}.`
    );
  }

  let daysToAdd = 0;
  for (let y = BS_MIN_YEAR; y < bsDate.year; y++) {
    daysToAdd += BS_CALENDAR_DATA[y].reduce((a, b) => a + b, 0);
  }
  for (let m = 0; m < bsDate.month - 1; m++) {
    daysToAdd += yearData[m];
  }
  daysToAdd += bsDate.day - 1;

  return new Date(REF_UTC_MS + daysToAdd * 86_400_000);
}

/** Last day of the given BS month, as a BSDate. */
export function getBSMonthEnd(year: number, month: number): BSDate {
  const days = BS_CALENDAR_DATA[year]?.[month - 1];
  if (!days) {
    throw new Error(`nepaliDate.getBSMonthEnd: BS year ${year} not found in BS_CALENDAR_DATA.`);
  }
  return { year, month, day: days };
}

/** Adds `days` (positive or negative) to a BS date, rolling over months/years. */
export function addDaysBS(bsDate: BSDate, days: number): BSDateFormatted {
  let { year, month, day } = bsDate;
  let d = day + days;
  let mIdx = month - 1;

  while (true) {
    const dim = BS_CALENDAR_DATA[year]?.[mIdx];
    if (!dim) {
      throw new Error(`nepaliDate.addDaysBS: BS year ${year} not found in BS_CALENDAR_DATA.`);
    }
    if (d >= 1 && d <= dim) break;
    if (d > dim) {
      d -= dim;
      mIdx++;
      if (mIdx > 11) {
        mIdx = 0;
        year++;
      }
    } else {
      mIdx--;
      if (mIdx < 0) {
        mIdx = 11;
        year--;
      }
      d += BS_CALENDAR_DATA[year]?.[mIdx] ?? 0;
    }
  }

  const result: BSDate = { year, month: mIdx + 1, day: d };
  return { ...result, formatted: formatBSDate(result) };
}

/** "Shrawan 5, 2082" style display string. */
export function formatBSLong(bs: BSDate): string {
  if (!bs?.month || bs.month < 1 || bs.month > 12) return "—";
  return `${BS_MONTHS[bs.month - 1]} ${bs.day}, ${bs.year}`;
}
