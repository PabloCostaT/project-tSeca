require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const net = require('net');

const config = require('./config/app');
const logger = require('./utils/logger');
const espRoutes = require('./routes/esp');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = config.server.port;

// Função para verificar se a porta está disponível
const isPortAvailable = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
    server.on('error', () => {
      resolve(false);
    });
  });
};

// Função para encontrar uma porta disponível
const findAvailablePort = async (startPort) => {
  let port = startPort;
  while (!(await isPortAvailable(port))) {
    port++;
    if (port > startPort + 100) {
      throw new Error('Não foi possível encontrar uma porta disponível');
    }
  }
  return port;
};

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.max,
  message: {
    error: 'Muitas requisições',
    message: 'Tente novamente em alguns minutos',
  },
});

// Middlewares de segurança e performance
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\'', 'https://cdn.tailwindcss.com', 'https://cdnjs.cloudflare.com', 'https://unpkg.com'],
      scriptSrc: ['\'self\'', '\'unsafe-inline\'', 'https://cdn.tailwindcss.com', 'https://unpkg.com'],
      fontSrc: ['\'self\'', 'https://cdnjs.cloudflare.com', 'https://fonts.gstatic.com', 'https://unpkg.com'],
      imgSrc: ['\'self\'', 'data:', 'https:'],
      connectSrc: ['\'self\'', 'https://cdn.tailwindcss.com'],
    },
  },
}));
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: config.server.env === 'production' ? config.security.allowedOrigins : true,
  credentials: true,
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public', {
  maxAge: '1d',
  etag: true,
}));

// Middleware de autenticação para rotas da API
app.use('/', authMiddleware);

// Rotas da API
app.use('/api', espRoutes);

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota de configurações
app.get('/config.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'config.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Tratamento de erros
app.use((err, req, res, next) => {
  logger.error('Erro interno do servidor', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: config.server.env === 'development' ? err.message : 'Algo deu errado!',
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Exportar app para testes
module.exports = app;

// Iniciar servidor apenas se não estiver em teste
if (config.server.env !== 'test') {
  const startServer = async () => {
    try {
      // Verificar se a porta está disponível
      const availablePort = await findAvailablePort(PORT);
      
      if (availablePort !== PORT) {
        logger.warn(`⚠️  Porta ${PORT} está em uso. Usando porta ${availablePort} como alternativa.`);
      }
      
      app.listen(availablePort, () => {
        logger.info(`🚀 Servidor tSeca rodando na porta ${availablePort}`);
        logger.info(`🌐 Acesse: http://localhost:${availablePort}`);
        logger.info(`🔧 ESP8266: ${config.esp.url}`);
        logger.info(`🔒 Ambiente: ${config.server.env}`);
      });
    } catch (error) {
      logger.error('❌ Erro ao iniciar o servidor:', error.message);
      process.exit(1);
    }
  };
  
  startServer();
}