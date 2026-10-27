import { useState } from "react"
import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react"
import { Smile, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "cn"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  BottomSheet,
  BottomSheetClose,
} from "@/components/arc/bottom-sheet/bottom-sheet"
import { useIsTouchLayout } from "@/shared/hooks/use-device"
import { SHEET_DETENTS } from "@/shared/theme/sheets"

const PICKER_HEIGHT = 380

interface EmojiPickerFieldProps {
  value: string | null
  onChange: (emoji: string | null) => void
  /** Thème suivi par le picker (`theme` du shell : light / dark / system). */
  theme?: "light" | "dark" | "system"
}

/**
 * Sélecteur d'emoji (emoji-picker-react) : popover ancré sur desktop, bottom sheet Arc UI
 * (hauteur quasi pleine, clavier de recherche compris) sur mobile. Bouton d'ouverture,
 * retrait explicite, thème aligné sur l'application.
 */
export function EmojiPickerField({
  value,
  onChange,
  theme = "system",
}: EmojiPickerFieldProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const isTouch = useIsTouchLayout()
  const toggleLabel = value
    ? t("shared.emoji.change")
    : t("shared.emoji.choose")

  const picker = (
    <EmojiPicker
      width="100%"
      height={isTouch ? "100%" : PICKER_HEIGHT}
      className={isTouch ? "qu-emoji-picker" : undefined}
      theme={
        theme === "dark"
          ? Theme.DARK
          : theme === "light"
            ? Theme.LIGHT
            : Theme.AUTO
      }
      lazyLoadEmojis
      emojiStyle={EmojiStyle.NATIVE}
      autoFocusSearch={!isTouch}
      searchPlaceholder={t("shared.emoji.searchPlaceholder")}
      previewConfig={{ showPreview: false }}
      onEmojiClick={(emoji) => {
        onChange(emoji.emoji)
        setOpen(false)
      }}
    />
  )

  if (isTouch) {
    return (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          aria-label={toggleLabel}
          onClick={() => setOpen(true)}
        >
          {value ? (
            <span className="text-base leading-none">{value}</span>
          ) : (
            <Smile className="size-4" />
          )}
          <span>{toggleLabel}</span>
        </Button>

        <BottomSheet
          open={open}
          onOpenChange={setOpen}
          title={t("shared.emoji.choose")}
          detents={SHEET_DETENTS.picker}
          initialDetent={1}
          bodyStyle={{ padding: 0 }}
          footer={
            value ? (
              <BottomSheetClose asChild>
                <button
                  type="button"
                  className={cn(
                    buttonVariants({ variant: "destructive" }),
                    "w-full"
                  )}
                  onClick={() => onChange(null)}
                >
                  <Trash2 className="size-4" /> {t("shared.emoji.remove")}
                </button>
              </BottomSheetClose>
            ) : undefined
          }
        >
          <div className="h-full px-1">{picker}</div>
        </BottomSheet>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          aria-label={toggleLabel}
          className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
        >
          {value ? (
            <span className="text-base leading-none">{value}</span>
          ) : (
            <Smile className="size-4" />
          )}
          <span>{toggleLabel}</span>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[min(320px,calc(100vw-1rem))] overflow-hidden p-0"
        >
          {picker}
        </PopoverContent>
      </Popover>
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          {t("shared.emoji.removeShort")}
        </button>
      )}
    </div>
  )
}
