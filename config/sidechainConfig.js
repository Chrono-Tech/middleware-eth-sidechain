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
  //contract = require('truffle-contract'),
  requireAll = require('require-all'),
  WalletProvider = require('../services/WalletProvider');


let contracts = {};

const contractDir = process.env.SMART_ATOMIC_CONTRACTS_PATH ? path.resolve(process.env.SMART_ATOMIC_CONTRACTS_PATH) : path.resolve(__dirname, '../node_modules/chronobank-smart-contracts/build/contracts');

if(fs.existsSync(contractDir))
  contracts = requireAll({
    dirname: contractDir
  });

const web3Uri = process.env.SIDEHCAIN_WEB3_URI || 'http://localhost:8546';

module.exports = {
  rabbit: {
    url: process.env.SIDECHAIN_RABBIT_URI || process.env.RABBIT_URI || 'amqp://localhost:5672',
    serviceName: process.env.SIDECHAIN_RABBIT_SERVICE_NAME || process.env.RABBIT_SERVICE_NAME || 'app_eth_sidechain'
  },
  mongo: {
    uri: process.env.SIDECHAIN_MONGO_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/data',
    collectionPrefix: process.env.SIDECHAIN_MONGO_COLLECTION_PREFIX || process.env.MONGO_COLLECTION_PREFIX || 'eth_sidechain'
  },
  contracts: contracts,
  web3: {
    uri: web3Uri,
    symbol: process.env.SIDECHAIN_SYMBOL || 'TIME',
    provider: new WalletProvider(process.env.SIDECHAIN_ORACLE_PRIVATE_KEY, web3Uri, contracts)
  }
};
