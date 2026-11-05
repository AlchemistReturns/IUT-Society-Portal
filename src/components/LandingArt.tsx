// Inline SVG illustrations and icons for the landing page.

const PATHS: Record<string, string> = {
  user: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  doc: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5",
  check: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  wallet: "M20 12V8a2 2 0 0 0-2-2H5a2 2 0 0 1 0-4h13M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4M18 12a2 2 0 0 0 0 4h4v-4z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4",
  printer: "M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z",
  building: "M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 10h.01M15 10h.01",
  pen: "M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z",
  login: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3",
};

export function Icon({ name, className = "h-6 w-6" }: { name: keyof typeof PATHS | string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

/** Hero: an application paper with approval stamps, plus a calendar tile. */
export function HeroArt() {
  return (
    <svg viewBox="0 0 420 300" className="mx-auto w-full max-w-md" role="img" aria-label="An event application being approved and added to the calendar">
      {/* calendar tile */}
      <g transform="translate(250 30)">
        <rect width="150" height="140" rx="14" fill="#fff" stroke="#cfe3d6" />
        <path d="M0 14a14 14 0 0 1 14-14h122a14 14 0 0 1 14 14v26H0z" fill="#0f5a45" />
        <circle cx="38" cy="0" r="5" fill="#083d31" />
        <circle cx="112" cy="0" r="5" fill="#083d31" />
        {Array.from({ length: 15 }, (_, i) => (
          <rect
            key={i}
            x={14 + (i % 5) * 25}
            y={52 + Math.floor(i / 5) * 25}
            width="19"
            height="19"
            rx="5"
            fill={i === 7 ? "#0f5a45" : i === 11 ? "#f6e0bd" : "#e3eee0"}
          />
        ))}
      </g>
      {/* application paper */}
      <g transform="translate(20 20)">
        <rect width="210" height="260" rx="14" fill="#fff" stroke="#cfe3d6" />
        <rect x="20" y="22" width="110" height="10" rx="5" fill="#0f5a45" />
        <rect x="20" y="44" width="170" height="6" rx="3" fill="#dfe9e3" />
        <rect x="20" y="58" width="150" height="6" rx="3" fill="#dfe9e3" />
        <rect x="20" y="72" width="160" height="6" rx="3" fill="#dfe9e3" />
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(20 ${100 + i * 44})`}>
            <circle cx="12" cy="12" r="12" fill="#0f5a45" />
            <path d="m6.5 12.5 4 4 7-8" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="34" y="4" width="90" height="7" rx="3.5" fill="#bcd5c5" />
            <rect x="34" y="16" width="60" height="5" rx="2.5" fill="#dfe9e3" />
            <path d="M138 18c6-12 10 6 16-4s8 6 14-2" stroke="#0f5a45" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </g>
        ))}
        <circle cx="160" cy="224" r="22" fill="none" stroke="#0f5a45" strokeWidth="2" strokeDasharray="3 3" />
        <text x="160" y="228" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0f5a45">
          APPROVED
        </text>
      </g>
      {/* arrow from paper to calendar */}
      <path d="M232 150c14-4 22-14 24-30" stroke="#0f5a45" strokeWidth="2" fill="none" strokeDasharray="4 4" />
      <path d="m251 124 6-8 7 8" stroke="#0f5a45" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A document with a reviewer's signature and seal. */
export function SignatureArt() {
  return (
    <svg viewBox="0 0 320 200" className="w-full max-w-sm" role="img" aria-label="Reviewer signature and seal stamped on an application">
      <rect x="10" y="10" width="300" height="180" rx="12" fill="#fff" stroke="#cfe3d6" />
      <rect x="30" y="30" width="120" height="9" rx="4.5" fill="#0f5a45" />
      <rect x="30" y="52" width="250" height="6" rx="3" fill="#dfe9e3" />
      <rect x="30" y="66" width="210" height="6" rx="3" fill="#dfe9e3" />
      <rect x="30" y="80" width="230" height="6" rx="3" fill="#dfe9e3" />
      <line x1="30" y1="160" x2="150" y2="160" stroke="#9db8a8" />
      <path d="M36 148c10-26 16 10 26-6s12 12 24-4 14 10 28-2" stroke="#0f5a45" strokeWidth="2" fill="none" strokeLinecap="round" />
      <text x="30" y="174" fontSize="9" fill="#6b7f74">Signature · Head, OSW</text>
      <g transform="translate(232 128)">
        <circle r="30" fill="#e3eee0" stroke="#0f5a45" strokeWidth="2" />
        <circle r="23" fill="none" stroke="#0f5a45" strokeDasharray="2 3" />
        <path d="m-9 0 6 6 12-13" stroke="#0f5a45" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
