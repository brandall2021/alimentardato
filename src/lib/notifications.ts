import { prisma } from './prisma'

type NotificationType = 'consulta' | 'importacion' | 'sistema'

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
}: {
  userId: string
  type: NotificationType
  title: string
  message?: string
  link?: string
}) {
  return prisma.notification.create({
    data: { userId, type, title, message, link },
  })
}