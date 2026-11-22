/**
 * Note Service - Frontdesk
 *
 * Implements private internal notes addressing INC-0304.
 * "Private team notes must never be shown to a customer. Not on a screen.
 * Not in an API response. Not in an export. Not in a list."
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auditService = require('./auditService');

class NoteService {
  /**
   * Add a private internal note for team members
   */
  async addInternalNote({ ticketId, agentId, content }) {
    if (!content || !content.trim()) {
      throw new Error('Note content cannot be empty');
    }

    const agent = await prisma.agent.findUnique({
      where: { id: agentId }
    });

    if (!agent) {
      throw new Error('Valid agent identity required to author an internal note');
    }

    const note = await prisma.internalNote.create({
      data: {
        ticketId,
        agentId,
        content: content.trim()
      },
      include: {
        agent: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    // Record in immutable audit trail
    await auditService.log({
      ticketId,
      actorType: 'AGENT',
      actorId: agent.id,
      actorName: agent.name,
      action: 'INTERNAL_NOTE_ADDED',
      details: {
        noteId: note.id,
        preview: content.trim().substring(0, 80)
      }
    });

    return note;
  }

  /**
   * Fetch internal notes for a ticket.
   * Hard validation: Only authenticated agents are allowed.
   */
  async getNotesForTicket(ticketId, requesterRole = 'AGENT') {
    if (requesterRole !== 'AGENT') {
      // Hard defense-in-depth: Never return internal notes to non-agents
      throw new Error('Access denied: Internal notes are strictly restricted to support staff');
    }

    return await prisma.internalNote.findMany({
      where: { ticketId },
      include: {
        agent: {
          select: { id: true, name: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }
}

module.exports = new NoteService();
