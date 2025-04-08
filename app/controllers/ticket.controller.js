const msTicket = require("../services/ticket.service.js");
const ticketMapper = require("../mappers/ticket.mapper.js");

async function createTicket(req, res, next) {
  try {
    const ticket = req.body;
    
    const formattedData = await ticketMapper.formatProducts(ticket);
    const mockResponse = {
      data: {
        ticket: formattedData.ticket,
      },
    };
    // const { data: response } = await msTicket.createTicket({
    //   ticket: formattedData.ticket,
    // });

    setTimeout(() => {
      res.status(200).send({ result: mockResponse });
    }, 5000); // 2 seconds delay
  } catch (error) {
    next(error);
  }
}

async function getTicketsByEmail(req, res, next) {
  try {
    const { email } = req.query;
    console.log("se recibio la peticion")
    const tickets = await msTicket.getTicketsByEmail(email);
    console.log("se recibio la peticion")
      res.status(200).send({ result: tickets });
  } catch (error) {
    next(error);
  }
}

async function updateTicket(req, res, next) {
  try {
    const { ticketId, email } = req.params;
    const updates = req.body;
    console.log({ticketId, email, updates})
    // const result = await msTicket.updateTicketById(ticketId, email, updates);
    const mockResponse = {
      data: {
        ticket: formattedData.ticket,
      },
    };
    res.status(200).send({ result: mockResponse });
  } catch (error) {
    next(error);
  }
}

async function getTicketStatus(req, res, next) {
  try {
    const { ticketId } = req.params;
    const status = await msTicket.getTicketStatus(ticketId);  
    res.status(200).send({ result: status });
  } catch (error) {
    next(error);
  }
}



module.exports = {
  createTicket,
  getTicketsByEmail,
  updateTicket,
  getTicketStatus,
};
