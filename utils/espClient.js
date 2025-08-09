/**
 * Cliente utilitário para comunicação com ESP8266
 */

const axios = require('axios');
const config = require('../config/app');
const logger = require('./logger');

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
    logger.info('Simulando ligar aquecedor por 25 minutos');
    this.simulatedState = {
      ativo: true,
      estado: 'aquecendo',
      minutos: 25,
      restante: 1500, // 25 minutos em segundos
      rele1: 1,
      rele2: 0
    };
    
    return {
      status: 'ligado 25 min',
      tempo: 1500,
      message: 'Aquecedor ligado por 25 minutos (simulado)'
    };
  }

  /**
   * Liga o aquecedor por 60 minutos (simulado)
   */
  async ligar60() {
    logger.info('Simulando ligar aquecedor por 60 minutos');
    this.simulatedState = {
      ativo: true,
      estado: 'aquecendo',
      minutos: 60,
      restante: 3600, // 60 minutos em segundos
      rele1: 1,
      rele2: 0
    };
    
    return {
      status: 'ligado 60 min',
      tempo: 3600,
      message: 'Aquecedor ligado por 60 minutos (simulado)'
    };
  }

  /**
   * Liga o aquecedor por 120 minutos (simulado)
   */
  async ligar120() {
    logger.info('Simulando ligar aquecedor por 120 minutos');
    this.simulatedState = {
      ativo: true,
      estado: 'aquecendo',
      minutos: 120,
      restante: 7200, // 120 minutos em segundos
      rele1: 1,
      rele2: 0
    };
    
    return {
      status: 'ligado 120 min',
      tempo: 7200,
      message: 'Aquecedor ligado por 120 minutos (simulado)'
    };
  }

  /**
   * Liga o aquecedor (simulado)
   */
  async ligarAquecedor() {
    logger.info('Simulando ligar aquecedor');
    this.simulatedState = {
      ativo: true,
      estado: 'aquecendo',
      minutos: 25,
      restante: 1500,
      rele1: 1,
      rele2: 0
    };
    
    return {
      status: 'ligado',
      message: 'Aquecedor ligado (simulado)'
    };
  }

  /**
   * Desliga o aquecedor (simulado)
   */
  async desligarAquecedor() {
    logger.info('Simulando desligar aquecedor');
    this.simulatedState = {
      ativo: false,
      estado: 'desligado',
      minutos: 0,
      restante: 0,
      rele1: 0,
      rele2: 0
    };
    
    return {
      status: 'desligado',
      message: 'Aquecedor desligado (simulado)'
    };
  }

  /**
   * Obtém o status atual
   */
  async getStatus() {
    try {
      // Tenta obter o status real do ESP
      const realStatus = await this.request('/status', 'GET');
      logger.debug('Status real obtido do ESP:', realStatus);
      return realStatus;
    } catch (error) {
      // Se falhar, retorna o status simulado
      logger.warn('Não foi possível obter status real do ESP, usando simulado');
      return this.simulatedState;
    }
  }

  /**
   * Configura temporizador (simulado)
   */
  async setTemporizador(minutos) {
    logger.info(`Simulando configurar temporizador para ${minutos} minutos`);
    this.simulatedState = {
      ativo: true,
      estado: 'aquecendo',
      minutos: minutos,
      restante: minutos * 60,
      rele1: 1,
      rele2: 0
    };
    
    return {
      status: `ligado ${minutos} min`,
      message: `Temporizador configurado para ${minutos} minutos (simulado)`
    };
  }
}

module.exports = new ESPClient();
