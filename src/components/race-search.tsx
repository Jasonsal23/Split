"use client";

import { useEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { searchRaceCatalog } from "@/lib/race-catalog-actions";
import { raceTypeLabel } from "@/lib/race-catalog";
import { inputClass } from "@/lib/run-form";
import type { RaceCatalogEntry } from "@/lib/types";

/**
 * Race-name input with a live-search dropdown against the shared, crowdsourced
 * race catalog. Selecting a suggestion hands the full entry back to the
 * caller so it can prefill date/distance; typing a name with no match just
 * behaves like a plain text input (the race gets added to the catalog on
 * submit for future searches).
 */
export default function RaceSearch({
  value,
  onChange,
  onSelect,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (entry: RaceCatalogEntry) => void;
}) {
  const [results, setResults] = useState<RaceCatalogEntry[]>([]);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) return;
    debounceRef.current = setTimeout(() => {
      searchRaceCatalog(value).then(setResults);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const open = focused && value.trim().length >= 2 && results.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <label className="flex flex-col gap-1 text-sm text-zinc-400">
        Race name
        <input
          name="race_name"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          autoComplete="off"
          required
          className={inputClass}
        />
      </label>
      {open && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 shadow-lg">
          {results.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(entry);
                  setFocused(false);
                }}
                className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-zinc-800"
              >
                <span className="text-zinc-100">{entry.race_name}</span>
                <span className="text-xs text-zinc-500">
                  {format(parseISO(entry.race_date), "MMM d, yyyy")} ·{" "}
                  {raceTypeLabel(entry.race_distance_mi)}
                  {entry.city ? ` · ${entry.city}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
