/**
 * Configurações centralizadas da aplicação
 */

require('dotenv').config();

const config = {
  // Configurações do servidor
  server: {
    port: process.env.PORT || 3030,
    env: process.env.NODE_ENV || 'development',
    host: process.env.HOST || '0.0.0.0',
  },

  // Configurações do ESP8266
  esp: {
    url: process.env.ESP_URL || 'http://192.168.15.14',
    apiToken: process.env.API_TOKEN || '123456',
    deviceId: process.env.ESP_DEVICE_ID || 'esp001',
  },

  // Configurações da VPS (comunicação global)
  vps: {
    baseUrl: process.env.VPS_BASE_URL || 'https://sua-vps.com',
    apiToken: process.env.VPS_API_TOKEN || 'seu_token_secreto',
    heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL_MS) || 30000, // 30s
    commandPollInterval: parseInt(process.env.COMMAND_POLL_INTERVAL_MS) || 10000, // 10s
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
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    },
  },

  // Configurações de log
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: process.env.LOG_MAX_FILES || '5',
  },

  // Configurações de banco de dados (futuro)
  database: {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/tseca',
    type: process.env.DATABASE_TYPE || 'mongodb', // mongodb, postgresql, sqlite
  },

  // Configurações de cache (futuro)
  cache: {
    type: process.env.CACHE_TYPE || 'memory', // memory, redis
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || '',
    },
  },
};

module.exports = config;
