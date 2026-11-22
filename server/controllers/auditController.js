/**
 * Audit Controller - Frontdesk
 *
 * Implements read-only access to immutable audit log (INC-0318).
 * Note: No PUT, PATCH or DELETE endpoints exist for audit logs by design.
 */

const auditService = require('../services/auditService');

class AuditController {
  async getAuditTrail(req, res, next) {
    try {
      const { id: ticketId } = req.params;
      const trail = await auditService.getAuditTrail(ticketId);
      res.json({ success: true, count: trail.length, data: trail });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuditController();
