import { hue } from "@/lib/format";

export function WorkArt({
  title,
  trade,
  image,
  label,
}: {
  title: string;
  trade: string;
  image?: string;
  label: "Before" | "After";
}) {
  if (image) {
    return (
      <div className="relative h-40 overflow-hidden rounded-xl bg-navy">
        {/* User-uploaded job photo, stored only in this browser. */}
        <img
          src={image}
          alt={`${label} photo for ${title}`}
          className={`h-full w-full object-cover ${label === "Before" ? "grayscale contrast-75 brightness-75" : ""}`}
        />
        <Tag label={label} />
      </div>
    );
  }

  const tone = hue(`${trade}-${title}-${label}`);
  const sky = label === "After" ? `hsl(${tone} 55% 38%)` : `hsl(${tone} 12% 28%)`;
  return (
    <div className="relative h-40 overflow-hidden rounded-xl" style={{ background: sky }}>
      <svg viewBox="0 0 320 160" className="h-full w-full" aria-hidden>
        <rect x="18" y="28" width="120" height="90" rx="8" fill="rgba(255,255,255,0.14)" />
        <rect x="150" y="48" width="150" height="70" rx="8" fill="rgba(255,255,255,0.2)" />
        <circle cx="78" cy="73" r="22" fill="rgba(255,255,255,0.28)" />
        <path d="M40 128h240" stroke="rgba(255,255,255,0.45)" strokeWidth="4" />
        <path d="M168 48v70M150 78h150" stroke="rgba(255,255,255,0.35)" strokeWidth="3" />
      </svg>
      <Tag label={label} />
      <p className="absolute bottom-2 left-3 right-3 truncate text-sm font-medium text-white">{title}</p>
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="absolute left-2 top-2 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
      {label}
    </span>
  );
}
