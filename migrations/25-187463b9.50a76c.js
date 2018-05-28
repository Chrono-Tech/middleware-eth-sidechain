
module.exports.id = '25.187463b9.50a76c';

const _ = require('lodash'),
  config = require('../config');

/**
 * @description flow 187463b9.50a76c update
 * @param done
 */
   

module.exports.up = function (done) {
  let coll = this.db.collection(`${_.get(config, 'nodered.mongo.collectionPrefix', '')}noderedstorages`);
  coll.update({"path":"187463b9.50a76c","type":"flows"}, {
    $set: {"path":"187463b9.50a76c","body":[{"id":"79640639.9f6918","type":"amqp in","z":"187463b9.50a76c","name":"event input ","topic":"${config.rabbit.serviceName}_chrono_sc.lock","iotype":"3","ioname":"events","noack":"0","durablequeue":"0","durableexchange":"0","server":"36594508.9bc8fa","servermode":"0","x":69.00000381469727,"y":309.65626525878906,"wires":[["f3bc0ec7.14473","22812a80.b669b6"]]},{"id":"6977c3e0.ae05dc","type":"async-function","z":"187463b9.50a76c","name":"open swap","func":"const Web3 = global.get('libs.web3');\nconst sidechainUri = global.get('settings.sidechain.uri');\nconst middlewareAddress = global.get('settings.sidechain.addresses.middleware');\nconst ownerAddress = global.get('settings.sidechain.addresses.owner');\nconst crypto = global.get('libs.crypto');\n\nconst keyHash = crypto.createHash('sha256').update(msg.payload.key)\n    .digest('hex');\n\n\n\nconst contracts = global.get('sidechainContracts');\nconst sidechainWeb3 = new Web3(new Web3.providers.HttpProvider(sidechainUri));\n\n\ncontracts.ChronoBankPlatform.setProvider(sidechainWeb3.currentProvider);\ncontracts.ERC20Interface.setProvider(sidechainWeb3.currentProvider);\ncontracts.AtomicSwapERC20.setProvider(sidechainWeb3.currentProvider);\n\n\nconst platform = await contracts.ChronoBankPlatform.deployed();\nawait platform.addAssetPartOwner(msg.symbol, middlewareAddress, {from: ownerAddress, gas: 5700000});\n\nconst tokenAddress = await platform.proxies(msg.symbol);\nconst token = contracts.ERC20Interface.at(tokenAddress);\nconst swapContract = await contracts.AtomicSwapERC20.deployed();\nawait platform.reissueAsset(msg.symbol, msg.value, {from: middlewareAddress});\n\nawait contracts.ERC20Interface.at(tokenAddress).approve(swapContract.address, msg.value, {from: middlewareAddress, gas: 5700000});\n\nawait swapContract.open(msg.payload.swap_id, msg.value, tokenAddress, msg.address, `0x${keyHash}`, (new Date()).getTime()/1000 + 120, {from: middlewareAddress, gas: 5700000});\n\n\nmsg.payload = {\n    swapId: msg.payload.swap_id\n};\n\n//node.warn(contracts);\n\nreturn msg;","outputs":1,"noerr":7,"x":720.076343536377,"y":304.8680934906006,"wires":[[]]},{"id":"def6fd01.5b8cc","type":"mongo","z":"187463b9.50a76c","model":"","request":"{}","options":"{}","name":"mongo","mode":"1","requestType":"1","dbAlias":"primary.data","x":507.0799102783203,"y":305.6528491973877,"wires":[["6977c3e0.ae05dc"]]},{"id":"22812a80.b669b6","type":"function","z":"187463b9.50a76c","name":"prepare exchange","func":"const prefix = global.get('settings.mongo.collectionPrefix');\nconst uniqid = global.get('libs.uniqid');\n\nif(msg.amqpMessage)\n    msg.amqpMessage.ackMsg();\n\n\nmsg.payload = JSON.parse(msg.payload).payload;\n\nmsg.symbol = msg.payload.token;\nmsg.value = parseInt(msg.payload.amount);\nmsg.address = msg.payload.who;\n\nmsg.payload = {\n    model: `${prefix}Exchange`, \n    request: {\n       key: uniqid(),\n       address: msg.payload.who,\n       swap_id: uniqid()\n       }\n};\n\n\nreturn msg;","outputs":1,"noerr":0,"x":309.0694580078125,"y":304.56945037841797,"wires":[["def6fd01.5b8cc"]]},{"id":"5db14f2f.82d13","type":"http in","z":"187463b9.50a76c","name":"get swaps","url":"/swaps/:address","method":"get","upload":false,"swaggerDoc":"","x":67.0173568725586,"y":397.0104064941406,"wires":[["fd1422b4.0c53d"]]},{"id":"fd1422b4.0c53d","type":"function","z":"187463b9.50a76c","name":"prepare request","func":"const prefix = global.get('settings.mongo.collectionPrefix');\n\n\nmsg.payload = {\n    model: `${prefix}Exchange`, \n    request: {\n       address: msg.req.params.address\n       }\n};\n\n\nreturn msg;","outputs":1,"noerr":0,"x":253.07642364501953,"y":398.00695610046387,"wires":[["158578b8.227e97"]]},{"id":"158578b8.227e97","type":"mongo","z":"187463b9.50a76c","model":"","request":"{}","options":"{}","name":"mongo","mode":"1","requestType":"0","dbAlias":"primary.data","x":432.017333984375,"y":397.0104064941406,"wires":[["48606ffe.6fdfc"]]},{"id":"11a8169f.3c2c39","type":"http response","z":"187463b9.50a76c","name":"","statusCode":"","headers":{},"x":816.076416015625,"y":396.46533012390137,"wires":[]},{"id":"48606ffe.6fdfc","type":"function","z":"187463b9.50a76c","name":"format response","func":"\nmsg.payload = msg.payload.map(item=>({\n    swap_id: item.swap_id,\n    isActive: item.isActive,\n    created: item.created\n}));\n\nreturn msg;","outputs":1,"noerr":0,"x":607.0833282470703,"y":397.24306869506836,"wires":[["11a8169f.3c2c39"]]},{"id":"4f10423b.4eaa7c","type":"http in","z":"187463b9.50a76c","name":"get key","url":"/swaps/obtain/:swap_id","method":"post","upload":false,"swaggerDoc":"","x":67,"y":495.0104064941406,"wires":[["e13f48c9.b78168"]]},{"id":"e13f48c9.b78168","type":"function","z":"187463b9.50a76c","name":"prepare request","func":"const prefix = global.get('settings.mongo.collectionPrefix');\n\nmsg.pubkey = msg.payload.pubkey;\n\nmsg.payload = {\n    model: `${prefix}Exchange`, \n    request: {\n       swap_id: msg.req.params.swap_id\n       }\n};\n\n\nreturn msg;","outputs":1,"noerr":0,"x":247.01734924316406,"y":495.0104064941406,"wires":[["25d007bb.1f4b08"]]},{"id":"25d007bb.1f4b08","type":"mongo","z":"187463b9.50a76c","model":"","request":"{}","options":"{}","name":"mongo","mode":"1","requestType":"0","dbAlias":"primary.data","x":415.017333984375,"y":495.0104064941406,"wires":[["d8dbcd84.5a57a"]]},{"id":"97141047.7ff0c","type":"http response","z":"187463b9.50a76c","name":"","statusCode":"","headers":{},"x":799.076416015625,"y":494.46533012390137,"wires":[]},{"id":"d8dbcd84.5a57a","type":"async-function","z":"187463b9.50a76c","name":"","func":"const EthCrypto = global.get('libs.EthCrypto');\n\n\nif(!msg.payload.length){\n    msg.payload = {msg: 'swap not found'};\n    return msg;\n}\n\nconst exchange = msg.payload[0];\n\nconst address = EthCrypto.publicKey.toAddress(msg.pubkey).toLowerCase();\n \n node.warn(address);\n  \nif(exchange.address !== address){\n    msg.payload = {msg: 'wrong pubkey provided'};\n    return msg;\n}\n\n\nmsg.payload = await EthCrypto.encryptWithPublicKey(msg.pubkey, exchange.key);\n\n\nreturn msg;","outputs":1,"noerr":1,"x":600.2986679077148,"y":495.86811351776123,"wires":[["97141047.7ff0c"]]},{"id":"f3bc0ec7.14473","type":"debug","z":"187463b9.50a76c","name":"","active":true,"console":"false","complete":"false","x":302.07640075683594,"y":205.56598663330078,"wires":[]},{"id":"b7d90d4c.99cc","type":"amqp in","z":"187463b9.50a76c","name":"event input","topic":"${config.sidechainRabbit.serviceName}_chrono_sc.revoke","iotype":"3","ioname":"events","noack":"0","durablequeue":"0","durableexchange":"0","server":"36594508.9bc8fa","servermode":"0","x":81.0173568725586,"y":115.01041412353516,"wires":[["d8b178aa.ecdc78","5d667198.805e3"]]},{"id":"d8b178aa.ecdc78","type":"function","z":"187463b9.50a76c","name":"prepare exchange","func":"const prefix = global.get('settings.mongo.collectionPrefix');\nconst uniqid = global.get('libs.uniqid');\n\nif(msg.amqpMessage)\n    msg.amqpMessage.ackMsg();\n\n\nmsg.payload = JSON.parse(msg.payload).payload;\n\nmsg.symbol = msg.payload.SYMBOL;\nmsg.value = parseInt(msg.payload.value);\nmsg.address = msg.payload.address;\n\nmsg.payload = {\n    model: `${prefix}Exchange`, \n    request: {\n       key: uniqid(),\n       address: msg.payload.address,\n       swap_id: uniqid()\n       }\n};\n\n\nreturn msg;","outputs":1,"noerr":0,"x":310.0104293823242,"y":114.92361831665039,"wires":[["9bff596b.91d9c8"]]},{"id":"9bff596b.91d9c8","type":"mongo","z":"187463b9.50a76c","model":"","request":"{}","options":"{}","name":"mongo","mode":"1","requestType":"1","dbAlias":"primary.data","x":508.02088165283203,"y":116.00701713562012,"wires":[["89d51e8e.f0c52"]]},{"id":"89d51e8e.f0c52","type":"async-function","z":"187463b9.50a76c","name":"open swap","func":"const Web3 = global.get('libs.web3');\nconst sidechainUri = global.get('settings.sidechain.uri');\nconst mainnetUri = global.get('settings.mainnet.uri');\nconst crypto = global.get('libs.crypto');\n\nconst keyHash = crypto.createHash('sha256').update(msg.payload.key)\n    .digest('hex');\n\n\nconst contracts = global.get('contracts');\nconst sidechainWeb3 = new Web3(new Web3.providers.HttpProvider(sidechainUri));\nconst mainnetWeb3 = new Web3(new Web3.providers.HttpProvider(mainnetUri));\n\ncontracts.ChronoBankPlatform.setProvider(sidechainWeb3.currentProvider);\ncontracts.TimeHolder.setProvider(mainnetWeb3.currentProvider);\n\nconst platform = await contracts.ChronoBankPlatform.deployed();\nconst timeHolder = await contracts.TimeHolder.deployed();\n\nconst tokenAddress = await platform.proxies(msg.symbol);\nawait timeHolder.registerUnlockShares(msg.payload.swap_id, tokenAddress, msg.value, msg.address, `0x${keyHash}`, {from: middlewareAddress, gas: 5700000});\nmsg.payload = {\n    swapId: msg.payload.swap_id\n};\n\n//node.warn(contracts);\n\nreturn msg;","outputs":1,"noerr":5,"x":721.0173149108887,"y":115.22226142883301,"wires":[[]]},{"id":"5d667198.805e3","type":"debug","z":"187463b9.50a76c","name":"","active":true,"console":"false","complete":"false","x":241.01734924316406,"y":35.010414123535156,"wires":[]}]}
  }, {upsert: true}, done);
};

module.exports.down = function (done) {
  let coll = this.db.collection(`${_.get(config, 'nodered.mongo.collectionPrefix', '')}noderedstorages`);
  coll.remove({"path":"187463b9.50a76c","type":"flows"}, done);
};
