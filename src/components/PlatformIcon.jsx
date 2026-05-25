// Platform icons for conversation/handoff channel badges
export default function PlatformIcon({ channel, size = 16, className = '' }) {
  const ch = (channel || 'line').toLowerCase();

  if (ch === 'messenger' || ch === 'facebook') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-label="Messenger">
        <circle cx="16" cy="16" r="16" fill="#1877F2" />
        <path d="M16 6C10.48 6 6 10.25 6 15.5c0 3.1 1.56 5.86 4 7.66V27l3.75-2.06c1 .28 2.06.42 3.25.42 5.52 0 10-4.25 10-9.5S21.52 6 16 6zm1.07 12.79-2.65-2.84-5.2 2.84 5.73-6.08 2.71 2.84 5.12-2.84-5.71 6.08z" fill="white" />
      </svg>
    );
  }

  if (ch === 'instagram') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-label="Instagram">
        <defs>
          <linearGradient id="ig-grad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#F58529" />
            <stop offset="40%" stopColor="#DD2A7B" />
            <stop offset="100%" stopColor="#515BD4" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill="url(#ig-grad)" />
        <rect x="8" y="8" width="16" height="16" rx="5" stroke="white" strokeWidth="2" />
        <circle cx="16" cy="16" r="4" stroke="white" strokeWidth="2" />
        <circle cx="21.5" cy="10.5" r="1.3" fill="white" />
      </svg>
    );
  }

  // LINE — green with white chat bubble (distinctive green = LINE in Thailand)
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-label="LINE">
      <rect width="32" height="32" rx="8" fill="#06C755" />
      <path d="M16 7c-5.52 0-10 3.8-10 8.5 0 4.23 3.73 7.75 8.76 8.34l-.89 3.52c-.08.33.18.33.4.18 1.77-1.2 5.76-3.9 6.3-4.27C24.25 21.9 26 19 26 15.5 26 10.8 21.52 7 16 7z" fill="white" />
      <text x="9.5" y="19" fontFamily="'Arial Black',Arial,sans-serif" fontWeight="900" fontSize="7.5" fill="#06C755" letterSpacing="0.5">LINE</text>
    </svg>
  );
}
