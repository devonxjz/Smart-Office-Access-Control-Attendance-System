/* ── SmartOffice Logo (shared SVG) ────────────────────────────────────────── */
/* Extracted from LoginPage so both Login and Dashboard use the same mark.    */

export function SmartOfficeLogo({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="SmartOffice logo">
      <defs>
        <linearGradient id="lg1" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#cc785c"/>
          <stop offset="100%" stopColor="#a9583e"/>
        </linearGradient>
        <linearGradient id="lg2" x1="30" y1="28" x2="46" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5db872"/>
          <stop offset="100%" stopColor="#3d9e54"/>
        </linearGradient>
      </defs>
      <circle cx="22" cy="22" r="20" stroke="url(#lg1)" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.5"/>
      <path d="M8 22 Q10 16 14 12" stroke="#cc785c" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
      <path d="M5 22 Q8 13 14 8" stroke="#cc785c" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
      <path d="M36 22 Q34 16 30 12" stroke="#cc785c" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
      <path d="M39 22 Q36 13 30 8" stroke="#cc785c" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
      <rect x="14" y="14" width="16" height="16" rx="3" fill="url(#lg1)"/>
      <rect x="17" y="17" width="10" height="10" rx="1.5" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
      <line x1="22" y1="17.5" x2="22" y2="26.5" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8"/>
      <line x1="17.5" y1="22" x2="26.5" y2="22" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8"/>
      <rect x="19" y="12" width="1.5" height="2.5" rx="0.5" fill="#cc785c"/>
      <rect x="23.5" y="12" width="1.5" height="2.5" rx="0.5" fill="#cc785c"/>
      <rect x="19" y="33.5" width="1.5" height="2.5" rx="0.5" fill="#cc785c"/>
      <rect x="23.5" y="33.5" width="1.5" height="2.5" rx="0.5" fill="#cc785c"/>
      <rect x="12" y="19" width="2.5" height="1.5" rx="0.5" fill="#cc785c"/>
      <rect x="12" y="23.5" width="2.5" height="1.5" rx="0.5" fill="#cc785c"/>
      <rect x="33.5" y="19" width="2.5" height="1.5" rx="0.5" fill="#cc785c"/>
      <rect x="33.5" y="23.5" width="2.5" height="1.5" rx="0.5" fill="#cc785c"/>
      <path d="M38 31 L38 37 Q38 41 34 43 Q30 41 30 37 L30 31 L34 29.5 Z" fill="url(#lg2)"/>
      <path d="M32 36.5 L33.8 38.2 L36.5 34" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
