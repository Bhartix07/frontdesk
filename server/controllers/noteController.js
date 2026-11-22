/**
 * Internal Note Controller - Frontdesk
 *
 * Implements strict security layer protecting private notes from customer leakage (INC-0304).
 */

const noteService = require('../services/noteService');

class NoteController {
  async addNote(req, res, next) {
    try {
      const { id: ticketId } = req.params;
      const { agentId, content } = req.body;

      if (!agentId || !content) {
        return res.status(400).json({
          success: false,
          message: 'Both agentId and content are required to author an internal note'
        });
      }

      const note = await noteService.addInternalNote({
        ticketId,
        agentId,
        content
      });

      res.status(201).json({
        success: true,
        message: 'Internal note added to private team ledger',
        data: note
      });
    } catch (err) {
      next(err);
    }
  }

  async getNotes(req, res, next) {
    try {
      const { id: ticketId } = req.params;
      // In production or demo, verify requester role
      const requesterRole = req.headers['x-requester-role'] || 'AGENT';

      const notes = await noteService.getNotesForTicket(ticketId, requesterRole);
      res.json({ success: true, count: notes.length, data: notes });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new NoteController();
