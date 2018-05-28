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

require('mongoose-long')(mongoose);

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
  swap_id: {
    type: String,
    unique: true,
    required: true
  },
  created: {type: Date, required: true, default: Date.now},
  isActive: {type: Boolean, required: true, default: true}
});


module.exports = mongoose.data.model(`${config.mongo.data.collectionPrefix}Exchange`, Exchange);
