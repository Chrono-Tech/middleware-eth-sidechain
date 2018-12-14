const exchangeModel = require('../../models/exchangeModel'),
  exchangeStates = require('../../factories/states/exchangeStatesFactory'),
  txTypes = require('../../factories/states/txTypeFactory'),
  uniqid = require('uniqid'),
  config = require('../../config'),
  providerService = require('../sidechain/providerService'),
  contracts = require('../../factories/sc/sidechainCotractsFactory'),
  crypto = require('crypto');


module.exports = async (txHash, value, address) => {

  let record = await exchangeModel.findOne({txHash});

  if (record && [exchangeStates.OPENED, exchangeStates.CLOSED].includes(record.status))
    return;

  if (!record) {

    let key = uniqid();
    let swapId = uniqid();

    record = new exchangeModel({
      key: key,
      address: address.toLowerCase(),
      swapId: swapId,
      txHash: txHash,
      status: exchangeStates.CREATED
    });

    await record.save();
  }


  const web3 = await providerService.get();
  const networkId = await web3.eth.net.getId();
  const account = web3.eth.accounts.privateKeyToAccount(config.sidechain.web3.privateKey);
  const keyHash = crypto.createHash('sha256').update(record.key).digest('hex');

  const platform = new web3.eth.Contract(contracts.ChronoBankPlatform.abi, _.get(contracts.ChronoBankPlatform, `networks.${networkId}.address`));
  const swapContract = new web3.eth.Contract(contracts.AtomicSwapERC20.abi, _.get(contracts.AtomicSwapERC20, `networks.${networkId}.address`));

  const paramsReissue = [web3.utils.asciiToHex(config.sidechain.web3.symbol), value];
  const gasReissue = await platform.methods.reissueAsset(...paramsReissue).estimateGas({from: account.address});


  if (!_.find(record.actions, {type: txTypes.REISSUE_ASSET})) {
    let result = await platform.methods.reissueAsset(...paramsReissue).send({
      from: account.address,
      gas: parseInt(gasReissue * 1.2)
    });
    record.actions.push({
      type: txTypes.REISSUE_ASSET,
      result: result
    })
  }

  const tokenAddress = await platform.methods.proxies(web3.utils.asciiToHex(config.sidechain.web3.symbol)).call();

  const erc20 = new web3.eth.Contract(contracts.ERC20Interface.abi, tokenAddress);
  const paramsApprove = [swapContract.options.address, value];
  const gasApprove = await erc20.methods.approve(...paramsApprove).estimateGas({from: account.address});

  if (!_.find(record.actions, {type: txTypes.APPROVE})) {
    let result = await erc20.methods.approve(...paramsApprove).send({
      from: account.address,
      gas: parseInt(gasApprove * 1.2)
    });
    record.actions.push({
      type: txTypes.APPROVE,
      result: result
    })
  }


  const paramsOpen = [web3.utils.asciiToHex(record.swapId),
    value,
    tokenAddress,
    address,
    `0x${keyHash}`,
    web3.utils.toHex(parseInt(((new Date()).getTime() + config.sidechain.swap.expiration) / 1000))];

  const gasOpen = await swapContract.methods.open(...paramsOpen).estimateGas({from: account.address});

  if (!_.find(record.actions, {type: txTypes.OPEN})) {
    let result = await swapContract.methods.open(...paramsOpen).send({
      from: account.address,
      gas: parseInt(gasOpen * 1.2)
    });
    record.actions.push({
      type: txTypes.OPEN,
      result: result
    })
  }


  record.status = exchangeStates.OPENED;
  await record.save();

};