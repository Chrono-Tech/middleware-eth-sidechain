/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */


module.exports = {
  swapNotFound: {message: 'wrong swap id provided', status: 300},
  wrongAddress: {message: 'wrong address provided', status: 301},
  wrongTxType: {message: 'wrong tx type provided', status: 302},
  txOpenExecuted: {message: 'the swap has already been opened', status: 303},
  wrongParams: {message: 'wrong params', status: 304},
  requestLimitReached: {message: 'request limit reached', status: 305}

};
