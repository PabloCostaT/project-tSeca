/*
  tSeca_temp.ino — Sistema de controle remoto global via VPS
  Funciona em ESP8266 e ESP32.
  Comunicação bidirecional com painel web através de VPS
*/

#if defined(ESP32)
  #include <WiFi.h>
  #include <WebServer.h>
  #include <HTTPClient.h>
  #include <Preferences.h>
  #include <ArduinoJson.h>
  Preferences prefs;
  WebServer server(80);
#elif defined(ESP8266)
  #include <ESP8266WiFi.h>
  #include <ESP8266WebServer.h>
  #include <ESP8266HTTPClient.h>
  #include <EEPROM.h>
  #include <ArduinoJson.h>
  ESP8266WebServer server(80);
#else
  #error "Selecione uma placa ESP8266 ou ESP32."
#endif

// ---------- CONFIGURAÇÕES GLOBAIS ----------
const char* AP_SSID        = "tSeca_Config";
const char* AP_PASS        = "12345678";
const char* DEVICE_ID      = "esp01";
const char* VPS_BASE_URL   = "https://sua-vps.com"; // ⚠️ ALTERE PARA SUA VPS
const char* VPS_API_TOKEN  = "seu_token_secreto";   // ⚠️ ALTERE PARA SEU TOKEN
const uint32_t HEARTBEAT_MS = 30000;                 // 30 segundos
const uint32_t PULL_MS     = 10000;                  // 10 segundos

// ---------- PINOS ----------
const int RELAY1_PIN = 2;  // Aquecedor
const int RELAY2_PIN = 4;  // Cooler
const int LED_PIN = 5;     // LED indicador (mudado para evitar conflito)

// ---------- ESTADO GLOBAL ----------
String savedSSID = "";
String savedPASS = "";
uint32_t lastHeartbeat = 0;
uint32_t lastPull = 0;
bool deviceOnline = false;

// Estrutura de status
struct DeviceStatus {
  bool ativo = false;
  String estado = "desligado";
  int minutos = 0;
  int restante = 0;
  bool rele1 = false;
  bool rele2 = false;
  float temperatura = 0.0;
  float umidade = 0.0;
  unsigned long uptime = 0;
} status;

