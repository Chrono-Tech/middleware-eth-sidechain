const Web3 = require('web3'),
  requireAll = require('require-all'),
  Promise = require('bluebird'),
  path = require('path'),
  _ = require('lodash');

const init = async () => {

  const sidechainUrl = process.env.SIDEHCAIN_WEB3_URI || 'http://localhost:8546';

  const web3 = new Web3(sidechainUrl);
  let addresses = await web3.eth.getAccounts();

  const sidechainContracts = requireAll({
    dirname: process.env.SMART_ATOMIC_CONTRACTS_PATH ? path.resolve(process.env.SMART_ATOMIC_CONTRACTS_PATH) : path.resolve(__dirname, '../node_modules/chronobank-smart-contracts/build/contracts')
  });

  console.log('platform', sidechainContracts.ChronoBankPlatform.networks[86].address);
  const platform = new web3.eth.Contract(sidechainContracts.ChronoBankPlatform.abi, sidechainContracts.ChronoBankPlatform.networks[86].address);

  const symbol = process.env.SIDECHAIN_SYMBOL || 'TIME';
  const middlewareAddress = addresses[1];
  const ownerAddress = addresses[0];

  console.log(symbol, middlewareAddress, ownerAddress);

  //methods.myMethod.estimateGas

  let gas = await platform.methods.addAssetPartOwner(web3.utils.asciiToHex(symbol), middlewareAddress).estimateGas({from: ownerAddress});

  console.log('gas', gas);

  platform.methods.addAssetPartOwner(web3.utils.asciiToHex(symbol), middlewareAddress).send({
    gas: gas,
    from: ownerAddress
  });
  //console.log(`sidechain middleware address: ${middlewareAddress}`);
  //console.log(`sidechain token: ${symbol}`);

  await Promise.delay(2000); //todo fix
  process.send({status: 1});
  process.exit(0);

};

module.exports = init().catch(e => console.log(e));



