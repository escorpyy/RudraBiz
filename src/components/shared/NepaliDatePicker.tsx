"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  adToBs,
  bsToAd,
  BS_CALENDAR_DATA,
  BS_MIN_YEAR,
  BS_MAX_YEAR,
  BS_MONTHS,
} from "@/lib/nepaliDate";

export type CalendarPreference = "BS" | "AD";

export type NepaliDatePickerProps = {
  label?: string;
  /** Canonical value — AD, "YYYY-MM-DD". This is what the form should store/submit. */
  adValue: string;
  /** Display cache — BS, "YYYY-MM-DD". Kept in sync by this component; safe to omit on first render. */
  bsValue?: string;
  /** Called whenever the date changes, with both representations already in sync. */
  onChange: (adValue: string, bsValue: string) => void;
  /**
   * Which calendar the user types into. "BS" (default) matches most users;
   * pass "AD" for users who've set calendarPreference to English — see
   * User.calendarPreference. The other calendar is always shown as a
   * read-only caption either way, so nothing is ever hidden, just which
   * side is editable changes.
   */
  primaryCalendar?: CalendarPreference;
  required?: boolean;
  className?: string;
};

/**
 * Date picker with dual BS/AD display. The canonical value the form should
 * read and submit is always `adValue` — BS is purely an input/display
 * convenience layered on top via src/lib/nepaliDate.ts. See that file for
 * why: the app's transactional logic runs on AD dates everywhere, BS is
 * converted at the edges only.
 */
