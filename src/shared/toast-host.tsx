import { Toast } from '@/ui'
import { useToastStore } from './toast'

/** Toast global, placé comme dans le lab : en haut de l'écran, en haut à droite au-delà de 640 px. */
export function ToastHost() {
  const current = useToastStore((state) => state.current)
  const hide = useToastStore((state) => state.hide)
  if (!current) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute inset-x-4 top-[calc(var(--jo-safe-top,0px)+8px)] z-50 @min-[640px]/app:inset-x-auto @min-[640px]/app:top-20 @min-[640px]/app:right-6 @min-[640px]/app:w-[360px]"
    >
      <Toast tone={current.tone} title={current.title} description={current.description} onClick={() => hide(current.id)} />
    </div>
  )
}
