/**
 * Cliente utilitário para comunicação com ESP8266
 */

const axios = require('axios');
const config = require('../config/app');
const logger = require('./logger');
const mqttClient = require('./mqttClient');

class ESPClient {
  constructor() {
    this.baseURL = config.esp.url;
    this.apiToken = config.esp.apiToken;
    this.timeout = 5000; // 5 segundos
    this.simulatedState = {
      ativo: false,
      estado: 'desligado',
      minutos: 0,
      restante: 0,
      rele1: 0,
      rele2: 0
    };
  }

  /**
   * Faz uma requisição para o ESP8266
   */
  async request(endpoint, method = 'GET', data = null) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers = {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      };

      const response = await axios({
        method,
        url,
        headers,
        data,
        timeout: this.timeout,
      });

      logger.debug(`ESP Request: ${method} ${url}`, { status: response.status });
      return response.data;
    } catch (error) {
      logger.error(`Erro na comunicação com ESP: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Liga o aquecedor por 25 minutos (simulado)
   */
  async ligar25() {
    logger.info('Publicando comando MQTT: ligar25');
    await mqttClient.publishCommand('ligar25');
    return { status: 'ligado 25 min' };
  }

  /**
   * Liga o aquecedor por 60 minutos (simulado)
   */
  async ligar60() {
    logger.info('Publicando comando MQTT: ligar60');
    await mqttClient.publishCommand('ligar60');
    return { status: 'ligado 60 min' };
  }

  /**
   * Liga o aquecedor por 120 minutos (simulado)
   */
  async ligar120() {
    logger.info('Publicando comando MQTT: ligar120');
    await mqttClient.publishCommand('ligar120');
    return { status: 'ligado 120 min' };
  }

  /**
   * Liga o aquecedor (simulado)
   */
  async ligarAquecedor() {
    logger.info('Publicando comando MQTT: ligar30');
    await mqttClient.publishCommand('ligar30');
    return { status: 'ligado' };
  }

  /**
   * Desliga o aquecedor (simulado)
   */
  async desligarAquecedor() {
    logger.info('Publicando comando MQTT: desligar');
    await mqttClient.publishCommand('desligar');
    return { status: 'desligado' };
  }

  /**
   * Obtém o status atual
   */
  async getStatus() {
    // Preferir status via MQTT (retained)
    const mqttStatus = mqttClient.getLastStatus();
    if (mqttStatus) {
      return mqttStatus;
    }

    // Fallback: HTTP direto ao ESP
    try {
      const realStatus = await this.request('/status', 'GET');
      logger.debug('Status real obtido do ESP:', realStatus);
      return realStatus;
    } catch (error) {
      logger.warn('Não foi possível obter status do ESP (MQTT/HTTP)');
      throw error;
    }
  }

  /**
   * Configura temporizador (simulado)
   */
  async setTemporizador(minutos) {
    logger.info(`Publicando comando MQTT JSON: ligar ${minutos} min`);
    await mqttClient.publishCommand({ cmd: 'ligar', minutos });
    return { status: `ligado ${minutos} min` };
  }
}

module.exports = new ESPClient();
