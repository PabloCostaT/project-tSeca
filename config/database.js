/**
 * Configurações de banco de dados
 * Para futuras integrações com MongoDB, PostgreSQL, etc.
 */

const config = {
  development: {
    // Configurações para desenvolvimento
  },
  production: {
    // Configurações para produção
  },
  test: {
    // Configurações para testes
  }
};

module.exports = config[process.env.NODE_ENV || 'development'];