export function NepaliDatePicker({
  label,
  adValue,
  bsValue,
  onChange,
  primaryCalendar = "BS",
  required,
  className,
}: NepaliDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [inputVal, setInputVal] = useState(
    primaryCalendar === "BS" ? bsValue || "" : adValue || ""
  );
  const [inputError, setInputError] = useState("");
  const [focusedDay, setFocusedDay] = useState<number | null>(null);
  const [calendarStyle, setCalendarStyle] = useState<React.CSSProperties>({});

  const wrapRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const mouseDownInside = useRef(false);

  const inputId = useId();
  const inputName = label
    ? "ndp_" + label.toLowerCase().replace(/[^a-z0-9]/g, "_")
    : "ndp_" + inputId.replace(/:/g, "");

  const [viewDate, setViewDate] = useState<Date>(() => {
    if (adValue) {
      const [y, m, d] = adValue.split("-").map(Number);
      return new Date(Date.UTC(y, m - 1, d));
    }
    return new Date();
  });

  useEffect(() => {
    setInputVal(primaryCalendar === "BS" ? bsValue || "" : adValue || "");
  }, [bsValue, adValue, primaryCalendar]);

  useEffect(() => {
    if (adValue) {
      const [y, m, d] = adValue.split("-").map(Number);
      setViewDate(new Date(Date.UTC(y, m - 1, d)));
    }
  }, [adValue]);

  const calculatePosition = useCallback(() => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const calHeight = 400;
    const calWidth = 320;
    const viewportH = window.innerHeight;
    const viewportW = window.innerWidth;

    const spaceBelow = viewportH - rect.bottom;
    const openAbove = spaceBelow < calHeight && rect.top > calHeight;

    let left = rect.left;
    if (left + calWidth > viewportW) {
      left = Math.max(8, viewportW - calWidth - 8);
    }

    const style: React.CSSProperties = {
      position: "fixed",
      left,
      width: Math.min(calWidth, viewportW - 16),
      zIndex: 99999,
    };

    if (openAbove) {
      style.bottom = viewportH - rect.top + 4;
    } else {
      style.top = rect.bottom + 4;
    }

    setCalendarStyle(style);
  }, []);

  useEffect(() => {
    if (!open) return;
    calculatePosition();
    if (adValue) {
      const [y, m, d] = adValue.split("-").map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      if (
        dt.getUTCFullYear() === viewDate.getUTCFullYear() &&
        dt.getUTCMonth() === viewDate.getUTCMonth()
      ) {
        setFocusedDay(dt.getUTCDate());
      } else {
        setFocusedDay(1);
      }
    } else {
      setFocusedDay(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open && calendarRef.current) {
      const t = setTimeout(() => {
        const focused = calendarRef.current?.querySelector<HTMLElement>('[data-focused="true"]');
        focused?.focus();
      }, 10);
      return () => clearTimeout(t);
    }
  }, [open, focusedDay]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        wrapRef.current &&
        !wrapRef.current.contains(e.target as Node) &&
        calendarRef.current &&
        !calendarRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = () => calculatePosition();
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, [open, calculatePosition]);

  const year = viewDate.getUTCFullYear();
  const month = viewDate.getUTCMonth();
  const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const weeks: number[][] = [];
  let d = 1 - firstDay;
  for (let w = 0; w < 6; w++) {
    const week: number[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(d);
      d++;
    }
    weeks.push(week);
    if (d > daysInMonth) break;
  }

  const toAdStr = (day: number) => new Date(Date.UTC(year, month, day)).toISOString().split("T")[0];
  const getBsForDay = (day: number) => {
    if (day < 1 || day > daysInMonth) return null;
    try {
      return adToBs(toAdStr(day));
    } catch {
      return null;
    }
  };

  const bsMonthsInView = (() => {
    const seen: { month: number; year: number; name: string }[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const bs = getBsForDay(i);
      if (bs && !seen.find((s) => s.month === bs.month && s.year === bs.year)) {
        seen.push({ month: bs.month, year: bs.year, name: BS_MONTHS[bs.month - 1] });
      }
    }
    return seen;
  })();

  const isSelected = (day: number) => {
    if (!adValue || day < 1 || day > daysInMonth) return false;
    return toAdStr(day) === adValue;
  };
  const isToday = (day: number) => {
    if (day < 1 || day > daysInMonth) return false;
    const t = new Date();
    return day === t.getDate() && month === t.getMonth() && year === t.getFullYear();
  };

  const goToPrevMonth = () => setViewDate(new Date(Date.UTC(year, month - 1, 1)));
  const goToNextMonth = () => setViewDate(new Date(Date.UTC(year, month + 1, 1)));

  const clampDay = (newYear: number, newMonth: number, newDay: number) => {
    const dim = new Date(Date.UTC(newYear, newMonth + 1, 0)).getUTCDate();
    return Math.min(Math.max(1, newDay), dim);
  };

  const emitChange = (adStr: string, bsFormatted: string) => {
    onChange(adStr, bsFormatted);
    setInputVal(primaryCalendar === "BS" ? bsFormatted : adStr);
    setInputError("");
  };

  const handleDayClick = (day: number) => {
    if (day < 1 || day > daysInMonth) return;
    const adStr = toAdStr(day);
    try {
      const bs = adToBs(adStr);
      emitChange(adStr, bs.formatted);
      setOpen(false);
    } catch {
      setInputError("Could not convert this date");
    }
  };

  // Parses free-typed input in whichever calendar is primary, converts,
  // and emits both. Same validation this app should also run server-side.
  const handleTextInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputVal(v);
    setInputError("");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return;

    if (primaryCalendar === "BS") {
      try {
        const [bsY, bsM, bsD] = v.split("-").map(Number);
        if (bsY < BS_MIN_YEAR || bsY > BS_MAX_YEAR) {
          setInputError(`Year out of range (${BS_MIN_YEAR}-${BS_MAX_YEAR})`);
          return;
        }
        const maxDay = BS_CALENDAR_DATA[bsY]?.[bsM - 1];
        if (bsM < 1 || bsM > 12) {
          setInputError("Month must be 1-12");
          return;
        }
        if (!maxDay || bsD < 1 || bsD > maxDay) {
          setInputError(`Day must be 1-${maxDay ?? "?"} for this month`);
          return;
        }
        const adDate = bsToAd({ year: bsY, month: bsM, day: bsD });
        const adStr = adDate.toISOString().split("T")[0];
        onChange(adStr, v);
        setViewDate(adDate);
      } catch {
        setInputError("Invalid date");
      }
    } else {
      try {
        const [adY, adM, adD] = v.split("-").map(Number);
        const dt = new Date(Date.UTC(adY, adM - 1, adD));
        // Reject dates that silently rolled over (e.g. Feb 30 -> Mar 2)
        if (dt.getUTCFullYear() !== adY || dt.getUTCMonth() !== adM - 1 || dt.getUTCDate() !== adD) {
          setInputError("Invalid AD date");
          return;
        }
        const bs = adToBs(dt);
        onChange(v, bs.formatted);
        setViewDate(dt);
      } catch {
        setInputError("Invalid date");
      }
    }
  };

  const handleTodayClick = () => {
    const t = new Date();
    const adStr = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(
      t.getDate()
    ).padStart(2, "0")}`;
    try {
      const bs = adToBs(adStr);
      emitChange(adStr, bs.formatted);
      setOpen(false);
    } catch {
      setInputError("Could not convert today's date");
    }
  };

  const handleCalendarKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    const curDay = focusedDay || 1;

    switch (e.key) {
      case "ArrowRight": {
        e.preventDefault();
        if (curDay < daysInMonth) setFocusedDay(curDay + 1);
        else {
          goToNextMonth();
          setFocusedDay(1);
        }
        break;
      }
      case "ArrowLeft": {
        e.preventDefault();
        if (curDay > 1) setFocusedDay(curDay - 1);
        else {
          const prevMonth = month === 0 ? 11 : month - 1;
          const prevYear = month === 0 ? year - 1 : year;
          const dim = new Date(Date.UTC(prevYear, prevMonth + 1, 0)).getUTCDate();
          goToPrevMonth();
          setFocusedDay(dim);
        }
        break;
      }
      case "ArrowDown": {
        e.preventDefault();
        const next7 = curDay + 7;
        if (next7 <= daysInMonth) setFocusedDay(next7);
        else {
          const overflow = next7 - daysInMonth;
          goToNextMonth();
          setFocusedDay(overflow);
        }
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const prev7 = curDay - 7;
        if (prev7 >= 1) setFocusedDay(prev7);
        else {
          const prevMonth = month === 0 ? 11 : month - 1;
          const prevYear = month === 0 ? year - 1 : year;
          const dim = new Date(Date.UTC(prevYear, prevMonth + 1, 0)).getUTCDate();
          goToPrevMonth();
          setFocusedDay(dim + prev7);
        }
        break;
      }
      case "PageDown": {
        e.preventDefault();
        const nd = clampDay(year, month + 1, curDay);
        goToNextMonth();
        setFocusedDay(nd);
        break;
      }
      case "PageUp": {
        e.preventDefault();
        const nd = clampDay(year, month - 1, curDay);
        goToPrevMonth();
        setFocusedDay(nd);
        break;
      }
      case "Home":
        e.preventDefault();
        setFocusedDay(1);
        break;
      case "End":
        e.preventDefault();
        setFocusedDay(daysInMonth);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        handleDayClick(curDay);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        break;
    }
  };

  const handleInputBlur = () => {
    if (mouseDownInside.current) {
      mouseDownInside.current = false;
      return;
    }
    setTimeout(() => {
      if (
        wrapRef.current &&
        !wrapRef.current.contains(document.activeElement) &&
        calendarRef.current &&
        !calendarRef.current.contains(document.activeElement)
      ) {
        setOpen(false);
      }
    }, 150);
  };

  const handleCalendarButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!open) calculatePosition();
    setOpen((prev) => !prev);
  };

  const adMonthFull = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const placeholder = primaryCalendar === "BS" ? "BS: YYYY-MM-DD" : "AD: YYYY-MM-DD";
  const captionValue = primaryCalendar === "BS" ? adValue : bsValue;
  const captionLabel = primaryCalendar === "BS" ? "AD" : "BS";

  const calendarContent = (
    <div
      ref={calendarRef}
      role="dialog"
      aria-modal="true"
      aria-label={label ? `${label} calendar` : "Date picker calendar"}
      style={calendarStyle}
      className="bg-white border border-slate-200 rounded-xl shadow-2xl w-80 p-3 animate-slide-up"
      onKeyDown={handleCalendarKeyDown}
    >
      <p className="text-xs text-slate-400 mb-2 text-center">
        ← → days · ↑ ↓ weeks · PgUp/Dn months · Enter select
      </p>

      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          aria-label="Previous month"
          onClick={goToPrevMonth}
          className="p-1.5 rounded hover:bg-slate-100"
        >
          <div className="icon-chevron-left w-4 h-4" />
        </button>
        <div className="text-center" aria-live="polite" aria-atomic="true">
          <div className="font-bold text-sm flex items-center justify-center gap-1">
            {bsMonthsInView.map((bm, i) => (
              <span key={i} className={i === 0 ? "text-green-700" : "text-teal-500"}>
                {bm.name} {bm.year}
                {i < bsMonthsInView.length - 1 ? " /" : ""}
              </span>
            ))}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {adMonthFull[month]} {year}
          </div>
        </div>
        <button
          type="button"
          aria-label="Next month"
          onClick={goToNextMonth}
          className="p-1.5 rounded hover:bg-slate-100"
        >
          <div className="icon-chevron-right w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {dayNames.map((dn) => (
          <div key={dn} className="text-center text-xs text-slate-400 font-medium py-1">
            {dn}
          </div>
        ))}
      </div>

      <div role="grid" aria-label="Calendar days">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7" role="row">
            {week.map((day, di) => {
              const valid = day >= 1 && day <= daysInMonth;
              const bsInfo = valid ? getBsForDay(day) : null;
              const bsDay = bsInfo ? bsInfo.day : "";
              const bsMonIdx = bsInfo
                ? bsMonthsInView.findIndex((m) => m.month === bsInfo.month && m.year === bsInfo.year)
                : 0;
              const selected = isSelected(day);
              const today = isToday(day);
              const isFocused = valid && day === focusedDay;
              const bsColour = selected ? "text-white" : bsMonIdx === 0 ? "text-green-700" : "text-teal-500";

              return (
                <button
                  key={di}
                  type="button"
                  role="gridcell"
                  data-focused={isFocused ? "true" : undefined}
                  tabIndex={isFocused ? 0 : -1}
                  onClick={() => handleDayClick(day)}
                  disabled={!valid}
                  aria-selected={selected}
                  className={
                    "flex flex-col items-center justify-center rounded-lg py-1.5 transition-colors " +
                    (!valid
                      ? "opacity-0 cursor-default pointer-events-none "
                      : selected
                      ? "bg-blue-600 text-white "
                      : isFocused
                      ? "bg-blue-100 ring-2 ring-blue-500 ring-inset "
                      : today
                      ? "bg-blue-50 ring-1 ring-blue-400 "
                      : "hover:bg-slate-100 text-slate-700 ")
                  }
                >
                  {valid && (
                    <>
                      <span className={"text-sm font-bold leading-none " + bsColour}>{bsDay}</span>
                      <span
                        className={
                          "text-[10px] leading-none mt-0.5 " + (selected ? "text-blue-200" : "text-slate-400")
                        }
                      >
                        {day}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="border-t border-slate-100 mt-2 pt-2 flex justify-between items-center">
        <div className="flex items-center gap-2 text-xs" aria-hidden="true">
          <span className="text-green-700 font-medium">● {bsMonthsInView[0]?.name}</span>
          {bsMonthsInView[1] && <span className="text-teal-500 font-medium">● {bsMonthsInView[1].name}</span>}
        </div>
        <button
          type="button"
          onClick={handleTodayClick}
          className="text-xs text-blue-600 hover:underline font-medium rounded px-1"
        >
          Today
        </button>
      </div>
    </div>
  );

  return (
    <div
      className={"relative " + (className || "")}
      ref={wrapRef}
      onMouseDown={() => {
        mouseDownInside.current = true;
      }}
    >
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
          {required && (
            <span className="text-red-500 ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className="flex items-stretch gap-1">
        <div className="flex-1 relative">
          <input
            id={inputId}
            name={inputName}
            type="text"
            value={inputVal}
            onChange={handleTextInput}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            autoComplete="off"
            aria-label={
              label
                ? `${label} — ${primaryCalendar === "BS" ? "Bikram Sambat" : "English"} date (YYYY-MM-DD)`
                : `Date in ${primaryCalendar === "BS" ? "Bikram Sambat" : "English"} format`
            }
            aria-required={required ? "true" : "false"}
            aria-invalid={inputError ? "true" : "false"}
            className={"input-field w-full font-mono text-sm " + (inputError ? "border-red-400" : "")}
          />
          {captionValue && (
            <div className="text-xs text-slate-400 mt-0.5 ml-1">
              {captionLabel}: {captionValue}
            </div>
          )}
          {inputError && (
            <div role="alert" className="text-xs text-red-500 mt-0.5 ml-1">
              {inputError}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleCalendarButtonClick}
          aria-label={open ? "Close calendar" : "Open calendar"}
          aria-expanded={open}
          className={
            "px-2.5 border rounded-md flex items-center justify-center flex-shrink-0 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 " +
            (open ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-500")
          }
          style={{ alignSelf: "flex-start", height: "38px" }}
        >
          <div className="icon-calendar-days w-4 h-4" />
        </button>
      </div>

      {open && typeof document !== "undefined" && createPortal(calendarContent, document.body)}
    </div>
  );
}
