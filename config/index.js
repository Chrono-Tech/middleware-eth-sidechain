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
  _ = require('lodash');

let config = {
  main: {
    mongo: {
      uri: process.env.MONGO_URI || 'mongodb://localhost:27017/data',
      collectionPrefix: process.env.MONGO_COLLECTION_PREFIX || 'eth_mainnet'
    },
    rabbit: {
      url: process.env.RABBIT_URI || 'amqp://localhost:5672',
      serviceName: process.env.RABBIT_SERVICE_NAME || 'app_eth_mainnet'
    },
    contracts: {
      path: process.env.SMART_CONTRACTS_PATH ? path.resolve(process.env.SMART_CONTRACTS_PATH) : path.resolve(__dirname, '../node_modules/chronobank-smart-contracts/build/contracts')
    },
    web3: {
      uri: process.env.SIDEHCAIN_WEB3_URI || 'http://localhost:8545',
      symbol: process.env.SYMBOL || 'TIME',
      symbolAddress: process.env.SYMBOL_ADDRESS,
      privateKey: process.env.ORACLE_PRIVATE_KEY,
      providers: _.chain(process.env.PROVIDERS).split(',')
        .map(provider => provider.trim())
        .filter(provider => provider.length)
        .thru(prov => prov.length ? prov : [
          `${process.env.WEB3_URI || `/tmp/${(process.env.NETWORK || 'development')}/geth.ipc`}`
        ])
        .value()
    }
  },
  sidechain: {
    rabbit: {
      url: process.env.SIDECHAIN_RABBIT_URI || process.env.RABBIT_URI || 'amqp://localhost:5672',
      serviceName: process.env.SIDECHAIN_RABBIT_SERVICE_NAME || process.env.RABBIT_SERVICE_NAME || 'app_eth_sidechain'
    },
    mongo: {
      uri: process.env.SIDECHAIN_MONGO_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/data',
      collectionPrefix: process.env.SIDECHAIN_MONGO_COLLECTION_PREFIX || process.env.MONGO_COLLECTION_PREFIX || 'eth_sidechain'
    },
    swap: {
      expiration: process.env.SWAP_EXPIRATION ? parseInt(process.env.SWAP_EXPIRATION) : 120000
    },
    contracts: {
      path: process.env.SMART_ATOMIC_CONTRACTS_PATH ? path.resolve(process.env.SMART_ATOMIC_CONTRACTS_PATH) : path.resolve(__dirname, '../node_modules/chronobank-smart-contracts/build/contracts')
    },
    web3: {
      uri: process.env.SIDEHCAIN_WEB3_URI || 'http://localhost:8546',
      symbol: process.env.SIDECHAIN_SYMBOL || 'TIME',
      symbolAddress: process.env.SIDECHAIN_SYMBOL_ADDRESS,
      privateKey: process.env.SIDECHAIN_ORACLE_PRIVATE_KEY,
      providers: _.chain(process.env.SIDECHAIN_PROVIDERS).split(',')
        .map(provider => provider.trim())
        .filter(provider => provider.length)
        .thru(prov => prov.length ? prov : [
          `${process.env.SIDECHAIN_WEB3_URI || `/tmp/${(process.env.SIDECHAIN_NETWORK || 'development')}/geth.ipc`}`
        ])
        .value()
    }
  },
  rest: {
    port: parseInt(process.env.REST_PORT) || 8081
  },
  logs: {
    level: process.env.LOG_LEVEL || 'info'
  }
};


module.exports = config;
