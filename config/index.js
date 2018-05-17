/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
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
    dirname: path.resolve(__dirname, '../../SidechainAtomicSwap/build/contracts'),
    resolve: Contract => contract(Contract)
  }),
  mongoose = require('mongoose');

let config = {
  mongo: {
    accounts: {
      uri: process.env.MONGO_ACCOUNTS_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/data',
      collectionPrefix: process.env.MONGO_ACCOUNTS_COLLECTION_PREFIX || process.env.MONGO_COLLECTION_PREFIX || 'sdk'
    },
    data: {
      uri: process.env.MONGO_DATA_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/data',
      collectionPrefix: process.env.MONGO_DATA_COLLECTION_PREFIX || process.env.MONGO_COLLECTION_PREFIX || 'sdk',
    }
  },
  rest: {
    domain: process.env.DOMAIN || 'localhost',
    port: parseInt(process.env.REST_PORT) || 8081
  },
  nodered: {
    mongo: {
      uri: process.env.NODERED_MONGO_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/data',
      collectionPrefix: process.env.NODE_RED_MONGO_COLLECTION_PREFIX || '',
    },
    httpServer: parseInt(process.env.USE_HTTP_SERVER) || false,
    autoSyncMigrations: process.env.NODERED_AUTO_SYNC_MIGRATIONS || true,
    customNodesDir: [path.join(__dirname, '../')],
    migrationsDir: path.join(__dirname, '../migrations'),
    functionGlobalContext: {
      connections: {
        primary: mongoose
      },
      contracts: sidechainContracts,
      libs: {
        web3: web3,
        uniqid: uniqid,
        crypto: crypto,
        EthCrypto: EthCrypto
      },
      settings: {
        mongo: {
          accountPrefix: process.env.MONGO_ACCOUNTS_COLLECTION_PREFIX || process.env.MONGO_COLLECTION_PREFIX || 'sdk',
          collectionPrefix: process.env.MONGO_DATA_COLLECTION_PREFIX || process.env.MONGO_COLLECTION_PREFIX || 'sdk'
        },
        rabbit: {
          url: process.env.RABBIT_URI || 'amqp://localhost:5672',
          serviceName: process.env.RABBIT_SERVICE_NAME || 'sdk'
        },
        sidechain: {
          uri: 'http://localhost:8545',
          addresses: {
            owner: '0x30e8dc8fb374f297d330aa1ed3ad55eed22782cf',
            middleware: '0xec723c98b4cff7383fd9dca22f2a9aafe174c600'
          }
        }
      }
    }
  }
};

module.exports = config;
