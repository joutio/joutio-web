import { cn } from "cn"

interface JoutioMarkProps {
  className?: string
}

/** Monogramme Joutio (`design/assets/logo-mark.svg`), identique dans les deux thèmes. */
export function JoutioMark({ className }: JoutioMarkProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden
      data-slot="joutio-mark"
      className={cn("shrink-0", className)}
    >
      <rect width="100" height="100" rx="28" fill="#181818" />
      <path
        d="M60 44V66A18 18 0 0 1 42 84H36"
        fill="none"
        stroke="#ffffff"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="60" cy="24" r="7" fill="#e8b04a" />
    </svg>
  )
}
