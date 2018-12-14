/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

/**
 * Middleware service for handling user balance.
 * Update balances for accounts, which addresses were specified
 * in received transactions from blockParser via amqp
 *
 * @module Chronobank/eth-balance-processor
 * @requires config
 * @requires models/accountModel
 */

const config = require('./config'),
  mongoose = require('mongoose'),
  Promise = require('bluebird'),
  models = require('./models'),
  _ = require('lodash'),
  MainAMQPController = require('./controllers/mainAMQPController'),
  mainProviderService = require('./services/main/providerService'),
  bunyan = require('bunyan'),
  log = bunyan.createLogger({name: 'core.balanceProcessor', level: config.logs.level});


mongoose.Promise = Promise;
mongoose.main = mongoose.createConnection(config.main.mongo.uri, {useMongoClient: true});
mongoose.sidechain = mongoose.createConnection(config.sidechain.mongo.uri, {useMongoClient: true});


let init = async () => {

  models.init();

  mongoose.connection.on('disconnected', () => {
    throw new Error('mongo disconnected!');
  });

  const mainAMQPController = new MainAMQPController();

  mainAMQPController.on('error', ()=>{
    throw new Error('rmq disconnected!');
  });

  await mainAMQPController.connect();

  await mainProviderService.setRabbitmqChannel(mainAMQPController.channel, config.main.rabbit.serviceName);
};

module.exports = init().catch(err => {
  log.error(err);
  process.exit(0);
});
