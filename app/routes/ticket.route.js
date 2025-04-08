const express = require('express');
const ticketController = require('../controllers/ticket.controller');

const router = express.Router();

router.post('/form', ticketController.createTicket)

router.get('/by-email', ticketController.getTicketsByEmail)

router.put("/update/:ticketId/:email", ticketController.updateTicket);

router.get("/status/:ticketId", ticketController.getTicketStatus);

module.exports = router;