/**
 * Note Routes - Frontdesk
 */

const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');

router.post('/:id/notes', noteController.addNote);
router.get('/:id/notes', noteController.getNotes);

module.exports = router;
