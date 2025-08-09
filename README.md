# tSeca Control Panel

Painel de controle web para dispositivo ESP8266 tSeca - Sistema de aquecimento inteligente com monitoramento de temperatura e umidade em tempo real.

## 🚀 Funcionalidades

- **Controle Remoto**: Liga/desliga aquecedor via interface web
- **Temporizador**: Configuração automática de tempo (25, 60, 120 minutos)
- **Monitoramento**: Temperatura e umidade em tempo real
- **Status Visual**: Indicadores coloridos para todos os componentes
- **Responsivo**: Interface adaptada para desktop e mobile
- **Seguro**: Autenticação via Bearer token
- **Auto-Update**: Dados atualizados automaticamente a cada 10 segundos
- **Configuração Inicial**: Tela para cadastrar IP e API Token
- **Teclas de Atalho**: Ctrl+1 (ligar), Ctrl+0 (desligar), Ctrl+R (refresh)

## 🏗️ Arquitetura

```
├── server.js              # Servidor principal Express.js
├── middleware/            
│   └── auth.js            # Middleware de autenticação
├── routes/
│   └── esp.js             # Rotas da API para comunicação com ESP
├── public/
│   ├── index.html         # Interface web principal
│   ├── styles.css         # Estilos personalizados
│   └── app.js             # JavaScript frontend
├── tests/                 # Testes automatizados
│   ├── setup.js           # Configuração dos testes
│   └── server.test.js     # Testes do servidor
├── .env                   # Variáveis de ambiente
├── .eslintrc.js          # Configuração ESLint
├── jest.config.js         # Configuração Jest
└── package.json           # Dependências e scripts
```

## 🔧 Configuração

### 1. Instalação
```bash
npm install
```

### 2. Configurar ambiente
Copie `.env.example` para `.env` e configure:

```env
PORT=3000
ESP_URL=http://192.168.0.100
API_TOKEN=123456
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
```

### 3. Executar
```bash
# Desenvolvimento
npm run dev

# Produção
npm start

# Testes
npm test

# Linting
npm run lint
npm run lint:fix
```

## 🧪 Testes

O projeto inclui testes automatizados usando Jest:

```bash
# Executar todos os testes
npm test

# Executar testes com coverage
npm test -- --coverage

# Executar testes em modo watch
npm test -- --watch
```

## 📡 API Endpoints

### Autenticação
Todas as rotas da API exigem header de autorização:
```
Authorization: Bearer 123456
```

### Rotas Disponíveis

#### `POST /api/ligar`
Liga o aquecedor
```json
{
  "success": true,
  "message": "Aquecedor ligado com sucesso"
}
```

#### `POST /api/desligar`
Desliga o aquecedor
```json
{
  "success": true,
  "message": "Aquecedor desligado com sucesso"
}
```

#### `POST /api/tempo`
Define temporizador automático
```json
// Request
{
  "minutos": 25
}

// Response
{
  "success": true,
  "message": "Temporizador definido para 25 minutos"
}
```

#### `GET /api/estado`
Obtém status atual do dispositivo
```json
{
  "success": true,
  "data": {
    "aquecedor": true,
    "cooler": false,
    "tempoRestante": 57,
    "temperatura": 32.5,
    "umidade": 62
  },
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

#### `GET /health`
Health check do servidor
```json
{
  "status": "OK",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "uptime": 123.456
}
```

## 🎨 Interface

### Tela de Configuração Inicial
- **IP do ESP**: Campo para inserir o endereço IP do dispositivo
- **API Token**: Campo para inserir o token de autenticação
- **Validação**: Verificação de formato IP e token válido
- **Persistência**: Dados salvos no localStorage

### Cards de Status
- **Temperatura**: Exibe temperatura atual com ícone 🔥
- **Umidade**: Mostra umidade relativa com ícone 💧  
- **Aquecedor**: Status ligado/desligado com indicador visual
- **Tempo**: Minutos restantes do temporizador

### Controles
- **Botões Liga/Desliga**: Controle manual do aquecedor
- **Temporizador**: Select com opções 25/60/120 minutos
- **Status Cooler**: Monitoramento automático

### Recursos Visuais
- **Indicadores coloridos**: Verde (ligado), vermelho (desligado)
- **Animações**: Pulsação para status ativo
- **Notificações**: Feedback visual das ações
- **Loading**: Overlay durante operações
- **Responsivo**: Layout adaptativo

### Teclas de Atalho
- **Ctrl+1**: Ligar aquecedor
- **Ctrl+0**: Desligar aquecedor
- **Ctrl+R**: Atualizar status

## 🔐 Segurança

- **Bearer Token**: Autenticação obrigatória para API
- **Rate Limiting**: Limite de 100 requests por IP a cada 15 minutos
- **Helmet**: Headers de segurança HTTP
- **CORS**: Configuração de origens permitidas
- **Compression**: Compressão de resposta
- **Timeout**: Conexões com ESP têm timeout de 5s
- **Validação**: Parâmetros validados no backend
- **Error Handling**: Tratamento completo de erros

## 🚀 Deploy

### Docker (Opcional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### PM2 (Produção)
```bash
npm install -g pm2
pm2 start server.js --name "tseca-control"
pm2 startup
pm2 save
```

## 🔧 ESP8266 Requirements

O dispositivo ESP8266 deve expor os seguintes endpoints:

- `POST http://192.168.0.100/ligar`
- `POST http://192.168.0.100/desligar`
- `POST http://192.168.0.100/tempo` (payload: `{"minutos": 25}`)
- `GET http://192.168.0.100/estado` (retorna JSON com status completo)

## 📱 Compatibilidade

- **Navegadores**: Chrome, Firefox, Safari, Edge (versões modernas)
- **Dispositivos**: Desktop, tablet, smartphone
- **Node.js**: Versão 14 ou superior

## 🐛 Troubleshooting

### ESP8266 Offline
- Verificar se o dispositivo está ligado
- Confirmar IP correto no arquivo `.env`
- Testar conectividade: `ping 192.168.15.14/status`

### Problemas de Autenticação
- Verificar token no arquivo `.env`
- Confirmar header Authorization no frontend

### Interface não atualiza
- Verificar console do navegador
- Confirmar se o servidor está rodando
- Testar endpoints da API manualmente

### Problemas de Desenvolvimento
- Executar `npm run lint` para verificar código
- Executar `npm test` para verificar testes
- Verificar logs do servidor para erros

## 📄 Licença

MIT License - Livre para uso pessoal e comercial.