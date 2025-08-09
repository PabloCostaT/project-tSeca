// Setup para testes
process.env.NODE_ENV = 'test';
process.env.API_TOKEN = 'test-token';
process.env.ESP_URL = 'http://192.168.1.100';

// Mock do console para reduzir ruído nos testes
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};