// ---------- HTML PÁGINA DE CADASTRO ----------
static const char CADASTRO_HTML[] PROGMEM = R"HTML(
<!doctype html>
<html lang="pt-br">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Configuração tSeca | VPS Global</title>
<style>
  :root{--fg:#0d0d0d;--muted:#666;--bg:#f7f7f7;--pri:#2563eb;--ok:#10b981;--err:#ef4444;border:0}
  *{box-sizing:border-box} body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#fff;color:var(--fg);margin:0}
  .wrap{max-width:720px;margin:24px auto;padding:16px}
  header{display:flex;align-items:center;gap:12px;margin-bottom:16px}
  h1{font-size:20px;margin:0} p{color:var(--muted)}
  .card{background:var(--bg);border-radius:16px;padding:16px;margin:12px 0}
  .btn{appearance:none;border:1px solid transparent;border-radius:999px;padding:10px 16px;cursor:pointer;font-weight:600}
  .btn.pri{background:var(--pri);color:#fff}
  .btn.ghost{background:#fff;border-color:#ddd}
  .btn.muted{background:#fff;color:var(--muted);border-color:#e5e5e5}
  form{display:grid;gap:12px}
  label{font-weight:600;font-size:14px}
  input,select{width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:12px;font-size:14px}
  .row{display:grid;grid-template-columns:1fr auto;gap:8px}
  .status{background:#e8f5e8;border:1px solid #4caf50;border-radius:8px;padding:12px;margin:12px 0}
  .status.error{background:#ffebee;border-color:#f44336}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>🌐 Configuração tSeca - Comunicação Global</h1>
  </header>

  <div class="card">
    <h3>📡 Status da Conexão</h3>
    <div id="connectionStatus" class="status">
      <p><strong>Status:</strong> <span id="wifiStatus">Verificando...</span></p>
      <p><strong>IP Local:</strong> <span id="localIP">-</span></p>
      <p><strong>VPS:</strong> <span id="vpsStatus">Verificando...</span></p>
      <p><strong>Device ID:</strong> <span id="deviceId">esp01</span></p>
    </div>
  </div>

  <div class="card">
    <h3>🔧 Configuração Wi-Fi</h3>
    <p>Configure o Wi-Fi para conectar à internet e comunicar com a VPS.</p>
    <div class="row" style="margin:8px 0 12px">
      <button class="btn muted" type="button" id="btnRefresh">Atualizar redes</button>
      <small id="scanStatus"></small>
    </div>

    <form id="wifiForm" method="POST" action="/salvar">
      <label for="ssid">Rede Wi-Fi (SSID)</label>
      <select id="ssid" name="ssid" required></select>
      <label for="pass">Senha Wi-Fi</label>
      <input id="pass" name="pass" type="password" placeholder="Senha da rede">
      <div class="row">
        <button class="btn pri" type="submit">Salvar & Conectar</button>
        <button class="btn ghost" type="button" id="btnTest">Testar conexão</button>
      </div>
      <small id="msg"></small>
    </form>
  </div>

  <div class="card">
    <h3>📋 Redes Encontradas</h3>
    <ul id="lista"></ul>
  </div>

  <div class="card">
    <h3>🎛️ Controles Remotos</h3>
    <p>Teste os comandos que serão executados remotamente via VPS:</p>
    <div class="row">
      <button class="btn pri" onclick="testCommand('ligar25')">Ligar 25min</button>
      <button class="btn pri" onclick="testCommand('ligar60')">Ligar 60min</button>
      <button class="btn pri" onclick="testCommand('ligar120')">Ligar 120min</button>
      <button class="btn ghost" onclick="testCommand('desligar')">Desligar</button>
    </div>
    <small id="commandMsg"></small>
  </div>
</div>

<script>
async function loadScan(){
  const s = document.getElementById('scanStatus');
  s.textContent = 'Varredura...';
  try{
    const res = await fetch('/scan.json',{cache:'no-store'});
    const js = await res.json();
    s.textContent = `Encontradas ${js.networks.length} redes`;
    const sel = document.getElementById('ssid');
    const ul  = document.getElementById('lista');
    sel.innerHTML = '';
    ul.innerHTML = '';
    js.networks.forEach(n=>{
      const opt = document.createElement('option');
      opt.value = n.ssid; opt.textContent = `${n.ssid} (${n.rssi} dBm)`;
      sel.appendChild(opt);

      const li = document.createElement('li');
      li.innerHTML = `<div><b>${n.ssid||'(oculta)'}</b><br><small>${n.enc}</small></div>
                      <div style="min-width:120px;margin-left:8px">
                        <div class="bar"><div class="fill" style="width:${n.quality}%;background:${n.quality>60?'#10b981':(n.quality>35?'#f59e0b':'#ef4444')}"></div></div>
                      </div>`;
      ul.appendChild(li);
    });
  }catch(e){
    s.textContent = 'Falha ao varrer';
  }
}

async function updateStatus(){
  try{
    const res = await fetch('/status.json');
    const status = await res.json();
    
    document.getElementById('wifiStatus').textContent = status.wifi ? 'Conectado ✅' : 'Desconectado ❌';
    document.getElementById('localIP').textContent = status.ip || '-';
    document.getElementById('vpsStatus').textContent = status.vps ? 'Online ✅' : 'Offline ❌';
    
    const statusDiv = document.getElementById('connectionStatus');
    if(status.vps){
      statusDiv.className = 'status';
    } else {
      statusDiv.className = 'status error';
    }
  }catch(e){
    console.error('Erro ao atualizar status:', e);
  }
}

async function testCommand(cmd){
  const msg = document.getElementById('commandMsg');
  msg.textContent = `Executando: ${cmd}...`;
  try{
    const res = await fetch(`/comando/${cmd}`, {method: 'POST'});
    const result = await res.json();
    msg.textContent = `Resultado: ${JSON.stringify(result)}`;
  }catch(e){
    msg.textContent = `Erro: ${e.message}`;
  }
}

document.getElementById('btnRefresh').onclick = loadScan;
document.getElementById('wifiForm').onsubmit = async (ev)=>{
  ev.preventDefault();
  const f = new FormData(ev.target);
  const msg = document.getElementById('msg');
  msg.textContent = 'Salvando...';
  const res = await fetch('/salvar',{method:'POST',body:new URLSearchParams(f)});
  const t = await res.text();
  msg.textContent = t;
  setTimeout(()=>updateStatus(),1500);
};

document.getElementById('btnTest').onclick = updateStatus;

// Atualiza status a cada 5 segundos
loadScan();
updateStatus();
setInterval(updateStatus, 5000);
</script>
</body>
</html>
)HTML";

// ---------- HELPERS ----------
void startAP(){
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP(AP_SSID, AP_PASS);
}

void saveCreds(const String& ssid, const String& pass){
#if defined(ESP32)
  prefs.begin("wifi", false);
  prefs.putString("ssid", ssid);
  prefs.putString("pass", pass);
  prefs.end();
#elif defined(ESP8266)
  EEPROM.begin(256);
  uint8_t i=0;
  for (; i<ssid.length() && i<63; ++i) EEPROM.write(i, ssid[i]);
  EEPROM.write(i++, 0);
  for (uint8_t j=0; j<pass.length() && j<63; ++j) EEPROM.write(i+j, pass[j]);
  EEPROM.write(i+pass.length(), 0);
  EEPROM.commit();
#endif
}

void loadCreds(){
#if defined(ESP32)
  prefs.begin("wifi", true);
  savedSSID = prefs.getString("ssid", "");
  savedPASS = prefs.getString("pass", "");
  prefs.end();
#elif defined(ESP8266)
  EEPROM.begin(256);
  char ss[64]; char pw[64];
  uint8_t i=0;
  for (; i<63; ++i){ ss[i]=EEPROM.read(i); if(ss[i]==0) break; }
  ss[i]=0; i++;
  uint8_t k=0;
  for (; k<63; ++k){ pw[k]=EEPROM.read(i+k); if(pw[k]==0) break; }
  pw[k]=0;
  savedSSID = String(ss);
  savedPASS = String(pw);
#endif
}

bool tryConnect(const String& ssid, const String& pass, uint32_t timeoutMs=15000){
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid.c_str(), pass.length()?pass.c_str():nullptr);
  uint32_t t0 = millis();
  while (WiFi.status() != WL_CONNECTED && (millis()-t0) < timeoutMs){
    delay(200);
  }
  return WiFi.status() == WL_CONNECTED;
}

// ---------- COMUNICAÇÃO COM VPS ----------
bool sendHeartbeat(){
  if (WiFi.status() != WL_CONNECTED) return false;
  
  String url = String(VPS_BASE_URL) + "/api/esp/heartbeat";
  
  DynamicJsonDocument doc(1024);
  doc["device_id"] = DEVICE_ID;
  
  // Serializar status individualmente para evitar problemas com ArduinoJson
  doc["ativo"] = status.ativo;
  doc["estado"] = status.estado;
  doc["minutos"] = status.minutos;
  doc["restante"] = status.restante;
  doc["rele1"] = status.rele1;
  doc["rele2"] = status.rele2;
  doc["temperatura"] = status.temperatura;
  doc["umidade"] = status.umidade;
  doc["uptime"] = status.uptime;
  
  doc["wifi"] = WiFi.status() == WL_CONNECTED;
  doc["ip"] = WiFi.localIP().toString();
  doc["uptime"] = millis() / 1000;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
#if defined(ESP32)
  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(VPS_API_TOKEN));
  
  int code = http.POST(jsonString);
  bool success = (code == 200);
  http.end();
  return success;
#elif defined(ESP8266)
  HTTPClient http;
  WiFiClient client;
  if (http.begin(client, url)){
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", "Bearer " + String(VPS_API_TOKEN));
    
    int code = http.POST(jsonString);
    bool success = (code == 200);
    http.end();
    return success;
  }
  return false;
#endif
}

bool pullCommands(){
  if (WiFi.status() != WL_CONNECTED) return false;
  
  String url = String(VPS_BASE_URL) + "/api/esp/commands?device=" + DEVICE_ID;
  
#if defined(ESP32)
  HTTPClient http;
  http.begin(url);
  http.addHeader("Authorization", "Bearer " + String(VPS_API_TOKEN));
  
  int code = http.GET();
  if (code == 200){
    String payload = http.getString();
    return processCommand(payload);
  }
  http.end();
#elif defined(ESP8266)
  HTTPClient http;
  WiFiClient client;
  if (http.begin(client, url)){
    http.addHeader("Authorization", "Bearer " + String(VPS_API_TOKEN));
    
    int code = http.GET();
    if (code == 200){
      String payload = http.getString();
      bool processed = processCommand(payload);
      http.end();
      return processed;
    }
    http.end();
  }
#endif
  
  return false;
}

// ---------- CONTROLE DE RELÉS ----------
void ligarAquecedor(int minutos){
  digitalWrite(RELAY1_PIN, HIGH);
  digitalWrite(RELAY2_PIN, HIGH);
  
  status.ativo = true;
  status.estado = "ligado";
  status.minutos = minutos;
  status.restante = minutos * 60;
  status.rele1 = true;
  status.rele2 = true;
  
  Serial.printf("Aquecedor ligado por %d minutos\n", minutos);
}

void desligarAquecedor(){
  digitalWrite(RELAY1_PIN, LOW);
  digitalWrite(RELAY2_PIN, LOW);
  
  status.ativo = false;
  status.estado = "desligado";
  status.minutos = 0;
  status.restante = 0;
  status.rele1 = false;
  status.rele2 = false;
  
  Serial.println("Aquecedor desligado");
}

void updateStatus(){
  if (status.ativo && status.restante > 0) {
    status.restante--;
    if (status.restante <= 0) {
      desligarAquecedor();
    }
  }
  
  status.uptime = millis() / 1000;
}

bool processCommand(const String& payload){
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, payload);
  
  if (error) {
    Serial.println("Erro ao processar comando JSON");
    return false;
  }
  
  // Verificar se é um array de comandos
  if (doc.containsKey("commands")) {
    JsonArray commands = doc["commands"];
    for (int i = 0; i < commands.size(); i++) {
      JsonObject command = commands[i];
      String cmd = command["command"] | "";
      int minutos = command["minutos"] | 0;
      
      if (cmd == "ligar25") {
        ligarAquecedor(25);
        return true;
      } else if (cmd == "ligar60") {
        ligarAquecedor(60);
        return true;
      } else if (cmd == "ligar120") {
        ligarAquecedor(120);
        return true;
      } else if (cmd == "desligar") {
        desligarAquecedor();
        return true;
      } else if (cmd == "ligar" && minutos > 0) {
        ligarAquecedor(minutos);
        return true;
      }
    }
  } else {
    // Comando único
    String command = doc["command"] | "";
    int minutos = doc["minutos"] | 0;
    
    if (command == "ligar25") {
      ligarAquecedor(25);
      return true;
    } else if (command == "ligar60") {
      ligarAquecedor(60);
      return true;
    } else if (command == "ligar120") {
      ligarAquecedor(120);
      return true;
    } else if (command == "desligar") {
      desligarAquecedor();
      return true;
    } else if (command == "ligar" && minutos > 0) {
      ligarAquecedor(minutos);
      return true;
    }
  }
  
  return false;
}

// ---------- HTTP HANDLERS ----------
void handleRoot(){
  server.sendHeader("Location","/cadastro",true);
  server.send(302,"text/plain","");
}

void handleCadastro(){
  server.send(200,"text/html", CADASTRO_HTML);
}

void handleScan(){
  int n = WiFi.scanNetworks();
  if (n < 0) {
    server.send(500, "application/json", "{\"error\":\"Falha ao varrer redes\"}");
    return;
  }

  String out = "{\"networks\":[";
  for (int i=0;i<n;i++){
    String ssid = WiFi.SSID(i); ssid.replace("\"","\\\"");
    int32_t rssi = WiFi.RSSI(i);
    int e = WiFi.encryptionType(i);
    
    int q;
    if (rssi >= -30) q = 100;
    else if (rssi <= -90) q = 0;
    else q = (rssi + 90) * 100 / 60; // Mapear de -90 a -30 para 0 a 100
    
    String encType = "";
    
    // Converter tipo de encriptação para string legível
    switch(e) {
      case 0: encType = "Aberta"; break;
      case 1: encType = "WEP"; break;
      case 2: encType = "WPA"; break;
      case 3: encType = "WPA2"; break;
      case 4: encType = "WPA/WPA2"; break;
      default: encType = "Desconhecida"; break;
    }
    
    if (i) out += ",";
    out += "{\"ssid\":\""+ssid+"\",\"rssi\":"+String(rssi)+",\"quality\":"+String(q)+",\"enc\":\""+encType+"\"}";
  }
  out += "]}";
  server.send(200,"application/json",out);
}

void handleSalvar(){
  if (!server.hasArg("ssid")){
    server.send(400,"text/plain","faltou ssid");
    return;
  }
  String ssid = server.arg("ssid");
  String pass = server.hasArg("pass") ? server.arg("pass") : "";
  saveCreds(ssid, pass);
  bool ok = tryConnect(ssid, pass, 10000);
  if (ok){
    server.send(200,"text/plain","Conectado! IP: " + WiFi.localIP().toString());
  } else {
    server.send(200,"text/plain","Salvo. Falha ao conectar agora; tentando em background.");
  }
}

void handleStatus(){
  wl_status_t st = WiFi.status();
  String s = "Status: " + String(st) + "\n";
  if (st == WL_CONNECTED){
    s += "IP: " + WiFi.localIP().toString() + "\n";
    s += "SSID: " + WiFi.SSID() + "\n";
    s += "RSSI: " + String(WiFi.RSSI()) + " dBm\n";
  }
  server.send(200,"text/plain",s);
}

void handleStatusJSON(){
  DynamicJsonDocument doc(1024);
  doc["wifi"] = WiFi.status() == WL_CONNECTED;
  doc["ip"] = WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : "";
  doc["ssid"] = WiFi.status() == WL_CONNECTED ? WiFi.SSID() : "";
  doc["rssi"] = WiFi.status() == WL_CONNECTED ? WiFi.RSSI() : 0;
  doc["vps"] = deviceOnline;
  
  // Serializar status individualmente para evitar problemas com ArduinoJson
  doc["ativo"] = status.ativo;
  doc["estado"] = status.estado;
  doc["minutos"] = status.minutos;
  doc["restante"] = status.restante;
  doc["rele1"] = status.rele1;
  doc["rele2"] = status.rele2;
  doc["temperatura"] = status.temperatura;
  doc["umidade"] = status.umidade;
  doc["uptime"] = status.uptime;
  
  String jsonString;
  serializeJson(doc, jsonString);
  server.send(200, "application/json", jsonString);
}

void handleComando(){
  DynamicJsonDocument response(256);
  
  // Determinar qual comando foi chamado baseado na URI
  String uri = server.uri();
  
  if (uri.indexOf("/comando/ligar25") >= 0) {
    ligarAquecedor(25);
    response["success"] = true;
    response["message"] = "Aquecedor ligado por 25 minutos";
  } else if (uri.indexOf("/comando/ligar60") >= 0) {
    ligarAquecedor(60);
    response["success"] = true;
    response["message"] = "Aquecedor ligado por 60 minutos";
  } else if (uri.indexOf("/comando/ligar120") >= 0) {
    ligarAquecedor(120);
    response["success"] = true;
    response["message"] = "Aquecedor ligado por 120 minutos";
  } else if (uri.indexOf("/comando/desligar") >= 0) {
    desligarAquecedor();
    response["success"] = true;
    response["message"] = "Aquecedor desligado";
  } else {
    response["success"] = false;
    response["message"] = "Comando não reconhecido: " + uri;
  }
  
  String jsonString;
  serializeJson(response, jsonString);
  server.send(200, "application/json", jsonString);
}

// ---------- SETUP/LOOP ----------
void setup(){
  delay(200);
  
  // Configurar pinos
  pinMode(RELAY1_PIN, OUTPUT);
  pinMode(RELAY2_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(RELAY1_PIN, LOW);
  digitalWrite(RELAY2_PIN, LOW);
  
#if defined(ESP32)
  prefs.begin("wifi", true); prefs.end();
#elif defined(ESP8266)
  EEPROM.begin(256);
#endif

  loadCreds();

  // Tenta conectar com credenciais salvas
  bool ok = false;
  if (savedSSID.length()){
    ok = tryConnect(savedSSID, savedPASS, 8000);
  }
  if (!ok){
    startAP(); // Abre AP para configurar
  }

  // Configurar rotas
  server.on("/", handleRoot);
  server.on("/cadastro", handleCadastro);
  server.on("/scan.json", handleScan);
  server.on("/salvar", HTTP_POST, handleSalvar);
  server.on("/status", handleStatus);
  server.on("/status.json", handleStatusJSON);
  server.on("/comando/ligar25", HTTP_POST, handleComando);
  server.on("/comando/ligar60", HTTP_POST, handleComando);
  server.on("/comando/ligar120", HTTP_POST, handleComando);
  server.on("/comando/desligar", HTTP_POST, handleComando);
  
  server.begin();
  
  Serial.begin(115200);
  Serial.println("tSeca iniciado - Comunicação Global via VPS");
}

void loop(){
  server.handleClient();

  // Se desconectou, tente reconectar
  static uint32_t lastRetry = 0;
  if (WiFi.status()!=WL_CONNECTED && millis()-lastRetry>5000 && savedSSID.length()){
    lastRetry = millis();
    tryConnect(savedSSID, savedPASS, 5000);
  }

  // Atualizar status
  updateStatus();
  
  // Heartbeat para VPS
  if (millis() - lastHeartbeat > HEARTBEAT_MS) {
    deviceOnline = sendHeartbeat();
    lastHeartbeat = millis();
  }
  
  // Pull de comandos da VPS
  if (millis() - lastPull > PULL_MS) {
    pullCommands();
    lastPull = millis();
  }
  
  // LED indicador
  digitalWrite(LED_PIN, WiFi.status() == WL_CONNECTED ? HIGH : LOW);
  
  delay(100);
}
