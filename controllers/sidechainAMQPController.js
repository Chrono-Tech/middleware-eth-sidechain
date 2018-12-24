const config = require('../config'),
  amqp = require('amqplib'),
  openSwapService = require('../services/main/rmq/openSwapService'),
  issueAssetSwapService = require('../services/main/rmq/issueAssetSwapService'),
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

    await this.channel.assertQueue(`${config.sidechain.rabbit.serviceName}.sidechain.issue`);

    await this.channel.bindQueue(`${config.sidechain.rabbit.serviceName}.sidechain.issue`, 'events', `${config.sidechain.rabbit.serviceName}_chrono_sc.issue`);

    this.channel.consume(`${config.sidechain.rabbit.serviceName}.sidechain.issue`, this._onIssueAssetEvent.bind(this));

  }

  async _onIssueAssetEvent (data) {

    let parsedData;

    try {
      parsedData = JSON.parse(data.content.toString());
    } catch (e) {
      return this.channel.ack(data);
    }

    try {
      console.log(parsedData);
      await issueAssetSwapService(parsedData.info.tx, parsedData.payload.swap);
      this.channel.ack(data);
    } catch (e) {
      console.log(e);
      return this.channel.nack(data);
    }


  }


}

module.exports = MainAMQPController;
