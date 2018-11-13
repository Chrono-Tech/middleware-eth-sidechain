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
  requireAll = require('require-all'),
  Web3 = require('web3'),
  web3 = new Web3(),
  //contract = require('truffle-contract'),
  path = require('path'),
  WalletProvider = require('../services/WalletProvider');
  fuzzTests = require('./fuzz'),
  /*performanceTests = require('./performance'),
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

    const mainContracts = requireAll({
        dirname: process.env.SMART_CONTRACTS_PATH ? path.resolve(process.env.SMART_CONTRACTS_PATH) : path.resolve(__dirname, '../node_modules/chronobank-smart-contracts/build/contracts')
      });

    const sidechainContracts = requireAll({
      dirname: process.env.SMART_ATOMIC_CONTRACTS_PATH ? path.resolve(process.env.SMART_ATOMIC_CONTRACTS_PATH) : path.resolve(__dirname, '../node_modules/chronobank-smart-contracts/build/contracts')
    });



    ctx.ownerWallet = web3.eth.accounts.privateKeyToAccount('0x6b9027372deb53f4ae973a5614d8a57024adf33126ece6b587d9e08ba901c0d2');
    ctx.userWallet = web3.eth.accounts.create();

    ctx.providers = {
      main: new WalletProvider(ctx.userWallet.privateKey, config.main.web3.uri, mainContracts),
      sidechain: new WalletProvider(ctx.userWallet.privateKey, config.sidechain.web3.uri, sidechainContracts)
    };

    ctx.providers.main = await ctx.providers.main.getInstance();
    ctx.providers.sidechain = await ctx.providers.sidechain.getInstance();


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


  //  describe('block', () => blockTests(ctx));

    describe('fuzz', () => fuzzTests(ctx));

    ///describe('performance', () => performanceTests(ctx));*/

  //describe('features', () => featuresTests(ctx));

});
