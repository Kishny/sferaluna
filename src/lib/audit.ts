import { AuditLog } from '@/models/AuditLog';

export async function createAuditLog(data: {
  userId: string;
  action: string;
  details: any;
  metadata?: any;
}) {
  try {
    await AuditLog.create({
      ...data,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Erreur création audit log:', error);
  }
}