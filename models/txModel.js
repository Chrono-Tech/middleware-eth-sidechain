/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

/**
 * Mongoose model. Represents a transaction in eth
 * @module models/txModel
 * @returns {Object} Mongoose model
 */

const mongoose = require('mongoose'),
  config = require('../config');

const TX = new mongoose.Schema({
  _id: {type: String},
  blockNumber: {type: Number, required: true, default: -1},
  index: {type: Number},
  value: {type: String},
  to: {type: String, index: true},
  fee: {type: String},
  nonce: {type: Number},
  gasPrice: {type: String},
  gas: {type: String},
  gasUsed: {type: String},
  from: {type: String, index: true}
}, {_id: false});

TX.index({blockNumber: 1, index: 1});

module.exports = (mongooseInstance, type) =>
  mongooseInstance.model(`${config[type].mongo.collectionPrefix}TX`, TX);
