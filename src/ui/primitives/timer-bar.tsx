import { cn } from "../lib/cn";

export type TimerState = "running" | "low" | "frozen" | "expired";

/** Rouge du décompte, commun à `TimerBar` et `DuelHeader`. */
export const isTimerUrgent = (
  seconds: number,
  state: TimerState = "running",
  lowAt = 3,
) =>
  state === "low" ||
  state === "expired" ||
  (state === "running" && seconds > 0 && seconds <= lowAt);

export type TimerBarProps = {
  /** Secondes restantes, calculées par l'appelant. */
  seconds: number;
  /** Durée totale d'une manche. */
  total?: number;
  /** Temps restant au moment où le premier joueur a répondu. */
  first?: number;
  state?: TimerState;
  /** Sous ce seuil, la barre passe en rouge. */
  lowAt?: number;
  className?: string;
};

export function TimerBar({
  seconds,
  total = 10,
  first,
  state = "running",
  lowAt = 3,
  className,
}: TimerBarProps) {
  const percent =
    state === "expired"
      ? 0
      : Math.max(0, Math.min(100, (seconds / total) * 100));
  const urgent = isTimerUrgent(seconds, state, lowAt);
  // Zone du premier répondant : grise de 0 à `first`, masquée à gauche par une couverture qui suit le remplissage.
  // Le bord droit reste fixe, le bord gauche est solidaire de la barre (pas de couture qui saute au tick).
  const firstPercent =
    first === undefined ? 0 : Math.max(0, Math.min(100, (first / total) * 100));
  const label = `Temps restant : ${Math.ceil(seconds)} s${first === undefined ? "" : `, premier à répondre à ${Math.ceil(first)} s`}`;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={seconds}
      aria-valuemin={0}
      aria-valuemax={total}
      className={cn("relative h-2 w-full overflow-hidden", className)}
    >
      {firstPercent > 0 && (
        <div
          className="absolute inset-y-0 left-0 bg-jo-text/45"
          style={{ width: `${firstPercent}%` }}
        />
      )}
      {firstPercent > 0 && (
        <div
          className="jo-timer-fill absolute inset-y-0 left-0 bg-jo-bg"
          style={{ width: `${percent}%` }}
        />
      )}
      <div
        className={cn(
          "jo-timer-fill absolute inset-y-0 left-0",
          urgent ? "bg-jo-wrong" : "bg-jo-text",
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
