const ethCrypto = require('eth-crypto'),
  Web3 = require('web3'),
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

//  let accounts = await web3.eth.getAccounts();

  const ownerWallet = web3.eth.accounts.privateKeyToAccount(`0x${hdwallet.derive(`m/44'/60'/0'/0/0`).getPrivateKey().toString('hex')}`);
  const middlewareWallet = web3.eth.accounts.privateKeyToAccount(`0x${hdwallet.derive(`m/44'/60'/0'/0/1`).getPrivateKey().toString('hex')}`);
  const userWallet = web3.eth.accounts.privateKeyToAccount(`0x${hdwallet.derive(`m/44'/60'/0'/0/2`).getPrivateKey().toString('hex')}`); //todo replace with random


  const networkId = await web3.eth.net.getId();

  const mainERC20Manager = new web3.eth.Contract(mainContractsFactory.contracts.ERC20Manager.abi, _.get(mainContractsFactory.addresses, `${networkId}.ERC20Manager.address`));
  let mainTokenAddress = await mainERC20Manager.methods.getTokenAddressBySymbol(web3.utils.asciiToHex(sidechainSymbol)).call();

  console.log(mainTokenAddress)

  /** send tokens to user **/


  const mainERC20 = new web3.eth.Contract(mainContractsFactory.contracts.ERC20Interface.abi, mainTokenAddress);

  const timeBalance = await mainERC20.methods.balanceOf(userWallet.address).call();

  if (parseInt(timeBalance) < 1000) {
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


  /**lock tokens **/



  const mainTimeHolder = new web3.eth.Contract(mainContractsFactory.contracts.TimeHolder.abi, _.get(mainContractsFactory.addresses, `${networkId}.TimeHolder.address`));

  let approveTxReceipt = await mainERC20.methods.approve(_.get(mainContractsFactory.addresses, `${networkId}.TimeHolderWallet.address`), 1000).send({
    from: userWallet.address,
    gas: 5700000
  });

  await web3.eth.getTransaction(approveTxReceipt.transactionHash);

  const depositTxReceipt = await mainTimeHolder.methods.deposit(mainTokenAddress, 1000).send({
    from: userWallet.address,
    gas: 5700000
  });

  //console.log(depositTxReceipt);
  expect(depositTxReceipt.events.Deposit).to.not.be.empty;


  await web3.eth.getTransaction(depositTxReceipt.transactionHash);

  const lockTxReceipt = await mainTimeHolder.methods.lock(mainTokenAddress, 1000).send({
    from: userWallet.address,
    gas: 5700000
  });


  console.log(lockTxReceipt)

  const sidechainChronoBankPlatformAtomicSwapPlugin = new web3.eth.Contract(sidechainCotractsFactory.contracts.ChronoBankPlatformAtomicSwapPlugin.abi, _.get(sidechainCotractsFactory.addresses, `${networkId}.ChronoBankPlatformAtomicSwapPlugin.address`));

  let secret = '123';
  let reissueAssetArgs = [
    '231',
    sidechainSymbol,
    1000, //value
    userWallet.address,
    web3.toBigNumber(new Date().getTime() / 1000 + 120)
  ];
  let reissueAssetAndOpenSwapTx = await sidechainChronoBankPlatformAtomicSwapPlugin.reissueAssetAndOpenSwap();
/*  let tx = await swapContractPlugin.reissueAssetAndOpenSwap(
    SWAP_ID,
    SYMBOL,
    VALUE,
    user,
    secretKeyHash,
    web3.toBigNumber(new Date().getTime() / 1000 + 120),
    { from: middleware }
  );*/



  //locks the same
  //mainnet -> sidechain
  //reissue + open + close -> sidechain.ChronoBankPlatformAtomicSwapPlugin.reissueAssetAndOpenSwap(); + close() - from middleware


  return;
  //sidechain->mainnet
  //burn the same
  //register unlock shares
  //need to add cbe account UserManager#addCBE(address _key, bytes32 _hash, bytes32 _salt, bytes _signatures) + oracle

  //generate message, sign and return v,r,s + salt

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

};

module.exports = init();
