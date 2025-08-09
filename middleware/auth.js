/**
 * Middleware de autenticação para validar Bearer token
 */
const config = require('../config/app');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ 
      error: 'Token de acesso obrigatório',
      message: 'Inclua o header: Authorization: Bearer TOKEN', 
    });
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Formato de token inválido',
      message: 'Use o formato: Bearer TOKEN', 
    });
  }

  if (token !== config.esp.apiToken) {
    return res.status(403).json({ 
      error: 'Token inválido',
      message: 'Acesso negado', 
    });
  }

  next();
};

module.exports = authMiddleware;