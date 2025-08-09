const express = require('express');
const router = express.Router();
const espController = require('../controllers/espController');

/**
 * Obter estado atual do dispositivo
 */
router.get('/estado', espController.getStatus);

/**
 * Obter status (alias para /estado)
 */
router.get('/status', espController.getStatus);

/**
 * Ligar aquecedor
 */
router.post('/ligar', espController.ligarAquecedor);

/**
 * Ligar por 25 minutos
 */
router.post('/ligar25', espController.ligar25);

/**
 * Ligar por 60 minutos
 */
router.post('/ligar60', espController.ligar60);

/**
 * Ligar por 120 minutos
 */
router.post('/ligar120', espController.ligar120);

/**
 * Desligar aquecedor
 */
router.post('/desligar', espController.desligarAquecedor);

/**
 * Configurar temporizador
 */
router.post('/tempo', espController.setTemporizador);

module.exports = router;