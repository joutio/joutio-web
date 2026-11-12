import { BellIcon } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { useT } from '@/lib/i18n'
import { ROUTES } from '@/shared/routes'
import { IconButton } from '@/ui'
import { useUnreadCount } from '../hooks/use-unread-count'

/** Cloche des barres d'onglets : badge des non-lues, ouvre la boîte de réception. */
export function NotificationBell() {
  const t = useT()
  const navigate = useNavigate()
  const unread = useUnreadCount().data?.count ?? 0
  return <IconButton icon={BellIcon} label={t('home.notifications')} variant="plain" tone="neutral" badge={unread || undefined} onClick={() => void navigate(ROUTES.notifications)} />
}
