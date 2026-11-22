/**
 * Audit Service - Frontdesk
 *
 * Implements an append-only, immutable activity log addressing INC-0318.
 * "The system must record exactly what happened, when it happened, and who did it.
 * Nobody should be able to change that record later."
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AuditService {
  /**
   * Append an immutable record to the audit trail
   */
  async log({ ticketId, actorType, actorId, actorName, action, details = {} }) {
    try {
      const serializedDetails = typeof details === 'string' ? details : JSON.stringify(details);
      
      const record = await prisma.auditLog.create({
        data: {
          ticketId,
          actorType: actorType || 'SYSTEM',
          actorId: actorId || null,
          actorName: actorName || 'System Automated Process',
          action,
          details: serializedDetails
        }
      });

      return record;
    } catch (error) {
      console.error('[AuditService.log] Failed to write audit record:', error);
      // Non-fatal logging error handling - never crash primary transaction
      return null;
    }
  }

  /**
   * Retrieve full audit history for a ticket
   */
  async getAuditTrail(ticketId) {
    const logs = await prisma.auditLog.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' }
    });

    return logs.map(log => {
      let parsed = {};
      try {
        parsed = JSON.parse(log.details);
      } catch (e) {
        parsed = { text: log.details };
      }
      return {
        ...log,
        parsedDetails: parsed
      };
    });
  }
}

module.exports = new AuditService();
