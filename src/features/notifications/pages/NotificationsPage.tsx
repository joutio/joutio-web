import { useState } from "react"
import { BellSlashIcon, ChecksIcon, TrashIcon } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { SwipeActions } from "@/components/arc/swipe-actions/swipe-actions"
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs"
import { playSuccessChime } from "@/shared/audio"
import { AppDialog } from "@/shared/components/app-dialog"
import { EmptyState } from "@/shared/components/empty-state"
import { PageHeaderBar } from "@/shared/components/page-header-bar"
import { PageContainer } from "@/features/shell"
import {
  useUrlParam,
  useUrlParamNumber,
  useUrlParams,
} from "@/shared/hooks/useUrlParam"
import { NotificationRow } from "../components/NotificationRow"
import {
  useDeleteAllNotifications,
  useMarkAllNotificationsRead,
  useNotifications,
  useUnreadNotificationsCount,
} from "../hooks/useNotifications"

const PAGE_SIZE = 20

/**
 * Page inbox : toutes les notifications personnelles (invitations, issues de défi, follows,
 * appariement prêt), avec filtre non-lues (défaut) et pagination. Le filtre (`?filter=`, absent
 * = non lues, `all` = toutes) et la page (`?page=`) sont persistés dans l'URL.
 */
export function NotificationsPage() {
  const { t } = useTranslation()
  const [filter] = useUrlParam<string>("filter", "unread")
  const [page, setPage] = useUrlParamNumber("page", 0)
  const updateParams = useUrlParams()
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)
  const unreadOnly = filter === "unread"
  const { data, isLoading, isError } = useNotifications({
    unreadOnly,
    page,
    size: PAGE_SIZE,
  })
  const unread = useUnreadNotificationsCount()
  const markAll = useMarkAllNotificationsRead()
  const deleteAll = useDeleteAllNotifications()

  const items = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const unreadCount = unread.data?.count ?? 0
  const hasNotifications = items.length > 0 || unreadCount > 0

  function changeFilter(next: string) {
    updateParams((params) => {
      if (next === "all") params.set("filter", "all")
      else params.delete("filter")
      params.delete("page")
    })
  }

  return (
    <div className="flex flex-col">
      <PageHeaderBar justify sticky>
        <Tabs
          value={unreadOnly ? "unread" : "all"}
          onValueChange={changeFilter}
          className="compact:w-full"
        >
          <TabsList>
            <TabsTrigger value="all">
              {t("notifications.page.filterAll")}
            </TabsTrigger>
            <TabsTrigger value="unread">
              {t("notifications.page.filterUnread")}
              {unreadCount > 0 ? ` (${unreadCount})` : ""}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={unreadCount === 0 || markAll.isPending}
            onClick={() => {
              playSuccessChime()
              markAll.mutate()
            }}
          >
            <ChecksIcon /> {t("notifications.page.markAll")}
          </Button>
          <Button
            variant="destructive"
            disabled={!hasNotifications || deleteAll.isPending}
            onClick={() => setConfirmDeleteAll(true)}
          >
            <TrashIcon /> {t("notifications.page.deleteAll")}
          </Button>
        </div>
      </PageHeaderBar>

      <PageContainer style={{ paddingTop: 16 }}>
        {isLoading && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("common.app.loading")}
          </p>
        )}

        {isError && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("notifications.page.loadError")}
          </p>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <EmptyState
            icon={<BellSlashIcon className="size-6 text-muted-foreground" />}
            title={t(
              unreadOnly
                ? "notifications.page.emptyUnreadTitle"
                : "notifications.page.emptyTitle"
            )}
            description={t("notifications.page.emptyDescription")}
          />
        )}

        {items.length > 0 && (
          <SwipeActions label={t("notifications.list.aria")}>
            {items.map((notification) => (
              <NotificationRow
                key={notification.notificationId}
                notification={notification}
              />
            ))}
          </SwipeActions>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={data?.first ?? true}
              onClick={() => setPage(Math.max(0, page - 1))}
            >
              {t("notifications.page.previous")}
            </Button>
            <span className="text-xs text-muted-foreground">
              {t("notifications.page.pageIndicator", {
                page: page + 1,
                totalPages,
              })}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={data?.last ?? true}
              onClick={() => setPage(page + 1)}
            >
              {t("notifications.page.next")}
            </Button>
          </div>
        )}
      </PageContainer>

      <AppDialog
        open={confirmDeleteAll}
        onClose={() => setConfirmDeleteAll(false)}
        title={t("notifications.page.deleteAllTitle")}
        className="tablet-up:max-w-md"
        footer={
          <>
            <div className="flex-1 compact:hidden" />
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteAll(false)}
            >
              {t("shared.actions.cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={deleteAll.isPending}
              onClick={() => {
                playSuccessChime()
                deleteAll.mutate(undefined, {
                  onSuccess: () => {
                    setConfirmDeleteAll(false)
                    setPage(0)
                  },
                })
              }}
            >
              {t("shared.actions.delete")}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("notifications.page.deleteAllDescription")}
        </p>
      </AppDialog>
    </div>
  )
}
