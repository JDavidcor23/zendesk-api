const { default: axios } = require( 'axios' );
const { axiosConf } = require('../../config/axios');

async function createTicket(body) {
  let axiosResponse = null
  const config = axiosConf('URL_ZENDESK', body, `tickets.json`);
  await axios.post(`${config.baseUrl}`, body, config.option)
    .then(response => {
      axiosResponse = response
    })
    .catch(error => {
      throw new Error(error)
    })
  return axiosResponse

}

async function getTicketsByEmail(email) {
  const config = axiosConf(
    "URL_ZENDESK",
    null,
    `search.json?query=type:ticket requester:${email}`
  );

  try {
    const response = await axios.get(config.baseUrl, config.option);
    return response.data;
  } catch (error) {
    throw new Error(error);
  }
}

async function updateTicketById(ticketId, email, updates) {
  const getTicketConfig = axiosConf(
    "URL_ZENDESK",
    null,
    `tickets/${ticketId}.json`
  );
  
  const { data: ticketData } = await axios.get(
    getTicketConfig.baseUrl,
    getTicketConfig.option
  );

  const requesterId = ticketData.ticket.requester_id;

  const requesterConfig = axiosConf(
    "URL_ZENDESK",
    null,
    `users/${requesterId}.json`
  );
  const { data: requesterData } = await axios.get(
    requesterConfig.baseUrl,
    requesterConfig.option
  );

  if (requesterData.user.email !== email) {
    throw new Error(`El ticket ${ticketId} no pertenece al correo ${email}`);
  }

  const updateConfig = axiosConf(
    "URL_ZENDESK",
    null,
    `tickets/${ticketId}.json`
  );
  const body = { ticket: updates };

  const response = await axios.put(
    updateConfig.baseUrl,
    body,
    updateConfig.option
  );
  return response.data;
}
async function getTicketStatus(ticketId) {
  const config = axiosConf("URL_ZENDESK", null, `tickets/${ticketId}.json`);
  const { data } = await axios.get(config.baseUrl, config.option);
  return data.ticket.status;
}

module.exports = {
  createTicket,
  getTicketsByEmail,
  updateTicketById,
  getTicketStatus,
};
