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
mongoose.accounts = mongoose.createConnection(config.mongo.accounts.uri);
mongoose.data = mongoose.createConnection(config.mongo.data.uri);

const Web3 = require('web3'),
  request = require('request'),
  expect = require('chai').expect,
  amqp = require('amqplib'),
  exchangeModel = require('../models/exchangeModel');

let web3, 
  contracts = config.nodered.functionGlobalContext.contracts,
  sidechainContracts = config.nodered.functionGlobalContext.sidechainContracts,
  sidechainWeb3,
  channel;

const getMainnetBalance = async (timeAddress, userAddress) {
    contracts.ERC20Interface.setProvider(web3.currentProvider); 
    return await contracts.ERC20Interface.at(timeAddress).balanceOf(userAddress);
}

const getSidechainBalance = async(timeAddress, userAddress) {
    sidechainContracts.ChronoBankPlatform.setProvider(sidechainWeb3.currentProvider);
    const platform = await sidechainContracts.ChronoBankPlatform.deployed();
    const tokenAddress = await platform.proxies(symbol);

    contracts.ERC20Interface.setProvider(sidechainWeb3.currentProvider); 
    return await contracts.ERC20Interface.at(timeAddress).balanceOf(userAddress);
}

describe('core/eth-sidechain', function () { //todo add integration tests for query, push tx, history and erc20tokens

  before(async () => {
    await exchangeModel.remove();

    let amqpInstance = await amqp.connect(config.nodered.functionGlobalContext.settings.rabbit.url);
    channel = await amqpInstance.createChannel();
  
    try {
      await channel.assertExchange('events', 'topic', {durable: false});
    } catch (e) {
      channel = await amqpInstance.createChannel();
    }

    const sidechainProvider = new Web3.providers.HttpProvider(config.nodered.functionGlobalContext.settings.sidechain.uri);
    sidechainWeb3 = new Web3();
    sidechainWeb3.setProvider(sidechainProvider);


    const mainnetProvider = new Web3.providers.HttpProvider(config.nodered.functionGlobalContext.settings.mainnet.uri);
    web3 = new Web3();
    web3.setProvider(mainnetProvider);
  });

  after(async () => {
    return mongoose.disconnect();
  });



  it('check from mainnet to sidechain', async () => {

    

    const privateKey = 'b7616111ee3c709ff907777d25b863d15109494a240d39c4f0b51fdb5245e99b';
    const userWallet = Wallet.fromPrivateKey(Buffer.from(privateKey, 'hex'));
    const userAddress = `0x${userWallet.getAddress().toString('hex')}`;
    const userPubKey = userWallet.getPublicKey().toString('hex');

    contracts.ERC20Manager.setProvider(web3.currentProvider); 
    contracts.TimeHolder.setProvider(web3.currentProvider); 
    contracts.TimeHolderWallet.setProvider(web3.currentProvider); 
    contracts.ERC20Interface.setProvider(web3.currentProvider); 
    sidechainContracts.AtomicSwapERC20.setProvider(sidechainWeb3.currentProvider); //8546
    
    const  erc20Manager = await contracts.ERC20Manager.deployed();
    const timeHolderWallet = await contracts.TimeHolderWallet.deployed();
    const timeHolder = await contracts.TimeHolder.deployed();
    const swapContract = await sidechainContracts.AtomicSwapERC20.deployed();

    const timeAddress = await erc20Manager.getTokenAddressBySymbol("TIME");

    await contracts.ERC20Interface.at(timeAddress).approve(timeHolderWallet.address, 1000, {from: userAddress, gas: 5700000});
    const initBalance = await contracts.ERC20Interface.at(timeAddress).balanceOf(userAddress);
    
    const lock = await timeHolder.deposit(timeAddress, 1000, {from: userAddress, gas: 5700000})
    expect(lock.logs[0].args.who).to.not.be.empty;

    await timeHolder.lock(timeAddress, 1000, {from: userAddress, gas: 5700000})

    await Promise.delay(5000);

  
    const swapList = await request({
      uri: `http://localhost:8081/swaps/${userAddress}`,
      json: true
    });
    expect(swapList).to.not.be.empty;
  
    const swapid = swapList[0].swap_id;
  
    const keyEncoded = await request({
      method: 'POST',
      uri: `http://localhost:8081/swaps/obtain/${swapid}`,
      body: {
        pubkey: userPubKey
      },
      json: true
    });
  
    const key = await EthCrypto.decryptWithPrivateKey(`0x${privateKey.toString('hex')}`, keyEncoded);
    expect(key).to.not.empty;
    expect(userAddress).to.not.empty;
  
    const response = await swapContract.close(swapid, key, {from: userAddress, gas: 5700000});
    expect(response).to.not.emtpy;

    const newBalance = await contracts.ERC20Interface.at(timeAddress).balanceOf(userAddress);
    console.log('newBalance on mainnet', initBalance, newBalance);
    expect(newBalance.minus(initBalance).lessThan(1000));

    
    sidechainContracts.ERC20Interface.setProvider(sidechainWeb3.currentProvider); 
    const newSidechainBalance = await contracts.ERC20Interface.at(timeAddress).balanceOf(userAddress);
    console.log('newBalance on sidechain', newSidechainBalance);
    expect(newSidechainBalance


  });

  /*it('check from sidechain to mainnet', async () => {
      const privateKey = 'b7616111ee3c709ff907777d25b863d15109494a240d39c4f0b51fdb5245e99b';
    const userWallet = Wallet.fromPrivateKey(Buffer.from(privateKey, 'hex'));
    const userAddress = `0x${userWallet.getAddress().toString('hex')}`;
    const userPubKey = userWallet.getPublicKey().toString('hex');
    
    contracts.ERC20Manager.setProvider(web3.currentProvider); 
    contracts.ERC20Interface.setProvider(web3.currentProvider); 
    contracts.TimeHolder.setProvider(web3.currentProvider); 
    contracts.TimeHolderWallet.setProvider(web3.currentProvider); 
    
    let erc20Manager = await contracts.ERC20Manager.deployed();
    const timeAddress = await erc20Manager.getTokenAddressBySymbol("TIME");
    //8546 
    try{
        newBalance = await contracts.ERC20Interface.at(timeAddress).balanceOf(userAddress);
        console.log('oldBalance', newBalance.toNumber());
    sidechainContracts.ChronobankPlatform.setProvider(sidechainWeb3.currentProvider); //8546
    let platform = await sidechainContracts.ChronobankPlatform.deployed();
    await platform.revokeAsset("TIME", 1000, {from: userAddress});
  
  
    await Promise.delay(5000);
  
    const swapList = await request({
      uri: `http://localhost:8081/swaps/${userAddress}`,
      json: true
    });
  
    const swapid = swapList[0].swap_id;
  
    const keyEncoded = await request({
      method: 'POST',
      uri: `http://localhost:8081/swaps/obtain/${swapid}`,
      body: {
        pubkey: userPubKey
      },
      json: true
    });
  
    const key = await EthCrypto.decryptWithPrivateKey(`0x${userWallet.getPrivateKey().toString('hex')}`, keyEncoded);
  
    expect(key).to.not.empty;
    expect(userAddress).to.not.empty;
  
    // 8545
    contracts.TimeHolder.setProvider(web3.currentProvider);
    const timeHolder = await contracts.TimeHolder.deployed();
    const response = await timeHolder.unlockShares(swapid, key, {from: userAddress, gas: 5700000});
        newBalance = await contracts.ERC20Interface.at(timeAddress).balanceOf(userAddress);
    expect(response).to.not.emtpy;
    contracts.ERC20Manager.setProvider(web3.currentProvider); 
    contracts.ERC20Interface.setProvider(web3.currentProvider); 
    contracts.TimeHolder.setProvider(web3.currentProvider); 
    contracts.TimeHolderWallet.setProvider(web3.currentProvider); 
    
    let erc20Manager = await contracts.ERC20Manager.deployed();
    const timeAddress = await erc20Manager.getTokenAddressBySymbol("TIME");
    //8546 
    try{
        newBalance = await contracts.ERC20Interface.at(timeAddress).balanceOf(userAddress);
        console.log('oldBalance', newBalance.toNumber());
    sidechainContracts.ChronobankPlatform.setProvider(sidechainWeb3.currentProvider); //8546
    let platform = await sidechainContracts.ChronobankPlatform.deployed();
    await platform.revokeAsset("TIME", 1000, {from: userAddress});
  
  
    await Promise.delay(5000);
  
    const swapList = await request({
      uri: `http://localhost:8081/swaps/${userAddress}`,
      json: true
    });
  
    } catch(e) {
        newBalance = await contracts.ERC20Interface.at(timeAddress).balanceOf(userAddress);
        console.log(newBalance.toNumber()+1000);
    }
  });*/

});
