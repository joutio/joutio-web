import { MoonIcon, SunIcon } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { useTheme } from "../providers/theme-context"

/**
 * Bascule rapide clair/sombre de la topbar. Le bouton vise le thème opposé au thème **résolu**
 * (préférence système comprise) : un premier clic quitte `system` pour un choix explicite, puis
 * alterne. Le réglage complet (dont « Système ») reste disponible dans le menu profil et les
 * réglages d'apparence.
 */
export function ThemeToggle() {
  const { t } = useTranslation()
  const { resolvedTheme, setTheme } = useTheme()
  const nextTheme = resolvedTheme === "dark" ? "light" : "dark"
  const label =
    nextTheme === "dark"
      ? t("shell.topbar.theme.toDark")
      : t("shell.topbar.theme.toLight")

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={label}
      title={label}
      onClick={() => setTheme(nextTheme)}
      className="text-muted-foreground"
    >
      {nextTheme === "dark" ? (
        <MoonIcon className="size-4" />
      ) : (
        <SunIcon className="size-4" />
      )}
    </Button>
  )
}
