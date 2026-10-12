"use client";

import { cx } from "./ui";

export function Pager({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}) {
  if (pages <= 1) return null;
  const items = Array.from({ length: pages }, (_, index) => index + 1).filter(
    (item) => item === 1 || item === pages || Math.abs(item - page) <= 1,
  );
  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
      <button className="rounded-lg border border-line px-3 py-1.5 text-sm disabled:opacity-40" onClick={() => onPage(page - 1)} disabled={page === 1}>
        Prev
      </button>
      {items.map((item, index) => {
        const prev = items[index - 1];
        return (
          <span key={item} className="flex items-center gap-2">
            {prev && item - prev > 1 ? <span className="text-muted">…</span> : null}
            <button
              className={cx(
                "grid h-9 w-9 place-items-center rounded-lg text-sm font-semibold",
                item === page ? "bg-brand text-white" : "border border-line",
              )}
              onClick={() => onPage(item)}
              aria-current={item === page ? "page" : undefined}
            >
              {item}
            </button>
          </span>
        );
      })}
      <button className="rounded-lg border border-line px-3 py-1.5 text-sm disabled:opacity-40" onClick={() => onPage(page + 1)} disabled={page === pages}>
        Next
      </button>
    </nav>
  );
}
