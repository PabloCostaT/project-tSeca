#!/bin/bash

# ============================= SCRIPT DE CONFIGURAÇÃO DA VPS =============================
# Este script configura uma VPS Ubuntu/Debian para rodar o painel tSeca
# Execute como root ou com sudo

set -e

echo "🚀 Configurando VPS para painel tSeca..."

# ============================= ATUALIZAR SISTEMA =============================
echo "📦 Atualizando sistema..."
apt update && apt upgrade -y

# ============================= INSTALAR DEPENDÊNCIAS =============================
echo "🔧 Instalando dependências..."
apt install -y curl wget git build-essential software-properties-common

# ============================= INSTALAR NODE.JS =============================
echo "📱 Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verificar versão
echo "Node.js versão: $(node --version)"
echo "NPM versão: $(npm --version)"

# ============================= INSTALAR PM2 =============================
echo "⚡ Instalando PM2..."
npm install -g pm2

# ============================= INSTALAR NGINX =============================
echo "🌐 Instalando Nginx..."
apt install -y nginx

# ============================= INSTALAR CERTBOT (SSL) =============================
echo "🔒 Instalando Certbot para SSL..."
apt install -y certbot python3-certbot-nginx

# ============================= CRIAR USUÁRIO PARA APLICAÇÃO =============================
echo "👤 Criando usuário para aplicação..."
if ! id "tseca" &>/dev/null; then
    useradd -m -s /bin/bash tseca
    usermod -aG sudo tseca
    echo "tseca ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/tseca
fi

# ============================= CONFIGURAR FIREWALL =============================
echo "🔥 Configurando firewall..."
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow 3030
ufw --force enable

# ============================= CRIAR DIRETÓRIOS =============================
echo "📁 Criando diretórios..."
mkdir -p /var/www/tseca
mkdir -p /var/log/tseca
mkdir -p /etc/tseca

# ============================= CONFIGURAR NGINX =============================
echo "⚙️ Configurando Nginx..."

cat > /etc/nginx/sites-available/tseca << 'EOF'
server {
    listen 80;
    server_name sua-vps.com;  # ⚠️ ALTERE PARA SEU DOMÍNIO

    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sua-vps.com;  # ⚠️ ALTERE PARA SEU DOMÍNIO

    # SSL (será configurado pelo Certbot)
    ssl_certificate /etc/letsencrypt/live/sua-vps.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sua-vps.com/privkey.pem;

    # Configurações SSL recomendadas
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Headers de segurança
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Logs
    access_log /var/log/nginx/tseca_access.log;
    error_log /var/log/nginx/tseca_error.log;

    # Proxy para aplicação Node.js
    location / {
        proxy_pass http://localhost:3030;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Ativar site
ln -sf /etc/nginx/sites-available/tseca /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar configuração
nginx -t

# ============================= CONFIGURAR SYSTEMD =============================
echo "🔧 Configurando systemd..."

cat > /etc/systemd/system/tseca.service << 'EOF'
[Unit]
Description=tSeca Painel Web
After=network.target

[Service]
Type=simple
User=tseca
WorkingDirectory=/var/www/tseca
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3030
Environment=HOST=0.0.0.0

# Logs
StandardOutput=journal
StandardError=journal
SyslogIdentifier=tseca

# Segurança
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/log/tseca /var/www/tseca

[Install]
WantedBy=multi-user.target
EOF

# Recarregar systemd
systemctl daemon-reload

# ============================= CONFIGURAR LOGROTATE =============================
echo "📋 Configurando logrotate..."

cat > /etc/logrotate.d/tseca << 'EOF'
/var/log/tseca/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 tseca tseca
    postrotate
        systemctl reload tseca
    endscript
}
EOF

# ============================= CONFIGURAR MONITORAMENTO =============================
echo "📊 Configurando monitoramento..."

# Instalar htop para monitoramento
apt install -y htop

# Criar script de monitoramento
cat > /usr/local/bin/tseca-monitor.sh << 'EOF'
#!/bin/bash

# Script de monitoramento para tSeca
LOG_FILE="/var/log/tseca/monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Verificar se o serviço está rodando
if systemctl is-active --quiet tseca; then
    STATUS="OK"
else
    STATUS="ERROR"
    echo "[$DATE] Serviço tSeca parado, reiniciando..." >> $LOG_FILE
    systemctl restart tseca
fi

# Verificar uso de memória
MEMORY=$(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2 }')
CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')

echo "[$DATE] Status: $STATUS | CPU: ${CPU}% | Mem: $MEMORY" >> $LOG_FILE

# Manter apenas as últimas 1000 linhas
tail -n 1000 $LOG_FILE > /tmp/tseca-monitor.tmp && mv /tmp/tseca-monitor.tmp $LOG_FILE
EOF

chmod +x /usr/local/bin/tseca-monitor.sh

# Adicionar ao crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/tseca-monitor.sh") | crontab -

# ============================= CONFIGURAR BACKUP =============================
echo "💾 Configurando backup..."

cat > /usr/local/bin/tseca-backup.sh << 'EOF'
#!/bin/bash

# Script de backup para tSeca
BACKUP_DIR="/var/backups/tseca"
DATE=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="tseca_backup_$DATE.tar.gz"

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Fazer backup dos arquivos
tar -czf $BACKUP_DIR/$BACKUP_FILE \
    /var/www/tseca \
    /etc/tseca \
    /var/log/tseca \
    /etc/nginx/sites-available/tseca

# Manter apenas os últimos 7 backups
find $BACKUP_DIR -name "tseca_backup_*.tar.gz" -mtime +7 -delete

echo "Backup criado: $BACKUP_FILE"
EOF

chmod +x /usr/local/bin/tseca-backup.sh

# Adicionar ao crontab (backup diário às 2h)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/tseca-backup.sh") | crontab -

# ============================= INSTRUÇÕES FINAIS =============================
echo ""
echo "✅ Configuração da VPS concluída!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Clone o repositório tSeca em /var/www/tseca"
echo "2. Configure o arquivo .env com suas variáveis"
echo "3. Instale as dependências: npm install"
echo "4. Configure seu domínio no Nginx"
echo "5. Obtenha certificado SSL: certbot --nginx -d sua-vps.com"
echo "6. Inicie o serviço: systemctl start tseca"
echo "7. Habilite o serviço: systemctl enable tseca"
echo ""
echo "🔧 COMANDOS ÚTEIS:"
echo "- Status do serviço: systemctl status tseca"
echo "- Logs do serviço: journalctl -u tseca -f"
echo "- Logs do Nginx: tail -f /var/log/nginx/tseca_error.log"
echo "- Monitoramento: htop"
echo "- Backup manual: /usr/local/bin/tseca-backup.sh"
echo ""
echo "🌐 Acesse: https://sua-vps.com"
echo "📱 API: https://sua-vps.com/api/esp"
echo ""
