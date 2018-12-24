const config = require('../config'),
  amqp = require('amqplib'),
  issueAssetSwapService = require('../services/main/rmq/issueAssetSwapService'),
  approveTransferSwapService = require('../services/main/rmq/approveTransferSwapService'),
  EventEmitter = require('events');


class MainAMQPController extends EventEmitter {

  constructor () {
    super();
  }

  async connect () {

    this.connection = await amqp.connect(config.sidechain.rabbit.url);
    this.channel = await this.connection.createChannel();
    this.channel.on('close', () => {
      this.emit('error', 'rabbitmq process has finished!');
    });

    this.channel.prefetch(2);

    await this.channel.assertExchange('events', 'topic', {durable: false});
    await this.channel.assertExchange('internal', 'topic', {durable: false});

    await this.channel.assertQueue(`${config.sidechain.rabbit.serviceName}.sidechain.reissueatomicswap`);
    await this.channel.assertQueue(`${config.sidechain.rabbit.serviceName}.sidechain.approval`);

    await this.channel.bindQueue(`${config.sidechain.rabbit.serviceName}.sidechain.reissueatomicswap`, 'events', `${config.sidechain.rabbit.serviceName}_chrono_sc.reissueatomicswap`);
    await this.channel.bindQueue(`${config.sidechain.rabbit.serviceName}.sidechain.approval`, 'events', `${config.sidechain.rabbit.serviceName}_chrono_sc.approval`);

    this.channel.consume(`${config.sidechain.rabbit.serviceName}.sidechain.reissueatomicswap`, this._onIssueAssetEvent.bind(this));
    this.channel.consume(`${config.sidechain.rabbit.serviceName}.sidechain.approval`, this._onApprovalEvent.bind(this));

  }

  async _onIssueAssetEvent (data) {

    let parsedData;

    try {
      parsedData = JSON.parse(data.content.toString());
    } catch (e) {
      return this.channel.ack(data);
    }

    try {
      await issueAssetSwapService(parsedData.info.tx, parsedData.payload.swapID);
      this.channel.ack(data);
    } catch (e) {
      console.log(e);
      return this.channel.nack(data);
    }


  }


  async _onApprovalEvent (data) {

    let parsedData;

    try {
      parsedData = JSON.parse(data.content.toString());
    } catch (e) {
      return this.channel.ack(data);
    }

    try {
      //await approveTransferSwapService(parsedData.info.tx, parsedData.payload.from, parsedData.payload.spender, parsedData.payload.value);
      this.channel.ack(data);
    } catch (e) {
      console.log(e);
      return this.channel.nack(data);
    }


  } //todo implement



}

module.exports = MainAMQPController;
