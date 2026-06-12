interface OmniLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export default function OmniLogo({ size = 36, className = "", animated = true }: OmniLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${animated ? "group cursor-pointer" : ""} ${className}`}
    >
      {/* Rounded square outer frame */}
      <rect
        x="2" y="2" width="40" height="40" rx="10"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        className={animated ? "transition-all duration-300 group-hover:opacity-80" : ""}
      />

      {/* Desk surface — perspective horizontal line */}
      <line
        x1="9" y1="28" x2="35" y2="28"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Desk left leg */}
      <line
        x1="12" y1="28" x2="11" y2="35"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Desk right leg */}
      <line
        x1="32" y1="28" x2="33" y2="35"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Monitor stand base */}
      <line
        x1="19" y1="28" x2="19" y2="24"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="17" y1="24" x2="27" y2="24"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Monitor screen */}
      <rect
        x="14" y="13" width="16" height="11" rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        className={animated ? "transition-all duration-300" : ""}
      />

      {/* Sprout stem from monitor center-top */}
      <line
        x1="22" y1="13" x2="22" y2="8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        className={animated ? "transition-all duration-300" : ""}
      />

      {/* Left petal branch */}
      <path
        d="M22 10 Q18 8 16 5"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
        className={animated ? "origin-bottom transition-transform duration-300 group-hover:scale-110" : ""}
      />

      {/* Right petal branch */}
      <path
        d="M22 10 Q26 8 28 5"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
        className={animated ? "origin-bottom transition-transform duration-300 group-hover:scale-110" : ""}
      />

      {/* Top center node */}
      <circle cx="22" cy="7" r="1.8" fill="currentColor"
        className={animated ? "transition-all duration-300 group-hover:opacity-70" : ""}
      />
      {/* Left node */}
      <circle cx="15.5" cy="4.5" r="1.4" fill="currentColor" opacity="0.65" />
      {/* Right node */}
      <circle cx="28.5" cy="4.5" r="1.4" fill="currentColor" opacity="0.65" />
    </svg>
  );
}
