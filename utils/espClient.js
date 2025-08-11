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
   * Liga o aquecedor por 25 minutos
   */
  async ligar25() {
    try {
      // Primeiro tenta via HTTP direto
      const resultado = await this.request('/ligar25', 'GET');
      logger.info('Comando ligar25 enviado via HTTP:', resultado);
      return resultado;
    } catch (error) {
      logger.warn('HTTP falhou, tentando MQTT:', error.message);
      // Fallback para MQTT
      await mqttClient.publishCommand('ligar25');
      return { status: 'ligado 25 min' };
    }
  }

  /**
   * Liga o aquecedor por 60 minutos
   */
  async ligar60() {
    try {
      // Primeiro tenta via HTTP direto
      const resultado = await this.request('/ligar60', 'GET');
      logger.info('Comando ligar60 enviado via HTTP:', resultado);
      return resultado;
    } catch (error) {
      logger.warn('HTTP falhou, tentando MQTT:', error.message);
      // Fallback para MQTT
      await mqttClient.publishCommand('ligar60');
      return { status: 'ligado 60 min' };
    }
  }

  /**
   * Liga o aquecedor por 120 minutos
   */
  async ligar120() {
    try {
      // Primeiro tenta via HTTP direto
      const resultado = await this.request('/ligar120', 'GET');
      logger.info('Comando ligar120 enviado via HTTP:', resultado);
      return resultado;
    } catch (error) {
      logger.warn('HTTP falhou, tentando MQTT:', error.message);
      // Fallback para MQTT
      await mqttClient.publishCommand('ligar120');
      return { status: 'ligado 120 min' };
    }
  }

  /**
   * Liga o aquecedor (padrão 30 minutos)
   */
  async ligarAquecedor() {
    try {
      // Primeiro tenta via HTTP direto
      const resultado = await this.request('/ligar', 'GET');
      logger.info('Comando ligar enviado via HTTP:', resultado);
      return resultado;
    } catch (error) {
      logger.warn('HTTP falhou, tentando MQTT:', error.message);
      // Fallback para MQTT
      await mqttClient.publishCommand('ligar30');
      return { status: 'ligado' };
    }
  }

  /**
   * Desliga o aquecedor
   */
  async desligarAquecedor() {
    try {
      // Primeiro tenta via HTTP direto
      const resultado = await this.request('/desligar', 'GET');
      logger.info('Comando desligar enviado via HTTP:', resultado);
      return resultado;
    } catch (error) {
      logger.warn('HTTP falhou, tentando MQTT:', error.message);
      // Fallback para MQTT
      await mqttClient.publishCommand('desligar');
      return { status: 'desligado' };
    }
  }

  /**
   * Obtém o status atual
   */
  async getStatus() {
    // Preferir status via MQTT (retained)
    const mqttStatus = mqttClient.getLastStatus();
    if (mqttStatus) {
      logger.debug('Status obtido via MQTT:', mqttStatus);
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
   * Configura temporizador personalizado
   * Como o ESP não tem endpoint /tempo, usamos MQTT com comando JSON
   */
  async setTemporizador(minutos) {
    if (!minutos || !Number.isInteger(minutos) || minutos <= 0) {
      throw new Error('Minutos deve ser um número inteiro positivo');
    }

    // O ESP suporta comandos JSON via MQTT
    const comando = { cmd: 'ligar', minutos: minutos };
    logger.info(`Publicando comando MQTT JSON: ${JSON.stringify(comando)}`);
    await mqttClient.publishCommand(comando);
    return { status: `ligado ${minutos} min` };
  }
}

module.exports = new ESPClient();
