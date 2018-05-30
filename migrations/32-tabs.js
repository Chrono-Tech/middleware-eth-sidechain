
module.exports.id = '32.tabs';

const _ = require('lodash'),
  config = require('../config');

/**
 * @description flow tabs update
 * @param done
 */
   

module.exports.up = function (done) {
  let coll = this.db.collection(`${_.get(config, 'nodered.mongo.collectionPrefix', '')}noderedstorages`);
  coll.update({"path":"tabs","type":"flows"}, {
    $set: {"path":"tabs","body":[{"id":"187463b9.50a76c","type":"tab","label":"sidechain","disabled":false,"info":""},{"id":"a5f1cbb7.f24be8","type":"tab","label":"mainnet","disabled":false,"info":""}]}
  }, {upsert: true}, done);
};

module.exports.down = function (done) {
  let coll = this.db.collection(`${_.get(config, 'nodered.mongo.collectionPrefix', '')}noderedstorages`);
  coll.remove({"path":"tabs","type":"flows"}, done);
};
