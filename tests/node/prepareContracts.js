const Web3 = require('web3'),
  requireAll = require('require-all'),
  Promise = require('bluebird'),
  config = require('../../config'),
  path = require('path'),
  _ = require('lodash');

const init = async () => {

  const mainnetUrl = process.env.WEB3_URI || 'http://localhost:8545';
  const sidechainUrl = process.env.SIDEHCAIN_WEB3_URI || 'http://localhost:8546';

  const mainnetWeb3 = new Web3(mainnetUrl);
  const sidechainWeb3 = new Web3(sidechainUrl);
  let addresses = await sidechainWeb3.eth.getAccounts();

  const sidechainContracts = requireAll({
    dirname: process.env.SMART_ATOMIC_CONTRACTS_PATH ? path.resolve(process.env.SMART_ATOMIC_CONTRACTS_PATH) : path.resolve(__dirname, '../node_modules/chronobank-smart-contracts/build/contracts')
  });

  const mainnetContracts = requireAll({
    dirname: process.env.SMART_CONTRACTS_PATH ? path.resolve(process.env.SMART_CONTRACTS_PATH) : path.resolve(__dirname, '../node_modules/chronobank-smart-contracts/build/contracts')
  });


  const platform = new sidechainWeb3.eth.Contract(sidechainContracts.ChronoBankPlatform.abi, sidechainContracts.ChronoBankPlatform.networks[86].address);

  const sidechainSymbol = process.env.SIDECHAIN_SYMBOL || 'TIME';
  const mainSymbol = process.env.SYMBOL || 'TIME';
  const middlewareAddress = addresses[1];
  const ownerAddress = addresses[0];


  const mainERC20Manager = new mainnetWeb3.eth.Contract(mainnetContracts.ERC20Manager.abi, _.get(mainnetContracts.ERC20Manager, `networks.${86}.address`));

  let mainTokenAddress = await mainERC20Manager.methods.getTokenAddressBySymbol(mainnetWeb3.utils.asciiToHex(config.sidechain.web3.symbol)).call();

  let sidechainTokenAddress = await platform.methods.proxies(mainnetWeb3.utils.asciiToHex(config.sidechain.web3.symbol)).call();

  console.log('symbol:',mainSymbol);
  console.log('sidechain symbol:',sidechainSymbol);
  console.log('owner address:', ownerAddress);
  console.log('middleware address:', middlewareAddress);
  console.log('mainnet erc20 token:', mainTokenAddress);
  console.log('sidechain erc20 token:', sidechainTokenAddress);

  //methods.myMethod.estimateGas

  let gas = await platform.methods.addAssetPartOwner(mainnetWeb3.utils.asciiToHex(sidechainSymbol), middlewareAddress).estimateGas({from: ownerAddress});

  await platform.methods.addAssetPartOwner(mainnetWeb3.utils.asciiToHex(sidechainSymbol), middlewareAddress).send({
    gas: gas,
    from: ownerAddress
  });


  const mainRolesLibrary = new mainnetWeb3.eth.Contract(mainnetContracts.Roles2Library.abi, _.get(mainnetContracts.Roles2Library, `networks.${86}.address`));
  await mainRolesLibrary.methods.addUserRole(middlewareAddress, 9).send({from: ownerAddress});

  //console.log(`sidechain middleware address: ${middlewareAddress}`);
  //console.log(`sidechain token: ${symbol}`);

  await Promise.delay(2000); //todo fix
  process.send({status: 1});
  process.exit(0);

};

module.exports = init().catch(e => console.log(e));



