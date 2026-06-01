"use client";

import { useState } from "react";

type ListingDescriptionExpandableProps = {
  description: string;
};

const PREVIEW_LENGTH = 320;

export default function ListingDescriptionExpandable({
  description,
}: ListingDescriptionExpandableProps) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = description.length > PREVIEW_LENGTH;

  return (
    <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-gray-900">Опис</h2>
      <p
        className={`whitespace-pre-wrap leading-relaxed text-gray-700 ${
          !expanded && canExpand ? "line-clamp-5" : ""
        }`}
      >
        {description}
      </p>
      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          {expanded ? "Згорнути" : "Показати повністю"}
          <svg
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </section>
  );
}
