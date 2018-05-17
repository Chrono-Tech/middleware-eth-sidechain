
module.exports.id = '4.';

const _ = require('lodash'),
  config = require('../config');

/**
 * @description flow  update
 * @param done
 */
   

module.exports.up = function (done) {
  let coll = this.db.collection(`${_.get(config, 'nodered.mongo.collectionPrefix', '')}noderedstorages`);
  coll.update({"path":"","type":"flows"}, {
    $set: {"path":"","body":[{"id":"4d3746a2.c73cd8","type":"amqp-server","z":"","host":"localhost","port":"32769","vhost":"","keepalive":"30","usetls":false,"verifyservercert":true,"usetopology":false,"topology":"{\n\t\"exchanges\": [\n\t\t{\"name\": \"exchange1\", \"type\": \"direct\", \"options\": {\"durable\": false}},\n\t\t{\"name\": \"exchange2\"}\n\t],\n\t\"queues\": [\n\t\t{\"name\": \"queue1\", \"options\": {\"messageTtl\": 60000}},\n\t\t{\"name\": \"queue2\"}\n\t],\n\t\"bindings\": [\n\t\t{\"source\": \"exchange1\", \"queue\": \"queue1\", \"pattern\": \"debug\", \"args\": {}},\n\t\t{\"source\": \"exchange1\", \"exchange\": \"exchange2\", \"pattern\": \"error\"},\n\t\t{\"source\": \"exchange2\", \"queue\": \"queue2\"}\n\t]\n}"}]}
  }, {upsert: true}, done);
};

module.exports.down = function (done) {
  let coll = this.db.collection(`${_.get(config, 'nodered.mongo.collectionPrefix', '')}noderedstorages`);
  coll.remove({"path":"","type":"flows"}, done);
};
