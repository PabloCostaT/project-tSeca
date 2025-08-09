// ============================= tSeca_2.6.4_GPIO5_GPIO4_DHT14 + MQTT (final) =============================
// ✅ HTTP, OTA, DHT22, logs, MQTT (QoS1, retained status, LWT) via Traefik:1883
// ✅ Patches: mqtt.setBufferSize, CORS/OPTIONS, DHT retry, WiFi none sleep, hostname,
//             log via MQTT (opcional), comando JSON opcional, keepalive/socket timeout

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266HTTPUpdateServer.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>
#include <LittleFS.h>
#include <fauxmoESP.h>
#include <DHT.h>

// ===== MQTT (cliente) =====
#include <PubSubClient.h>
WiFiClient wifiClient;      // sem TLS por enquanto (TLS depois)
PubSubClient mqtt(wifiClient);

// === DEFINIÇÕES DE PINOS ===
#define RELAY1_PIN 5     // GPIO5 - Relé aquecedor
#define RELAY2_PIN 4     // GPIO4 - Relé cooler
#define DHTPIN     14    // GPIO14 - Sensor DHT22
#define DHTTYPE    DHT22 // Tipo do sensor

// === OBJETOS GLOBAIS ===
ESP8266WebServer server(80);
ESP8266HTTPUpdateServer httpUpdater;
fauxmoESP fauxmo;
DHT dht(DHTPIN, DHTTYPE);

// Estrutura para cadastro
struct Cadastro {
  String nome, sobrenome, telefone, email;
  String ssid, senha;
  bool aceitou = false, enviado = false;
} cadastro;

// === CONSTANTES DO SISTEMA ===
const char* idDispositivo   = "esp001";
const char* versaoFirmware  = "2.6.4";
const char* endpointLog      = "http://srv01.seulimacasafacil.com.br/webhook/logs";
const char* endpointCadastro = "http://srv01.seulimacasafacil.com.br/webhook/cadastro";
const String apiToken       = "123456";

// === MQTT (AJUSTE AQUI) ===
const char* MQTT_HOST = "srv01.seulimacasafacil.com.br";   // ou mqtt.seulimacasafacil.com.br se criou o A record
const uint16_t MQTT_PORT = 1883;
const char* MQTT_USER = "espuser";
const char* MQTT_PASS = "Esp@2025!";

// Tópicos
String topicCmd     = String("tSeca/") + idDispositivo + "/cmd";
String topicStatus  = String("tSeca/") + idDispositivo + "/status";
String topicLog     = String("tSeca/") + idDispositivo + "/log"; // opcional

// === VARIÁVEIS DE CONTROLE ===
unsigned long tempoDesligamento = 0;
unsigned long tempoDesligarCooler = 0;
bool rele1Ativo = false;
bool coolerAguardando = false;
unsigned long proximoEnvioLogs = 0;
const unsigned long intervaloEnvioLogs = 12UL * 60UL * 60UL * 1000UL; // 12h

#define LOG_MAX 2048
String bufferLog = "";

// Sensor
float temperaturaAtual = NAN;
float umidadeAtual = NAN;

// Protótipos
void publicarStatusMqtt();
void conectarMqtt();
void publicarLogMqtt(const String& m); // opcional

// ============================= FUNÇÕES DE UTILIDADE =============================
void logTxt(const String& msg) {
  String logMsg = "[" + String(millis() / 1000) + "s] " + msg;
  Serial.println(logMsg);
  bufferLog += logMsg + "\n";
  if (bufferLog.length() > LOG_MAX) bufferLog = bufferLog.substring(bufferLog.length() - LOG_MAX);
  File f = LittleFS.open("/log.txt", "w");
  if (f) { f.print(bufferLog); f.close(); }

  // publica log no MQTT (opcional; não retido)
  publicarLogMqtt(logMsg);
}

bool validarToken() {
  if (!server.hasHeader("Authorization")) return false;
  String tokenHeader = server.header("Authorization");
  if (tokenHeader.startsWith("Bearer ")) {
    String token = tokenHeader.substring(7);
    return token == apiToken;
  }
  return false;
}

