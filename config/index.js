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
      symbol: process.env.SYMBOL || 'TIME',
      symbolAddress: process.env.SYMBOL_ADDRESS,
      networkId: process.env.NETWORK_ID || '4',
      privateKey: process.env.ORACLE_PRIVATE_KEY//todo remove
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
      expiration: process.env.SWAP_EXPIRATION ? parseInt(process.env.SWAP_EXPIRATION) : 120000,
      requestLimit: process.env.SWAP_REQUEST_LIMIT ? parseInt(process.env.SWAP_REQUEST_LIMIT) : 3,
    },
    contracts: {
      path: process.env.SMART_ATOMIC_CONTRACTS_PATH ? path.resolve(process.env.SMART_ATOMIC_CONTRACTS_PATH) : path.resolve(__dirname, '../node_modules/chronobank-smart-contracts/build/contracts'),
      actions: {
        open: {
          gas: process.env.SMART_ATOMIC_ACTION_OPEN_GAS || '270000',
          gasPrice: process.env.SMART_ATOMIC_ACTION_OPEN_GAS_PRICE || '2000000000'
        },
        reissueAsset: {
          gas: process.env.SMART_ATOMIC_ACTION_REISSUE_ASSET_GAS || '110000',
          gasPrice: process.env.SMART_ATOMIC_ACTION_REISSUE_ASSET_GAS_PRICE || '2000000000'
        },
        approve: {
          gas: process.env.SMART_ATOMIC_ACTION_APPROVE_GAS || '120000', //todo count real gas
          gasPrice: process.env.SMART_ATOMIC_ACTION_APPROVE_GAS_PRICE || '2000000000'
        }
      }
    },
    web3: {
      symbol: process.env.SIDECHAIN_SYMBOL || 'TIME',
      symbolAddress: process.env.SIDECHAIN_SYMBOL_ADDRESS,
      networkId: process.env.SIDECHAIN_NETWORK_ID || '4',
      privateKey: process.env.SIDECHAIN_ORACLE_PRIVATE_KEY //todo remove
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
