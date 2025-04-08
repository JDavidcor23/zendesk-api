const axiosConf = (url, headers, route) => ({
    baseUrl:`${process.env[url]}/${route}`,
    option: {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.ZENDESK_API_TOKEN}`
        }
    }
});
const axiosConfFiles = (url) => ({
  baseUrl:`${url}`,
  option: {
      responseType: 'arraybuffer',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ZENDESK_API_TOKEN}`
      }
  }
});
const axiosConfMicro = (url, req, route) => ({

    baseUrl: `${process.env[url]}/${route}`,
    option: {
      headers: {
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*',
        // HEADERS solicitados por el equipo de arquitectura
        'x-country': req.headers["x-country"],
        'x-commerce': req.headers["x-commerce"],
        'x-customerid': req.headers["x-customerid"],
        'x-api-version': req.headers["x-api-version"],
        'x-channel': req.headers["x-channel"],
        'x-brand-id': req.headers["x-brand-id"],
        'Ocp-Apim-Subscription-Key': process.env.MICROTARIFARIO_CODE,
      }, 
      params: {
        ...req.query
      },
      
      body: req.body ? {
        ...req.body
      } : undefined
    },
  });

module.exports = { axiosConf,axiosConfMicro,axiosConfFiles};
