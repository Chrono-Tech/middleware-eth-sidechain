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
  web3 = require('web3'),
  uniqid = require('uniqid'),
  crypto = require('crypto'),
  EthCrypto = require('eth-crypto'),
  contract = require('truffle-contract'),
  requireAll = require('require-all'),
  sidechainContracts = requireAll({
    dirname: process.env.SMART_ATOMIC_CONTRACTS_PATH || path.join(__dirname, '../node_modules/chronobank-smart-contracts-atomic-swap/build/contracts'),
    resolve: Contract => contract(Contract)
  }),
  contracts = requireAll({ //scan dir for all smartContracts, excluding emitters (except ChronoBankPlatformEmitter) and interfaces
    dirname: process.env.SMART_CONTRACTS_PATH || path.join(__dirname, '../node_modules/chronobank-smart-contracts/build/contracts'),
    resolve: Contract => contract(Contract)
  }),
  mongoose = require('mongoose'),
  rabbit = {
    url: process.env.RABBIT_URI || 'amqp://localhost:5672',
    serviceName: process.env.RABBIT_SERVICE_NAME || 'app_eth'
  },
  sidechainRabbit = {
    url: process.env.SIDECHAIN_RABBIT_URI || 'amqp://localhost:5672',
    serviceName: process.env.SIDECHAIN_RABBIT_SERVICE_NAME || 'app_eth_sidechain'
  },
  mongo = {
    accounts: {
      uri: process.env.MONGO_ACCOUNTS_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/data',
      collectionPrefix: process.env.MONGO_ACCOUNTS_COLLECTION_PREFIX || process.env.MONGO_COLLECTION_PREFIX || 'eth'
    },
    data: {
      uri: process.env.MONGO_DATA_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/data',
      collectionPrefix: process.env.MONGO_DATA_COLLECTION_PREFIX || process.env.MONGO_COLLECTION_PREFIX || 'eth',
    }
  };


let config = {
  mongo,
  rest: {
    domain: process.env.DOMAIN || 'localhost',
    port: parseInt(process.env.REST_PORT) || 8081
  },
  nodered: {
    mongo: mongo.data,
    httpServer: parseInt(process.env.USE_HTTP_SERVER) || false,
    autoSyncMigrations: process.env.NODERED_AUTO_SYNC_MIGRATIONS || true,
    customNodesDir: [path.join(__dirname, '../')],
    migrationsDir: path.join(__dirname, '../migrations'),
    functionGlobalContext: {
      connections: {
        primary: mongoose
      },
      sidechainContracts,
      contracts,
      libs: {
        web3: web3,
        uniqid: uniqid,
        crypto: crypto,
        EthCrypto: EthCrypto
      },
      settings: {
        mongo,
        rabbit,
        sidechainRabbit,
        sidechain: {
          uri: `${/^win/.test(process.platform) ? '\\\\.\\pipe\\' : ''}${process.env.WEB3_SIDECHAIN_URI || `/tmp/${(process.env.NETWORK || 'development')}/geth.ipc`}`,
          symbol: 'TIME',
          addresses: {
            owner: '0x30e8dc8fb374f297d330aa1ed3ad55eed22782cf',
            middleware: '0x30e8dc8fb374f297d330aa1ed3ad55eed22782cf'
          }
        },
        mainnet: {
          uri: `${/^win/.test(process.platform) ? '\\\\.\\pipe\\' : ''}${process.env.WEB3_URI || `/tmp/${(process.env.NETWORK || 'development')}/geth.ipc`}`,
          addresses: {
            owner: '0x30e8dc8fb374f297d330aa1ed3ad55eed22782cf',
            middleware: '0x30e8dc8fb374f297d330aa1ed3ad55eed22782cf'
          }
        }
      }
    }
  }
};

module.exports = config;
