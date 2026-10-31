import { memo, useEffect, useLayoutEffect, useRef, useState } from "react"
import { useReducedMotion } from "framer-motion"
import { cn } from "cn"
import { UserAvatar } from "@/shared/components/user-avatar"
import { TIER_COLORS } from "@/features/progression/domain/progression"
import { COUNTRIES, type CountryPoint } from "../domain/country-centroids"
import { LAND_PATH, MAP_HEIGHT, PLAYER_SPOTS } from "../domain/world-map-data"

/** Valeurs de `design/matchmaking-map.html` (design system 3.0). */
const SPEED = 18
const SPAWN_MS = 420
const PIN_LIFE_MIN = 1800
const PIN_LIFE_MAX = 3400
const FOUND_PAN_MS = 700
const FOUND_PIN_MS = 250
const FOUND_TAG_MS = 550
const HALO_SIZE = 420

const RINGS = [
  TIER_COLORS.FER.fill,
  TIER_COLORS.BRONZE.fill,
  TIER_COLORS.ARGENT.fill,
  TIER_COLORS.OR.fill,
  TIER_COLORS.PLATINE.fill,
  TIER_COLORS.EMERAUDE.fill,
  TIER_COLORS.DIAMANT.fill,
] as const

const SEEDS = [
  "Lucas",
  "Ines",
  "Hugo",
  "Nora",
  "Yanis",
  "Kenji",
  "Sofia",
  "Leo",
  "Amira",
  "Theo",
  "Jade",
  "Omar",
  "Lina",
  "Mateo",
  "Zoe",
  "Sami",
] as const

interface Pin {
  id: number
  x: number
  y: number
  ring: string
  seed: string
  avatar?: string | null
  /** Épingle en cours de sortie (fade + scale avant retrait du DOM). */
  leaving?: boolean
}

export interface FoundOpponent {
  name: string
  avatarOptions?: string | null
  ring?: string
  country?: string | null
}

interface MatchmakingMapProps {
  /** Adversaire trouvé : la carte s'arrête et se centre sur son pays. */
  found?: FoundOpponent | null
  className?: string
}

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)]
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

/** Le pays du profil est un code ou un nom libre, selon sa saisie. */
function findCountry(country?: string | null): CountryPoint | null {
  if (!country) return null
  const exact = COUNTRIES[country.trim().toUpperCase()]
  if (exact) return exact
  const wanted = normalize(country)
  return (
    Object.values(COUNTRIES).find(
      (entry) =>
        normalize(entry.name) === wanted || normalize(entry.en) === wanted
    ) ?? null
  )
}

const MapPin = memo(function MapPin({
  pin,
  target = false,
}: {
  pin: Pin
  target?: boolean
}) {
  return (
    <div
      className="absolute size-[34px]"
      style={{
        left: pin.x - 17,
        top: pin.y - 42,
        zIndex: target ? 3 : 2,
        transformOrigin: "50% 100%",
        animation: target
          ? undefined
          : pin.leaving
            ? "qu-pin-out 400ms ease both"
            : "qu-pin-in 520ms cubic-bezier(.34,1.56,.64,1) both",
      }}
    >
      <span
        aria-hidden
        className="absolute size-[34px]"
        style={{
          borderRadius: "50% 50% 50% 4px",
          transform: "rotate(-45deg)",
          background: pin.ring,
          boxShadow: "0 6px 14px rgba(0,0,0,.5)",
          animation: target
            ? "qu-pop 520ms cubic-bezier(.34,1.56,.64,1) both"
            : undefined,
        }}
      />
      <span className="absolute top-1 left-1 overflow-hidden rounded-full bg-white">
        <UserAvatar
          name={pin.seed}
          avatarOptions={pin.avatar ?? undefined}
          size={26}
          eloFrame={false}
        />
      </span>
    </div>
  )
})

const Fades = memo(function Fades() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[4]">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, var(--duel-bg), transparent 14%, transparent 86%, var(--duel-bg))",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, var(--duel-bg), transparent 18%, transparent 70%, var(--duel-bg))",
        }}
      />
    </div>
  )
})

