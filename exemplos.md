# Exemplos de Uso dos Endpoints

## Comandos cURL

### Status
```bash
curl -H "Authorization: Bearer 123456" http://localhost:3030/status
```

### Ligar por 25 minutos
```bash
curl -H "Authorization: Bearer 123456" http://localhost:3030/ligar25
```

### Ligar por 60 minutos
```bash
curl -H "Authorization: Bearer 123456" http://localhost:3030/ligar60
```

### Ligar por 120 minutos
```bash
curl -H "Authorization: Bearer 123456" http://localhost:3030/ligar120
```

### Desligar
```bash
curl -H "Authorization: Bearer 123456" http://localhost:3030/desligar
```

## Comandos PowerShell

### Status
```powershell
Invoke-RestMethod -Uri "http://localhost:3030/status" -Headers @{Authorization="Bearer 123456"}
```

### Ligar por 25 minutos
```powershell
Invoke-RestMethod -Uri "http://localhost:3030/ligar25" -Method POST -Headers @{Authorization="Bearer 123456"}
```

### Ligar por 60 minutos
```powershell
Invoke-RestMethod -Uri "http://localhost:3030/ligar60" -Method POST -Headers @{Authorization="Bearer 123456"}
```

### Ligar por 120 minutos
```powershell
Invoke-RestMethod -Uri "http://localhost:3030/ligar120" -Method POST -Headers @{Authorization="Bearer 123456"}
```

### Desligar
```powershell
Invoke-RestMethod -Uri "http://localhost:3030/desligar" -Method POST -Headers @{Authorization="Bearer 123456"}
```

## Exemplos para ESP8266 Direto

Se você quiser acessar o ESP8266 diretamente (substituindo o IP):

### Status
```bash
curl -H "Authorization: Bearer 123456" http://192.168.15.14/status
```

### Ligar por 25 minutos
```bash
curl -H "Authorization: Bearer 123456" http://192.168.15.14/ligar25
```

### Ligar por 60 minutos
```bash
curl -H "Authorization: Bearer 123456" http://192.168.15.14/ligar60
```

### Ligar por 120 minutos
```bash
curl -H "Authorization: Bearer 123456" http://192.168.15.14/ligar120
```

### Desligar
```bash
curl -H "Authorization: Bearer 123456" http://192.168.15.14/desligar
```

## PowerShell para ESP8266 Direto

### Status
```powershell
Invoke-RestMethod -Uri "http://192.168.15.14/status" -Headers @{Authorization="Bearer 123456"}
```

### Ligar por 25 minutos
```powershell
Invoke-RestMethod -Uri "http://192.168.15.14/ligar25" -Method POST -Headers @{Authorization="Bearer 123456"}
```

### Ligar por 60 minutos
```powershell
Invoke-RestMethod -Uri "http://192.168.15.14/ligar60" -Method POST -Headers @{Authorization="Bearer 123456"}
```

### Ligar por 120 minutos
```powershell
Invoke-RestMethod -Uri "http://192.168.15.14/ligar120" -Method POST -Headers @{Authorization="Bearer 123456"}
```

### Desligar
```powershell
Invoke-RestMethod -Uri "http://192.168.15.14/desligar" -Method POST -Headers @{Authorization="Bearer 123456"}
```

## Notas Importantes

1. **Token de Autenticação**: O token padrão é `123456`. Você pode alterá-lo através da variável de ambiente `API_TOKEN`.

2. **IP do ESP8266**: O IP padrão é `192.168.15.14`. Você pode alterá-lo através da variável de ambiente `ESP_URL`.

3. **Porta do Servidor**: O servidor roda na porta `3030` por padrão. Você pode alterá-la através da variável de ambiente `PORT`.

4. **Fallback**: Se o ESP8266 não tiver os endpoints específicos implementados, o servidor Node.js simulará as respostas para garantir compatibilidade.

## Configuração de Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
PORT=3030
ESP_URL=http://192.168.15.14
API_TOKEN=123456
NODE_ENV=development
```

