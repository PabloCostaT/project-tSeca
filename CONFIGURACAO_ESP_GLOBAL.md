# 🌐 Configuração do ESP para Comunicação Global

## 📋 Visão Geral

Este guia explica como configurar o ESP8266/ESP32 para se comunicar com o painel web através da sua VPS, permitindo controle remoto de qualquer lugar do mundo.

## 🔧 Requisitos

### Hardware
- ESP8266 ou ESP32
- Relés para controle dos dispositivos
- LED indicador (opcional)
- Fonte de alimentação estável

### Software
- Arduino IDE ou PlatformIO
- Biblioteca ArduinoJson (versão 6.x)

## 📥 Instalação das Bibliotecas

No Arduino IDE, vá em **Ferramentas > Gerenciar Bibliotecas** e instale:

```
ArduinoJson by Benoit Blanchon (versão 6.x)
```

## ⚙️ Configuração do Código

### 1. Configurações da VPS

No arquivo `tSeca_temp.ino`, altere estas linhas:

```cpp
const char* VPS_BASE_URL   = "https://sua-vps.com"; // ⚠️ ALTERE PARA SUA VPS
const char* VPS_API_TOKEN  = "seu_token_secreto";   // ⚠️ ALTERE PARA SEU TOKEN
const char* DEVICE_ID      = "esp01";               // ⚠️ ID único para este ESP
```

### 2. Configuração dos Pinos

```cpp
const int RELAY1_PIN = 2;  // Pino do relé do aquecedor
const int RELAY2_PIN = 4;  // Pino do relé do cooler
const int LED_PIN = 2;     // Pino do LED indicador
```

**⚠️ IMPORTANTE**: Ajuste os pinos conforme sua placa e conexões.

## 🔌 Conexões Físicas

### ESP8266/ESP32 → Relés
```
ESP VCC (3.3V) → Relé VCC
ESP GND → Relé GND
ESP GPIO2 → Relé 1 IN (aquecedor)
ESP GPIO4 → Relé 2 IN (cooler)
```

### Relés → Dispositivos
```
Relé 1 COM → Fase da rede
Relé 1 NO → Aquecedor
Relé 2 COM → Fase da rede  
Relé 2 NO → Cooler
```

## 📡 Configuração Wi-Fi

### Primeira Configuração
1. **Compile e faça upload** do código para o ESP
2. **Conecte-se** ao Wi-Fi `tSeca_Config` (senha: `12345678`)
3. **Acesse** `http://192.168.4.1/cadastro`
4. **Configure** sua rede Wi-Fi doméstica
5. **Clique** em "Salvar & Conectar"

### Configurações Adicionais
- O ESP salvará as credenciais Wi-Fi na memória
- Na próxima inicialização, conectará automaticamente
- Se falhar, abrirá o AP de configuração novamente

## 🌐 Comunicação com a VPS

### Heartbeat (ESP → VPS)
- **Frequência**: A cada 30 segundos
- **Endpoint**: `POST /api/esp/heartbeat`
- **Dados**: Status, IP, uptime, estado dos relés

### Comandos (VPS → ESP)
- **Frequência**: A cada 10 segundos
- **Endpoint**: `GET /api/esp/commands?device=esp01`
- **Resposta**: Lista de comandos pendentes

## 📊 Endpoints Locais do ESP

### Status
- `GET /status.json` - Status completo em JSON
- `GET /status` - Status em texto simples

### Comandos de Teste
- `POST /comando/ligar25` - Ligar por 25 minutos
- `POST /comando/ligar60` - Ligar por 60 minutos
- `POST /comando/ligar120` - Ligar por 120 minutos
- `POST /comando/desligar` - Desligar

### Configuração
- `GET /cadastro` - Interface de configuração
- `POST /salvar` - Salvar configurações Wi-Fi
- `GET /scan.json` - Listar redes disponíveis

## 🔒 Segurança

### Autenticação
- **Token**: Bearer token obrigatório para todas as APIs
- **Validação**: Token verificado na VPS antes de processar comandos

### Recomendações
- Use HTTPS na VPS
- Troque o token padrão por um secreto
- Configure firewall na VPS
- Monitore logs de acesso

## 📱 Interface Web Local

### Funcionalidades
- **Status da Conexão**: Wi-Fi e VPS
- **Configuração Wi-Fi**: Seleção de rede e senha
- **Teste de Comandos**: Botões para testar relés
- **Monitoramento**: Status em tempo real

### Acesso
- **URL**: `http://IP_DO_ESP/cadastro`
- **IP**: Mostrado no Serial Monitor
- **Rede**: Apenas na rede local

## 🚨 Troubleshooting

### ESP não conecta ao Wi-Fi
1. Verifique credenciais da rede
2. Confirme se a rede está ativa
3. Verifique distância do roteador
4. Use o AP de configuração

### Não comunica com a VPS
1. Verifique URL da VPS no código
2. Confirme se o token está correto
3. Verifique se a VPS está online
4. Monitore logs no Serial Monitor

### Relés não funcionam
1. Verifique conexões físicas
2. Confirme pinos configurados
3. Teste com multímetro
4. Verifique alimentação dos relés

### LED não acende
1. Verifique conexão do LED
2. Confirme pino configurado
3. LED acende quando Wi-Fi conectado

## 📊 Monitoramento

### Serial Monitor
```
[0s] tSeca iniciado - Comunicação Global via VPS
[5s] 🔌 Conectando ao Wi‑Fi: SuaRede
[8s] ✅ Wi‑Fi conectado! IP: 192.168.1.100
[30s] 💓 Heartbeat enviado para VPS
[40s] 📥 Comandos verificados (0 pendentes)
```

### Logs da VPS
- Heartbeats recebidos
- Comandos enviados
- Status dos dispositivos
- Erros de comunicação

## 🔄 Atualizações

### Firmware
1. **Modifique** o código conforme necessário
2. **Compile** e faça upload
3. **Configure** Wi-Fi novamente se necessário

### Configurações
- Credenciais Wi-Fi são mantidas
- Device ID pode ser alterado
- URLs da VPS podem ser atualizadas

## 📞 Suporte

### Logs Importantes
- **Serial Monitor**: Para debug local
- **Logs da VPS**: Para monitoramento remoto
- **Interface Web**: Para status em tempo real

### Comunidade
- **Issues**: Reporte problemas no GitHub
- **Documentação**: Consulte este guia
- **Exemplos**: Veja códigos de exemplo

## ✅ Checklist de Configuração

- [ ] Bibliotecas instaladas
- [ ] Código configurado com suas URLs
- [ ] Pinos configurados corretamente
- [ ] Conexões físicas verificadas
- [ ] Wi-Fi configurado e funcionando
- [ ] VPS configurada e online
- [ ] Heartbeat funcionando
- [ ] Comandos sendo recebidos
- [ ] Relés funcionando
- [ ] LED indicador funcionando
- [ ] Interface web acessível
- [ ] Segurança configurada

## 🎯 Próximos Passos

1. **Teste local**: Verifique funcionamento na rede local
2. **Configure VPS**: Siga o guia de configuração da VPS
3. **Teste remoto**: Acesse de outro local
4. **Monitore**: Configure alertas e monitoramento
5. **Expanda**: Adicione mais dispositivos se necessário

---

**🎉 Parabéns!** Seu ESP está configurado para comunicação global via VPS.
