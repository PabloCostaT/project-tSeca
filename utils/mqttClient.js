/**
 * Cliente MQTT compartilhado para o painel
 */

const mqtt = require('mqtt');
const config = require('../config/app');
const logger = require('./logger');

class MQTTClient {
  constructor() {
    const { host, port, username, password, clientIdPrefix } = config.mqtt;
    const clientId = `${clientIdPrefix}-${Math.random().toString(16).slice(2)}`;

    this.client = mqtt.connect({
      host,
      port,
      username,
      password,
      clientId,
      keepalive: 60,
      reconnectPeriod: 3000,
      connectTimeout: 10_000,
      protocolVersion: 4,
      clean: true,
    });

    this.baseTopic = config.mqtt.baseTopic;
    this.deviceId = config.esp.deviceId;
    this.statusTopic = `${this.baseTopic}/${this.deviceId}/status`;
    this.cmdTopic = `${this.baseTopic}/${this.deviceId}/cmd`;
    this.lastStatus = null;

    this._wireEvents();
  }

  _wireEvents() {
    this.client.on('connect', () => {
      logger.info(`✅ Conectado ao MQTT em ${config.mqtt.host}:${config.mqtt.port}`);
      this.client.subscribe(this.statusTopic, { qos: 1 }, (err) => {
        if (err) {
          logger.error('Erro ao assinar tópico de status', err);
        } else {
          logger.info(`📡 Assinado: ${this.statusTopic}`);
        }
      });
    });

    this.client.on('reconnect', () => {
      logger.warn('Reconectando ao MQTT...');
    });

    this.client.on('error', (err) => {
      logger.error('Erro MQTT', err);
    });

    this.client.on('message', (topic, payload) => {
      if (topic === this.statusTopic) {
        try {
          const data = JSON.parse(payload.toString());
          this.lastStatus = data;
        } catch (e) {
          logger.warn('Falha ao parsear status MQTT', e);
        }
      }
    });
  }

  /**
   * Retorna o último status conhecido (retained) do dispositivo
   */
  getLastStatus() {
    return this.lastStatus;
  }

  /**
   * Publica um comando bruto (string ou objeto).
   */
  publishCommand(command) {
    return new Promise((resolve, reject) => {
      const message = typeof command === 'string' ? command : JSON.stringify(command);
      this.client.publish(this.cmdTopic, message, { qos: 1 }, (err) => {
        if (err) return reject(err);
        resolve(true);
      });
    });
  }
}

module.exports = new MQTTClient();


