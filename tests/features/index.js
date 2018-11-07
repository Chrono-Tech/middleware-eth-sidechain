/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

require('dotenv/config');

const config = require('../../config'),
  models = require('../../models'),
  _ = require('lodash'),
  request = require('request-promise'),
  EthCrypto = require('eth-crypto'),
  expect = require('chai').expect,
  Promise = require('bluebird'),
  spawn = require('child_process').spawn;

module.exports = (ctx) => {

  before(async () => {
    await models.exchangeModel.remove({});
    await models.sidechainExchangeModel.remove({});

/*
    config.main.contracts.ERC20Manager.setProvider(ctx.web3.main.currentProvider);
    config.main.contracts.TimeHolder.setProvider(ctx.web3.main.currentProvider);
    config.main.contracts.TimeHolderWallet.setProvider(ctx.web3.main.currentProvider);
    config.main.contracts.ERC20Interface.setProvider(ctx.web3.main.currentProvider);

    config.sidechain.contracts.ChronoBankPlatform.setProvider(ctx.web3.sidechain.currentProvider);
    config.sidechain.contracts.ERC20Interface.setProvider(ctx.web3.sidechain.currentProvider);
    config.sidechain.contracts.AtomicSwapERC20.setProvider(ctx.web3.sidechain.currentProvider);
*/


    ctx.sidechainPid = spawn('node', ['index.js'], {env: process.env, stdio: 'ignore'});
    await Promise.delay(30000);
    //await Promise.delay(5000);
  });


  it('send tokens to user', async () => {

    const timeAddress = await ctx.providers.main.contracts.ERC20Manager.methods.getTokenAddressBySymbol(ctx.providers.main.web3.utils.asciiToHex(config.sidechain.web3.symbol)).call();
    ctx.providers.main.contracts.ERC20Interface.options.address = timeAddress;
    const timeBalance = await ctx.providers.main.contracts.ERC20Interface.methods.balanceOf(ctx.providers.main.address).call({to: timeAddress});

    if (parseInt(timeBalance) < 1000) {

      await ctx.providers.main.contracts.ERC20Interface.methods.transfer(ctx.providers.main.address, 1000).send({
        to: timeAddress,
        from: ctx.ownerWallet.address,
        gas: 570000
      });

      const timeBalance = await ctx.providers.main.contracts.ERC20Interface.methods.balanceOf(ctx.providers.main.address).call({to: timeAddress});
      expect(parseInt(timeBalance)).to.be.gte(1000);
    }


    const balance = await ctx.providers.main.web3.eth.getBalance(ctx.userWallet.address);

    if(parseInt(balance) < Math.pow(10, 19)){

      await ctx.providers.main.web3.eth.sendTransaction({
        from: ctx.ownerWallet.address,
        to: ctx.userWallet.address,
        value: Math.pow(10, 19).toString()
      })

    }




  });



  it('lock 1000 tokens (mainnet)', async () => {

    const timeAddress = await ctx.providers.main.contracts.ERC20Manager.methods.getTokenAddressBySymbol(ctx.providers.main.web3.utils.asciiToHex(config.sidechain.web3.symbol)).call();
    ctx.providers.main.contracts.ERC20Interface.options.address = timeAddress;
    const timeBalance = await ctx.providers.main.contracts.ERC20Interface.methods.balanceOf(ctx.providers.main.address).call({to: timeAddress});


    await ctx.providers.main.contracts.ERC20Interface.methods.approve(ctx.providers.main.contracts.TimeHolderWallet.options.address, 1000).send({
      from: ctx.userWallet.address,
      gas: 5700000
    });

    const depositTx = await ctx.providers.main.contracts.TimeHolder.methods.deposit(timeAddress, 1000).send({from: ctx.userWallet.address, gas: 5700000});

    expect(depositTx.events.Deposit).to.not.be.empty;
    const timeBalance2 = await ctx.providers.main.contracts.ERC20Interface.methods.balanceOf(ctx.providers.main.address).call({to: timeAddress});


    expect(timeBalance - timeBalance2).to.eq(1000);

    const lockTx = await ctx.providers.main.contracts.TimeHolder.methods.lock(timeAddress, 1000).send({from: ctx.userWallet.address, gas: 5700000});

    expect(lockTx.events.Lock).to.not.be.empty;

    let args = _.chain(lockTx.events.Lock.returnValues)
      .toPairs()
      .reject(pair=> !!parseInt(pair[0]))
      .fromPairs()
      .value();

    console.log(args)

    await ctx.amqp.channel.publish('events', `${config.main.rabbit.serviceName}_chrono_sc.lock`, new Buffer(JSON.stringify({
      name: 'lock',
      payload: args
    })));

    await Promise.delay(10000);

  });


/*
  it('transfer 1000 tokens (mainnet->sidechain)', async () => {

    await Promise.delay(10000);

    const userAddress = `0x${ctx.userWallet.getAddress().toString('hex')}`;
    const userPubKey = ctx.userWallet.getPublicKey().toString('hex');
    const userPrivKey = ctx.userWallet.getPrivateKeyString();

    const swapList = await request({
      uri: `http://localhost:${config.rest.port}/mainnet/swaps/${userAddress}`,
      json: true
    });

    expect(swapList).to.not.be.empty;


    const swapid = swapList[0].swapId;

    const keyEncoded = await request({
      method: 'POST',
      uri: `http://localhost:${config.rest.port}/mainnet/swaps/obtain/${swapid}`,
      body: {
        pubkey: userPubKey
      },
      json: true
    });

    const key = await EthCrypto.decryptWithPrivateKey(userPrivKey, keyEncoded);

    expect(key).to.not.empty;
    expect(userAddress).to.not.empty;


    const platform = await config.sidechain.contracts.ChronoBankPlatform.deployed();
    const tokenAddress = await platform.proxies(config.sidechain.web3.symbol);

    const oldSidechainBalance = await config.sidechain.contracts.ERC20Interface.at(tokenAddress).balanceOf(userAddress);

    const swapContract = await config.sidechain.contracts.AtomicSwapERC20.deployed();
    const closeTx = await swapContract.close(swapid, key, {from: userAddress, gas: 5700000});

    const newSidechainBalance = await config.sidechain.contracts.ERC20Interface.at(tokenAddress).balanceOf(userAddress);
    expect(newSidechainBalance.minus(oldSidechainBalance).toString()).to.eq('1000');

    const closeEvent = _.find(closeTx.logs, {event: 'Close'});

    await ctx.amqp.channel.publish('events', `${config.rabbit.serviceName}_chrono_sc.close`, new Buffer(JSON.stringify({
      name: 'close',
      payload: closeEvent.args
    })));


  });

  it('burn 1000 tokens (sidechain)', async () => {

    const userAddress = `0x${ctx.userWallet.getAddress().toString('hex')}`;

    const platform = await config.sidechain.contracts.ChronoBankPlatform.deployed();
    const tokenAddress = await platform.proxies(config.sidechain.web3.symbol);

    const oldSidechainBalance = await config.sidechain.contracts.ERC20Interface.at(tokenAddress).balanceOf(userAddress);

    const revokeTx = await platform.revokeAsset(config.sidechain.web3.symbol, 1000, {from: userAddress, gas: 5700000});

    const revokeEvent = _.find(revokeTx.logs, {event: 'Revoke'});

    await ctx.amqp.channel.publish('events', `${config.sidechain.rabbit.serviceName}_chrono_sc.revoke`, new Buffer(JSON.stringify({
      name: 'revoke',
      payload: revokeEvent.args
    })));

    const newSidechainBalance = await config.sidechain.contracts.ERC20Interface.at(tokenAddress).balanceOf(userAddress);

    expect(oldSidechainBalance.minus(newSidechainBalance).toString()).to.eq('1000');
  });

  it('transfer 1000 tokens (sidechain->mainnet)', async () => {

    await Promise.delay(10000);

    const userAddress = `0x${ctx.userWallet.getAddress().toString('hex')}`;
    const userPubKey = ctx.userWallet.getPublicKey().toString('hex');
    const userPrivKey = ctx.userWallet.getPrivateKeyString();

    const swapList = await request({
      uri: `http://localhost:8081/sidechain/swaps/${userAddress}`,
      json: true
    });

    expect(swapList).to.not.be.empty;

    const swapid = swapList[0].swapId;

    const keyEncoded = await request({
      method: 'POST',
      uri: `http://localhost:8081/sidechain/swaps/obtain/${swapid}`,
      body: {
        pubkey: userPubKey
      },
      json: true
    });

    const key = await EthCrypto.decryptWithPrivateKey(userPrivKey, keyEncoded);
    const keyHash = sha3.sha3_256(key);

    expect(key).to.not.empty;
    expect(userAddress).to.not.empty;

    let erc20Manager = await config.main.contracts.ERC20Manager.deployed();
    const timeAddress = await erc20Manager.getTokenAddressBySymbol(config.main.web3.symbol);

    const oldBalance = await config.main.contracts.ERC20Interface.at(timeAddress).balanceOf(userAddress);

    const timeHolder = await config.main.contracts.TimeHolder.deployed();
    console.log(swapid, key, keyHash);
    const unlockTx = await timeHolder.unlockShares(swapid, key, {from: userAddress, gas: 5700000});

   // const unlockTx = await timeHolder.unlockShares.call(swapid, `0x${keyHash}`, {from: userAddress, gas: 5700000});


    expect(unlockTx).to.not.empty;

    console.log(unlockTx);

    const newBalance = await config.main.contracts.ERC20Interface.at(timeAddress).balanceOf(userAddress);

    console.log(oldBalance, newBalance)

    expect(newBalance.minus(oldBalance).toString()).to.eq('1000');
  });

*/

  after('kill environment', async () => {
    // ctx.blockProcessorPid.kill();
    // await Promise.delay(30000);
  });


};
