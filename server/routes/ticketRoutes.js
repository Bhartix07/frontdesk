/**
 * Ticket Routes - Frontdesk
 */

const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const noteController = require('../controllers/noteController');
const auditController = require('../controllers/auditController');

// Metrics & sweep
router.get('/metrics', ticketController.getDashboardMetrics);
router.post('/sweep-autoclose', ticketController.sweepAutoClose);

// Public / Customer-Facing Safe Endpoint (INC-0304 - internal notes stripped)
router.get('/customer/:ticketNumber', ticketController.getCustomerTicket);

// Standard Agent Ticket endpoints
router.get('/', ticketController.getTickets);
router.post('/', ticketController.createTicket);
router.get('/:id', ticketController.getTicketDetails);

// Actions
router.post('/:id/claim', ticketController.claimTicket);
router.post('/:id/assign', ticketController.assignTicket);
router.patch('/:id/priority', ticketController.updatePriority);
router.patch('/:id/status', ticketController.updateStatus);
router.post('/:id/messages', ticketController.addMessage);

// Nested routes for internal notes and audit trail
router.post('/:id/notes', noteController.addNote);
router.get('/:id/notes', noteController.getNotes);
router.get('/:id/audit', auditController.getAuditTrail);

module.exports = router;
