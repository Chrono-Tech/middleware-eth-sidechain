/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const express = require('express'),
  bunyan = require('bunyan'),
  messages = require('../factories/messages/genericMessages'),
  log = bunyan.createLogger({name: 'server.routes'}),
  routes = require('require-all')({
    dirname: __dirname,
    filter: /(.+Route)\.js$/,
    map: name => name.replace('Route', '')
  });


const asyncMiddlewareWrapper = fn =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .catch((err)=>{
        log.error(err);
        res.send(messages.fail);
      });
  };

/**
 * @factory
 * @description route factory
 * @param app - express instance
 */
module.exports = (app) => {

  for (let path of Object.keys(routes)) {
    let router = express.Router();
    routes[path](router, asyncMiddlewareWrapper);
    app.use(`/${path}`, router);
  }

};
