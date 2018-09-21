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
  AmqpService = require('middleware_common_infrastructure/AmqpService'),
  InfrastructureInfo = require('middleware_common_infrastructure/InfrastructureInfo'),
  InfrastructureService = require('middleware_common_infrastructure/InfrastructureService'),
  _ = require('lodash'),
  log = bunyan.createLogger({name: 'core.rest'}),
  redInitter = require('middleware_service.sdk').init;

mongoose.Promise = Promise;
mongoose.mainnet = mongoose.createConnection(config.main.mongo.uri);
mongoose.sidechain = mongoose.createConnection(config.sidechain.mongo.uri);

[mongoose.sidechain, mongoose.mainnet].forEach(instance =>
  instance.on('disconnected', function () {
    log.error('mongo disconnected!');
    process.exit(0);
  })
);

const runSystem = async function () {
  const rabbit = new AmqpService(
    config.systemRabbit.url, 
    config.systemRabbit.exchange,
    config.systemRabbit.serviceName
  );
  const info = new InfrastructureInfo(require('./package.json'));
  const system = new InfrastructureService(info, rabbit, {checkInterval: 10000});
  await system.start();
  system.on(system.REQUIREMENT_ERROR, ({requirement, version}) => {
    log.error(`Not found requirement with name ${requirement.name} version=${requirement.version}.` +
        ` Last version of this middleware=${version}`);
    process.exit(1);
  });
  await system.checkRequirements();
  system.periodicallyCheck();
};
const init = async () => {
  if (config.checkSystem)
    await runSystem();

  require('require-all')({
    dirname: path.join(__dirname, '/models'),
    filter: /(.+Model)\.js$/
  });

  if (config.nodered.autoSyncMigrations)
    await migrator.run(
      config,
      path.join(__dirname, 'migrations')
    );

  redInitter(config);

};

module.exports = init();
