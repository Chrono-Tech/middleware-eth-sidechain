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
  express = require('express'),
  bodyParser = require('body-parser'),
  cors = require('cors'),
  app = express(),
  routes = require('./routes'),
  blockchainTypes = require('./factories/states/blockchainTypesFactory'),
  MainAMQPController = require('./controllers/mainAMQPController'),
  SidechainAMQPController = require('./controllers/sidechainAMQPController'),
  bunyan = require('bunyan'),
  log = bunyan.createLogger({name: 'core.balanceProcessor', level: config.logs.level});

mongoose.Promise = Promise;
mongoose.set('useCreateIndex', true);
mongoose[blockchainTypes.main] = mongoose.createConnection(config.main.mongo.uri, {useNewUrlParser: true});
mongoose[blockchainTypes.sidechain] = mongoose.createConnection(config.sidechain.mongo.uri, {useNewUrlParser: true});


let init = async () => {

  models.init(mongoose[blockchainTypes.main], mongoose[blockchainTypes.sidechain]);

  mongoose.connection.on('disconnected', () => {
    throw new Error('mongo disconnected!');
  });

  const mainAMQPController = new MainAMQPController();
  const sidechainAMQPController = new SidechainAMQPController();

  mainAMQPController.on('error', ()=>{
    throw new Error('rmq disconnected!');
  });

  await mainAMQPController.connect();
  await sidechainAMQPController.connect();


  app.use(bodyParser.urlencoded({extended: false}));
  app.use(bodyParser.json());

  app.use(cors());
  routes(app);

  app.listen(config.rest.port, () => log.info(`Listening on port ${config.rest.port}!`));


};

module.exports = init().catch(err => {
  log.error(err);
  process.exit(0);
});
