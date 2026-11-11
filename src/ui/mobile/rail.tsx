import { Children, type ReactNode } from "react";
import { cn } from "../lib/cn";

export type RailProps = {
  /** Largeur de chaque élément en px, ou par index quand elles diffèrent. */
  itemWidth: number | ((index: number) => number);
  label?: string;
  className?: string;
  children: ReactNode;
};

/** Défilement horizontal au geste. */
export function Rail({ itemWidth, label, className, children }: RailProps) {
  return (
    <ul aria-label={label} className={cn("jo-no-scrollbar flex gap-3 overflow-x-auto px-4", className)}>
      {Children.map(children, (child, index) => (
        <li className="flex-none" style={{ width: typeof itemWidth === "function" ? itemWidth(index) : itemWidth }}>
          {child}
        </li>
      ))}
    </ul>
  );
}
