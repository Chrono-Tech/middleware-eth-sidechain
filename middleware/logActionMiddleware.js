/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const bunyan = require('bunyan'),
  _ = require('lodash'),
  log = bunyan.createLogger({name: 'sidechain.middleware.logActionMiddleware'});


/**
 * @description express middleware for logging incoming requests
 * @param req - the request object
 * @param res - the response object
 * @param next - the next function
 */
module.exports = async (req, res, next) => {

  log.info(`endpoint: ${req.method} ${req.originalUrl} with params ${JSON.stringify(req.body)}`);
  next();
};
