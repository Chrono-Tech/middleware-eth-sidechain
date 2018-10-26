/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */

/**
 * @module config
 * @returns {Object} Configuration
 */
require('dotenv').config();
const path = require('path'),
  fs = require('fs'),
  Wallet = require('ethereumjs-wallet'),
  contract = require('truffle-contract'),
  requireAll = require('require-all'),
  WalletProvider = require('../services/WalletProvider');

let contracts = {};

const contractDir = process.env.SMART_CONTRACTS_PATH ? path.resolve(process.env.SMART_CONTRACTS_PATH) : path.resolve(__dirname, '../node_modules/chronobank-smart-contracts/build/contracts');

if(fs.existsSync(contractDir))
  contracts = requireAll({
    dirname: contractDir,
    resolve: Contract => contract(Contract)
  });

const web3Uri = process.env.WEB3_URI || 'http://localhost:8545';
const wallet = Wallet.fromPrivateKey(Buffer.from(process.env.ORACLE_PRIVATE_KEY, 'hex'));

module.exports = {
  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/data',
    collectionPrefix: process.env.MONGO_COLLECTION_PREFIX || 'eth_mainnet'
  },
  rabbit: {
    url: process.env.RABBIT_URI || 'amqp://localhost:5672',
    serviceName: process.env.RABBIT_SERVICE_NAME || 'app_eth_mainnet'
  },
  contracts: contracts,
  web3: {
    wallet: wallet,
    uri: web3Uri,
    symbol: process.env.SYMBOL || 'TIME',
    provider: new WalletProvider(wallet, web3Uri)
  }
};
