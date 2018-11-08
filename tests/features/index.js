/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

require('dotenv/config');

const config = require('../../config'),
  models = require('../../models'),
  _ = require('lodash'),
  Wallet = require('ethereumjs-wallet'),
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


   // ctx.sidechainPid = spawn('node', ['index.js'], {env: process.env, stdio: 'ignore'});
   // await Promise.delay(30000);
    //await Promise.delay(5000);
  });


  it('send tokens to user', async () => {

    const timeAddress = await ctx.providers.main.contracts.ERC20Manager.methods.getTokenAddressBySymbol(ctx.providers.main.web3.utils.asciiToHex(config.sidechain.web3.symbol)).call();
    ctx.providers.main.contracts.ERC20Interface.options.address = timeAddress;
    const timeBalance = await ctx.providers.main.contracts.ERC20Interface.methods.balanceOf(ctx.providers.main.address).call();

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


    const balanceSidechain = await ctx.providers.sidechain.web3.eth.getBalance(ctx.userWallet.address);

    if(parseInt(balanceSidechain) < Math.pow(10, 19)){

      await ctx.providers.sidechain.web3.eth.sendTransaction({
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

    await ctx.amqp.channel.publish('events', `${config.main.rabbit.serviceName}_chrono_sc.lock`, new Buffer(JSON.stringify({
      name: 'lock',
      payload: args
    })));

    await Promise.delay(10000);

  });

  it('transfer 1000 tokens (mainnet->sidechain)', async () => {

    await Promise.delay(10000);

    const userWallet = Wallet.fromPrivateKey(Buffer.from(ctx.userWallet.privateKey.replace('0x', ''), 'hex'));
    const userPubKey = userWallet.getPublicKey().toString('hex');

    const swapList = await request({
      uri: `http://localhost:${config.rest.port}/mainnet/swaps/${ctx.userWallet.address}`,
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


    const key = await EthCrypto.decryptWithPrivateKey(ctx.userWallet.privateKey, keyEncoded);

    expect(key).to.not.empty;

    const web3 = ctx.providers.main.web3;
    const contracts = ctx.providers.sidechain.contracts;

    const platform = contracts.ChronoBankPlatform;

    contracts.ERC20Interface.options.address = await platform.methods.proxies(web3.utils.asciiToHex(config.sidechain.web3.symbol)).call();

    const oldSidechainBalance = await contracts.ERC20Interface.methods.balanceOf(ctx.userWallet.address).call();

    const closeTx = await contracts.AtomicSwapERC20.methods.close(web3.utils.asciiToHex(swapid), web3.utils.asciiToHex(key)).send({from: ctx.userWallet.address, gas: 5700000});

    const newSidechainBalance = await contracts.ERC20Interface.methods.balanceOf(ctx.userWallet.address).call();
    expect(newSidechainBalance - oldSidechainBalance).to.eq(1000);


    await ctx.amqp.channel.publish('events', `${config.rabbit.serviceName}_chrono_sc.close`, new Buffer(JSON.stringify({
      name: 'close',
      payload: closeTx.events.Close.returnValues
    })));



  });

  it('burn 1000 tokens (sidechain)', async () => {

    const contracts = ctx.providers.sidechain.contracts;
    const web3 = ctx.providers.sidechain.web3;

    const platform = contracts.ChronoBankPlatform;
    contracts.ERC20Interface.options.address = await platform.methods.proxies(web3.utils.asciiToHex(config.sidechain.web3.symbol)).call();

    const oldSidechainBalance = await contracts.ERC20Interface.methods.balanceOf(ctx.userWallet.address).call();
    const revokeTx = await platform.methods.revokeAsset(web3.utils.asciiToHex(config.sidechain.web3.symbol), 1000).send({from: ctx.userWallet.address, gas: 5700000});

    await ctx.amqp.channel.publish('events', `${config.sidechain.rabbit.serviceName}_chrono_sc.revoke`, new Buffer(JSON.stringify({
      name: 'revoke',
      payload: revokeTx.events.Revoke.returnValues
    })));

    const newSidechainBalance = await contracts.ERC20Interface.methods.balanceOf(ctx.userWallet.address).call();


    expect(oldSidechainBalance - newSidechainBalance).to.eq(1000);
  });

  it('transfer 1000 tokens (sidechain->mainnet)', async () => {

    await Promise.delay(10000);

    const userWallet = Wallet.fromPrivateKey(Buffer.from(ctx.userWallet.privateKey.replace('0x', ''), 'hex'));
    const userPubKey = userWallet.getPublicKey().toString('hex');

    const swapList = await request({
      uri: `http://localhost:8081/sidechain/swaps/${ctx.userWallet.address}`,
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

    const contracts = ctx.providers.main.contracts;
    const web3 = ctx.providers.main.web3;

    const key = await EthCrypto.decryptWithPrivateKey(ctx.userWallet.privateKey, keyEncoded);

    expect(key).to.not.empty;

    contracts.ERC20Interface.options.address = await contracts.ERC20Manager.methods.getTokenAddressBySymbol(web3.utils.asciiToHex(config.main.web3.symbol)).call();

    const oldBalanceDeposit = await contracts.TimeHolder.methods.getDepositBalance(contracts.ERC20Interface.options.address, ctx.userWallet.address).call();
    const oldBalance = await contracts.ERC20Interface.methods.balanceOf(ctx.userWallet.address).call();

    const unlockTx = await contracts.TimeHolder.methods.unlockShares(web3.utils.asciiToHex(swapid), web3.utils.asciiToHex(key)).send({from: ctx.userWallet.address, gas: 5700000});
    expect(unlockTx).to.not.empty;

    const newBalanceDeposit = await contracts.TimeHolder.methods.getDepositBalance(contracts.ERC20Interface.options.address, ctx.userWallet.address).call();

    expect(newBalanceDeposit - oldBalanceDeposit).to.eq(1000);

    await contracts.TimeHolder.methods.withdrawShares(contracts.ERC20Interface.options.address, 1000).send({from: ctx.userWallet.address, gas: 570000});
    const newBalance = await contracts.ERC20Interface.methods.balanceOf(ctx.userWallet.address).call();

    console.log('user address', ctx.userWallet.address)

    expect(newBalance - oldBalance).to.eq(1000);
  });



  after('kill environment', async () => {
    // ctx.blockProcessorPid.kill();
    // await Promise.delay(30000);
  });


};
