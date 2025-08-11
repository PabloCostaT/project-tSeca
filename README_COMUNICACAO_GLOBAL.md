# 🌐 tSeca - Sistema de Controle Remoto Global

## 📋 Visão Geral

O **tSeca** é um sistema de controle remoto inteligente que permite gerenciar dispositivos ESP8266/ESP32 de qualquer lugar do mundo através de uma VPS (Virtual Private Server). Ideal para automação residencial, controle industrial e monitoramento remoto.

## 🏗️ Arquitetura do Sistema

```
┌─────────────────┐    🌐 INTERNET    ┌─────────────────┐
│   ESP8266/ESP32 │ ◄──────────────► │      VPS        │
│   (Dispositivo) │                  │   (Painel Web)  │
└─────────────────┘                  └─────────────────┘
         │                                     │
         │                                     │
    🔌 Relés                              📱 Usuário
    🌡️ Sensores                           💻 Web/Mobile
    💡 LEDs                               📊 Dashboard
```

## ✨ Funcionalidades Principais

### 🔌 Controle Remoto
- **Ligar/Desligar** dispositivos remotamente
- **Temporizadores** configuráveis (25, 60, 120 min)
- **Controle personalizado** com minutos específicos
- **Status em tempo real** dos dispositivos

### 🌐 Comunicação Global
- **Heartbeat automático** a cada 30 segundos
- **Pull de comandos** a cada 10 segundos
- **Comunicação bidirecional** ESP ↔ VPS
- **Fallback MQTT** para redundância

### 🔒 Segurança
- **Autenticação Bearer Token**
- **HTTPS obrigatório** na VPS
- **Firewall configurado**
- **Rate limiting** configurável

### 📊 Monitoramento
- **Dashboard web** em tempo real
- **Logs estruturados** com timestamps
- **Alertas automáticos** para falhas
- **Métricas de performance**

## 🚀 Instalação e Configuração

### 1. ESP8266/ESP32

#### Requisitos
- Arduino IDE ou PlatformIO
- Biblioteca ArduinoJson 6.x
- ESP8266 ou ESP32

#### Configuração
1. **Clone** o repositório
2. **Instale** a biblioteca ArduinoJson
3. **Configure** as URLs da VPS no código
4. **Ajuste** os pinos dos relés
5. **Faça upload** para o ESP

```cpp
// Configurações no tSeca_temp.ino
const char* VPS_BASE_URL   = "https://sua-vps.com";
const char* VPS_API_TOKEN  = "seu_token_secreto";
const char* DEVICE_ID      = "esp01";
```

#### Conexões
```
ESP GPIO2 → Relé 1 (Aquecedor)
ESP GPIO4 → Relé 2 (Cooler)
ESP 3.3V → VCC dos Relés
ESP GND → GND dos Relés
```

### 2. VPS (Servidor)

#### Requisitos
- Ubuntu 20.04+ ou Debian 11+
- Domínio configurado (opcional)
- Acesso root ou sudo

#### Configuração Automática
```bash
# Baixe o script de configuração
wget https://raw.githubusercontent.com/seu-repo/tSeca/main/deploy/vps-setup.sh

# Execute como root
sudo bash vps-setup.sh
```

#### Configuração Manual
1. **Instale** Node.js 18+
2. **Configure** Nginx como proxy reverso
3. **Configure** SSL com Let's Encrypt
4. **Configure** firewall (UFW)
5. **Configure** systemd para auto-start

### 3. Painel Web

#### Instalação
```bash
# Clone o repositório
git clone https://github.com/seu-repo/tSeca.git
cd tSeca

# Instale dependências
npm install

# Configure variáveis de ambiente
cp tseca.env.example .env
# Edite o arquivo .env com suas configurações

# Inicie o servidor
npm start
```

#### Variáveis de Ambiente
```bash
# VPS
VPS_BASE_URL=https://sua-vps.com
VPS_API_TOKEN=seu_token_secreto

# ESP
ESP_URL=http://192.168.1.100
API_TOKEN=123456

# Segurança
NODE_ENV=production
CORS_ORIGIN=https://sua-vps.com
```

