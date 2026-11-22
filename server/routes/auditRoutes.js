/**
 * Audit Routes - Frontdesk
 */

const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');

router.get('/:id/audit', auditController.getAuditTrail);

module.exports = router;
