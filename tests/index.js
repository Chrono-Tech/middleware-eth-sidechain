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
  requireAll = require('require-all'),
  contract = require('truffle-contract'),
  path = require('path'),
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
        console.log(data);
        if (data.includes('sidechain token'))
          res();
      });
    });

    config.main.contracts = requireAll({
        dirname: process.env.SMART_CONTRACTS_PATH ? path.resolve(process.env.SMART_CONTRACTS_PATH) : path.resolve(__dirname, '../node_modules/chronobank-smart-contracts/build/contracts'),
        resolve: Contract => contract(Contract)
      });

    config.sidechain.contracts = requireAll({
      dirname: process.env.SMART_ATOMIC_CONTRACTS_PATH ? path.resolve(process.env.SMART_ATOMIC_CONTRACTS_PATH) : path.resolve(__dirname, '../node_modules/chronobank-smart-contracts/build/contracts'),
      resolve: Contract => contract(Contract)
    });

    ctx.web3 = {
      main: new Web3(config.main.web3.provider.getInstance()),
      sidechain: new Web3(config.sidechain.web3.provider.getInstance())
    };

    ctx.amqp = {};
    ctx.amqp.instance = await amqp.connect(config.rabbit.url);
    ctx.amqp.channel = await ctx.amqp.instance.createChannel();
    await ctx.amqp.channel.assertExchange('events', 'topic', {durable: false});


    await Promise.delay(5000);
    ctx.nodePid.on('exit', function () {
      process.exit(1);
    });
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
