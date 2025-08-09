# Endpoints da API tSeca

Esta documentação descreve os endpoints disponíveis na API do tSeca.

## Base URL
```
http://localhost:3030
```

## Autenticação
Todos os endpoints requerem autenticação via Bearer Token no header `Authorization`.

**Token padrão:** `123456`

## Endpoints

### 1. Status
**GET** `/status`

Obtém o status atual do dispositivo.

**Exemplo:**
```bash
curl -H "Authorization: Bearer 123456" http://localhost:3030/status
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "status": "ligado",
    "tempo_restante": 1200
  }
}
```

### 2. Ligar por 25 minutos
**POST** `/ligar25`

Liga o aquecedor por 25 minutos.

**Exemplo:**
```bash
curl -H "Authorization: Bearer 123456" http://localhost:3030/ligar25
```

**Resposta:**
```json
{
  "success": true,
  "message": "Aquecedor ligado por 25 minutos com sucesso",
  "data": {
    "status": "ligado",
    "tempo": 1500
  }
}
```

### 3. Ligar por 60 minutos
**POST** `/ligar60`

Liga o aquecedor por 60 minutos.

**Exemplo:**
```bash
curl -H "Authorization: Bearer 123456" http://localhost:3030/ligar60
```

**Resposta:**
```json
{
  "success": true,
  "message": "Aquecedor ligado por 60 minutos com sucesso",
  "data": {
    "status": "ligado",
    "tempo": 3600
  }
}
```

### 4. Ligar por 120 minutos
**POST** `/ligar120`

Liga o aquecedor por 120 minutos.

**Exemplo:**
```bash
curl -H "Authorization: Bearer 123456" http://localhost:3030/ligar120
```

**Resposta:**
```json
{
  "success": true,
  "message": "Aquecedor ligado por 120 minutos com sucesso",
  "data": {
    "status": "ligado",
    "tempo": 7200
  }
}
```

### 5. Desligar
**POST** `/desligar`

Desliga o aquecedor.

**Exemplo:**
```bash
curl -H "Authorization: Bearer 123456" http://localhost:3030/desligar
```

**Resposta:**
```json
{
  "success": true,
  "message": "Aquecedor desligado com sucesso",
  "data": {
    "status": "desligado"
  }
}
```

## Códigos de Status HTTP

- **200 OK**: Requisição bem-sucedida
- **400 Bad Request**: Dados inválidos
- **401 Unauthorized**: Token de autenticação ausente ou inválido
- **403 Forbidden**: Token inválido
- **404 Not Found**: Endpoint não encontrado
- **429 Too Many Requests**: Limite de requisições excedido
- **500 Internal Server Error**: Erro interno do servidor

## Exemplos para PowerShell

```powershell
# Status
Invoke-RestMethod -Uri "http://localhost:3030/status" -Headers @{Authorization="Bearer 123456"}

# Ligar por 25 minutos
Invoke-RestMethod -Uri "http://localhost:3030/ligar25" -Method POST -Headers @{Authorization="Bearer 123456"}

# Ligar por 60 minutos
Invoke-RestMethod -Uri "http://localhost:3030/ligar60" -Method POST -Headers @{Authorization="Bearer 123456"}

# Ligar por 120 minutos
Invoke-RestMethod -Uri "http://localhost:3030/ligar120" -Method POST -Headers @{Authorization="Bearer 123456"}

# Desligar
Invoke-RestMethod -Uri "http://localhost:3030/desligar" -Method POST -Headers @{Authorization="Bearer 123456"}
```

## Configuração

As configurações podem ser ajustadas através de variáveis de ambiente:

- `PORT`: Porta do servidor (padrão: 3030)
- `ESP_URL`: URL do ESP8266 (padrão: http://192.168.15.14)
- `API_TOKEN`: Token de autenticação (padrão: 123456)
- `NODE_ENV`: Ambiente de execução (development/production)