void adicionarCORS() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}
// ============================= CONTROLE DE RELÉS =============================
void iniciarTemporizador(int minutos) {
  digitalWrite(RELAY1_PIN, HIGH);
  digitalWrite(RELAY2_PIN, HIGH);
  rele1Ativo = true;
  coolerAguardando = false;
  tempoDesligamento = millis() + (minutos * 60000UL);
  logTxt("🔛 Ligado por " + String(minutos) + " minutos");
  publicarStatusMqtt();
}

void desligarRele1() {
  if (rele1Ativo) {
    digitalWrite(RELAY1_PIN, LOW);
    rele1Ativo = false;
    coolerAguardando = true;
    tempoDesligarCooler = millis() + 60000UL; // 1 min
    logTxt("⛔ Aquecedor desligado, cooler aguardando 1 minuto");
    publicarStatusMqtt();
  }
}

void desligarCooler() {
  digitalWrite(RELAY2_PIN, LOW);
  coolerAguardando = false;
  logTxt("❄️ Cooler desligado - fim do ciclo");
  publicarStatusMqtt();
}

// ============================= ENDPOINTS HTTP =============================
void handleLigar()    { adicionarCORS(); if (!validarToken()) return server.send(401,"application/json","{\"erro\":\"Token inválido\"}"); iniciarTemporizador(30);  server.send(200,"application/json","{\"status\":\"ligado 30 min\"}"); }
void handleDesligar() { adicionarCORS(); if (!validarToken()) return server.send(401,"application/json","{\"erro\":\"Token inválido\"}"); desligarRele1(); desligarCooler(); server.send(200,"application/json","{\"status\":\"desligado\"}"); }
void handleLigar25()  { adicionarCORS(); if (!validarToken()) return server.send(401,"application/json","{\"erro\":\"Token inválido\"}"); iniciarTemporizador(25);  server.send(200,"application/json","{\"status\":\"ligado 25 min\"}"); }
void handleLigar60()  { adicionarCORS(); if (!validarToken()) return server.send(401,"application/json","{\"erro\":\"Token inválido\"}"); iniciarTemporizador(60);  server.send(200,"application/json","{\"status\":\"ligado 60 min\"}"); }
void handleLigar120() { adicionarCORS(); if (!validarToken()) return server.send(401,"application/json","{\"erro\":\"Token inválido\"}"); iniciarTemporizador(120); server.send(200,"application/json","{\"status\":\"ligado 120 min\"}"); }

// ============================= PÁGINA DE CADASTRO WI-FI =============================
String gerarListaRedes() {
  String lista = "";
  int n = WiFi.scanNetworks();
  for (int i = 0; i < n; ++i) {
    String ssid = WiFi.SSID(i);
    int rssi = WiFi.RSSI(i);
    String seguranca = (WiFi.encryptionType(i) == ENC_TYPE_NONE) ? " 🔓" : " 🔒";
    lista += "<option value='" + ssid + "'>" + ssid + " (" + String(rssi) + "dBm)" + seguranca + "</option>";
  }
  return lista;
}

