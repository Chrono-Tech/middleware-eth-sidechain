/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

/**
 * Mongoose model. Used to store hashes, which need to be pinned.
 * @module models/accountModel
 * @returns {Object} Mongoose model
 */

const mongoose = require('mongoose'),
  config = require('../config');

/**
 * Account model definition
 * @param  {Object} obj Describes account's model
 * @return {Object} Model's object
 */
const Exchange = new mongoose.Schema({ //todo add request limit by operation and nonce
  key: {
    type: String,
    unique: true,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  requested: {
    amount: {type: Number, required: true, default: 0},
    nonce: {type: Number, required: true, default: -1}
  },
  swapId: {
    type: String,
    unique: true,
    required: true
  },
  actions: [{
    txHash: {type: String, unique: true},
    type: {type: Number}
  }],
  created: {type: Date, required: true, default: Date.now},
  status: {type: Number, required: true, default: 0}
});


module.exports = (mongooseInstance, type) =>
  mongooseInstance.model(`${config[type].mongo.collectionPrefix}Exchange`, Exchange);
