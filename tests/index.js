/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

require('dotenv/config');
process.env.LOG_LEVEL = 'error';

const config = require('../config'),
  models = require('../models'),
  spawn = require('child_process').spawn,
  Web3 = require('web3'),
  net = require('net'),
  /*  fuzzTests = require('./fuzz'),
    performanceTests = require('./performance'),
    blockTests = require('./blocks'),*/
  featuresTests = require('./features'),
  fs = require('fs-extra'),
  Promise = require('bluebird'),
  mongoose = require('mongoose'),
  amqp = require('amqplib'),
  ctx = {};

mongoose.Promise = Promise;
mongoose.mainnet = mongoose.createConnection(config.main.mongo.uri);
mongoose.sidechain = mongoose.createConnection(config.sidechain.mongo.uri);


describe('core/sidechain', function () {

  before(async () => {
    models.init();

    ctx.nodePid = spawn('node', ['--max_old_space_size=4096', 'tests/node/nodesCluster.js'], {
      env: process.env
    });


    await new Promise(res => {
      ctx.nodePid.stdout.on('data', (data) => {
        data = data.toString();
        if (data.includes('sidechain token'))
          res();
      });
    });


    await Promise.delay(5000);
    ctx.nodePid.on('exit', function () {
      process.exit(1);
    });

    /*  const provider = /http:\/\//.test(config.web3.providers[0]) ?
        new Web3.providers.HttpProvider(config.web3.providers[0]) :
        new Web3.providers.IpcProvider(`${/^win/.test(process.platform) ? '\\\\.\\pipe\\' : ''}${config.web3.providers[0]}`, net);

      ctx.web3 = new Web3(provider);
      ctx.accounts = await Promise.promisify(ctx.web3.eth.getAccounts)();


      ctx.amqp = {};
      ctx.amqp.instance = await amqp.connect(config.rabbit.url);
      ctx.amqp.channel = await ctx.amqp.instance.createChannel();
      await ctx.amqp.channel.assertExchange('events', 'topic', {durable: false});
      await ctx.amqp.channel.assertExchange('internal', 'topic', {durable: false});
      await ctx.amqp.channel.assertQueue(`${config.rabbit.serviceName}_current_provider.get`, {
        durable: false,
        autoDelete: true
      });
      await ctx.amqp.channel.bindQueue(`${config.rabbit.serviceName}_current_provider.get`, 'internal', `${config.rabbit.serviceName}_current_provider.get`);*/

  });

  after(async () => {
    /*    mongoose.disconnect();
        mongoose.accounts.close();
        await ctx.amqp.instance.close();*/
    //ctx.nodePid.kill();
  });


  /*  describe('block', () => blockTests(ctx));

    describe('fuzz', () => fuzzTests(ctx));

    describe('performance', () => performanceTests(ctx));*/

  describe('features', () => featuresTests(ctx));

});
