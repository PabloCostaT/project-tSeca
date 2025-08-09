/**
 * Configurações centralizadas da aplicação
 */

require('dotenv').config();

const config = {
  // Configurações do servidor
  server: {
    port: process.env.PORT || 3030,
    env: process.env.NODE_ENV || 'development',
  },

  // Configurações do ESP8266
  esp: {
    url: process.env.ESP_URL || 'http://192.168.15.14',
    apiToken: process.env.API_TOKEN || '123456',
    deviceId: process.env.ESP_DEVICE_ID || 'esp001',
  },

  // Configurações de MQTT (painel)
  mqtt: {
    host: process.env.MQTT_HOST || 'mqtt.seulimacasafacil.com.br',
    port: parseInt(process.env.MQTT_PORT || '1883', 10),
    username: process.env.MQTT_USER || 'paineluser',
    password: process.env.MQTT_PASS || 'Painel@2025!',
    clientIdPrefix: process.env.MQTT_CLIENT_ID_PREFIX || 'tSecaPainel',
    baseTopic: process.env.MQTT_BASE_TOPIC || 'tSeca',
  },

  // Configurações de segurança
  security: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3030'],
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    },
  },

  // Configurações de log
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

module.exports = config;
