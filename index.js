/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

/**
 * Expose an express web server
 * @module middleware-custom-service
 */

const config = require('./config'),
  mongoose = require('mongoose'),
  Promise = require('bluebird'),
  path = require('path'),
  bunyan = require('bunyan'),
  migrator = require('middleware_service.sdk').migrator,
  _ = require('lodash'),
  log = bunyan.createLogger({name: 'core.rest'}),
  redInitter = require('middleware_service.sdk').init;

mongoose.Promise = Promise;
mongoose.accounts = mongoose.createConnection(config.mongo.accounts.uri);

mongoose.data = mongoose.createConnection(config.mongo.data.uri);

[mongoose.accounts, mongoose.data].forEach(instance =>
  instance.on('disconnected', function () {
    log.error('mongo disconnected!');
    process.exit(0);
  })
);

const init = async () => {

  require('require-all')({
    dirname: path.join(__dirname, '/models'),
    filter: /(.+Model)\.js$/
  });

  if (config.nodered.autoSyncMigrations)
    await migrator.run(config.nodered.mongo.uri, path.join(__dirname, 'migrations'), `_${_.get(config, 'nodered.mongo.collectionPrefix', '')}migrations`);

  redInitter(config);
};

module.exports = init();
