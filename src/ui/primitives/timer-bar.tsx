import { useEffect, useRef } from "react";
import { cn } from "../lib/cn";

export type TimerState = "running" | "low" | "frozen" | "expired";

/** Rouge du décompte, commun à `TimerBar` et `DuelHeader` : 0 compris. */
export const isTimerUrgent = (
  seconds: number,
  state: TimerState = "running",
  lowAt = 3,
) =>
  state === "low" ||
  state === "expired" ||
  (state === "running" && seconds <= lowAt);

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
  /** Échéance (ms epoch serveur) et horloge stable (`readServerNow`) : la barre descend seule, d'une traite, jusqu'à 0. */
  deadline?: { at: number; now: () => number };
  className?: string;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

/**
 * Chrono de la manche, en barre pleine largeur. Avec `deadline` et l'état `running`, le remplissage descend en une seule
 * animation linéaire jusqu'à l'échéance serveur (Web Animations API, `scaleX`) : il touche 0 avec le chiffre, sans
 * dépendre de la fréquence des rendus. Figée ou sans échéance, la barre affiche `seconds`.
 */
export function TimerBar({
  seconds,
  total = 10,
  first,
  state = "running",
  lowAt = 3,
  deadline,
  className,
}: TimerBarProps) {
  const fraction = state === "expired" ? 0 : clamp01(seconds / total);
  const urgent = isTimerUrgent(seconds, state, lowAt);
  // Zone du premier répondant : grise de 0 à `first`, masquée à gauche par une couverture qui suit le remplissage.
  // Le bord droit reste fixe, le bord gauche est solidaire de la barre (pas de couture qui saute au tick).
  const firstPercent =
    first === undefined ? 0 : clamp01(first / total) * 100;
  const hasFirst = firstPercent > 0;
  const label = `Temps restant : ${Math.ceil(seconds)} s${first === undefined ? "" : `, premier à répondre à ${Math.ceil(first)} s`}`;

  const fill = useRef<HTMLDivElement>(null);
  const cover = useRef<HTMLDivElement>(null);
  const deadlineAt = deadline?.at;
  // Horloge stable (`readServerNow`) : l'animation n'est relancée qu'au changement d'état ou d'échéance.
  const now = deadline?.now;

  useEffect(() => {
    if (state !== "running" || deadlineAt == null || now == null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const remaining = Math.max(0, deadlineAt - now());
    const keyframes = [
      { transform: `scaleX(${clamp01(remaining / 1000 / total)})` },
      { transform: "scaleX(0)" },
    ];
    const animations = [fill.current, cover.current].flatMap((element) =>
      element
        ? [element.animate(keyframes, { duration: remaining, easing: "linear", fill: "forwards" })]
        : [],
    );
    return () => animations.forEach((animation) => animation.cancel());
  }, [state, deadlineAt, now, total, hasFirst]);

  const scale = { transform: `scaleX(${fraction})` };

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={seconds}
      aria-valuemin={0}
      aria-valuemax={total}
      className={cn("relative h-2 w-full overflow-hidden", className)}
    >
      {hasFirst && (
        <div
          className="absolute inset-y-0 left-0 bg-jo-text/45"
          style={{ width: `${firstPercent}%` }}
        />
      )}
      {hasFirst && (
        <div
          ref={cover}
          className="jo-timer-fill absolute inset-0 bg-jo-bg"
          style={scale}
        />
      )}
      <div
        ref={fill}
        className={cn(
          "jo-timer-fill absolute inset-0",
          urgent ? "bg-jo-wrong" : "bg-jo-text",
        )}
        style={scale}
      />
    </div>
  );
}
