/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */

/**
 * Rise a testrpc server
 * @module testrpc-server
 * @requires ethereumjs-testrpc
 */
require('dotenv').config();
const Web3 = require('web3'),
  URL = require('url').URL,
  web3 = new Web3(),
  requireAll = require('require-all'),
  fs = require('fs-extra'),
  path = require('path'),
  _ = require('lodash'),
  {spawn, execSync} = require('child_process'),
  dbPathMain = path.join(__dirname, 'testrpc_main_db'),
  dbPathSidechain = path.join(__dirname, 'testrpc_sidechain_db'),
  TestRPC = require('ganache-cli');

const mainUrl = new URL(process.env.WEB3_URI || 'http://localhost:8545');
const sidechainUrl = new URL(process.env.SIDEHCAIN_WEB3_URI || 'http://localhost:8546');
const networkId = process.env.SMART_CONTRACTS_NETWORK_ID ? parseInt(process.env.SMART_CONTRACTS_NETWORK_ID) : 86;

const mainContractPath = process.env.SMART_CONTRACTS_PATH ? path.resolve(process.env.SMART_CONTRACTS_PATH) : path.resolve(__dirname, '../node_modules/chronobank-smart-contracts/build/contracts');
const sidechainContractPath = process.env.SMART_ATOMIC_CONTRACTS_PATH ? path.resolve(process.env.SMART_ATOMIC_CONTRACTS_PATH) : path.resolve(__dirname, '../node_modules/chronobank-smart-contracts/build/contracts');

const mainContractRoot = path.join(...path.dirname(mainContractPath).split(path.sep).slice(0, -1));
const sidechainContractRoot = path.join(...path.dirname(sidechainContractPath).split(path.sep).slice(0, -1));

const accounts = [
  '6b9027372deb53f4ae973a5614d8a57024adf33126ece6b587d9e08ba901c0d2',
  '993130d3dd4de71254a94a47fdacb1c9f90dd33be8ad06b687bd95f073514a97',
  'c3ea2286b88b51e7cd1cf09ce88b65e9c344302778f96a145c9a01d203f80a4c',
  '51cd20e24463a0e86c540f074a5f083c334659353eec43bb0bd9297b5929bd35',
  '7af5f0d70d97f282dfd20a9b611a2e4bd40572c038a89c0ee171a3c93bd6a17a',
  'cfc6d3fa2b579e3023ff0085b09d7a1cf13f6b6c995199454b739d24f2cf23a5',
  'cfc6d3fa2b579e3023ff0085b09d7a1cf13f6b6c995199454b739d24f2cf23a6',
  'cfc6d3fa2b579e3023ff0085b09d7a1cf13f6b6c995199454b739d24f2cf23a7',
  'cfc6d3fa2b579e3023ff0085b09d7a1cf13f6b6c995199454b739d24f2cf23a8',
  'cfc6d3fa2b579e3023ff0085b09d7a1cf13f6b6c995199454b739d24f2cf23a9',
  'cfc6d3fa2b579e3023ff0085b09d7a1cf13f6b6c995199454b739d24f2cf23a1'

].map(privKey => ({secretKey: Buffer.from(privKey, 'hex'), balance: web3.utils.toWei('500', 'ether')}));


const init = async () => {

  if (!fs.existsSync(dbPathMain)) {
    fs.mkdirSync(dbPathMain);
    fs.removeSync(path.join(mainContractRoot, 'build'));
  }


  if (!fs.existsSync(dbPathSidechain)) {
    fs.mkdirSync(dbPathSidechain);
    fs.removeSync(path.join(sidechainContractRoot, 'build'));
  }

  let RPCServer = TestRPC.server({
    accounts: accounts,
    default_balance_ether: 500,
    db_path: dbPathMain,
    network_id: networkId
  });
  let RPCSidechainServer = TestRPC.server({
    accounts: accounts,
    default_balance_ether: 500,
    db_path: dbPathSidechain,
    network_id: networkId
  });

  RPCServer.listen(mainUrl.port);
  RPCSidechainServer.listen(sidechainUrl.port);

  let addresses = _.chain(RPCServer.provider.manager.state.accounts)
    .toPairs()
    .map(pair => {
      pair[1] = Buffer.from(pair[1].secretKey, 'hex').toString('hex');
      return pair;
    })
    .fromPairs()
    .value();

  console.log(addresses);

  await fs.copy('tests/node/truffle.js', `${mainContractRoot}/truffle.js`);


  execSync(`npx -p node@8 ${process.platform.includes('win') ? 'truffle.cmd' : 'truffle'} migrate'}`, {
    env: _.merge({TYPE: 1}, process.env),
    stdio: 'inherit',
    cwd: mainContractRoot
  });

  await fs.copy('tests/node/truffle.js', `${sidechainContractRoot}/truffle.js`);

  execSync(`npx ${process.platform.includes('win') ? 'truffle.cmd' : 'truffle'} migrate'}`, {
    env: _.merge({TYPE: 2}, process.env),
    stdio: 'inherit',
    cwd: sidechainContractRoot
  });

  console.log('preparing contracts...');
  const sidechainContracts = requireAll({
    dirname: process.env.SMART_ATOMIC_CONTRACTS_PATH ? path.resolve(process.env.SMART_ATOMIC_CONTRACTS_PATH) : path.resolve(__dirname, '../node_modules/chronobank-smart-contracts/build/contracts')
  });


  web3.setProvider(new Web3.providers.HttpProvider(sidechainUrl.toString()));

  const platform = new web3.eth.Contract(sidechainContracts.ChronoBankPlatform.abi, sidechainContracts.ChronoBankPlatform.networks[86].address);

  //sidechainContracts.ChronoBankPlatform.setProvider(web3.currentProvider);
 // const platform = await sidechainContracts.ChronoBankPlatform.deployed();
  const symbol = process.env.SIDECHAIN_SYMBOL || 'TIME';
  const middlewareAddress = Object.keys(addresses)[1];
  const ownerAddress = Object.keys(addresses)[0];

  await platform.methods.addAssetPartOwner(web3.utils.asciiToHex(symbol), middlewareAddress).send({gas: 5700000, from: ownerAddress});

  console.log(`sidechain middleware address: ${Object.keys(addresses)[1]}`);
  console.log(`sidechain token: ${symbol}`);

};


module.exports = init().catch(e => console.log(e));



