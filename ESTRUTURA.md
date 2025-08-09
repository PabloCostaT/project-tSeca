# 📁 Estrutura do Projeto tSeca

## 🏗️ Organização das Pastas

```
project/
├── 📄 server.js                 # Servidor principal Express.js
├── 📄 package.json              # Dependências e scripts
├── 📄 README.md                 # Documentação principal
├── 📄 jest.config.js            # Configuração de testes
├── 📄 .eslintrc.js             # Configuração ESLint
├── 📄 .gitignore               # Arquivos ignorados pelo Git
│
├── 📁 config/                  # Configurações centralizadas
│   ├── 📄 app.js              # Configurações da aplicação
│   └── 📄 database.js         # Configurações de banco (futuro)
│
├── 📁 controllers/             # Lógica de negócio
│   └── 📄 espController.js    # Controller para operações ESP8266
│
├── 📁 middleware/              # Middlewares personalizados
│   └── 📄 auth.js             # Autenticação Bearer token
│
├── 📁 routes/                  # Definição de rotas
│   └── 📄 esp.js              # Rotas da API ESP8266
│
├── 📁 utils/                   # Utilitários e helpers
│   ├── 📄 logger.js           # Sistema de logging centralizado
│   └── 📄 espClient.js        # Cliente para comunicação ESP8266
│
├── 📁 public/                  # Arquivos estáticos (frontend)
│   ├── 📄 index.html          # Interface web principal
│   ├── 📄 styles.css          # Estilos CSS
│   └── 📄 app.js              # JavaScript frontend
│
└── 📁 tests/                   # Testes automatizados
    ├── 📄 setup.js            # Configuração dos testes
    └── 📄 server.test.js      # Testes do servidor
```

## 🔧 Melhorias Implementadas

### 1. **Separação de Responsabilidades**
- **Controllers**: Lógica de negócio isolada
- **Utils**: Utilitários reutilizáveis
- **Config**: Configurações centralizadas

### 2. **Configuração Centralizada**
- Arquivo `config/app.js` com todas as configurações
- Variáveis de ambiente organizadas
- Configurações de segurança centralizadas

### 3. **Sistema de Logging**
- Logger centralizado em `utils/logger.js`
- Logs estruturados com timestamps
- Diferentes níveis de log (info, error, warn, debug)

### 4. **Cliente ESP8266**
- Cliente dedicado em `utils/espClient.js`
- Tratamento de erros centralizado
- Timeout configurável
- Headers padronizados

### 5. **Controllers Organizados**
- `espController.js` com métodos específicos
- Validação de entrada
- Respostas padronizadas
- Tratamento de erros consistente

## 📋 Fluxo de Dados

```
Frontend (public/) 
    ↓
Routes (routes/esp.js)
    ↓
Controllers (controllers/espController.js)
    ↓
Utils (utils/espClient.js)
    ↓
ESP8266 Device
```

## 🔒 Segurança

- **Rate Limiting**: Configurável via `config/app.js`
- **CORS**: Configuração por ambiente
- **Helmet**: Headers de segurança
- **Autenticação**: Bearer token obrigatório

## 🧪 Testes

- **Jest**: Framework de testes
- **Supertest**: Testes de integração
- **Setup**: Configuração isolada para testes

## 🚀 Scripts Disponíveis

```bash
npm start          # Produção
npm run dev        # Desenvolvimento
npm test           # Executar testes
npm run lint       # Verificar código
npm run lint:fix   # Corrigir código
```

## 📝 Próximos Passos

1. **Banco de Dados**: Integração com MongoDB/PostgreSQL
2. **Cache**: Redis para otimização
3. **Monitoramento**: Logs estruturados
4. **Deploy**: Configuração para produção
5. **Documentação**: API docs com Swagger
