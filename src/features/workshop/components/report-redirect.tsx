import { useReportDetail } from '@joutio/client/authoring'
import { useEffect } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import { useT } from '@/lib/i18n'
import { LoadingScreen } from '@/shared/loading-screen'
import { ROUTES } from '@/shared/routes'
import { toast } from '@/shared/toast'

/**
 * Signalement ouvert depuis une notification (`notifications.md` § 2) : le signalement donne sa question, puis les
 * signalements de cette question s'ouvrent à sa place dans l'historique. Signalement disparu : la file du sujet.
 */
export function ReportRedirect() {
  const t = useT()
  const location = useLocation()
  const { topicId = '', reportId = '' } = useParams()
  const detail = useReportDetail(reportId || undefined)
  useEffect(() => {
    if (detail.isError) toast.info(t('notifications.unavailable'))
  }, [detail.isError, t])
  if (detail.isError) return <Navigate to={ROUTES.topicModeration(topicId, 'reports')} replace />
  if (!detail.data) return <LoadingScreen />
  return <Navigate to={ROUTES.questionReports(topicId, detail.data.questionId, reportId)} replace state={location.state} />
}
