import { Prisma } from '@prisma/client';

/**
 * Tạo sự kiện Outbox nguyên tử trong transaction nghiệp vụ
 */
export async function createOutboxEvent(
  tx: Prisma.TransactionClient,
  aggregateType: string,
  aggregateId: string,
  eventType: string,
  payload: any,
  scheduledAt?: Date
) {
  const lastEvent = await tx.outboxEvent.findFirst({
    where: { aggregateType, aggregateId },
    orderBy: { aggregateSequence: 'desc' },
    select: { aggregateSequence: true },
  });

  const nextSeq = (lastEvent?.aggregateSequence ?? 0) + 1;

  return tx.outboxEvent.create({
    data: {
      aggregateType,
      aggregateId,
      aggregateSequence: nextSeq,
      eventType,
      payload,
      scheduledAt: scheduledAt ?? null,
    },
  });
}
