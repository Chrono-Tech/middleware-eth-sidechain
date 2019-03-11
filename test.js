const Web3 = require('web3'),
  crypto = require('crypto'),
  _ = require('lodash'),
  expect = require('chai').expect,
  mainContractsFactory = require('./factories/sc/mainContractsFactory'),
  sidechainCotractsFactory = require('./factories/sc/sidechainCotractsFactory'),
  HDWallet = require('ethereum-hdwallet'),
  web3 = new Web3('http://localhost:8545'),
  web3Sidechain = new Web3('http://localhost:8546');


const init = async () => {

  const sidechainSymbol = 'TIME';
  const mnemonic = 'brave dry ride escape panther wave wife coin input come cash survey';
  const hdwallet = HDWallet.fromMnemonic(mnemonic);

  const transferValue = _.random(5, 20);


  const ownerWallet = web3.eth.accounts.privateKeyToAccount(`0x${hdwallet.derive(`m/44'/60'/0'/0/0`).getPrivateKey().toString('hex')}`);
  const middlewareWallet = web3.eth.accounts.privateKeyToAccount(`0x${hdwallet.derive(`m/44'/60'/0'/0/1`).getPrivateKey().toString('hex')}`);
  const userWallet = web3.eth.accounts.privateKeyToAccount(`0x${hdwallet.derive(`m/44'/60'/0'/0/2`).getPrivateKey().toString('hex')}`); //todo replace with random


  const networkId = await web3.eth.net.getId();
  const sidechainNetworkId = await web3Sidechain.eth.net.getId();

  const mainERC20Manager = new web3.eth.Contract(mainContractsFactory.contracts.ERC20Manager.abi, _.get(mainContractsFactory.addresses, `${networkId}.ERC20Manager.address`));
  let mainTokenAddress = await mainERC20Manager.methods.getTokenAddressBySymbol(web3.utils.asciiToHex(sidechainSymbol)).call();


  const platformAddress = _.get(sidechainCotractsFactory.addresses, `${sidechainNetworkId}.ChronoBankPlatform.address`);
  const platform = new web3Sidechain.eth.Contract(sidechainCotractsFactory.contracts.ChronoBankPlatform.abi, platformAddress);
  let sidechainTokenAddress = await platform.methods.proxies(web3.utils.asciiToHex(sidechainSymbol)).call();


  const mainERC20 = new web3.eth.Contract(mainContractsFactory.contracts.ERC20Interface.abi, mainTokenAddress);
  const sidechainERC20 = new web3Sidechain.eth.Contract(mainContractsFactory.contracts.ERC20Interface.abi, sidechainTokenAddress);

  let mainTimeBalance = await mainERC20.methods.balanceOf(userWallet.address).call();
  let sidechainTimeBalance = await sidechainERC20.methods.balanceOf(userWallet.address).call();


  const mainTimeHolder = new web3.eth.Contract(mainContractsFactory.contracts.TimeHolder.abi, _.get(mainContractsFactory.addresses, `${networkId}.TimeHolder.address`));


  /** initial prepare platform (should be done manually) **/
  await platform.methods.addAssetPartOwner(web3.utils.asciiToHex(sidechainSymbol), middlewareWallet.address).send({
    from: ownerWallet.address,
    gas: 570000
  });


  const mainRolesLibrary = new web3.eth.Contract(mainContractsFactory.contracts.Roles2Library.abi, _.get(mainContractsFactory.addresses, `${networkId}.RolesLibrary.address`));
  await mainRolesLibrary.methods.addUserRole(middlewareWallet.address, 9).send({from: ownerWallet.address});


  /** send some money to user (so he could make some operations) **/

  if (parseInt(mainTimeBalance) < 1000) {
    let txReceipt = await mainERC20.methods.transfer(userWallet.address, 1000).send({
      from: ownerWallet.address,
      gas: 570000
    });

    await web3.eth.getTransaction(txReceipt.transactionHash);

    const timeBalance = await mainERC20.methods.balanceOf(userWallet.address).call();
    expect(parseInt(timeBalance)).to.be.gte(1000);
  }

  const balance = await web3.eth.getBalance(userWallet.address);

  if (parseInt(balance) < Math.pow(10, 19)) {
    let txReceipt = await web3.eth.sendTransaction({
      from: ownerWallet.address,
      to: userWallet.address,
      value: Math.pow(10, 19).toString()
    });

    await web3.eth.getTransaction(txReceipt.transactionHash);

  }

  const balanceSidechain = await web3Sidechain.eth.getBalance(userWallet.address);

  if (parseInt(balanceSidechain) < Math.pow(10, 19)) {
    let txReceipt = await web3Sidechain.eth.sendTransaction({
      from: ctx.ownerWallet.address,
      to: ctx.userWallet.address,
      value: Math.pow(10, 19).toString()
    });

    await web3Sidechain.eth.getTransaction(txReceipt.transactionHash);
  }


  /*** MAINNET->SIDECHAIN FLOW **/


  /**lock tokens **/

  let approveTxReceipt = await mainERC20.methods.approve(_.get(mainContractsFactory.addresses, `${networkId}.TimeHolderWallet.address`), 1000).send({
    from: userWallet.address,
    gas: 5700000
  });

  await web3.eth.getTransaction(approveTxReceipt.transactionHash);

  const depositTxReceipt = await mainTimeHolder.methods.deposit(mainTokenAddress, 1000).send({
    from: userWallet.address,
    gas: 5700000
  });

  expect(depositTxReceipt.events.Deposit).to.not.be.empty;

  await web3.eth.getTransaction(depositTxReceipt.transactionHash);

  const lockTxReceipt = await mainTimeHolder.methods.lock(mainTokenAddress, 1000).send({
    from: userWallet.address,
    gas: 5700000
  });

  expect(lockTxReceipt.events.Lock).to.not.be.empty;

  /** on lock event we have to catch the event on service and create swap
   * after that, user is able to make api calls in order to obtain the tx
   * for opening the swap from middleware address (actions are listed below)
   * */

  const sidechainChronoBankPlatformAtomicSwapPlugin = new web3Sidechain.eth.Contract(sidechainCotractsFactory.contracts.ChronoBankPlatformAtomicSwapPlugin.abi, _.get(sidechainCotractsFactory.addresses, `${sidechainNetworkId}.ChronoBankPlatformAtomicSwapPlugin.address`));

  let secret = '123';
  let swap_id = web3.utils.utf8ToHex(Date.now() + '_test');
  let symbol = web3.utils.asciiToHex(sidechainSymbol);
//  const keyHash = web3.utils.soliditySha3({t: 'bytes32', v: web3.utils.asciiToHex(secret)}); //todo try with sha3

  let keyHash = crypto.createHash('sha256').update(secret).digest('hex');

  let reissueAssetArgs = [
    swap_id,
    symbol,
    transferValue, //value
    userWallet.address,
    `0x${keyHash}`,
    parseInt(new Date().getTime() / 1000 + 120)
  ];

  let reissueAssetAndOpenSwapTx = await sidechainChronoBankPlatformAtomicSwapPlugin.methods.reissueAssetAndOpenSwap(...reissueAssetArgs).send({
    from: middlewareWallet.address,
    gas: 570000
  });

  expect(reissueAssetAndOpenSwapTx.events.SwapOpened).to.not.be.empty;


  /** now user can close swap **/

  const atomicSwapERC20 = new web3Sidechain.eth.Contract(sidechainCotractsFactory.contracts.AtomicSwapERC20.abi, _.get(sidechainCotractsFactory.addresses, `${sidechainNetworkId}.AtomicSwapERC20.address`));

  const swapContractCloseTx = await atomicSwapERC20.methods.close(swap_id, web3Sidechain.utils.asciiToHex(secret)).send({
    from: userWallet.address,
    gas: 5700000
  });


  expect(swapContractCloseTx.events.Close).to.not.be.empty;

  let newSidechainTimeBalance = await sidechainERC20.methods.balanceOf(userWallet.address).call();
  expect(parseInt(sidechainTimeBalance) + transferValue).to.eq(parseInt(newSidechainTimeBalance));
  sidechainTimeBalance = newSidechainTimeBalance;


  /*** SIDECHAIN->MAINNET FLOW **/


  /** we have to burn our tokens on sidechain **/

  const revokeTx = await platform.methods.revokeAsset(web3Sidechain.utils.asciiToHex(sidechainSymbol), transferValue).send({
    from: userWallet.address,
    gas: 5700000
  });

  expect(revokeTx.events.Revoke).to.not.be.empty;
  newSidechainTimeBalance = await sidechainERC20.methods.balanceOf(userWallet.address).call();
  expect(parseInt(sidechainTimeBalance) - transferValue).to.eq(parseInt(newSidechainTimeBalance));
  sidechainTimeBalance = newSidechainTimeBalance;


  /** the service should track the revoke event and create the swap.  **/


  secret = '242342';
  swap_id = web3.utils.utf8ToHex(Date.now() + '_test');
  keyHash = web3.utils.soliditySha3({t: 'bytes32', v: web3.utils.asciiToHex(secret)});

  let registerUnlockSharesArgs = [
    swap_id,
    mainTokenAddress,
    transferValue,
    userWallet.address,
    keyHash,
    web3.utils.toHex(Date.now()) //salt
  ];

  let signPayloadRegisterUnlockShares = web3.utils.soliditySha3({
    t: 'address',
    v: mainContractsFactory.addresses[networkId].TimeHolder.address
  }, {
    t: 'bytes4',
    v: mainTimeHolder.methods.registerUnlockShares(...registerUnlockSharesArgs, '0x123').encodeABI().slice(0, 10)
  }, {
    t: 'address',
    v: userWallet.address
  }, {
    t: 'bytes32',
    v: registerUnlockSharesArgs[5]
  }, {
    t: 'bytes32',
    v: registerUnlockSharesArgs[0]
  }, {
    t: 'address',
    v: registerUnlockSharesArgs[1]
  }, {
    t: 'uint',
    v: registerUnlockSharesArgs[2]
  }, {
    t: 'address',
    v: registerUnlockSharesArgs[3]
  }, {
    t: 'bytes32',
    v: registerUnlockSharesArgs[4]
  });

  let {signature} = web3.eth.accounts.sign(signPayloadRegisterUnlockShares, middlewareWallet.privateKey);
  let {signature: signature2} = web3.eth.accounts.sign(signPayloadRegisterUnlockShares, ownerWallet.privateKey);
  //let {signature: signature2} = web3.eth.accounts.sign(signPayloadRegisterUnlockShares, userWallet.privateKey);
  signature = '0x' + signature.substr(2) + signature2.substr(2);


  console.log(registerUnlockSharesArgs)
  console.log(signature.length)

//  return;
  let registerUnlockSharesTx = await mainTimeHolder.methods.registerUnlockShares(...registerUnlockSharesArgs, signature).send({from: userWallet.address});


  console.log(registerUnlockSharesTx);



  //locks the same
  //mainnet -> sidechain
  //reissue + open + close -> sidechain.ChronoBankPlatformAtomicSwapPlugin.reissueAssetAndOpenSwap(); + close() - from middleware


  return;
  //sidechain->mainnet
  //burn the same
  //register unlock shares
  //need to add cbe account UserManager#addCBE(address _key, bytes32 _hash, bytes32 _salt, bytes _signatures) + oracle

  //generate message, sign and return v,r,s + salt
/*

  let getSignaturesForRegisterUnlockShares = async (sender, salt, registrationId, sharesAddress, amount, user, secretLock, signers) => {
    const message = web3Utils.soliditySha3({
      t: 'address',
      v: timeHolder.address
    }, {
      t: 'bytes4',
      v: timeHolder.contract.registerUnlockShares.getData('', 0x0, 0, 0x0, '', '', '').slice(0, 10)
    }, {
      t: 'address',
      v: sender
    }, {
      t: 'bytes32',
      v: salt
    }, {
      t: 'bytes32',
      v: registrationId
    }, {
      t: 'address',
      v: sharesAddress
    }, {
      t: 'uint',
      v: amount
    }, {
      t: 'address',
      v: user
    }, {
      t: 'bytes32',
      v: secretLock
    })
    const signs = await signatures.getSignaturesBytesArray(message, signers)
    return signs
  };


  const signs = await getSignaturesForRegisterUnlockShares(
    middlewareAuthorityAddress,
    salt,
    registrationId,
    shares.address,
    needToUnlockAmount,
    user1,
    secretLock,
    [middlewareAuthorityAddress, systemUser]
  )
  const tx = await timeHolder.registerUnlockShares(
    registrationId,
    shares.address,
    needToUnlockAmount,
    user1,
    secretLock,
    salt,
    signs,
    {from: middlewareAuthorityAddress}
  )

  let result = timeHolder.methods.registerUnlockShares(web3.utils.asciiToHex(swapId),
    config.main.web3.symbolAddress,
    value,
    address,
    keyHash,
    salt, //random string
    concat(signs) //middleware + cbe accounts[0] / accounts[1]
  ).encodeABI();
*/

};

module.exports = init().catch(e => console.log(e));
