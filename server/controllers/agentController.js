/**
 * Agent Controller - Frontdesk
 *
 * Provides access to Arvo Systems' 9 support agents.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AgentController {
  async getAgents(req, res, next) {
    try {
      const agents = await prisma.agent.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              assignedTickets: {
                where: {
                  status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER'] }
                }
              }
            }
          }
        }
      });
      res.json({ success: true, count: agents.length, data: agents });
    } catch (err) {
      next(err);
    }
  }

  async getAgentById(req, res, next) {
    try {
      const { id } = req.params;
      const agent = await prisma.agent.findUnique({
        where: { id }
      });
      if (!agent) {
        return res.status(404).json({ success: false, message: 'Agent not found' });
      }
      res.json({ success: true, data: agent });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AgentController();
