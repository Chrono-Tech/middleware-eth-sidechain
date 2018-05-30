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
    dirname: process.env.SMART_ATOMIC_CONTRACTS_PATH || path.join(__dirname, '../chronobank-smart-contracts-atomic-swap/build/contracts'),
    resolve: Contract => contract(Contract)
  }),
  contracts = requireAll({ //scan dir for all smartContracts, excluding emitters (except ChronoBankPlatformEmitter) and interfaces
    dirname: process.env.SMART_CONTRACTS_PATH || path.join(__dirname, '../chronobank-smart-contracts/build/contracts'),
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
  },
  sidechainMongo = {
    accounts: {
      collectionPrefix: process.env.SIDECHAIN_MONGO_ACCOUNTS_COLLECTION_PREFIX || process.env.SIDECHAIN_MONGO_COLLECTION_PREFIX || 'eth'
    },
    data: {
      collectionPrefix: process.env.SIDECHAIN_MONGO_DATA_COLLECTION_PREFIX || process.env.SIDECHAIN_MONGO_COLLECTION_PREFIX || 'eth',
    }
  },
  WalletProvider = require('../services/WallerProvider'),
  sidechainWeb3 = {
    oracleKey: process.env.SIDECHAIN_ORACLE_PRIVATE_KEY,
    uri: `${process.env.SIDEHCAIN_WEB3_URI || `/tmp/${(process.env.SIDECHAIN_NETWORK || 'development')}/geth.ipc`}`,
    symbol: process.env.SIDECHAIN_SYMBOL || 'TIME',
    addresses: {
      owner: process.env.SIDECHAIN_OWNER_ADDRESS,
      middleware: process.env.SIDECHAIN_OWNER_ADDRESS
    }
  },
  mainnetWeb3 = {
    oracleKey: process.env.ORACLE_PRIVATE_KEY,
    uri: `${process.env.WEB3_URI || `/tmp/${(process.env.NETWORK || 'development')}/geth.ipc`}`,
    addresses: {
      owner: process.env.OWNER_ADDRESS,
    }
  };

const mainetWallet = require('ethereumjs-wallet').fromPrivateKey(Buffer.from(mainnetWeb3.oracleKey, 'hex'));
const sidechainWallet = require('ethereumjs-wallet').fromPrivateKey(Buffer.from(sidechainWeb3.oracleKey, 'hex'));

let config = {
  mongo,
  sidechainMongo,
  rest: {
    domain: process.env.DOMAIN || 'localhost',
    port: parseInt(process.env.REST_PORT) || 8081
  },
  nodered: {
    mongo: mongo.data,
    sidechainMongo: sidechainMongo.data,
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
        mainnet: {
          mongo,
          rabbit,
          wallet: mainnetWallet, 
          provider: new WalletProvider(mainnetWallet, mainnetWeb3.uri),
          addresses: mainnetWeb3.addresses
        },
        sidechain: {
          mongo: sidechainMongo,
          rabbit: sidechainRabbit,
          wallet: sidechainWallet,
          provider: new WalletProvider(sidechainWallet, sidechainWeb3.uri),
          addresses: sidechainWeb3.addresses,
          symbol: sidechainWeb3.symbol
        }
      }
    }
  }
};

module.exports = config;
