export default function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Split"
    >
      <rect width="64" height="64" rx="14" fill="#09090b" />
      <path
        d="M18,16 L46,16 L33,27 M31,37 L18,48 L46,48"
        fill="none"
        stroke="#fafafa"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
