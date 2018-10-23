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
  mainConfig = require('./mainConfig'),
  sidechainConfig = require('./sidechainConfig'),
  web3 = require('web3'),
  uniqid = require('uniqid'),
  crypto = require('crypto'),
  EthCrypto = require('eth-crypto'),
  mongoose = require('mongoose');

let config = {
  main: mainConfig,
  sidechain: sidechainConfig,
  rabbit: { //todo move
    url: process.env.RABBIT_URI || 'amqp://localhost:5672',
    serviceName: process.env.RABBIT_SERVICE_NAME || 'app_eth'
  },
  rest: {
    domain: process.env.DOMAIN || 'localhost',
    port: parseInt(process.env.REST_PORT) || 8081
  },
  nodered: {
    mongo: {
      uri: process.env.NODERED_MONGO_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/data',
      collectionPrefix: process.env.NODERED_MONGO_COLLECTION_PREFIX || ''
    },
    httpServer: parseInt(process.env.USE_HTTP_SERVER) || false,
    httpAdminRoot: process.env.HTTP_ADMIN || false,
    useLocalServer: true,
    migrationsInOneFile: true,
    useLocalStorage: true,
    autoSyncMigrations: process.env.NODERED_AUTO_SYNC_MIGRATIONS || true,
    customNodesDir: [path.join(__dirname, '../')],
    migrationsDir: path.join(__dirname, '../migrations'),
    functionGlobalContext: {
      connections: {
        primary: mongoose
      },
      libs: {
        web3: web3,
        uniqid: uniqid,
        crypto: crypto,
        EthCrypto: EthCrypto
      },
      settings: {
        main: mainConfig,
        sidechain: sidechainConfig,
        rabbit: { //todo move
          url: process.env.RABBIT_URI || 'amqp://localhost:5672',
          serviceName: process.env.RABBIT_SERVICE_NAME || 'app_eth'
        }
      }
    }
  }
};


module.exports = config;
