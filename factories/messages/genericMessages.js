/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

/**
 * @factory
 * @description generic message factory
 * @type {{
 *       success: {
 *          message: string, status: number
 *          },
 *       fail: {
 *          message: string, status: number
 *          }
 *       }}
 */
module.exports = {
  success: {message: 'success', status: 1},
  fail: {message: 'fail', status: 0},
  
};
