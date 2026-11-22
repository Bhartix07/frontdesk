/**
 * Ticket Service - Frontdesk (Arvo Systems)
 *
 * Implements ticket orchestration with:
 * - Atomic collision protection & race condition avoidance (INC-0291)
 * - Strict isolation of customer-facing and internal data (INC-0304)
 * - Complete immutable audit event logging (INC-0318)
 * - Working-hours-based SLA tracking, pause on customer wait, and dynamic priority recalculation
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const slaService = require('./slaService');
const auditService = require('./auditService');

class TicketService {
  /**
   * Helper: Generate human-friendly Ticket Number (e.g. INC-0342)
   */
  async generateTicketNumber() {
    const count = await prisma.ticket.count();
    const sequence = 1000 + count + 1;
    return `INC-${sequence}`;
  }

  /**
   * Get filtered tickets for the support agent screen
   */
  async getTickets({ status, priority, assignedToId, search, isBreached, view }) {
    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }

    if (assignedToId) {
      if (assignedToId === 'UNASSIGNED') {
        where.assignedToId = null;
      } else {
        where.assignedToId = assignedToId;
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { ticketNumber: { contains: q } },
        { title: { contains: q } },
        { description: { contains: q } },
        { customer: { name: { contains: q } } },
        { customer: { email: { contains: q } } }
      ];
    }

    // Preset Views for Meera's agents
    if (view === 'LATE_OR_BREACHED') {
      where.OR = [
        { isFirstReplyBreached: true },
        { isResolutionBreached: true }
      ];
    } else if (view === 'WAITING_ON_CUSTOMER') {
      where.status = 'WAITING_ON_CUSTOMER';
    } else if (view === 'MY_TICKETS' && assignedToId) {
      where.assignedToId = assignedToId;
      where.status = { notIn: ['RESOLVED', 'CLOSED'] };
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        customer: {
          select: { id: true, name: true, email: true, company: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true, role: true }
        },
        _count: {
          select: {
            messages: true,
            internalNotes: true
          }
        }
      },
      orderBy: [
        { priority: 'asc' }, // Will sort logically in UI
        { createdAt: 'desc' }
      ]
    });

    // Evaluate live SLA status and check for breaches
    const now = new Date();
    return tickets.map(ticket => {
      const sla = slaService.evaluateSLA(ticket, now);
      return {
        ...ticket,
        slaEvaluation: sla
      };
    });
  }

  /**
   * Get complete ticket details for agent view (includes internal notes and audit trail)
   */
  async getTicketDetailsForAgent(ticketId) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        customer: true,
        assignedTo: {
          select: { id: true, name: true, email: true, role: true }
        },
        messages: {
          orderBy: { createdAt: 'asc' }
        },
        internalNotes: {
          include: {
            agent: {
              select: { id: true, name: true, email: true, role: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        auditLogs: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const slaEvaluation = slaService.evaluateSLA(ticket, new Date());
    return {
      ...ticket,
      slaEvaluation
    };
  }

  /**
   * Customer-Facing View (Addresses INC-0304):
   * Absolutely NO internal notes or internal team audit logs are leaked!
   */
  async getCustomerFacingTicket(ticketNumber) {
    const ticket = await prisma.ticket.findUnique({
      where: { ticketNumber },
      include: {
        customer: {
          select: { id: true, name: true, email: true, company: true }
        },
        assignedTo: {
          select: { name: true } // Only agent first/display name, no sensitive agent internals
        },
        messages: {
          orderBy: { createdAt: 'asc' }
        }
        // Notice: internalNotes is deliberately omitted!
      }
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Format safe customer response
    const canReopen = ticket.status === 'RESOLVED' 
      ? slaService.canReopenTicket(ticket.resolvedAt)
      : false;

    return {
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      createdAt: ticket.createdAt,
      customer: ticket.customer,
      assignedTo: ticket.assignedTo,
      messages: ticket.messages,
      canReopen
    };
  }

  /**
   * Create a new ticket (from customer or agent)
   */
  async createTicket({ title, description, priority = 'MEDIUM', customerId, customerName, customerEmail, company }) {
    if (!title || !description) {
      throw new Error('Title and description are required');
    }

    let finalCustomerId = customerId;

    // Ensure customer exists
    if (!finalCustomerId && customerEmail) {
      let customer = await prisma.customer.findUnique({
        where: { email: customerEmail }
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: customerName || customerEmail.split('@')[0],
            email: customerEmail,
            company: company || 'Arvo Client'
          }
        });
      }
      finalCustomerId = customer.id;
    }

    if (!finalCustomerId) {
      throw new Error('Customer information required');
    }

    const ticketNumber = await this.generateTicketNumber();
    const createdAt = new Date();

    // Compute SLA deadlines based on Arvo's working hours
    const { firstReplyDueAt, resolutionDueAt } = slaService.calculateSLADueDates(createdAt, priority);

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        title,
        description,
        priority: priority.toUpperCase(),
        status: 'OPEN',
        customerId: finalCustomerId,
        firstReplyDueAt,
        resolutionDueAt,
        createdAt
      },
      include: {
        customer: true
      }
    });

    // Record immutable audit log
    await auditService.log({
      ticketId: ticket.id,
      actorType: 'CUSTOMER',
      actorId: finalCustomerId,
      actorName: ticket.customer.name,
      action: 'TICKET_CREATED',
      details: {
        ticketNumber: ticket.ticketNumber,
        priority: ticket.priority,
        firstReplyDueAt: ticket.firstReplyDueAt,
        resolutionDueAt: ticket.resolutionDueAt
      }
    });

    return ticket;
  }

  /**
   * Claim / Take Ticket with Atomic Collision Protection (Addresses INC-0291)
   * "Two agents opened the same ticket. Both clicked 'take this ticket' ...
   * The spreadsheet allowed both agents to take the same ticket."
   */
  async claimTicket({ ticketId, agentId }) {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId }
    });

    if (!agent) {
      throw new Error('Valid agent required to claim ticket');
    }

    // Atomic update: only succeeds if assignedToId is null OR already assigned to this agent
    const updated = await prisma.ticket.updateMany({
      where: {
        id: ticketId,
        OR: [
          { assignedToId: null },
          { assignedToId: agentId }
        ]
      },
      data: {
        assignedToId: agentId,
        status: 'IN_PROGRESS',
        version: { increment: 1 }
      }
    });

    if (updated.count === 0) {
      // Race condition detected! Another agent claimed it first.
      const currentTicket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: { assignedTo: true }
      });

      const claimedBy = currentTicket?.assignedTo?.name || 'Another agent';
      const error = new Error(`Ticket already claimed by ${claimedBy}. Action prevented.`);
      error.statusCode = 409; // Conflict
      error.claimedBy = claimedBy;
      throw error;
    }

    // Fetch refreshed ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { assignedTo: true, customer: true }
    });

    // Append to immutable audit trail
    await auditService.log({
      ticketId: ticket.id,
      actorType: 'AGENT',
      actorId: agent.id,
      actorName: agent.name,
      action: 'TICKET_CLAIMED',
      details: {
        assignedToId: agent.id,
        assignedToName: agent.name,
        newStatus: 'IN_PROGRESS'
      }
    });

    return ticket;
  }

  /**
   * Reassign Ticket to another agent
   */
  async assignTicket({ ticketId, targetAgentId, assignedByAgentId, assignedByAgentName }) {
    const targetAgent = await prisma.agent.findUnique({
      where: { id: targetAgentId }
    });

    if (!targetAgent) {
      throw new Error('Target agent not found');
    }

    const previousTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { assignedTo: true }
    });

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        assignedToId: targetAgent.id,
        version: { increment: 1 }
      },
      include: { assignedTo: true, customer: true }
    });

    await auditService.log({
      ticketId,
      actorType: 'AGENT',
      actorId: assignedByAgentId,
      actorName: assignedByAgentName,
      action: 'TICKET_REASSIGNED',
      details: {
        previousAssignee: previousTicket.assignedTo?.name || 'Unassigned',
        newAssignee: targetAgent.name
      }
    });

    return ticket;
  }

  /**
   * Update Ticket Priority with SLA Recalculation (Addresses Section 3 unanswered question)
   */
  async updatePriority({ ticketId, newPriority, agentId, agentName }) {
    const validPriorities = ['CRITICAL', 'MEDIUM', 'LOW'];
    const normPriority = (newPriority || '').toUpperCase();

    if (!validPriorities.includes(normPriority)) {
      throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const oldPriority = ticket.priority;
    if (oldPriority === normPriority) {
      return ticket;
    }

    const now = new Date();
    // Dynamic recalculation of remaining SLA working minutes
    const recalculated = slaService.recalculateSLAOnPriorityChange(ticket, normPriority, now);

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        priority: normPriority,
        firstReplyDueAt: recalculated.firstReplyDueAt,
        resolutionDueAt: recalculated.resolutionDueAt,
        isFirstReplyBreached: recalculated.isFirstReplyBreached,
        isResolutionBreached: recalculated.isResolutionBreached,
        version: { increment: 1 }
      },
      include: { customer: true, assignedTo: true }
    });

    await auditService.log({
      ticketId,
      actorType: 'AGENT',
      actorId,
      actorName,
      action: 'PRIORITY_CHANGED',
      details: {
        oldPriority,
        newPriority: normPriority,
        recalculatedFirstReplyDueAt: recalculated.firstReplyDueAt,
        recalculatedResolutionDueAt: recalculated.resolutionDueAt,
        isFirstReplyBreached: recalculated.isFirstReplyBreached
      }
    });

    return updatedTicket;
  }

  /**
   * Update Ticket Status with SLA Pause / Resume Handling
   */
  async updateStatus({ ticketId, newStatus, actorType = 'AGENT', actorId, actorName, reason }) {
    const validStatuses = ['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'RESOLVED', 'CLOSED'];
    const normStatus = (newStatus || '').toUpperCase();

    if (!validStatuses.includes(normStatus)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const oldStatus = ticket.status;
    if (oldStatus === normStatus) {
      return ticket;
    }

    const now = new Date();
    const updateData = {
      status: normStatus,
      lastStatusChangeAt: now,
      version: { increment: 1 }
    };

    // If reopening a resolved ticket, check 5-working-day window rule
    if (oldStatus === 'RESOLVED' && (normStatus === 'OPEN' || normStatus === 'IN_PROGRESS')) {
      const allowed = slaService.canReopenTicket(ticket.resolvedAt, now);
      if (!allowed) {
        throw new Error(
          'Reopen window expired. Customer can only reopen within 5 working days of resolution. Please create a new ticket.'
        );
      }
    }

    // 1. Entering WAITING_ON_CUSTOMER: Pause SLA timer!
    if (normStatus === 'WAITING_ON_CUSTOMER') {
      updateData.waitingCustomerStartedAt = now;
    }

    // 2. Resuming from WAITING_ON_CUSTOMER: Unpause & extend SLA due dates by paused working time!
    if (oldStatus === 'WAITING_ON_CUSTOMER') {
      const resumeResult = slaService.resumeSLAAfterCustomerWait(ticket, now);
      updateData.firstReplyDueAt = resumeResult.firstReplyDueAt;
      updateData.resolutionDueAt = resumeResult.resolutionDueAt;
      updateData.totalPausedWorkingMinutes = ticket.totalPausedWorkingMinutes + resumeResult.additionalPausedMinutes;
      updateData.waitingCustomerStartedAt = null;
    }

    // 3. Marking as RESOLVED
    if (normStatus === 'RESOLVED') {
      updateData.resolvedAt = now;
      if (now > new Date(ticket.resolutionDueAt)) {
        updateData.isResolutionBreached = true;
      }
    }

    // 4. Marking as CLOSED
    if (normStatus === 'CLOSED') {
      updateData.closedAt = now;
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: { customer: true, assignedTo: true }
    });

    await auditService.log({
      ticketId,
      actorType,
      actorId,
      actorName,
      action: 'STATUS_CHANGED',
      details: {
        oldStatus,
        newStatus: normStatus,
        reason: reason || 'Manual status change'
      }
    });

    return updatedTicket;
  }

  /**
   * Send Customer Message / Agent Reply
   * Tracks First Reply SLA accurately addressing INC-0318 dispute.
   */
  async addMessage({ ticketId, senderType, senderId, senderName, content }) {
    if (!content || !content.trim()) {
      throw new Error('Message content cannot be empty');
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { assignedTo: true }
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const now = new Date();
    const isFirstAgentReply = senderType === 'AGENT' && !ticket.firstRepliedAt;

    // Create the message
    const message = await prisma.ticketMessage.create({
      data: {
        ticketId,
        senderType,
        senderId: senderId || null,
        senderName: senderName || (senderType === 'AGENT' ? 'Support Agent' : 'Customer'),
        content: content.trim(),
        createdAt: now
      }
    });

    // Update ticket state based on reply
    const updateData = {
      updatedAt: now,
      version: { increment: 1 }
    };

    if (isFirstAgentReply) {
      updateData.firstRepliedAt = now;
      if (now > new Date(ticket.firstReplyDueAt)) {
        updateData.isFirstReplyBreached = true;
      }
    }

    // If agent replies and asks customer, we typically transition to WAITING_ON_CUSTOMER
    if (senderType === 'AGENT' && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED') {
      updateData.status = 'WAITING_ON_CUSTOMER';
      updateData.waitingCustomerStartedAt = now;
    }

    // If customer replies while WAITING_ON_CUSTOMER, resume SLA clock!
    if (senderType === 'CUSTOMER' && ticket.status === 'WAITING_ON_CUSTOMER') {
      const resumeResult = slaService.resumeSLAAfterCustomerWait(ticket, now);
      updateData.status = 'IN_PROGRESS';
      updateData.firstReplyDueAt = resumeResult.firstReplyDueAt;
      updateData.resolutionDueAt = resumeResult.resolutionDueAt;
      updateData.totalPausedWorkingMinutes = ticket.totalPausedWorkingMinutes + resumeResult.additionalPausedMinutes;
      updateData.waitingCustomerStartedAt = null;
    }

    await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData
    });

    // Immutable audit record of message
    await auditService.log({
      ticketId,
      actorType: senderType,
      actorId,
      actorName: message.senderName,
      action: senderType === 'AGENT' ? 'AGENT_REPLIED' : 'CUSTOMER_REPLIED',
      details: {
        messageId: message.id,
        isFirstAgentReply,
        preview: content.trim().substring(0, 100)
      }
    });

    return message;
  }

  /**
   * Automated Sweep: Auto-close tickets inactive in WAITING_ON_CUSTOMER for > 5 working days
   */
  async sweepAndAutoClose() {
    const now = new Date();
    const waitingTickets = await prisma.ticket.findMany({
      where: {
        status: 'WAITING_ON_CUSTOMER',
        waitingCustomerStartedAt: { not: null }
      }
    });

    const closed = [];
    for (const ticket of waitingTickets) {
      if (slaService.shouldAutoClose(ticket.waitingCustomerStartedAt, now)) {
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            status: 'CLOSED',
            closedAt: now,
            version: { increment: 1 }
          }
        });

        await auditService.log({
          ticketId: ticket.id,
          actorType: 'SYSTEM',
          actorName: 'Frontdesk Auto-Closer',
          action: 'AUTO_CLOSED',
          details: {
            reason: 'Customer did not reply within 5 working days'
          }
        });

        closed.push(ticket.ticketNumber);
      }
    }

    return closed;
  }

  /**
   * Quick Dashboard Metrics for Agents & Leads
   */
  async getDashboardMetrics() {
    const totalOpen = await prisma.ticket.count({
      where: { status: { in: ['OPEN', 'IN_PROGRESS'] } }
    });

    const waitingOnCustomer = await prisma.ticket.count({
      where: { status: 'WAITING_ON_CUSTOMER' }
    });

    const resolvedToday = await prisma.ticket.count({
      where: {
        status: { in: ['RESOLVED', 'CLOSED'] },
        updatedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    const unassigned = await prisma.ticket.count({
      where: {
        assignedToId: null,
        status: { notIn: ['RESOLVED', 'CLOSED'] }
      }
    });

    // Check breach counts
    const breached = await prisma.ticket.count({
      where: {
        OR: [
          { isFirstReplyBreached: true },
          { isResolutionBreached: true }
        ],
        status: { notIn: ['RESOLVED', 'CLOSED'] }
      }
    });

    return {
      totalOpen,
      waitingOnCustomer,
      resolvedToday,
      unassigned,
      breached
    };
  }
}

module.exports = new TicketService();
