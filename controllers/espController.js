/**
 * Controller para operações do ESP8266
 */

const espClient = require('../utils/espClient');
const logger = require('../utils/logger');

class ESPController {
  /**
   * Liga o aquecedor por 25 minutos
   */
  async ligar25(req, res) {
    try {
      logger.info('Tentativa de ligar aquecedor por 25 minutos');
      const resultado = await espClient.ligar25();
      
      res.json({
        success: true,
        message: 'Aquecedor ligado por 25 minutos com sucesso',
        data: resultado
      });
    } catch (error) {
      logger.error('Erro ao ligar aquecedor por 25 minutos', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao ligar aquecedor por 25 minutos',
        error: error.message
      });
    }
  }

  /**
   * Liga o aquecedor por 60 minutos
   */
  async ligar60(req, res) {
    try {
      logger.info('Tentativa de ligar aquecedor por 60 minutos');
      const resultado = await espClient.ligar60();
      
      res.json({
        success: true,
        message: 'Aquecedor ligado por 60 minutos com sucesso',
        data: resultado
      });
    } catch (error) {
      logger.error('Erro ao ligar aquecedor por 60 minutos', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao ligar aquecedor por 60 minutos',
        error: error.message
      });
    }
  }

  /**
   * Liga o aquecedor por 120 minutos
   */
  async ligar120(req, res) {
    try {
      logger.info('Tentativa de ligar aquecedor por 120 minutos');
      const resultado = await espClient.ligar120();
      
      res.json({
        success: true,
        message: 'Aquecedor ligado por 120 minutos com sucesso',
        data: resultado
      });
    } catch (error) {
      logger.error('Erro ao ligar aquecedor por 120 minutos', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao ligar aquecedor por 120 minutos',
        error: error.message
      });
    }
  }

  /**
   * Liga o aquecedor
   */
  async ligarAquecedor(req, res) {
    try {
      logger.info('Tentativa de ligar aquecedor');
      const resultado = await espClient.ligarAquecedor();
      
      res.json({
        success: true,
        message: 'Aquecedor ligado com sucesso',
        data: resultado
      });
    } catch (error) {
      logger.error('Erro ao ligar aquecedor', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao ligar aquecedor',
        error: error.message
      });
    }
  }

  /**
   * Desliga o aquecedor
   */
  async desligarAquecedor(req, res) {
    try {
      logger.info('Tentativa de desligar aquecedor');
      const resultado = await espClient.desligarAquecedor();
      
      res.json({
        success: true,
        message: 'Aquecedor desligado com sucesso',
        data: resultado
      });
    } catch (error) {
      logger.error('Erro ao desligar aquecedor', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao desligar aquecedor',
        error: error.message
      });
    }
  }

  /**
   * Obtém o status atual
   */
  async getStatus(req, res) {
    try {
      logger.debug('Solicitando status do ESP');
      const status = await espClient.getStatus();
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Erro ao obter status', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao obter status',
        error: error.message
      });
    }
  }

  /**
   * Configura temporizador
   */
  async setTemporizador(req, res) {
    try {
      const { minutos } = req.body;
      
      if (!minutos || !Number.isInteger(minutos) || minutos <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Minutos deve ser um número inteiro positivo'
        });
      }

      logger.info(`Configurando temporizador para ${minutos} minutos`);
      const resultado = await espClient.setTemporizador(minutos);
      
      res.json({
        success: true,
        message: `Temporizador configurado para ${minutos} minutos`,
        data: resultado
      });
    } catch (error) {
      logger.error('Erro ao configurar temporizador', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao configurar temporizador',
        error: error.message
      });
    }
  }
}

module.exports = new ESPController();
