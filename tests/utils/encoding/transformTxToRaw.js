const RLP = require('eth-lib/lib/rlp'),
  _ = require('lodash'),
  Web3 = require('web3'),
  web3 = new Web3(),
  Bytes = require('eth-lib/lib/bytes');

let makeEven = function (hex) { //todo move
  if (hex.length % 2 === 1)
    hex = hex.replace('0x', '0x0');

  return hex;
};

let trimLeadingZero = function (hex) { //todo move
  while (hex && hex.startsWith('0x0'))
    hex = '0x' + hex.slice(3);

  return hex;
};


module.exports = (tx, signature) => {

  if(!web3.utils.isHex(tx.nonce))
    tx.nonce = web3.utils.toHex(tx.nonce || 0);

  if(!web3.utils.isHex(tx.gasPrice))
    tx.gasPrice = web3.utils.toHex(tx.gasPrice);

  if(!web3.utils.isHex(tx.gasPrice))
    tx.gas = web3.utils.toHex(tx.gas);

  if(!web3.utils.isHex(tx.value))
    tx.value = tx.value ? web3.utils.toHex(tx.value) : '0x';

  if(!web3.utils.isHex(tx.chainId))
    tx.chainId = web3.utils.toHex(tx.chainId);

  let rlpEncoded = RLP.encode([
    Bytes.fromNat(tx.nonce),
    Bytes.fromNat(tx.gasPrice),
    Bytes.fromNat(tx.gas),
    tx.to,
    Bytes.fromNat(tx.value || '0x'), //value
    tx.data,
    Bytes.fromNat(tx.chainId),
    '0x',
    '0x']);

  let rawTx = RLP.decode(rlpEncoded).slice(0, 6).concat([signature.v, signature.r, signature.s]);

  rawTx[6] = makeEven(trimLeadingZero(rawTx[6]));
  rawTx[7] = makeEven(trimLeadingZero(rawTx[7]));
  rawTx[8] = makeEven(trimLeadingZero(rawTx[8]));

  return RLP.encode(rawTx);
};


