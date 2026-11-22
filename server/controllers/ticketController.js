/**
 * Ticket Controller - Frontdesk
 */

const ticketService = require('../services/ticketService');

class TicketController {
  async getTickets(req, res, next) {
    try {
      const { status, priority, assignedToId, search, view } = req.query;
      const tickets = await ticketService.getTickets({
        status,
        priority,
        assignedToId,
        search,
        view
      });
      res.json({ success: true, count: tickets.length, data: tickets });
    } catch (err) {
      next(err);
    }
  }

  async getTicketDetails(req, res, next) {
    try {
      const { id } = req.params;
      const ticket = await ticketService.getTicketDetailsForAgent(id);
      res.json({ success: true, data: ticket });
    } catch (err) {
      next(err);
    }
  }

  async getCustomerTicket(req, res, next) {
    try {
      const { ticketNumber } = req.params;
      const ticket = await ticketService.getCustomerFacingTicket(ticketNumber);
      res.json({ success: true, data: ticket });
    } catch (err) {
      next(err);
    }
  }

  async createTicket(req, res, next) {
    try {
      const { title, description, priority, customerId, customerName, customerEmail, company } = req.body;
      const ticket = await ticketService.createTicket({
        title,
        description,
        priority,
        customerId,
        customerName,
        customerEmail,
        company
      });
      res.status(201).json({ success: true, data: ticket });
    } catch (err) {
      next(err);
    }
  }

  async claimTicket(req, res, next) {
    try {
      const { id } = req.params;
      const { agentId } = req.body;
      if (!agentId) {
        return res.status(400).json({ success: false, message: 'agentId is required' });
      }
      const ticket = await ticketService.claimTicket({ ticketId: id, agentId });
      res.json({ success: true, message: 'Ticket claimed successfully', data: ticket });
    } catch (err) {
      if (err.statusCode === 409) {
        return res.status(409).json({
          success: false,
          conflict: true,
          message: err.message,
          claimedBy: err.claimedBy
        });
      }
      next(err);
    }
  }

  async assignTicket(req, res, next) {
    try {
      const { id } = req.params;
      const { targetAgentId, assignedByAgentId, assignedByAgentName } = req.body;
      const ticket = await ticketService.assignTicket({
        ticketId: id,
        targetAgentId,
        assignedByAgentId,
        assignedByAgentName
      });
      res.json({ success: true, data: ticket });
    } catch (err) {
      next(err);
    }
  }

  async updatePriority(req, res, next) {
    try {
      const { id } = req.params;
      const { priority, agentId, agentName } = req.body;
      const ticket = await ticketService.updatePriority({
        ticketId: id,
        newPriority: priority,
        agentId,
        agentName
      });
      res.json({ success: true, data: ticket });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, actorType, actorId, actorName, reason } = req.body;
      const ticket = await ticketService.updateStatus({
        ticketId: id,
        newStatus: status,
        actorType,
        actorId,
        actorName,
        reason
      });
      res.json({ success: true, data: ticket });
    } catch (err) {
      next(err);
    }
  }

  async addMessage(req, res, next) {
    try {
      const { id } = req.params;
      const { senderType, senderId, senderName, content } = req.body;
      const message = await ticketService.addMessage({
        ticketId: id,
        senderType: senderType || 'AGENT',
        senderId,
        senderName,
        content
      });
      res.status(201).json({ success: true, data: message });
    } catch (err) {
      next(err);
    }
  }

  async getDashboardMetrics(req, res, next) {
    try {
      const metrics = await ticketService.getDashboardMetrics();
      res.json({ success: true, data: metrics });
    } catch (err) {
      next(err);
    }
  }

  async sweepAutoClose(req, res, next) {
    try {
      const closed = await ticketService.sweepAndAutoClose();
      res.json({ success: true, closedTickets: closed });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TicketController();
