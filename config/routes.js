/* eslint-disable global-require */
const express = require('express');
const path = require('path');
const glob = require('glob');

const logger = require('../config/logger');
// const { healthCheck } = require( '../app/Controllers/healthcheck.controller' );

const matches = glob.sync(path.join(global.appRoot, 'app/Routes/*.route.js'));

const routerV1 = express.Router();

routerV1.get('/healthcheck', (req, res, next) => {
  res.status(200).send({ message: "Arq-Pokemon", status: "OK" });
});

matches.forEach((item) => {
  const pathParsed = path.parse(item);
  routerV1.use(`/${pathParsed.base.split('.')[0]}`, require(item));
  require('../config/logger').debug(`route [/${pathParsed.base.split('.')[0]}] added`);
});

module.exports = { v1: routerV1 };