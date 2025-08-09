/**
 * Configurações - tSeca Control
 * Gerenciamento da página de configurações
 */

class ConfigController {
  constructor() {
    this.init();
  }

  init() {
    this.loadSavedConfig();
    this.bindEvents();
  }

  bindEvents() {
    // Form de configurações
    document.getElementById('config-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveConfig();
    });

    // Botão de teste de conexão
    document.getElementById('btn-test-connection')?.addEventListener('click', () => {
      this.testConnection();
    });

    // Efeitos de hover nos botões
    this.addButtonEffects();
  }

  addButtonEffects() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.02)';
      });
      button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
      });
    });
  }

  loadSavedConfig() {
    const savedEspUrl = localStorage.getItem('espUrl');
    const savedApiToken = localStorage.getItem('apiToken');
    
    if (savedEspUrl) {
      // Extrair IP da URL salva
      const ipMatch = savedEspUrl.match(/http:\/\/([^\/]+)/);
      if (ipMatch) {
        document.getElementById('device-ip').value = ipMatch[1];
      }
    }
    
    if (savedApiToken) {
      document.getElementById('api-token').value = savedApiToken;
    }
  }

  async saveConfig() {
    try {
      this.showLoading();
      
      const deviceIp = document.getElementById('device-ip').value.trim();
      const apiToken = document.getElementById('api-token').value.trim();
      
      if (!deviceIp || !apiToken) {
        this.showNotification('Por favor, preencha todos os campos', 'error');
        return;
      }

      // Validar formato do IP
      if (!this.isValidIP(deviceIp)) {
        this.showNotification('Formato de IP inválido', 'error');
        return;
      }

      // Salvar no localStorage
      const espUrl = `http://${deviceIp}`;
      localStorage.setItem('espUrl', espUrl);
      localStorage.setItem('apiToken', apiToken);
      
      this.showNotification('Configurações salvas com sucesso!', 'success');
      
      // Testar conexão automaticamente após salvar
      setTimeout(() => {
        this.testConnection();
      }, 1000);
      
    } catch (error) {
      this.showNotification('Erro ao salvar configurações', 'error');
      console.error('Erro ao salvar:', error);
    } finally {
      this.hideLoading();
    }
  }

  async testConnection() {
    try {
      this.showLoading();
      
      const deviceIp = document.getElementById('device-ip').value.trim();
      const apiToken = document.getElementById('api-token').value.trim();
      
      if (!deviceIp || !apiToken) {
        this.showNotification('Por favor, preencha todos os campos antes de testar', 'error');
        return;
      }

      // Testar conexão com o ESP8266
      const response = await fetch(`http://${deviceIp}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000
      });

      if (response.ok) {
        const data = await response.json();
        this.showConnectionStatus(true, 'Conexão estabelecida com sucesso!', data);
        this.showNotification('Conexão testada com sucesso!', 'success');
      } else {
        this.showConnectionStatus(false, 'Erro na conexão', { error: response.statusText });
        this.showNotification('Erro ao conectar com o dispositivo', 'error');
      }
      
    } catch (error) {
      console.error('Erro no teste de conexão:', error);
      this.showConnectionStatus(false, 'Erro na conexão', { error: error.message });
      this.showNotification('Erro ao conectar com o dispositivo', 'error');
    } finally {
      this.hideLoading();
    }
  }

  showConnectionStatus(success, message, data) {
    const statusEl = document.getElementById('connection-status');
    const indicatorEl = document.getElementById('status-indicator');
    const textEl = document.getElementById('status-text');
    const detailsEl = document.getElementById('status-details');
    
    if (statusEl && indicatorEl && textEl && detailsEl) {
      statusEl.classList.remove('hidden');
      
      if (success) {
        indicatorEl.className = 'w-3 h-3 bg-green-500 rounded-full';
        textEl.textContent = 'Conectado';
        textEl.className = 'font-medium text-green-700';
        detailsEl.textContent = `IP: ${data.ip || 'N/A'} | Versão: ${data.versao || 'N/A'}`;
      } else {
        indicatorEl.className = 'w-3 h-3 bg-red-500 rounded-full';
        textEl.textContent = 'Desconectado';
        textEl.className = 'font-medium text-red-700';
        detailsEl.textContent = data.error || 'Verifique o IP e token';
      }
    }
  }

  isValidIP(ip) {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  }

  showLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.classList.remove('hidden');
    }
  }

  hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
    }
  }

  showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const messageEl = document.getElementById('notification-message');
    const iconEl = document.getElementById('notification-icon');
    
    if (notification && messageEl && iconEl) {
      messageEl.textContent = message;
      
      // Configurar ícone e cor baseado no tipo
      if (type === 'success') {
        iconEl.className = 'w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-green-100';
        iconEl.innerHTML = '<i class="fas fa-check text-xs sm:text-sm text-green-600"></i>';
      } else if (type === 'error') {
        iconEl.className = 'w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-red-100';
        iconEl.innerHTML = '<i class="fas fa-exclamation-triangle text-xs sm:text-sm text-red-600"></i>';
      } else if (type === 'warning') {
        iconEl.className = 'w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-yellow-100';
        iconEl.innerHTML = '<i class="fas fa-exclamation-circle text-xs sm:text-sm text-yellow-600"></i>';
      }
      
      notification.classList.remove('translate-x-full');
      
      // Auto-hide após 5 segundos
      setTimeout(() => {
        this.hideNotification();
      }, 5000);
    }
  }

  hideNotification() {
    const notification = document.getElementById('notification');
    if (notification) {
      notification.classList.add('translate-x-full');
    }
  }
}

// Função global para esconder notificação
function hideNotification() {
  if (window.configApp) {
    window.configApp.hideNotification();
  }
}

// Inicializar aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  window.configApp = new ConfigController();
});
