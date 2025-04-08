require('dotenv').config();

global.appRoot = __dirname.replace(/'\'/g, "/");
const moment = require('moment-timezone');
moment.tz.setDefault(process.env.TIMEZONE);
const ticketController = require('./app/controllers/ticket.controller');
const express = require('express');
const cors = require('cors');
const multer = require('multer'); // Agrega la importación de multer
const bodyParser = require('body-parser');

const logger = require('./config/logger');
const routes = require('./config/routes');
const { handlerErrors } = require('./config/handler');

logger.info('Starting server...');

const app = express();

// Configuración de multer para manejar la carga de archivos
const storage = multer.memoryStorage(); // Almacena el archivo en memoria como un búfer
const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // Limita el tamaño de archivo a 100 MB
});

app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

app.use(cors());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
    res.setHeader('Content-Type', 'application/json');
    return next();
});

// Configuración de multer como middleware para manejar archivos
app.use(upload.single('file'));

app.use(express.json());

app.post("/webhook/zendesk", (req, res) => {
  console.log("🎯 Webhook recibido:", JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});
app.post("/form", ticketController.createTicket);

app.get("/by-email", ticketController.getTicketsByEmail);

app.put("/update/:ticketId/:email", ticketController.updateTicket);

app.get("/status/:ticketId", ticketController.getTicketStatus);

app.use('/api', routes.v1);
app.use(handlerErrors);

// Ruta por defecto para páginas no encontradas
app.use((req, res) => {
    return res.status(404).send({ status: 'ERROR', message: 'Página no encontrada' })
})



module.exports = app;