const _ = require('lodash');

module.exports = async (web3, txModel) => {

  let last = await txModel.find().sort({blockNumber: -1}).limit(1);
  last = _.get(last, 'blockNumber', 0);

  let currentBlock = await web3.eth.getBlockNumber();

  for (let index = last; index <= currentBlock; index++) {
    let block = await web3.eth.getBlock(index, true);

    for (let transaction of block.transactions)
      await txModel.create({
        _id: transaction.hash,
        blockNumber: transaction.blockNumber,
        index: transaction.transactionIndex,
        value: transaction.value,
        to: transaction.to ? transaction.to.toLowerCase() : null,
        nonce: transaction.nonce,
        gasPrice: transaction.gasPrice,
        gas: transaction.gas,
        gasUsed: transaction.gasUsed,
        from: transaction.from ? transaction.from.toLowerCase() : null
      });


  }


};
