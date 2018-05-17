const Wallet = require('ethereumjs-wallet'),
  request = require('request-promise'),
  EthCrypto = require('eth-crypto'),
  mongoose = require('mongoose'),
  amqp = require('amqplib'),
  Web3 = require('web3'),
  Promise = require('bluebird'),
  config = require('./config');

mongoose.data = mongoose.createConnection(config.mongo.data.uri);

const exchangeModel = require('./models/exchangeModel');

const init = async () => {

  let amqpInstance = await amqp.connect(config.nodered.functionGlobalContext.settings.rabbit.url);
  let channel = await amqpInstance.createChannel();

  try {
    await channel.assertExchange('events', 'topic', {durable: false});
  } catch (e) {
    channel = await amqpInstance.createChannel();
  }

  const web3 = new Web3(new Web3.providers.HttpProvider(config.nodered.functionGlobalContext.settings.sidechain.uri));
  const contracts = config.nodered.functionGlobalContext.contracts;

  contracts.AtomicSwapERC20.setProvider(web3.currentProvider);
  const swapContract = await contracts.AtomicSwapERC20.deployed();

  const privateKeys = [
    'b7616111ee3c709ff907777d25b863d15109494a240d39c4f0b51fdb5245e99b',
    '7738bb0816358bd3847f940b95d763d94082c51059ae755b667b9ec9c7a3e28c',
    '2897c2af6f3e291a89fcef259df0a2192b52b0f68d5bccbbdccada5f14127623'
  ];

  const userWallet = Wallet.fromPrivateKey(Buffer.from(privateKeys[2], 'hex'));
  const userAddress = `0x${userWallet.getAddress().toString('hex')}`;
  const userPubKey = userWallet.getPublicKey().toString('hex');

  await exchangeModel.remove();

  channel.publish('events', `app_eth_chrono_sc.locked`, new Buffer(JSON.stringify({
    name: 'Locked',
    payload: {
      SYMBOL: 'LHMOON',
      value: 10,
      address: userAddress
    }
  })));

  await Promise.delay(5000);

  const swapList = await request({
    uri: `http://localhost:8081/swaps/${userAddress}`,
    json: true
  });

  console.log(swapList);

  const swapid = swapList[0].swap_id;

  const keyEncoded = await request({
    method: 'POST',
    uri: `http://localhost:8081/swaps/obtain/${swapid}`,
    body: {
      pubkey: userPubKey
    },
    json: true
  });

  const key = await EthCrypto.decryptWithPrivateKey(`0x${userWallet.getPrivateKey().toString('hex')}`, keyEncoded);

  console.log(key)
  console.log(userAddress)

  const response = await swapContract.close(swapid, key, {from: userAddress, gas: 5700000});
  console.log(response);

};

module.exports = init();
