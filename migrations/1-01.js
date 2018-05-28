/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

'use strict';

const bcrypt = require('bcryptjs'),
  _ = require('lodash'),
  config = require('../config');

module.exports.id = '2.01';

module.exports.up = function (done) {
  let coll = this.db.collection(`${_.get(config, 'nodered.mongo.collectionPrefix', '')}noderedusers`);
  coll.insert({
    username: 'admin',
    password: bcrypt.hashSync('123'),
    isActive: true,
    permissions: '*'
  }, done);
};

module.exports.down = function (done) {
  let coll = this.db.collection(`${_.get(config, 'nodered.mongo.collectionPrefix', '')}noderedusers`);
  coll.remove({username: 'admin'}, done);
  done();
};