void handleCadastro() {
  String statusWifi = WiFi.status() == WL_CONNECTED ? "Conectado ✅" : "Não conectado ⛔";
  String ipLocal = WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : String("-");

  String html = R"rawliteral(
  <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Cadastro Wi‑Fi</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    :root { --bg:#f4f6f8; --card:#fff; --text:#1f2937; --muted:#6b7280; --primary:#0d6efd; --danger:#dc3545; }
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background:var(--bg); color:var(--text); margin:0; }
    .container { max-width:520px; margin:30px auto; padding:0 16px; }
    .card { background:var(--card); border-radius:14px; box-shadow:0 10px 30px rgba(0,0,0,.06); padding:22px; }
    h2 { margin:0 0 10px; font-size:22px; display:flex; align-items:center; gap:8px; }
    .subtitle { color:var(--muted); font-size:13px; margin-bottom:16px; }
    .row { display:flex; gap:10px; }
    .row > * { flex:1; }
    label { font-size:12px; color:var(--muted); display:block; margin:10px 2px 6px; }
    input, select { width:100%; padding:11px 12px; border:1px solid #e5e7eb; border-radius:10px; outline:none; background:#fff; }
    input:focus, select:focus { border-color:#b4c6ff; box-shadow:0 0 0 3px rgba(13,110,253,.12); }
    .actions { display:flex; gap:10px; margin-top:16px; }
    .btn { appearance:none; border:0; border-radius:10px; padding:11px 14px; font-weight:600; cursor:pointer; }
    .btn-primary { background:var(--primary); color:#fff; flex:1; }
    .btn-secondary { background:#e5e7eb; color:#111827; }
    .btn-danger { background:var(--danger); color:#fff; }
    .status { background:#f9fafb; border:1px solid #eef2f7; border-radius:12px; padding:10px 12px; font-size:13px; display:flex; justify-content:space-between; align-items:center; }
    .pw { position:relative; }
    .pw button { position:absolute; right:8px; top:50%; transform:translateY(-50%); border:0; background:transparent; color:#0d6efd; cursor:pointer; padding:4px 6px; }
  </style>
  </head><body>
    <div class="container">
      <div class="card">
        <h2>🌐 Configurar Wi‑Fi</h2>
        <div class="status"><span><b>Status:</b> %STATUS%</span><span><b>IP:</b> %IP%</span></div>
        <div class="subtitle">Preencha seus dados e selecione a rede Wi‑Fi. Clique em "Salvar e Conectar".
        </div>
        <form action='/salvar' method='GET'>
          <label>Nome</label>
          <input name='nome' placeholder='Nome' required>
          <label>Sobrenome</label>
          <input name='sobrenome' placeholder='Sobrenome' required>
          <label>Telefone</label>
          <input name='telefone' placeholder='Telefone' required>
          <label>Email</label>
          <input name='email' type='email' placeholder='Email' required>
          <label>Wi‑Fi</label>
          <select name='ssid' required><option value=''>-- Selecione o Wi‑Fi --</option>)rawliteral";

  html += gerarListaRedes();
  html += R"rawliteral(</select>
          <label>Senha Wi‑Fi</label>
          <div class='pw'>
            <input id='pw' name='senha' type='password' placeholder='Senha Wi‑Fi' required>
            <button type='button' onclick="const p=document.getElementById('pw'); p.type=p.type==='password'?'text':'password'; this.textContent=p.type==='password'?'Mostrar':'Ocultar'">Mostrar</button>
          </div>
          <input type='hidden' name='aceitou' value='1'>
          <div class='actions'>
            <button class='btn btn-secondary' type='button' onclick='location.reload()'>Atualizar lista</button>
            <button class='btn btn-primary' type='submit'>Salvar e Conectar</button>
          </div>
        </form>
        <div class='actions' style='margin-top:8px;'>
          <a class='btn btn-danger' href='/desconectar'>Desconectar da rede</a>
        </div>
      </div>
    </div>
  </body></html>)rawliteral";

  html.replace("%STATUS%", statusWifi);
  html.replace("%IP%", ipLocal);
  server.send(200, "text/html", html);
}

void handleSalvarCadastro() {
  cadastro.nome      = server.arg("nome");
  cadastro.sobrenome = server.arg("sobrenome");
  cadastro.telefone  = server.arg("telefone");
  cadastro.email     = server.arg("email");
  cadastro.ssid      = server.arg("ssid");
  cadastro.senha     = server.arg("senha");
  cadastro.aceitou   = (server.arg("aceitou") == "1");
  cadastro.enviado   = false;

  salvarCadastro();

  server.send(200, "text/html",
              "<h2>🔄 Conectando ao Wi‑Fi...</h2><p>O dispositivo vai reiniciar agora.</p>");
  delay(1000);
  ESP.restart();
}

// ============================= DESCONEXÃO / LIMPAR REDE =============================
void handleDesconectar() {
  adicionarCORS();
  // Desconecta do Wi‑Fi e limpa cadastro salvo
  WiFi.disconnect(true);
  LittleFS.remove("/cadastro.json");
  cadastro.nome = ""; cadastro.sobrenome = ""; cadastro.telefone = ""; cadastro.email = "";
  cadastro.ssid = ""; cadastro.senha = ""; cadastro.aceitou = false; cadastro.enviado = false;

  // Sobe AP de cadastro
  WiFi.mode(WIFI_AP);
  WiFi.softAP("Cadastro_tSeca");

  server.send(200, "text/html",
              "<h2>🔌 Desconectado da rede Wi‑Fi</h2><p>O dispositivo será reiniciado e entrará em modo AP (Cadastro_tSeca)." 
              "<br/>Conecte-se ao AP e acesse <b>http://192.168.4.1/</b> para configurar novamente.</p>");
  delay(1000);
  ESP.restart();
}
// ============================= ARQUIVOS LITTLEFS =============================
bool carregarCadastro() {
  if (!LittleFS.exists("/cadastro.json")) return false;
  File f = LittleFS.open("/cadastro.json", "r");
  if (!f) return false;
  DynamicJsonDocument doc(1024);
  if (deserializeJson(doc, f)) return false;
  f.close();

  cadastro.nome = doc["nome"] | "";
  cadastro.sobrenome = doc["sobrenome"] | "";
  cadastro.telefone = doc["telefone"] | "";
  cadastro.email = doc["email"] | "";
  cadastro.ssid = doc["ssid"] | "";
  cadastro.senha = doc["senha"] | "";
  cadastro.aceitou = doc["aceitou"] | false;
  cadastro.enviado = doc["enviado"] | false;
  return true;
}

void salvarCadastro() {
  File f = LittleFS.open("/cadastro.json", "w");
  if (!f) return;
  DynamicJsonDocument doc(1024);
  doc["nome"] = cadastro.nome;
  doc["sobrenome"] = cadastro.sobrenome;
  doc["telefone"] = cadastro.telefone;
  doc["email"] = cadastro.email;
  doc["ssid"] = cadastro.ssid;
  doc["senha"] = cadastro.senha;
  doc["aceitou"] = cadastro.aceitou;
  doc["enviado"] = cadastro.enviado;
  serializeJson(doc, f);
  f.close();
  logTxt("💾 Cadastro salvo");
}

// ============================= CONEXÃO COM WI-FI SALVO =============================
void conectarWifiSalvo() {
  if (cadastro.ssid.length() == 0) return;
  WiFi.mode(WIFI_STA);
  WiFi.begin(cadastro.ssid.c_str(), cadastro.senha.c_str());
  logTxt("🔌 Conectando ao Wi-Fi: " + cadastro.ssid);
  unsigned long inicio = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - inicio < 15000) {
    delay(500);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    logTxt("✅ Wi-Fi conectado! IP: " + WiFi.localIP().toString());
  } else {
    logTxt("❌ Falha ao conectar ao Wi-Fi");
  }
}

// ============================= ENVIO DE CADASTRO =============================
void enviarCadastroSeNecessario() {
  if (WiFi.status() != WL_CONNECTED || cadastro.enviado || !cadastro.aceitou) return;
  WiFiClient client;
  HTTPClient http;
  http.begin(client, endpointCadastro);
  http.addHeader("Content-Type", "application/json");

  DynamicJsonDocument doc(1024);
  doc["id_dispositivo"] = idDispositivo;
  doc["versao"] = versaoFirmware;
  doc["nome"] = cadastro.nome;
  doc["sobrenome"] = cadastro.sobrenome;
  doc["telefone"] = cadastro.telefone;
  doc["email"] = cadastro.email;
  doc["ip"] = WiFi.localIP().toString();
  doc["timestamp"] = millis();

  String payload; serializeJson(doc, payload);
  int code = http.POST(payload);
  http.end();

  if (code == 200 || code == 201) { logTxt("✅ Cadastro enviado com sucesso"); cadastro.enviado = true; salvarCadastro(); }
  else { logTxt("❌ Erro ao enviar cadastro: " + String(code)); }
}

// ============================= ENDPOINT /status =============================
void handleStatus() {
  adicionarCORS();
  if (!validarToken()) { server.send(401,"application/json","{\"erro\":\"Token inválido\"}"); return; }

  // DHT com retry
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (isnan(t) || isnan(h)) { delay(50); t = dht.readTemperature(); h = dht.readHumidity(); }
  temperaturaAtual = t; umidadeAtual = h;

  int restante = 0, minutos = 0; bool ativo = false; String estado = "desligado";
  if (rele1Ativo) {
    restante = max(0, (int)((tempoDesligamento - millis()) / 1000));
    minutos  = (tempoDesligamento - millis() + 59999UL) / 60000UL;
    ativo = true; estado = "aquecendo";
  } else if (coolerAguardando) {
    restante = max(0, (int)((tempoDesligarCooler - millis()) / 1000));
    ativo = true; estado = "resfriando";
  }

  DynamicJsonDocument doc(768);
  doc["ativo"] = ativo;
  doc["estado"] = estado;
  doc["minutos"] = minutos;
  doc["restante"] = restante;
  doc["rele1"] = digitalRead(RELAY1_PIN);
  doc["rele2"] = digitalRead(RELAY2_PIN);
  doc["temperatura"] = isnan(temperaturaAtual) ? -1 : temperaturaAtual;
  doc["umidade"] = isnan(umidadeAtual) ? -1 : umidadeAtual;
  doc["ip"] = WiFi.localIP().toString();
  doc["versao"] = versaoFirmware;
  doc["uptime"] = millis() / 1000;

  String resposta; serializeJson(doc, resposta);
  server.send(200, "application/json", resposta);
}
// ============================= MQTT: callback e conectar =============================
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String msg; msg.reserve(length);
  for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];

  // comandos clássicos
  if      (msg == "ligar25")  iniciarTemporizador(25);
  else if (msg == "ligar60")  iniciarTemporizador(60);
  else if (msg == "ligar120") iniciarTemporizador(120);
  else if (msg == "ligar30")  iniciarTemporizador(30);
  else if (msg == "desligar") { desligarRele1(); desligarCooler(); }
  else {
    // opcional: comando JSON {"cmd":"ligar","minutos":45}
    DynamicJsonDocument d(64);
    if (!deserializeJson(d, msg)) {
      const char* cmd = d["cmd"] | "";
      int min = d["minutos"] | -1;
      if (String(cmd) == "ligar" && min > 0) iniciarTemporizador(min);
    }
  }

  logTxt("MQTT cmd: " + msg);
  publicarStatusMqtt();
}

void publicarStatusMqtt() {
  if (!mqtt.connected()) return;
  DynamicJsonDocument doc(512);
  doc["online"] = true;
  doc["estado"] = (rele1Ativo ? "aquecendo" : (coolerAguardando ? "resfriando" : "desligado"));
  doc["rele1"] = digitalRead(RELAY1_PIN);
  doc["rele2"] = digitalRead(RELAY2_PIN);
  doc["temperatura"] = isnan(temperaturaAtual) ? -1 : temperaturaAtual;
  doc["umidade"] = isnan(umidadeAtual) ? -1 : umidadeAtual;
  doc["ip"] = WiFi.localIP().toString();
  doc["versao"] = versaoFirmware;
  doc["uptime"] = millis() / 1000;
  String payload; serializeJson(doc, payload);
  mqtt.publish(topicStatus.c_str(), payload.c_str(), true); // retained
}

void publicarLogMqtt(const String& m) { // opcional
  if (!mqtt.connected()) return;
  mqtt.publish(topicLog.c_str(), m.c_str(), false); // não retém log
}

void conectarMqtt() {
  if (!WiFi.isConnected()) return;
  if (!mqtt.connected()) {
    // LWT: online=false se desconectar
    DynamicJsonDocument lwt(64); lwt["online"] = false;
    String lwtPayload; serializeJson(lwt, lwtPayload);

    mqtt.setServer(MQTT_HOST, MQTT_PORT);
    mqtt.setCallback(mqttCallback);
    mqtt.setBufferSize(768);   // JSON maior
    mqtt.setKeepAlive(60);
    mqtt.setSocketTimeout(5);

    String clientId = String("tSeca-") + idDispositivo + "-" + String(ESP.getChipId(), HEX);
    bool ok = mqtt.connect(clientId.c_str(),
                           MQTT_USER, MQTT_PASS,
                           topicStatus.c_str(), 1, true, lwtPayload.c_str());
    if (ok) {
      mqtt.subscribe(topicCmd.c_str(), 1);
      logTxt("✅ MQTT conectado");
      publicarStatusMqtt(); // birth (online=true)
    } else {
      logTxt("❌ MQTT falhou rc=" + String(mqtt.state()));
    }
  }
}

// ============================= ENVIAR LOG =============================
void enviarLogParaServidor(String mensagem) {
  if (WiFi.status() != WL_CONNECTED) return;
  WiFiClient client;
  HTTPClient http;
  http.begin(client, endpointLog);
  http.addHeader("Content-Type", "application/json");

  DynamicJsonDocument doc(512);
  doc["id_dispositivo"] = idDispositivo;
  doc["versao"] = versaoFirmware;
  doc["timestamp"] = millis();
  doc["log"] = mensagem;

  String payload; serializeJson(doc, payload);
  int code = http.POST(payload);
  http.end();
  logTxt(code == 200 ? "📤 Log enviado com sucesso" : "⚠️ Erro envio log: " + String(code));
}

// ============================= SETUP =============================
void setup() {
  Serial.begin(115200);
  LittleFS.begin();
  dht.begin();
  pinMode(RELAY1_PIN, OUTPUT);
  pinMode(RELAY2_PIN, OUTPUT);
  digitalWrite(RELAY1_PIN, LOW);
  digitalWrite(RELAY2_PIN, LOW);
  logTxt("🚀 Sistema inicializando");

  // Wi‑Fi robusto
  WiFi.setSleepMode(WIFI_NONE_SLEEP);
  WiFi.hostname(idDispositivo);

  if (carregarCadastro()) { conectarWifiSalvo(); }
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.mode(WIFI_AP);
    WiFi.softAP("Cadastro_tSeca");
    logTxt("📶 Modo AP ativo: Cadastro_tSeca");
  }

  // OTA
  httpUpdater.setup(&server, "/update", "admin", "tseca123");

  // Rotas HTTP
  server.on("/", HTTP_GET, handleCadastro);
  server.on("/salvar", HTTP_GET, handleSalvarCadastro);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/ligar", HTTP_GET, handleLigar);
  server.on("/desligar", HTTP_GET, handleDesligar);
  server.on("/ligar25", HTTP_GET, handleLigar25);
  server.on("/ligar60", HTTP_GET, handleLigar60);
  server.on("/ligar120", HTTP_GET, handleLigar120);
  server.on("/desconectar", HTTP_GET, handleDesconectar);

  // Preflight CORS e 404
  server.onNotFound([](){
    if (server.method() == HTTP_OPTIONS) { adicionarCORS(); server.send(204); return; }
    server.send(404, "application/json", "{\"erro\":\"rota nao encontrada\"}");
  });

  server.begin();
  logTxt("🌐 WebServer iniciado");

  // MQTT (se Wi‑Fi já ok)
  if (WiFi.status() == WL_CONNECTED) {
    conectarMqtt();
  }
}

// ============================= LOOP =============================
void loop() {
  server.handleClient();
  fauxmo.handle();
  enviarCadastroSeNecessario();

  static unsigned long ultimaVerificacao = 0;
  if (millis() - ultimaVerificacao > 1000) {
    ultimaVerificacao = millis();
    if (rele1Ativo && millis() > tempoDesligamento) desligarRele1();
    if (coolerAguardando && millis() > tempoDesligarCooler) desligarCooler();
  }

  if (millis() > proximoEnvioLogs) {
    enviarLogParaServidor("Sistema funcionando. Uptime: " + String(millis() / 1000) + "s");
    proximoEnvioLogs = millis() + intervaloEnvioLogs;
  }

  // MQTT loop & reconexão
  if (WiFi.isConnected()) {
    if (mqtt.connected()) {
      mqtt.loop();
    } else {
      static unsigned long lastTry = 0;
      if (millis() - lastTry > 5000) { lastTry = millis(); conectarMqtt(); }
    }
  }

  // Publica status a cada 10s (com DHT retry)
  static unsigned long lastStatus = 0;
  if (millis() - lastStatus > 10000) {
    lastStatus = millis();
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (isnan(t) || isnan(h)) { delay(50); t = dht.readTemperature(); h = dht.readHumidity(); }
    temperaturaAtual = t; umidadeAtual = h;
    publicarStatusMqtt();
  }

  yield();
}
