/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */

const Wallet = require('ethereumjs-wallet'),
  EthCrypto = require('eth-crypto'),
  mongoose = require('mongoose'),
  Promise = require('bluebird'),
  config = require('../config');


process.env.USE_MONGO_DATA = 1;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

mongoose.Promise = Promise;
mongoose.mainnet = mongoose.createConnection(config.main.mongo.uri);
mongoose.sidechain = mongoose.createConnection(config.sidechain.mongo.uri);

const Web3 = require('web3'),
  request = require('request-promise'),
  expect = require('chai').expect,
  amqp = require('amqplib'),
  exchangeModel = require('../models/exchangeModel'),
  sidechainExchangeModel = require('../models/sidechainExchangeModel');

let web3,
  sidechainWeb3,
  channel;

describe('core/eth-sidechain', function () { //todo add integration tests for query, push tx, history and erc20tokens

  before(async () => {
    await exchangeModel.remove();
    await sidechainExchangeModel.remove();

    let amqpInstance = await amqp.connect(config.rabbit.url);
    channel = await amqpInstance.createChannel();
    await channel.assertExchange('events', 'topic', {durable: false});

    sidechainWeb3 = new Web3();
    sidechainWeb3.setProvider(config.sidechain.web3.provider);

    web3 = new Web3();
    web3.setProvider(config.main.web3.provider);
  });

  after(async () => {
    return mongoose.disconnect();
  });


  it('check from mainnet to sidechain', async () => {
    const privateKey = '6b9027372deb53f4ae973a5614d8a57024adf33126ece6b587d9e08ba901c0d2'; //owner account
    const userWallet = Wallet.fromPrivateKey(Buffer.from(privateKey, 'hex'));
    const userAddress = `0x${userWallet.getAddress().toString('hex')}`;
    const userPubKey = userWallet.getPublicKey().toString('hex');

    config.main.contracts.ERC20Manager.setProvider(web3.currentProvider);
    config.main.contracts.TimeHolder.setProvider(web3.currentProvider);
    config.main.contracts.TimeHolderWallet.setProvider(web3.currentProvider);
    config.main.contracts.ERC20Interface.setProvider(web3.currentProvider);
    config.sidechain.contracts.AtomicSwapERC20.setProvider(sidechainWeb3.currentProvider); //8546

    const erc20Manager = await config.main.contracts.ERC20Manager.deployed();
    const timeHolderWallet = await config.main.contracts.TimeHolderWallet.deployed();
    const timeHolder = await config.main.contracts.TimeHolder.deployed();
    const swapContract = await config.sidechain.contracts.AtomicSwapERC20.deployed();

    const timeAddress = await erc20Manager.getTokenAddressBySymbol(config.sidechain.web3.symbol);
    await config.main.contracts.ERC20Interface.at(timeAddress).approve(timeHolderWallet.address, 1000, {
      from: userAddress,
      gas: 5700000
    });

    const initBalance = await config.main.contracts.ERC20Interface.at(timeAddress).balanceOf(userAddress);
    console.log('initBalance on mainnet', initBalance.toNumber());

    const lock = await timeHolder.deposit(timeAddress, 1000, {from: userAddress, gas: 5700000})
    expect(lock.logs[0].args.who).to.not.be.empty;
    await timeHolder.lock(timeAddress, 1000, {from: userAddress, gas: 5700000})

    await Promise.delay(20000);


    const swapList = await request({
      uri: `http://localhost:8081/mainnet/swaps/${userAddress}`,
      json: true
    });
    expect(swapList).to.not.be.empty;

    const swapid = swapList[0].swapId;

    const keyEncoded = await request({
      method: 'POST',
      uri: `http://localhost:8081/mainnet/swaps/obtain/${swapid}`,
      body: {
        pubkey: userPubKey
      },
      json: true
    });

    const key = await EthCrypto.decryptWithPrivateKey(`0x${privateKey.toString('hex')}`, keyEncoded);
    expect(key).to.not.empty;
    expect(userAddress).to.not.empty;


    config.sidechain.contracts.ChronoBankPlatform.setProvider(sidechainWeb3.currentProvider);
    const platform = await config.sidechain.contracts.ChronoBankPlatform.deployed();
    const tokenAddress = await platform.proxies(config.sidechain.web3.symbol);

    config.sidechain.contracts.ERC20Interface.setProvider(sidechainWeb3.currentProvider);
    const oldSidechainBalance = await config.sidechain.contracts.ERC20Interface.at(tokenAddress).balanceOf(userAddress);
    console.log('oldBalance on sidechain', tokenAddress, oldSidechainBalance.toNumber());

    const response = await swapContract.close(swapid, key, {from: userAddress, gas: 5700000});
    expect(response).to.not.empty;


    const newBalance = await config.main.contracts.ERC20Interface.at(timeAddress).balanceOf(userAddress);
    console.log('newBalance on mainnet', newBalance.toNumber());

    config.sidechain.contracts.ERC20Interface.setProvider(sidechainWeb3.currentProvider);
    const newSidechainBalance = await config.sidechain.contracts.ERC20Interface.at(tokenAddress).balanceOf(userAddress);
    console.log('newBalance on sidechain', newSidechainBalance.toNumber());


  });


  it('check from sidechain to mainnet', async () => {
    const privateKey = '6b9027372deb53f4ae973a5614d8a57024adf33126ece6b587d9e08ba901c0d2';
    const userWallet = Wallet.fromPrivateKey(Buffer.from(privateKey, 'hex'));
    const userAddress = `0x${userWallet.getAddress().toString('hex')}`;
    const userPubKey = userWallet.getPublicKey().toString('hex');

    config.main.contracts.ERC20Manager.setProvider(web3.currentProvider);
    config.main.contracts.ERC20Interface.setProvider(web3.currentProvider);
    config.main.contracts.TimeHolder.setProvider(web3.currentProvider);
    config.main.contracts.TimeHolderWallet.setProvider(web3.currentProvider);

    let erc20Manager = await config.main.contracts.ERC20Manager.deployed();
    const timeAddress = await erc20Manager.getTokenAddressBySymbol(config.sidechain.web3.symbol);

    const initBalance = await config.main.contracts.ERC20Interface.at(timeAddress).balanceOf(userAddress);
    console.log('oldBalance on mainnet', initBalance.toNumber());

    config.sidechain.contracts.ChronoBankPlatform.setProvider(sidechainWeb3.currentProvider);
    const platform = await config.sidechain.contracts.ChronoBankPlatform.deployed();

    const tokenAddress = await platform.proxies(config.sidechain.web3.symbol);


    config.sidechain.contracts.ERC20Interface.setProvider(sidechainWeb3.currentProvider);
    const oldSidechainBalance = await config.sidechain.contracts.ERC20Interface.at(tokenAddress).balanceOf(userAddress);
    console.log('oldBalance on sidechain', oldSidechainBalance.toNumber());

    await platform.revokeAsset(config.sidechain.web3.symbol, 1000, {from: userAddress, gas: 5700000});


    await Promise.delay(20000);

    const swapList = await request({
      uri: `http://localhost:8081/sidechain/swaps/${userAddress}`,
      json: true
    });

    const swapid = swapList[0].swapId;

    const keyEncoded = await request({
      method: 'POST',
      uri: `http://localhost:8081/sidechain/swaps/obtain/${swapid}`,
      body: {
        pubkey: userPubKey
      },
      json: true
    });

    const key = await EthCrypto.decryptWithPrivateKey(`0x${userWallet.getPrivateKey().toString('hex')}`, keyEncoded);

    expect(key).to.not.empty;
    expect(userAddress).to.not.empty;


    config.main.contracts.TimeHolder.setProvider(web3.currentProvider);
    const timeHolder = await config.main.contracts.TimeHolder.deployed();
    const response = await timeHolder.unlockShares(swapid, key, {from: userAddress, gas: 5700000});
    expect(response).to.not.empty;


    const newBalance = await config.main.contracts.ERC20Interface.at(timeAddress).balanceOf(userAddress);
    console.log('newBalance on mainnet', newBalance.toNumber());
    expect(newBalance.minus(initBalance).lessThan(1000));


    config.sidechain.contracts.ERC20Interface.setProvider(sidechainWeb3.currentProvider);
    const newSidechainBalance = await config.sidechain.contracts.ERC20Interface.at(tokenAddress).balanceOf(userAddress);
    console.log('newBalance on sidechain', newSidechainBalance.toNumber());
    expect(newSidechainBalance.minus(initBalance).lessThan(1000));

  });


});
