const generalDictionary = require("../dictionaries/general.environment.dictionary");

function formatProducts(body) {
  body.ticket.custom_fields = [];

  const ticketsForms = generalDictionary.getTicketForms();

  if (ticketsForms[body.data.type]) {

    const formInfo = ticketsForms[body.data.type];

    body.ticket.ticket_form_id = formInfo.id;

    body.ticket.tags = formInfo.tags;
    const ticketAttributes = generalDictionary.getFields();

    for (const key of Object.keys(body.data)) {
      if (ticketAttributes[key]) {

        body.ticket.custom_fields.push({
          id: ticketAttributes[key].id,
          value:
            key == "ImageUrl"
              ? decodeURIComponent(body.data[key])
              : body.data[key],
        });
      }
    }
  } else {
    throw new Error("El ticket no pudo ser creado debido a que el formulario no existe en la configuración");
  }
  return body;
}

module.exports = {
  formatProducts,
};
