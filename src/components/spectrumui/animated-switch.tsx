import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "framer-motion"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AnimatedSwitchProps {
  /** Controlled checked state. Leave undefined for uncontrolled usage */
  checked?: boolean
  /** Initial checked state when uncontrolled. Default false */
  defaultChecked?: boolean
  /** Fires with the next checked state whenever a toggle commits */
  onCheckedChange?: (checked: boolean) => void
  /** Icon shown inside the knob while on; crossfades with offIcon on toggle */
  onIcon?: React.ReactNode
  /** Icon shown inside the knob while off; crossfades with onIcon on toggle */
  offIcon?: React.ReactNode
  /** Visual size of the switch. Default "md" */
  size?: "sm" | "md" | "lg"
  /** Disables pointer and keyboard interaction */
  disabled?: boolean
  /** Accessible name of the switch. Default "Activer" */
  label?: string
  /** Additional classes merged with the default track styles */
  className?: string
}

interface PointerSample {
  /** Pointer clientX, px */
  x: number
  /** Event timestamp, ms */
  t: number
}

interface GestureState {
  /** Pointer captured for this gesture */
  pointerId: number
  /** clientX where the press started, px */
  originClientX: number
  /** Knob x in inner-track coordinates when the press started, px */
  originKnobX: number
  /** Whether the press has travelled far enough to count as a drag */
  dragging: boolean
  /** Recent samples used for the release-velocity estimate */
  samples: PointerSample[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Gap between the knob and the track edge on every side, px */
const TRACK_PADDING = 2
/** Horizontal knob growth while pressed — the signature iOS stretch */
const STRETCH_FACTOR = 1.35
/** Pointer travel before a press becomes a drag instead of a click, px */
const DRAG_START_DISTANCE = 3
/** Release velocity that commits a toggle in the flick direction, px/s */
const FLICK_VELOCITY = 250
/** Recent pointer samples kept for the release-velocity estimate */
const VELOCITY_SAMPLE_COUNT = 5
/** Knob icon rotation while crossfading, deg */
const ICON_ROTATION = 45

/** Snappy spring for knob travel and the press stretch */
const SNAPPY_SPRING = { type: "spring", stiffness: 500, damping: 30 } as const
/** Softer spring for the icon crossfade */
const SOFT_SPRING = { type: "spring", stiffness: 260, damping: 22 } as const

const SIZES = {
  sm: { trackWidth: 32, trackHeight: 18, icon: 8 },
  md: { trackWidth: 44, trackHeight: 24, icon: 10 },
  lg: { trackWidth: 56, trackHeight: 30, icon: 12 },
} as const

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AnimatedSwitch({
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  onIcon,
  offIcon,
  size = "md",
  disabled = false,
  label = "Activer",
  className,
}: AnimatedSwitchProps) {
  const shouldReduceMotion = useReducedMotion()
  const [internalChecked, setInternalChecked] = useState(defaultChecked)

  const gesture = useRef<GestureState | null>(null)
  // A drag commits on pointerup, so the click the browser fires right after
  // must not toggle a second time
  const suppressClick = useRef(false)
  // Tant qu'un drag est en cours, la réconciliation `checked` → position est suspendue :
  // le knob suit le doigt, puis spring uniquement au release.
  const draggingRef = useRef(false)

  const checked = checkedProp ?? internalChecked
  const { trackWidth, trackHeight, icon: iconSize } = SIZES[size]

  const knobSize = trackHeight - TRACK_PADDING * 2
  const stretchedWidth = Math.round(knobSize * STRETCH_FACTOR)
  const innerWidth = trackWidth - TRACK_PADDING * 2

  // Motion values : le drag écrit directement dedans (aucun re-render React par
  // pointermove) et le spring ne tourne qu'au press/release.
  const x = useMotionValue(checked ? innerWidth - knobSize : 0)
  const knobWidth = useMotionValue(knobSize)

  const settleTo = useCallback(
    (isChecked: boolean) => {
      const targetX = isChecked ? innerWidth - knobSize : 0
      if (shouldReduceMotion) {
        x.set(targetX)
        knobWidth.set(knobSize)
        return
      }
      animate(x, targetX, SNAPPY_SPRING)
      animate(knobWidth, knobSize, SNAPPY_SPRING)
    },
    [innerWidth, knobSize, shouldReduceMotion, x, knobWidth]
  )

  // Réconciliation avec l'état logique (prop contrôlée ou état interne) : sauf pendant un
  // drag, le knob rejoint sa position de repos.
  useEffect(() => {
    if (draggingRef.current) return
    settleTo(checked)
  }, [checked, settleTo])

  const setChecked = useCallback(
    (next: boolean) => {
      if (checkedProp === undefined) setInternalChecked(next)
      onCheckedChange?.(next)
    },
    [checkedProp, onCheckedChange]
  )

  const handleClick = useCallback(() => {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    setChecked(!checked)
  }, [checked, setChecked])

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (disabled || !event.isPrimary) return
      suppressClick.current = false
      event.currentTarget.setPointerCapture(event.pointerId)
      const width = shouldReduceMotion ? knobSize : stretchedWidth
      gesture.current = {
        pointerId: event.pointerId,
        originClientX: event.clientX,
        originKnobX: checked ? innerWidth - width : 0,
        dragging: false,
        samples: [{ x: event.clientX, t: event.timeStamp }],
      }
      draggingRef.current = false
      if (!shouldReduceMotion) {
        // Étirement + recalage de x avec le même spring : le bord ancré ne bouge pas.
        animate(knobWidth, stretchedWidth, SNAPPY_SPRING)
        animate(x, checked ? innerWidth - stretchedWidth : 0, SNAPPY_SPRING)
      }
    },
    [
      checked,
      disabled,
      innerWidth,
      knobSize,
      shouldReduceMotion,
      stretchedWidth,
      x,
      knobWidth,
    ]
  )

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const state = gesture.current
      if (!state || event.pointerId !== state.pointerId) return
      state.samples.push({ x: event.clientX, t: event.timeStamp })
      if (state.samples.length > VELOCITY_SAMPLE_COUNT) state.samples.shift()
      const deltaX = event.clientX - state.originClientX
      if (!state.dragging && Math.abs(deltaX) < DRAG_START_DISTANCE) return
      state.dragging = true
      draggingRef.current = true
      const width = shouldReduceMotion ? knobSize : stretchedWidth
      // Suivi 1:1 du doigt : pas de spring ici.
      x.set(clamp(state.originKnobX + deltaX, 0, innerWidth - width))
    },
    [innerWidth, knobSize, shouldReduceMotion, stretchedWidth, x]
  )

  const endGesture = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      gesture.current = null
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
    },
    []
  )

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const state = gesture.current
      if (!state || event.pointerId !== state.pointerId) return
      if (state.dragging) {
        suppressClick.current = true
        const width = shouldReduceMotion ? knobSize : stretchedWidth
        const knobEnd = clamp(
          state.originKnobX + (event.clientX - state.originClientX),
          0,
          innerWidth - width
        )
        const oldest = state.samples[0]
        const elapsed = event.timeStamp - oldest.t
        const velocity =
          elapsed > 0 ? ((event.clientX - oldest.x) / elapsed) * 1000 : 0
        // A fast flick wins; otherwise commit to whichever side the knob
        // center is closest to
        const next =
          Math.abs(velocity) >= FLICK_VELOCITY
            ? velocity > 0
            : knobEnd + width / 2 > innerWidth / 2
        draggingRef.current = false
        if (next !== checked) {
          // L'effet de réconciliation springera vers la nouvelle position dès que l'état
          // logique bascule (état interne, ou prop contrôlée optimiste du parent).
          setChecked(next)
        } else {
          settleTo(checked)
        }
      } else {
        // Simple clic (pas de drag) : on relâche l'étirement, l'effet recalera x si l'état
        // logique change.
        draggingRef.current = false
        animate(
          knobWidth,
          knobSize,
          shouldReduceMotion ? { duration: 0 } : SNAPPY_SPRING
        )
      }
      endGesture(event)
    },
    [
      checked,
      endGesture,
      innerWidth,
      knobSize,
      setChecked,
      settleTo,
      shouldReduceMotion,
      stretchedWidth,
      knobWidth,
    ]
  )

  const handlePointerCancel = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      draggingRef.current = false
      settleTo(checked)
      endGesture(event)
    },
    [checked, endGesture, settleTo]
  )

  const hasIcons = onIcon != null || offIcon != null
  const activeIcon = checked ? onIcon : offIcon

  return (
    <button
      type="button"
      role="switch"
      data-slot="animated-switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer touch-manipulation items-center rounded-full select-none",
        "transition-colors duration-200 ease-out",
        "focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-hidden",
        "disabled:pointer-events-none disabled:opacity-50",
        checked ? "bg-primary" : "bg-input/90",
        className
      )}
      style={{ width: trackWidth, height: trackHeight }}
    >
      {/* Invisible hit-area extender: 24px minimum, 44px sur layout tactile. */}
      <span
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 h-[max(100%,24px)] w-[max(100%,24px)] -translate-x-1/2 -translate-y-1/2 touch:h-[max(100%,44px)] touch:w-[max(100%,44px)]"
      />

      <motion.span
        aria-hidden="true"
        className="absolute rounded-full bg-background shadow-sm ring-0 will-change-transform dark:bg-foreground"
        style={{
          top: TRACK_PADDING,
          left: TRACK_PADDING,
          height: knobSize,
          x,
          width: knobWidth,
        }}
      >
        {hasIcons && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-muted-foreground">
            <AnimatePresence initial={false}>
              {activeIcon != null && (
                <motion.span
                  key={checked ? "on" : "off"}
                  className="absolute flex items-center justify-center [&_svg]:h-full [&_svg]:w-full"
                  style={{
                    width: iconSize,
                    height: iconSize,
                    fontSize: iconSize,
                    lineHeight: 1,
                  }}
                  initial={
                    shouldReduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, rotate: -ICON_ROTATION, scale: 0.5 }
                  }
                  animate={
                    shouldReduceMotion
                      ? { opacity: 1 }
                      : { opacity: 1, rotate: 0, scale: 1 }
                  }
                  exit={
                    shouldReduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, rotate: ICON_ROTATION, scale: 0.5 }
                  }
                  transition={
                    shouldReduceMotion ? { duration: 0 } : SOFT_SPRING
                  }
                >
                  {activeIcon}
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        )}
      </motion.span>
    </button>
  )
}
