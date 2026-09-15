import type { IconKey } from "@/lib/flare";

export function Icon({
  name,
  className,
  style,
}: {
  name: IconKey | string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const common = { className, style, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6 };
  switch (name) {
    case "crown":
      return (
        <svg {...common}>
          <path d="M3 8l3 8h12l3-8-5 3-3-5-3 5-5-3z" strokeLinejoin="round" />
        </svg>
      );
    case "flame":
      return (
        <svg {...common}>
          <path d="M12 2c1 3-3 4-3 8a3 3 0 106 0c0-1-1-2-1-3 2 1 4 4 4 7a6 6 0 11-12 0c0-5 4-7 6-12z" />
        </svg>
      );
    case "trophy":
      return (
        <svg {...common}>
          <path d="M7 4h10v3a5 5 0 01-10 0V4z" />
          <path d="M7 5H4v2a3 3 0 003 3M17 5h3v2a3 3 0 01-3 3" />
          <path d="M9 15v2h6v-2M9 21h6M12 17v4" />
        </svg>
      );
    case "lightning":
      return (
        <svg {...common}>
          <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" strokeLinejoin="round" />
        </svg>
      );
    case "skull":
      return (
        <svg {...common}>
          <path d="M12 3a7 7 0 00-7 7v3l-1 2h4l1 3h6l1-3h4l-1-2v-3a7 7 0 00-7-7z" />
          <circle cx="9.5" cy="11" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="14.5" cy="11" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3z" />
        </svg>
      );
    case "lock":
      return (
        <svg {...common}>
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 118 0v3" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.2-3.2" strokeLinecap="round" />
        </svg>
      );
    case "file":
    default:
      return (
        <svg {...common}>
          <path d="M6 3h8l4 4v14H6z" />
          <path d="M14 3v4h4" />
        </svg>
      );
  }
}
