const config = require('../config'),
  amqp = require('amqplib'),
  openSwapService = require('../services/main/openSwapService'),
  EventEmitter = require('events');


class MainAMQPController extends EventEmitter {

  constructor () {
    super();
  }

  async connect () {

    this.connection = await amqp.connect(config.main.rabbit.url);
    this.channel = await this.connection.createChannel();
    this.channel.on('close', () => {
      this.emit('error', 'rabbitmq process has finished!');
    });

    this.channel.prefetch(2);

    await this.channel.assertExchange('events', 'topic', {durable: false});
    await this.channel.assertExchange('internal', 'topic', {durable: false});
    await this.channel.assertQueue(`${config.main.rabbit.serviceName}.sidechain`);
    await this.channel.bindQueue(`${config.main.rabbit.serviceName}.sidechain`, 'events', `${config.main.rabbit.serviceName}_chrono_sc.lock`);
    this.channel.consume(`${config.main.rabbit.serviceName}.sidechain`, this._onLockEvent.bind(this));

  }


  async _onLockEvent (data) {

    let parsedData;

    try {
      parsedData = JSON.parse(data.content.toString());
    } catch (e) {
      return this.channel.ack(data);
    }

    try {
      console.log(parsedData)
      await openSwapService(parsedData.info.tx, parsedData.payload.amount, parsedData.payload.who);
      this.channel.ack(data);
    } catch (e) {
      console.log(e);
      return this.channel.nack(data);
    }


  }

}

module.exports = MainAMQPController;
