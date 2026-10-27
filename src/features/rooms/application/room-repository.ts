import { roomsService } from "../lib/rooms"
import type { RoomNotification } from "../domain/room-notification"
import { applyRoomNotification, emptyRoom, type Room } from "../domain/room"
import { NotificationStream } from "@/shared/realtime/notification-stream"

/** Stream d'une salle : historique REST + push STOMP sur `/topic/rooms/{roomId}`. */
export function createRoomStream(
  roomId: string
): NotificationStream<RoomNotification, Room> {
  return new NotificationStream<RoomNotification, Room>({
    service: "matchmaking",
    aggregateId: roomId,
    topic: `/topic/rooms/${roomId}`,
    initial: emptyRoom,
    load: (id) => roomsService.getNotifications(id),
    apply: applyRoomNotification,
  })
}
