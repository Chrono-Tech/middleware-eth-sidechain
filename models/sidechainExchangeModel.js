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
const Exchange = new mongoose.Schema({
  key: {
    type: String,
    unique: true,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  swapId: {
    type: String,
    unique: true,
    required: true
  },
  created: {type: Date, required: true, default: Date.now},
  status: {type: Number, required: true, default: 0}
});


module.exports = ()=> mongoose.sidechain.model(`${config.sidechain.mongo.collectionPrefix}Exchange`, Exchange);