## 📱 Uso do Sistema

### Interface Web Local (ESP)
- **URL**: `http://IP_DO_ESP/cadastro`
- **Configuração Wi-Fi**: Seleção de rede e senha
- **Teste de Comandos**: Botões para testar relés
- **Status**: Conexão Wi-Fi e VPS

### Painel Web (VPS)
- **URL**: `https://sua-vps.com`
- **Dashboard**: Status de todos os dispositivos
- **Controles**: Envio de comandos remotos
- **Monitoramento**: Logs e métricas

### API REST
```bash
# Status do dispositivo
GET /api/esp/device/esp01

# Enviar comando
POST /api/esp/send-command
{
  "device_id": "esp01",
  "command": "ligar60"
}

# Listar dispositivos online
GET /api/esp/devices
```

## 🔧 Manutenção

### Logs
- **ESP**: Serial Monitor (115200 baud)
- **VPS**: `/var/log/tseca/`
- **Nginx**: `/var/log/nginx/tseca_*.log`

### Monitoramento
```bash
# Status do serviço
systemctl status tseca

# Logs em tempo real
journalctl -u tseca -f

# Monitoramento de recursos
htop
```

### Backup
- **Automático**: Diário às 2h
- **Manual**: `/usr/local/bin/tseca-backup.sh`
- **Localização**: `/var/backups/tseca/`

## 🚨 Troubleshooting

### Problemas Comuns

#### ESP não conecta ao Wi-Fi
1. Verifique credenciais da rede
2. Use o AP de configuração (`tSeca_Config`)
3. Confirme se a rede está ativa

#### Não comunica com a VPS
1. Verifique URL e token no código
2. Confirme se a VPS está online
3. Verifique firewall e SSL

#### Relés não funcionam
1. Verifique conexões físicas
2. Confirme pinos configurados
3. Teste com multímetro

### Logs de Debug
```bash
# ESP (Serial Monitor)
[30s] 💓 Heartbeat enviado para VPS
[40s] 📥 Comandos verificados (0 pendentes)

# VPS
INFO: Heartbeat recebido do ESP esp01
INFO: Comando ligar60 enviado para ESP esp01
```

## 🔄 Atualizações

### Firmware ESP
1. Modifique o código conforme necessário
2. Compile e faça upload
3. Configure Wi-Fi novamente se necessário

### Painel Web
```bash
# Atualizar código
git pull origin main

# Reinstalar dependências
npm install

# Reiniciar serviço
systemctl restart tseca
```

## 📊 Escalabilidade

### Múltiplos Dispositivos
- Cada ESP tem um `DEVICE_ID` único
- VPS gerencia todos simultaneamente
- Dashboard mostra status de todos

### Load Balancing
- Nginx como proxy reverso
- Múltiplas instâncias Node.js
- Redis para cache compartilhado

### Monitoramento Avançado
- Prometheus + Grafana
- Alertas via email/SMS
- Backup automático para cloud

## 🔒 Segurança

### Recomendações
- **Troque tokens padrão** por segretos únicos
- **Use HTTPS** obrigatório na VPS
- **Configure firewall** restritivo
- **Monitore logs** de acesso
- **Atualize regularmente** dependências

### Autenticação
- Bearer token obrigatório
- Rate limiting configurável
- CORS configurado por ambiente
- Headers de segurança (Helmet)

## 📚 Documentação Adicional

- [Configuração do ESP](CONFIGURACAO_ESP_GLOBAL.md)
- [Estrutura do Projeto](ESTRUTURA.md)
- [Endpoints da API](ENDPOINTS.md)
- [Deploy na VPS](deploy/)

## 🤝 Contribuição

1. **Fork** o repositório
2. **Crie** uma branch para sua feature
3. **Commit** suas mudanças
4. **Push** para a branch
5. **Abra** um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/seu-repo/tSeca/issues)
- **Documentação**: [Wiki](https://github.com/seu-repo/tSeca/wiki)
- **Email**: suporte@tseca.com

---

**🎉 Obrigado por usar o tSeca!** 

Se este projeto te ajudou, considere dar uma ⭐ no repositório.
