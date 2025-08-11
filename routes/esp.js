const express = require('express');
const router = express.Router();
const espController = require('../controllers/espController');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

// Middleware de autenticação para todas as rotas
router.use(auth);

// ============================= ROTAS EXISTENTES =============================

// Obter status do ESP
router.get('/status', async (req, res) => {
  try {
    const status = await espController.getStatus();
    res.json(status);
  } catch (error) {
    logger.error('Erro ao obter status:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Ligar aquecedor por 25 minutos
router.post('/ligar25', async (req, res) => {
  try {
    const resultado = await espController.ligar25();
    res.json(resultado);
  } catch (error) {
    logger.error('Erro ao ligar por 25min:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Ligar aquecedor por 60 minutos
router.post('/ligar60', async (req, res) => {
  try {
    const resultado = await espController.ligar60();
    res.json(resultado);
  } catch (error) {
    logger.error('Erro ao ligar por 60min:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Ligar aquecedor por 120 minutos
router.post('/ligar120', async (req, res) => {
  try {
    const resultado = await espController.ligar120();
    res.json(resultado);
  } catch (error) {
    logger.error('Erro ao ligar por 120min:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Desligar aquecedor
router.post('/desligar', async (req, res) => {
  try {
    const resultado = await espController.desligarAquecedor();
    res.json(resultado);
  } catch (error) {
    logger.error('Erro ao desligar:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Configurar temporizador personalizado
router.post('/tempo', async (req, res) => {
  try {
    const { minutos } = req.body;
    if (!minutos || !Number.isInteger(minutos) || minutos <= 0) {
      return res.status(400).json({ error: 'Minutos deve ser um número inteiro positivo' });
    }
    
    const resultado = await espController.setTemporizador(minutos);
    res.json(resultado);
  } catch (error) {
    logger.error('Erro ao configurar temporizador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ============================= NOVAS ROTAS PARA COMUNICAÇÃO GLOBAL =============================

// Heartbeat do ESP (ESP → VPS)
router.post('/heartbeat', async (req, res) => {
  try {
    const { device_id, status, wifi, ip, uptime } = req.body;
    
    if (!device_id) {
      return res.status(400).json({ error: 'device_id é obrigatório' });
    }

    logger.info(`Heartbeat recebido do ESP ${device_id}`, {
      device_id,
      wifi,
      ip,
      uptime,
      status: status?.estado || 'desconhecido'
    });

    // Armazenar status do dispositivo (em memória por enquanto)
    // TODO: Implementar banco de dados para persistir
    global.deviceStatus = global.deviceStatus || {};
    global.deviceStatus[device_id] = {
      ...status,
      wifi,
      ip,
      uptime,
      lastSeen: new Date().toISOString(),
      online: true
    };

    res.json({ 
      success: true, 
      message: 'Heartbeat recebido',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Erro ao processar heartbeat:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Comandos para o ESP (VPS → ESP)
router.get('/commands', async (req, res) => {
  try {
    const { device } = req.query;
    
    if (!device) {
      return res.status(400).json({ error: 'Parâmetro device é obrigatório' });
    }

    // Verificar se há comandos pendentes para este dispositivo
    // TODO: Implementar fila de comandos no banco de dados
    const pendingCommands = global.pendingCommands || {};
    const deviceCommands = pendingCommands[device] || [];
    
    if (deviceCommands.length === 0) {
      return res.json({ commands: [] });
    }

    // Retornar comandos pendentes e limpar a fila
    const commandsToSend = [...deviceCommands];
    pendingCommands[device] = [];
    global.pendingCommands = pendingCommands;

    logger.info(`Enviando ${commandsToSend.length} comandos para ESP ${device}`, commandsToSend);
    
    res.json({ 
      commands: commandsToSend,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Erro ao obter comandos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Enviar comando para ESP específico
router.post('/send-command', async (req, res) => {
  try {
    const { device_id, command, minutos } = req.body;
    
    if (!device_id || !command) {
      return res.status(400).json({ 
        error: 'device_id e command são obrigatórios' 
      });
    }

    // Validar comando
    const validCommands = ['ligar25', 'ligar60', 'ligar120', 'desligar', 'ligar'];
    if (!validCommands.includes(command)) {
      return res.status(400).json({ 
        error: `Comando inválido. Comandos válidos: ${validCommands.join(', ')}` 
      });
    }

    // Preparar comando
    const commandData = { command };
    if (command === 'ligar' && minutos) {
      commandData.minutos = parseInt(minutos);
    }

    // Adicionar à fila de comandos pendentes
    global.pendingCommands = global.pendingCommands || {};
    if (!global.pendingCommands[device_id]) {
      global.pendingCommands[device_id] = [];
    }
    
    global.pendingCommands[device_id].push({
      ...commandData,
      timestamp: new Date().toISOString(),
      id: Date.now().toString()
    });

    logger.info(`Comando ${command} adicionado à fila para ESP ${device_id}`, commandData);

    res.json({ 
      success: true, 
      message: `Comando ${command} enviado para ESP ${device_id}`,
      command: commandData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Erro ao enviar comando:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar dispositivos online
router.get('/devices', async (req, res) => {
  try {
    const devices = global.deviceStatus || {};
    const onlineDevices = Object.entries(devices)
      .filter(([_, status]) => status.online)
      .map(([deviceId, status]) => ({
        device_id: deviceId,
        ...status
      }));

    res.json({
      devices: onlineDevices,
      total: onlineDevices.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Erro ao listar dispositivos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Status de dispositivo específico
router.get('/device/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const devices = global.deviceStatus || {};
    const device = devices[deviceId];

    if (!device) {
      return res.status(404).json({ error: 'Dispositivo não encontrado' });
    }

    res.json({
      device_id: deviceId,
      ...device
    });
  } catch (error) {
    logger.error('Erro ao obter status do dispositivo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Limpar comandos pendentes de um dispositivo
router.delete('/device/:deviceId/commands', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    if (global.pendingCommands && global.pendingCommands[deviceId]) {
      global.pendingCommands[deviceId] = [];
      logger.info(`Comandos pendentes limpos para ESP ${deviceId}`);
    }

    res.json({ 
      success: true, 
      message: `Comandos pendentes limpos para ESP ${deviceId}` 
    });
  } catch (error) {
    logger.error('Erro ao limpar comandos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;