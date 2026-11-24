import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

export interface AuditParams {
  userId?: string | null;
  action: string;
  entityName: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}

export const logAudit = async (params: AuditParams) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        entityName: params.entityName,
        entityId: params.entityId,
        oldValues: params.oldValues ? JSON.parse(JSON.stringify(params.oldValues)) : null,
        newValues: params.newValues ? JSON.parse(JSON.stringify(params.newValues)) : null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Lỗi ghi Audit Log bất biến');
  }
};
