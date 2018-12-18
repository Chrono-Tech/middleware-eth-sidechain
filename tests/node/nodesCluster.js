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
  fs = require('fs-extra'),
  path = require('path'),
  _ = require('lodash'),
  {spawn, fork} = require('child_process'),
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

const mnemonic = 'garage episode keen pulp estate loyal nurse maximum hard post satoshi time';

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
    mnemonic: mnemonic,
    total_accounts: 12,
    default_balance_ether: web3.utils.toWei('500', 'ether'),
    db_path: dbPathMain,
    network_id: networkId
  });
  let RPCSidechainServer = TestRPC.server({
    mnemonic: mnemonic,
    default_balance_ether: web3.utils.toWei('500', 'ether'),
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

  const isWindows = /^win/.test(process.platform);

  await fs.copy('tests/node/truffle.js', `${mainContractRoot}/truffle.js`);

  const mainContractDeployPid = spawn(isWindows ? 'npx.cmd' : 'npx', ['-p', 'node@8', isWindows ? 'truffle.cmd' : 'truffle', 'migrate'], {
    env: _.merge({TYPE: 1}, process.env),
    stdio: 'inherit',
    cwd: mainContractRoot
  });

  await new Promise(res =>
    mainContractDeployPid.on('exit', res)
  );


  await fs.copy('tests/node/truffle.js', `${sidechainContractRoot}/truffle.js`);


  const sidechainContractDeployPid = spawn(isWindows ? 'npx.cmd' : 'npx', ['-p', 'node@8', isWindows ? 'truffle.cmd' : 'truffle', 'migrate'], {
    env: _.merge({TYPE: 2}, process.env),
    stdio: 'inherit',
    cwd: sidechainContractRoot
  });

  await new Promise(res =>
    sidechainContractDeployPid.on('exit', res)
  );


  console.log('preparing contracts...');

  console.log(path.join(__dirname, 'prepareContracts.js'));

  const pr = fork(path.join(__dirname, 'prepareContracts.js'), {stdio: 'inherit', env: process.env});

  await new Promise(res => {
    pr.on('message', (message) => {
      if (message.status)
        res();
    });
  });

  if (process.send)
    process.send({status: 1});

};


module.exports = init().catch(e => console.log(e));