/**
 * Fond de recherche d'appariement — portage React/SVG de `design/matchmaking-map.html`.
 *
 * La carte se déplace en continu (18 px/s) et des épingles de joueurs apparaissent puis
 * s'effacent. Quand `found` est fourni, elle s'arrête, se centre sur le pays de l'adversaire
 * (repli sur le dernier point visible) et affiche son épingle + `Nom · Pays`.
 *
 * Aucun CDN : le tracé et les centroïdes sont embarqués dans `domain/world-map-data.ts` et
 * `domain/country-centroids.ts` (données générées, chargées avec le chunk matchmaking).
 */
export function MatchmakingMap({ found, className }: MatchmakingMapProps) {
  const reduce = useReducedMotion() ?? false
  const rootRef = useRef<HTMLDivElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(0)
  const lastSpotRef = useRef<readonly [number, number] | null>(null)
  const nextIdRef = useRef(0)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [pins, setPins] = useState<Pin[]>([])
  const [target, setTarget] = useState<Pin | null>(null)
  const [tag, setTag] = useState<string | null>(null)

  const mapWidth = Math.round(size.height * 1.9)
  const scale = size.height / MAP_HEIGHT

  useLayoutEffect(() => {
    const element = rootRef.current
    if (!element) return
    const measure = () =>
      setSize({
        width: element.clientWidth,
        height: element.clientHeight,
      })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // Défilement continu. Le transform est posé directement sur le DOM : pas de re-render
  // par frame, comme la maquette.
  useEffect(() => {
    if (found || reduce || !mapWidth || !size.width) return
    const strip = stripRef.current
    if (!strip) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const delta = Math.min(64, now - last)
      last = now
      offsetRef.current =
        (offsetRef.current + (SPEED * delta) / 1000) % mapWidth
      strip.style.transform = `translateX(${-offsetRef.current}px)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [found, mapWidth, reduce, size.width])

  // Épingles décoratives : apparition/disparition, uniquement si la carte est visible.
  useEffect(() => {
    if (found || reduce || !mapWidth || !size.width) return
    const timers = new Set<number>()
    const spawn = () => {
      const current = offsetRef.current
      const visible = PLAYER_SPOTS.filter(([x]) => {
        const screen =
          (((x * scale - current) % mapWidth) + mapWidth) % mapWidth
        return screen > 30 && screen < size.width - 30
      })
      if (visible.length === 0) return
      const spot = pick(visible)
      lastSpotRef.current = spot
      const [x, y] = spot
      const turns = Math.floor((current - x * scale) / mapWidth) + 1
      const pin: Pin = {
        id: nextIdRef.current++,
        x: x * scale + turns * mapWidth + (Math.random() * 16 - 8),
        y: y * scale + (Math.random() * 10 - 5),
        ring: pick(RINGS),
        seed: pick(SEEDS),
      }
      setPins((list) => [...list, pin])
      const life = PIN_LIFE_MIN + Math.random() * (PIN_LIFE_MAX - PIN_LIFE_MIN)
      const leave = window.setTimeout(() => {
        timers.delete(leave)
        setPins((list) =>
          list.map((item) =>
            item.id === pin.id ? { ...item, leaving: true } : item
          )
        )
      }, life)
      timers.add(leave)
      const remove = window.setTimeout(() => {
        timers.delete(remove)
        setPins((list) => list.filter((item) => item.id !== pin.id))
      }, life + 450)
      timers.add(remove)
    }
    const initial = window.setTimeout(() => {
      for (let index = 0; index < 5; index += 1) {
        const timer = window.setTimeout(spawn, index * 180)
        timers.add(timer)
      }
      const interval = window.setInterval(spawn, SPAWN_MS)
      timers.add(interval)
    }, 350)
    timers.add(initial)
    return () => {
      timers.forEach((timer) => {
        window.clearTimeout(timer)
        window.clearInterval(timer)
      })
    }
  }, [found, mapWidth, reduce, scale, size.width])

  // Retour à la recherche : la cible et le tag disparaissent, le défilement reprend.
  useEffect(() => {
    if (found) return
    const strip = stripRef.current
    if (strip) strip.style.transition = "none"
    const resetTimer = window.setTimeout(() => {
      setTarget(null)
      setTag(null)
    }, 0)
    return () => window.clearTimeout(resetTimer)
  }, [found])

  // État « adversaire trouvé » : arrêt, pan vers le pays, épingle et tag.
  useEffect(() => {
    if (!found || !mapWidth || !size.width || !size.height) return
    const country = findCountry(found.country)
    const [x, y] = country?.at ?? lastSpotRef.current ?? ([950, 460] as const)
    const current = offsetRef.current
    const base = x * scale - size.width / 2
    const stop = base + Math.round((current - base) / mapWidth) * mapWidth
    const strip = stripRef.current
    offsetRef.current = stop

    if (strip) {
      strip.style.transition = reduce
        ? "none"
        : `transform ${FOUND_PAN_MS}ms cubic-bezier(.32,.72,0,1)`
      strip.style.transform = `translateX(${-stop}px)`
    }

    const resetTimer = window.setTimeout(() => {
      setPins([])
      setTarget(null)
      setTag(null)
    }, 0)
    const pinTimer = window.setTimeout(
      () => {
        setTarget({
          id: nextIdRef.current++,
          x: stop + size.width / 2,
          y: y * scale,
          ring: found.ring ?? RINGS[0],
          seed: found.name,
          avatar: found.avatarOptions,
        })
      },
      reduce ? 0 : FOUND_PIN_MS
    )
    const tagTimer = window.setTimeout(
      () => setTag(country ? `${found.name} · ${country.name}` : found.name),
      reduce ? 0 : FOUND_TAG_MS
    )
    return () => {
      window.clearTimeout(resetTimer)
      window.clearTimeout(pinTimer)
      window.clearTimeout(tagTimer)
    }
  }, [found, mapWidth, reduce, scale, size.height, size.width])

  const haloY = target?.y ?? size.height * 0.46

  if (!size.width || !size.height) {
    return (
      <div
        ref={rootRef}
        aria-hidden
        className={cn("absolute inset-0 bg-[var(--duel-bg)]", className)}
      />
    )
  }

  return (
    <div
      ref={rootRef}
      aria-hidden
      className={cn(
        "absolute inset-0 overflow-hidden bg-[var(--duel-bg)]",
        className
      )}
    >
      <div
        ref={stripRef}
        className="absolute inset-y-0 left-0 will-change-transform"
        style={{ width: mapWidth * 2 }}
      >
        {[0, 1].map((copy) => (
          <svg
            key={copy}
            width={mapWidth}
            height={size.height}
            viewBox={`0 0 1900 ${MAP_HEIGHT}`}
            preserveAspectRatio="none"
            className="absolute top-0"
            style={{ left: copy * mapWidth }}
          >
            <path
              d={LAND_PATH}
              fill="var(--duel-map-land)"
              stroke="var(--duel-map-line)"
              strokeWidth={0.7}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        ))}

        {pins.map((pin) => (
          <MapPin key={pin.id} pin={pin} />
        ))}
        {target ? <MapPin pin={target} target /> : null}
        {target && tag ? (
          <span
            className="absolute z-[5] -translate-x-1/2 rounded-md bg-white px-2 py-[3px] text-xs leading-4 font-semibold whitespace-nowrap text-black"
            style={{ left: target.x, top: target.y + 8 }}
          >
            {tag}
          </span>
        ) : null}
      </div>

      <span
        className="pointer-events-none absolute left-1/2 z-[1] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          top: haloY,
          width: HALO_SIZE,
          height: HALO_SIZE,
          background:
            "radial-gradient(circle, var(--duel-map-glow), transparent 65%)",
        }}
      />

      <Fades />
    </div>
  )
}
