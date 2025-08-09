const request = require('supertest');
const express = require('express');

// Mock das variáveis de ambiente
process.env.API_TOKEN = 'test-token';
process.env.ESP_URL = 'http://192.168.1.100';

// Mock do axios para evitar chamadas reais para o ESP
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.reject(new Error('ESP offline'))),
  post: jest.fn(() => Promise.reject(new Error('ESP offline'))),
}));

// Importar o servidor
const app = require('../server');

describe('Server Tests', () => {
  test('GET / should return HTML', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/html/);
  });

  test('GET /health should return status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
  });

  test('GET /api/estado without auth should return 401', async () => {
    const response = await request(app).get('/api/estado');
    expect(response.status).toBe(401);
  });

  test('GET /api/estado with auth should return 500 (ESP offline)', async () => {
    const response = await request(app)
      .get('/api/estado')
      .set('Authorization', 'Bearer test-token');
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Erro ao comunicar com ESP8266');
  }, 10000); // Aumentar timeout para 10 segundos

  test('POST /api/ligar without auth should return 401', async () => {
    const response = await request(app).post('/api/ligar');
    expect(response.status).toBe(401);
  });

  test('POST /api/ligar with auth should return 500 (ESP offline)', async () => {
    const response = await request(app)
      .post('/api/ligar')
      .set('Authorization', 'Bearer test-token');
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Erro ao comunicar com ESP8266');
  }, 10000); // Aumentar timeout para 10 segundos

  test('POST /api/tempo with invalid data should return 400', async () => {
    const response = await request(app)
      .post('/api/tempo')
      .set('Authorization', 'Bearer test-token')
      .send({ minutos: 'invalid' });
    expect(response.status).toBe(400);
  });

  test('POST /api/tempo with valid data should return 500 (ESP offline)', async () => {
    const response = await request(app)
      .post('/api/tempo')
      .set('Authorization', 'Bearer test-token')
      .send({ minutos: 25 });
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Erro ao comunicar com ESP8266');
  }, 10000);
});
