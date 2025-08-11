# Compatibilidade Total entre Painel e ESP8266

## ✅ Status: TOTALMENTE COMPATÍVEL

O painel de controle agora está **100% compatível** com o código do ESP8266. Todas as funcionalidades foram alinhadas e testadas.

## 🔄 Comunicação Bidirecional

### HTTP Direto (Prioritário)
O painel tenta primeiro comunicação HTTP direta com o ESP:
- **GET** `/status` - Status atual do dispositivo
- **GET** `/ligar25` - Ligar por 25 minutos
- **GET** `/ligar60` - Ligar por 60 minutos  
- **GET** `/ligar120` - Ligar por 120 minutos
- **GET** `/ligar` - Ligar por 30 minutos (padrão)
- **GET** `/desligar` - Desligar aquecedor

### MQTT (Fallback)
Se HTTP falhar, usa MQTT como fallback:
- **Tópico**: `tSeca/esp001/cmd`
- **Comandos**: `ligar25`, `ligar60`, `ligar120`, `ligar30`, `desligar`
- **JSON**: `{"cmd":"ligar","minutos":45}` para temporizador personalizado

## 📊 Estrutura de Dados Compatível

### Status do ESP (endpoint `/status`)
```json
{
  "ativo": true,
  "estado": "aquecendo",
  "minutos": 25,
  "restante": 1200,
  "rele1": 1,
  "rele2": 1,
  "temperatura": 45.2,
  "umidade": 30.5,
  "ip": "192.168.15.14",
  "versao": "2.6.4",
  "uptime": 3600
}
```

### Comandos Suportados
| Comando | Endpoint | MQTT | Descrição |
|---------|----------|------|-----------|
| Ligar 25min | `/ligar25` | `ligar25` | Liga por 25 minutos |
| Ligar 60min | `/ligar60` | `ligar60` | Liga por 60 minutos |
| Ligar 120min | `/ligar120` | `ligar120` | Liga por 120 minutos |
| Ligar padrão | `/ligar` | `ligar30` | Liga por 30 minutos |
| Desligar | `/desligar` | `desligar` | Desliga completamente |
| Temporizador | `/tempo` | `{"cmd":"ligar","minutos":X}` | Tempo personalizado |

## 🎯 Funcionalidades Implementadas

### ✅ Status em Tempo Real
- **Temperatura**: Sensor DHT22 (-1 = erro, valor real = temperatura)
- **Umidade**: Sensor DHT22 (-1 = erro, valor real = umidade)
- **Estado**: `aquecendo` / `resfriando` / `desligado`
- **Tempo Restante**: Em minutos (calculado a partir de segundos)
- **Relés**: Status dos relés (0 = desligado, 1 = ligado)

### ✅ Controles Funcionais
- **Botões de Tempo Fixo**: 25, 60, 120 minutos
- **Botão Desligar**: Desliga aquecedor e cooler
- **Temporizador Personalizado**: Qualquer tempo via endpoint `/tempo`
- **Feedback Visual**: Ícones e cores mudam conforme estado

### ✅ Sistema de Fallback
1. **HTTP Direto**: Tenta comunicação direta com ESP
2. **MQTT**: Se HTTP falhar, usa MQTT
3. **Offline**: Interface funciona mesmo sem ESP

## 🔧 Configuração

### Variáveis de Ambiente
```bash
# ESP8266
ESP_URL=http://192.168.15.14
API_TOKEN=123456
ESP_DEVICE_ID=esp001

# MQTT
MQTT_HOST=mqtt.seulimacasafacil.com.br
MQTT_PORT=1883
MQTT_USER=paineluser
MQTT_PASS=Painel@2025!
MQTT_BASE_TOPIC=tSeca
```

### Token de Autenticação
- **Padrão**: `123456`
- **Header**: `Authorization: Bearer 123456`
- **Segurança**: Todas as rotas requerem autenticação

## 🧪 Testes de Compatibilidade

### 1. Status
```bash
curl -H "Authorization: Bearer 123456" http://localhost:3030/api/estado
```

### 2. Comandos de Tempo Fixo
```bash
# 25 minutos
curl -X POST -H "Authorization: Bearer 123456" http://localhost:3030/api/ligar25

# 60 minutos  
curl -X POST -H "Authorization: Bearer 123456" http://localhost:3030/api/ligar60

# 120 minutos
curl -X POST -H "Authorization: Bearer 123456" http://localhost:3030/api/ligar120
```

### 3. Comandos Gerais
```bash
# Ligar (30 min padrão)
curl -X POST -H "Authorization: Bearer 123456" http://localhost:3030/api/ligar

# Desligar
curl -X POST -H "Authorization: Bearer 123456" http://localhost:3030/api/desligar

# Temporizador personalizado
curl -X POST -H "Authorization: Bearer 123456" -H "Content-Type: application/json" \
  -d '{"minutos": 45}' http://localhost:3030/api/tempo
```

## 🚀 Vantagens da Implementação

### ✅ **100% Compatível**
- Usa exatamente os mesmos endpoints do ESP
- Estrutura de dados idêntica
- Comandos MQTT compatíveis

### ✅ **Robusto**
- Fallback automático HTTP → MQTT
- Funciona mesmo com ESP offline
- Tratamento de erros completo

### ✅ **Eficiente**
- Comunicação direta quando possível
- MQTT apenas quando necessário
- Cache de status via MQTT retained

### ✅ **Escalável**
- Fácil adicionar novos comandos
- Suporte a múltiplos dispositivos
- Configuração via variáveis de ambiente

## 📋 Checklist de Compatibilidade

- [x] **Endpoints HTTP**: Todos os endpoints do ESP implementados
- [x] **Comandos MQTT**: Comandos compatíveis com callback do ESP
- [x] **Estrutura de Dados**: Campos idênticos entre painel e ESP
- [x] **Autenticação**: Token Bearer implementado
- [x] **Fallback**: Sistema MQTT como backup
- [x] **Tratamento de Erros**: Erros do ESP tratados adequadamente
- [x] **Interface**: UI reflete estado real do ESP
- [x] **Controles**: Botões funcionam conforme esperado

## 🎉 Conclusão

O painel de controle está **totalmente compatível** com o ESP8266. Todas as funcionalidades foram implementadas seguindo exatamente a especificação do firmware do ESP, garantindo:

- **Comunicação confiável** via HTTP e MQTT
- **Interface responsiva** que reflete o estado real
- **Controles funcionais** para todas as operações
- **Sistema robusto** com fallback automático
- **Experiência do usuário** fluida e intuitiva

**Status**: 🟢 **FUNCIONANDO PERFEITAMENTE**
