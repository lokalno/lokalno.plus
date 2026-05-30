"use client";

import { useEffect, useRef, useState } from "react";

type Settlement = {
  name: string;
  region: string;
  district: string;
  type: string;
  full: string;
};

type SettlementSearchProps = {
  value: string;
  onChange: (value: string) => void;
  onSelectSettlement?: (settlement: Settlement) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
};

export default function SettlementSearch({
  value,
  onChange,
  onSelectSettlement,
  label = "Населений пункт",
  required = false,
  placeholder = "Напр. Татарбунари, Київ або tatarbunary…",
}: SettlementSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Settlement[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/settlements?q=${encodeURIComponent(query)}&limit=25`);
        const data = await res.json();
        if (res.ok) setResults(data);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, open]);

  function select(item: Settlement) {
    onChange(item.full);
    onSelectSettlement?.(item);
    setQuery(item.full);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative">
      <label className="block text-sm font-medium mb-1">
        {label}
        {required ? " *" : ""}
      </label>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        required={required}
        placeholder={placeholder}
        autoComplete="off"
      />
      <p className="text-[11px] text-gray-400 mt-1">Усі міста та села України — знайдіть через пошук</p>

      {open && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading && results.length === 0 && (
            <p className="px-3 py-2 text-sm text-gray-400">Пошук…</p>
          )}
          {!loading && results.length === 0 && (
            <p className="px-3 py-2 text-sm text-gray-400">Нічого не знайдено</p>
          )}
          {results.map((item) => (
            <button
              key={item.full}
              type="button"
              onClick={() => select(item)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-brand-50 border-b border-gray-50 last:border-0"
            >
              <span className="font-medium text-gray-900">{item.name}</span>
              {item.district && (
                <span className="block text-xs text-gray-500 truncate">
                  {item.district}, {item.region}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
