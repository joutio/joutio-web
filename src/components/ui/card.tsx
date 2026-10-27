import * as React from "react"
import { cn } from "cn"

/**
 * Survol d'une carte cliquable : fond **plein** `--surface-muted` (même recette que le trigger de
 * la carte de titre Arc), bordure `--border` inchangée et même retour à l'appui en tactile.
 * Ne jamais employer `hover:bg-muted/N` : le fond deviendrait translucide et laisserait passer
 * le motif de page. Le focus clavier reste porté par l'élément interactif parent (lien/bouton).
 */
export const CARD_INTERACTIVE_CLASS =
  "cursor-pointer transition-colors hover:bg-surface-muted active:bg-surface-muted"

/**
 * Recette unique des cartes (cf. AGENTS § 5) : surface pleine, bordure 1 px, rayon
 * `--radius-surface` (carte de titre Arc) et **aucune ombre au repos** — le design est à plat,
 * la bordure porte le détourage.
 */
function Card({
  className,
  size = "default",
  interactive = false,
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "sm"
  /** Visuel de survol d'une carte cliquable (le focus reste sur le lien/bouton parent). */
  interactive?: boolean
}) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col overflow-hidden rounded-card border border-border bg-card text-sm text-card-foreground shadow-none [--card-spacing:--spacing(5)] has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] *:[img:first-child]:rounded-t-card *:[img:last-child]:rounded-b-card",
        interactive && CARD_INTERACTIVE_CLASS,
        className
      )}
      {...props}
    />
  )
}

/**
 * En-tête de carte : une **rangée** de 64 px — visuel de tête (`CardMedia`), copie
 * (`CardHeading` : titre + description) et action à droite (`CardAction`).
 */
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex min-h-16 items-center gap-5 px-(--card-spacing) py-4",
        className
      )}
      {...props}
    />
  )
}

/** Visuel de tête de l'en-tête (avatar, pastille de sujet, médaillon) — 36 px. */
function CardMedia({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-media"
      className={cn("grid size-9 shrink-0 place-items-center", className)}
      {...props}
    />
  )
}

/** Copie de l'en-tête : prend la place laissée entre le visuel et l'action. */
function CardHeading({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-heading"
      className={cn("min-w-0 flex-1", className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("text-sm leading-tight font-medium", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("mt-1 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

/** Action de l'en-tête, poussée à droite (chevron, bouton, compte à rebours). */
function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("ml-auto flex shrink-0 items-center gap-2", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing) pt-4 pb-(--card-spacing)", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center px-(--card-spacing) pb-(--card-spacing) [.border-t]:pt-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardMedia,
  CardHeading,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
