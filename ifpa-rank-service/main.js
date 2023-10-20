'use strict';

const express = require('express');
const debug = require('debug')('ifpa-rank-service:server');

require('dotenv').load();

const app = express();

require('fs').readdirSync('./route').forEach( route => {
  debug('USE:',route);
  app.use(require(`./route/${route}`));
});

// TODO: Do we need some error-middleware?

module.exports = app;
