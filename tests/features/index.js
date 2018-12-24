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
  crypto = require('crypto'),
  expect = require('chai').expect,
  transformTxToRaw = require('../utils/encoding/transformTxToRaw'),
  Promise = require('bluebird'),
  updateBlockchainCache = require('../utils/updateBlockchainCache'),
  blockchainTypes = require('../../factories/states/blockchainTypesFactory'),
  mainnetContracts = require('../../factories/sc/mainContractsFactory'),
  sidechainContracts = require('../../factories/sc/sidechainCotractsFactory'),
  spawn = require('child_process').spawn;

module.exports = (ctx) => {

  before(async () => {
    await models[blockchainTypes.main].exchangeModel.deleteMany({});
    await models[blockchainTypes.main].txModel.deleteMany({});

    await models[blockchainTypes.sidechain].exchangeModel.deleteMany({});
    await models[blockchainTypes.sidechain].txModel.deleteMany({});

    const networkId = await ctx.web3.main.eth.net.getId();

    const mainERC20Manager = new ctx.web3.main.eth.Contract(mainnetContracts.ERC20Manager.abi, _.get(mainnetContracts.ERC20Manager, `networks.${networkId}.address`));

    let mainTokenAddress = await mainERC20Manager.methods.getTokenAddressBySymbol(ctx.web3.main.utils.asciiToHex(config.sidechain.web3.symbol)).call();


    ctx.sidechainPid = spawn('node', ['index.js'], {
      env: _.merge({
        SYMBOL_ADDRESS: mainTokenAddress
      }, process.env), stdio: 'inherit'
    });


    // await Promise.delay(30000);
    await Promise.delay(5000);
  });


  it('send tokens to user', async () => {

    const networkId = await ctx.web3.main.eth.net.getId();

    const mainERC20Manager = new ctx.web3.main.eth.Contract(mainnetContracts.ERC20Manager.abi, _.get(mainnetContracts.ERC20Manager, `networks.${networkId}.address`));
    let mainTokenAddress = await mainERC20Manager.methods.getTokenAddressBySymbol(ctx.web3.main.utils.asciiToHex(config.sidechain.web3.symbol)).call();

    const mainERC20 = new ctx.web3.main.eth.Contract(mainnetContracts.ERC20Interface.abi, mainTokenAddress);

    const timeBalance = await mainERC20.methods.balanceOf(ctx.userWallet.address).call();

    if (parseInt(timeBalance) < 1000) {
      let txReceipt = await mainERC20.methods.transfer(ctx.userWallet.address, 1000).send({
        from: ctx.ownerWallet.address,
        gas: 570000
      });

      await ctx.web3.main.eth.getTransaction(txReceipt.transactionHash);

      const timeBalance = await mainERC20.methods.balanceOf(ctx.userWallet.address).call();
      expect(parseInt(timeBalance)).to.be.gte(1000);
    }


    const balance = await ctx.web3.main.eth.getBalance(ctx.userWallet.address);

    if (parseInt(balance) < Math.pow(10, 19)) {
      let txReceipt = await ctx.web3.main.eth.sendTransaction({
        from: ctx.ownerWallet.address,
        to: ctx.userWallet.address,
        value: Math.pow(10, 19).toString()
      });

      await ctx.web3.main.eth.getTransaction(txReceipt.transactionHash);

    }

    const balanceSidechain = await ctx.web3.sidechain.eth.getBalance(ctx.userWallet.address);

    if (parseInt(balanceSidechain) < Math.pow(10, 19)) {
      let txReceipt = await ctx.web3.sidechain.eth.sendTransaction({
        from: ctx.ownerWallet.address,
        to: ctx.userWallet.address,
        value: Math.pow(10, 19).toString()
      });

      await ctx.web3.sidechain.eth.getTransaction(txReceipt.transactionHash);

    }
  });

  it('lock 1000 tokens (mainnet)', async () => {


    const networkId = await ctx.web3.main.eth.net.getId();

    const mainERC20Manager = new ctx.web3.main.eth.Contract(mainnetContracts.ERC20Manager.abi, _.get(mainnetContracts.ERC20Manager, `networks.${networkId}.address`));
    const mainTimeHolder = new ctx.web3.main.eth.Contract(mainnetContracts.TimeHolder.abi, _.get(mainnetContracts.TimeHolder, `networks.${networkId}.address`));

    let mainTokenAddress = await mainERC20Manager.methods.getTokenAddressBySymbol(ctx.web3.main.utils.asciiToHex(config.sidechain.web3.symbol)).call();
    const mainERC20 = new ctx.web3.main.eth.Contract(mainnetContracts.ERC20Interface.abi, mainTokenAddress);

    const timeBalance = await mainERC20.methods.balanceOf(ctx.userWallet.address).call();

    let approveTxReceipt = await mainERC20.methods.approve(_.get(mainnetContracts.TimeHolderWallet, `networks.${networkId}.address`), 1000).send({
      from: ctx.userWallet.address,
      gas: 5700000
    });

    await ctx.web3.main.eth.getTransaction(approveTxReceipt.transactionHash);

    const depositTxReceipt = await mainTimeHolder.methods.deposit(mainTokenAddress, 1000).send({
      from: ctx.userWallet.address,
      gas: 5700000
    });

    expect(depositTxReceipt.events.Deposit).to.not.be.empty;


    await ctx.web3.main.eth.getTransaction(depositTxReceipt.transactionHash);

    const timeBalance2 = await mainERC20.methods.balanceOf(ctx.userWallet.address).call();

    expect(timeBalance - timeBalance2).to.eq(1000);

    const lockTxReceipt = await mainTimeHolder.methods.lock(mainTokenAddress, 1000).send({
      from: ctx.userWallet.address,
      gas: 5700000
    });


    await ctx.web3.main.eth.getTransaction(lockTxReceipt.transactionHash);

    expect(lockTxReceipt.events.Lock).to.not.be.empty;

    await updateBlockchainCache(ctx.web3.main, models[blockchainTypes.main].txModel); //todo remove
    await updateBlockchainCache(ctx.web3.sidechain, models[blockchainTypes.sidechain].txModel);


    let args = _.chain(lockTxReceipt.events.Lock.returnValues)
      .toPairs()
      .reject(pair => !!parseInt(pair[0]))
      .fromPairs()
      .value();

    await ctx.amqp.channel.publish('events', `${config.main.rabbit.serviceName}_chrono_sc.lock`, Buffer.from(JSON.stringify({
      info: {
        tx: lockTxReceipt.transactionHash,
        blockNumber: lockTxReceipt.blockNumber
      },
      name: 'lock',
      payload: args
    })));

    await Promise.delay(10000);

  });


  it('obtain reissue tx and apply on network', async () => {


    await Promise.delay(1000);

    const swapList = await request({
      uri: `http://localhost:${config.rest.port}/mainnet/swaps/${ctx.userWallet.address}`,
      json: true
    });

    expect(swapList).to.not.be.empty;

    const swapId = swapList[0].swapId;

    const nonce = await ctx.web3.sidechain.eth.getTransactionCount(ctx.middlewareWallet.address);

    const payload = await request({
      method: 'POST',
      uri: `http://localhost:${config.rest.port}/mainnet/swaps/${swapId}/signature/reissue`,
      body: {
        nonce: nonce
      },
      json: true
    });

    console.log(payload);


    const platformAddress = _.get(sidechainContracts.ChronoBankPlatform, `networks.${config.sidechain.web3.networkId}.address`);
    const platform = new ctx.web3.sidechain.eth.Contract(sidechainContracts.ChronoBankPlatform.abi, platformAddress);

    let result = platform.methods.reissueAssetAtomicSwap(ctx.web3.sidechain.utils.asciiToHex(swapId), ctx.web3.sidechain.utils.asciiToHex(config.sidechain.web3.symbol), 1000).encodeABI();

    let tx = {
      to: platformAddress,
      data: result,
      chainId: config.sidechain.web3.networkId,
      nonce: nonce,
      gas: payload.params.gas,
      gasPrice: payload.params.gasPrice
    };

    const signed = await ctx.web3.sidechain.eth.accounts.signTransaction(tx, config.sidechain.web3.privateKey);


    expect(signed.r).to.eq(payload.signature.r);
    expect(signed.s).to.eq(payload.signature.s);
    expect(signed.v).to.eq(payload.signature.v);

    let rawTx = transformTxToRaw(tx, payload.signature);

    let reissueTx = await ctx.web3.sidechain.eth.sendSignedTransaction(rawTx);

    expect(reissueTx.status).to.eq(true);

    let decodedLogs = _.chain(reissueTx.logs).map(log => {
      const logDefinition = _.get(sidechainContracts.ChronoBankPlatform, `networks.${config.sidechain.web3.networkId}.events.${log.topics[0]}`);
      if (!logDefinition)
        return;
      let params = ctx.web3.sidechain.eth.abi.decodeLog(logDefinition.inputs, log.data, log.topics);


      if (logDefinition.name.toLowerCase() === 'issue')
        params.swap = swapId; //todo remove

      return {
        name: logDefinition.name,
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
        params: _.chain(params).toPairs().reject(pair => {
          return !isNaN(parseInt(pair[0])) || pair[0].indexOf('_') === 0
        }).fromPairs().value()
      };

    }).compact().value();


    for (let log of decodedLogs)
      await ctx.amqp.channel.publish('events', `${config.sidechain.rabbit.serviceName}_chrono_sc.${log.name.toLowerCase()}`, new Buffer(JSON.stringify({
        info: {
          tx: log.txHash,
          blockNumber: log.blockNumber
        },
        name: log.name.toLowerCase(),
        payload: log.params
      })));

    await Promise.delay(5000);

  });


  it('transfer 1000 tokens (mainnet->sidechain)', async () => {

    await Promise.delay(1000);

    const swapList = await request({
      uri: `http://localhost:${config.rest.port}/mainnet/swaps/${ctx.userWallet.address}`,
      json: true
    });

    expect(swapList).to.not.be.empty;

    const swapId = swapList[0].swapId;

    const nonce = await ctx.web3.sidechain.eth.getTransactionCount(ctx.middlewareWallet.address);

    const payload = await request({
      method: 'POST',
      uri: `http://localhost:${config.rest.port}/mainnet/swaps/${swapId}/signature/open`,
      body: {
        nonce: nonce
      },
      json: true
    });

    const userWallet = Wallet.fromPrivateKey(Buffer.from(ctx.userWallet.privateKey.replace('0x', ''), 'hex'));
    const userPubKey = userWallet.getPublicKey().toString('hex');

    const encodedKey = await request({
      method: 'POST',
      uri: `http://localhost:${config.rest.port}/mainnet/swaps/${swapId}/key`,
      body: {
        pubKey: userPubKey
      },
      json: true
    });


    const key = await EthCrypto.decryptWithPrivateKey(ctx.userWallet.privateKey, encodedKey);
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');

    const swapContractAddress = _.get(sidechainContracts.AtomicSwapERC20, `networks.${config.sidechain.web3.networkId}.address`);
    const swapContract = new ctx.web3.sidechain.eth.Contract(sidechainContracts.AtomicSwapERC20.abi, swapContractAddress);

    let result = swapContract.methods.open(
      ctx.web3.sidechain.utils.asciiToHex(swapId),
      1000,
      config.sidechain.web3.symbolAddress,
      ctx.userWallet.address,
      `0x${keyHash}`,
      ctx.web3.sidechain.utils.toHex(payload.expiration)
    ).encodeABI();


    let tx = {
      to: swapContractAddress,
      data: result,
      chainId: config.sidechain.web3.networkId,
      nonce: nonce,
      gas: config.sidechain.contracts.actions.open.gas,
      gasPrice: config.sidechain.contracts.actions.open.gasPrice
    };

    const signed = await ctx.web3.sidechain.eth.accounts.signTransaction(tx, config.sidechain.web3.privateKey);

    expect(signed.r).to.eq(payload.signature.r);
    expect(signed.s).to.eq(payload.signature.s);
    expect(signed.v).to.eq(payload.signature.v);


    let rawTransaction = transformTxToRaw(tx, payload.signature);

    expect(signed.rawTransaction).to.eq(rawTransaction);


    return;

    let openTx = await ctx.web3.sidechain.eth.sendSignedTransaction(rawTransaction);

    expect(openTx.status).to.eq(true);


    const platform = new ctx.web3.sidechain.eth.Contract(sidechainContracts.ChronoBankPlatform.abi, _.get(sidechainContracts.ChronoBankPlatform, `networks.${86}.address`));
    const erc20tokenAddress = await platform.methods.proxies(ctx.web3.sidechain.utils.asciiToHex(config.sidechain.web3.symbol)).call();

    const sidechainErc20Token = new ctx.web3.sidechain.eth.Contract(sidechainContracts.ERC20Interface.abi, erc20tokenAddress);
    const atomicSwapERC20 = new ctx.web3.sidechain.eth.Contract(sidechainContracts.AtomicSwapERC20.abi, _.get(sidechainContracts.AtomicSwapERC20, `networks.${86}.address`));

    const oldSidechainBalance = await sidechainErc20Token.methods.balanceOf(ctx.userWallet.address).call();

    const closeTx = await atomicSwapERC20.methods.close(ctx.web3.sidechain.utils.asciiToHex(swapId), ctx.web3.sidechain.utils.asciiToHex(key)).send({
      from: ctx.userWallet.address,
      gas: 5700000
    });

    const newSidechainBalance = await sidechainErc20Token.methods.balanceOf(ctx.userWallet.address).call();
    expect(newSidechainBalance - oldSidechainBalance).to.eq(1000);


    await ctx.amqp.channel.publish('events', `${config.rabbit.serviceName}_chrono_sc.close`, new Buffer(JSON.stringify({
      name: 'close',
      payload: closeTx.events.Close.returnValues
    })));

  });

  /*
  it('burn 1000 tokens (sidechain)', async () => {

    const contracts = ctx.providers.sidechain.contracts;
    const web3 = ctx.providers.sidechain.web3;

    const platform = contracts.ChronoBankPlatform;
    contracts.ERC20Interface.options.address = await platform.methods.proxies(web3.utils.asciiToHex(config.sidechain.web3.symbol)).call();

    const oldSidechainBalance = await contracts.ERC20Interface.methods.balanceOf(ctx.userWallet.address).call();
    const revokeTx = await platform.methods.revokeAsset(web3.utils.asciiToHex(config.sidechain.web3.symbol), 1000).send({
      from: ctx.userWallet.address,
      gas: 5700000
    });

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

    const unlockTx = await contracts.TimeHolder.methods.unlockShares(web3.utils.asciiToHex(swapid), web3.utils.asciiToHex(key)).send({
      from: ctx.userWallet.address,
      gas: 5700000
    });
    expect(unlockTx).to.not.empty;

    const newBalanceDeposit = await contracts.TimeHolder.methods.getDepositBalance(contracts.ERC20Interface.options.address, ctx.userWallet.address).call();

    expect(newBalanceDeposit - oldBalanceDeposit).to.eq(1000);

    await contracts.TimeHolder.methods.withdrawShares(contracts.ERC20Interface.options.address, 1000).send({
      from: ctx.userWallet.address,
      gas: 570000
    });
    const newBalance = await contracts.ERC20Interface.methods.balanceOf(ctx.userWallet.address).call();

    expect(newBalance - oldBalance).to.eq(1000);
  });
*/


  after('kill environment', async () => {
    // ctx.blockProcessorPid.kill();
    // await Promise.delay(30000);
  });


};
