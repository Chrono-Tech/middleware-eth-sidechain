/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

require('dotenv/config');
process.env.LOG_LEVEL = 'error';

const config = require('../config'),
  models = require('../models'),
  {fork} = require('child_process'),
  path = require('path'),
  Web3 = require('web3'),
  web3 = new Web3(),
  //fuzzTests = require('./fuzz'),
  /*performanceTests = require('./performance'),
  blockTests = require('./blocks'),*/
  featuresTests = require('./features'),
  Promise = require('bluebird'),
  mongoose = require('mongoose'),
  amqp = require('amqplib'),
  ctx = {};

mongoose.Promise = Promise;
mongoose.main = mongoose.createConnection(config.main.mongo.uri);
mongoose.sidechain = mongoose.createConnection(config.sidechain.mongo.uri);


describe('core/sidechain', function () {

  before(async () => {
    models.init();

/*    ctx.nodePid = fork(path.join(__dirname, 'node/nodesCluster.js'), {//todo uncomment
      env: process.env,
      stdio: 'inherit'
    });


    await new Promise(res => {
      ctx.nodePid.on('message', (message) => {
        if (message.status)
          res();
      });
    });*/


    ctx.ownerWallet = web3.eth.accounts.privateKeyToAccount('0xfa76f1264b268a7900584fd845ae602affd05bf1a25687a788f8b851e507db34');
    ctx.userWallet = web3.eth.accounts.privateKeyToAccount('0x0b225e8c97627cf9c13bec195c2cdba58715023105c8f67b020efa1d70ebd12b'); //todo replace with random

    ctx.web3 = {
      main: new Web3('http://localhost:8545'),
      sidechain: new Web3('http://localhost:8546') //todo move to config
    };

    ctx.amqp = {};
    ctx.amqp.instance = await amqp.connect(config.main.rabbit.url);
    ctx.amqp.channel = await ctx.amqp.instance.createChannel();
    await ctx.amqp.channel.assertExchange('events', 'topic', {durable: false});


    await Promise.delay(5000);
  //  ctx.nodePid.kill();
  });

  after(async () => {
    /*    mongoose.disconnect();
        mongoose.accounts.close();
        await ctx.amqp.instance.close();*/
    //ctx.nodePid.kill();
  });


  //  describe('block', () => blockTests(ctx));

  //describe('fuzz', () => fuzzTests(ctx));

  ///describe('performance', () => performanceTests(ctx));*/

  describe('features', () => featuresTests(ctx));

});
