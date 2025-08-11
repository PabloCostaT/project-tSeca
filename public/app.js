/**
 * tSeca Control Panel - JavaScript
 * Controle remoto para dispositivo ESP8266 - Design Moderno
 */

class tSecaController {
  constructor() {
    this.apiToken = localStorage.getItem('apiToken') || '123456';
    this.espUrl = localStorage.getItem('espUrl') || '';
    this.updateInterval = null;
    this.isConnected = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.lastUpdate = null;
    this.init();
  }

  init() {
    this.checkSetup();
    this.bindEvents();
    this.startAutoUpdate();
    this.updateStatus();
    this.addCardAnimations();
    this.updateConnectionInfo();
  }

  addCardAnimations() {
    // Adicionar animações de entrada para os cards
    const cards = document.querySelectorAll('.bg-white\\/80');
    cards.forEach((card, index) => {
      card.classList.add('card-enter');
      card.style.animationDelay = `${index * 0.1}s`;
    });
  }

  checkSetup() {
    const savedEspUrl = localStorage.getItem('espUrl');
    const savedApiToken = localStorage.getItem('apiToken');
    
    if (savedEspUrl && savedApiToken) {
      this.espUrl = savedEspUrl;
      this.apiToken = savedApiToken;
      this.updateConnectionInfo();
    } else {
      // Configuração padrão se não houver dados salvos
      this.espUrl = 'http://192.168.15.14';
      this.apiToken = '123456';
    }
  }

  updateConnectionInfo() {
    const espUrlDisplay = document.getElementById('esp-url-display');
    const lastUpdate = document.getElementById('last-update');
    
    if (espUrlDisplay) {
      espUrlDisplay.textContent = this.espUrl || 'Não configurado';
    }
    
    if (lastUpdate && this.lastUpdate) {
      lastUpdate.textContent = this.lastUpdate;
    }
  }

  bindEvents() {
    // Botões de controle
    console.log('Configurando eventos dos botões...');
    
    const btn25 = document.getElementById('btn-25');
    const btn60 = document.getElementById('btn-60');
    const btn120 = document.getElementById('btn-120');
    const btnDesligar = document.getElementById('btn-desligar');
    
    console.log('Botões encontrados:', { btn25, btn60, btn120, btnDesligar });
    
    btn25?.addEventListener('click', () => {
      console.log('Botão 25 clicado');
      this.ligarPorTempo(25);
    });
    
    btn60?.addEventListener('click', () => {
      console.log('Botão 60 clicado');
      this.ligarPorTempo(60);
    });
    
    btn120?.addEventListener('click', () => {
      console.log('Botão 120 clicado');
      this.ligarPorTempo(120);
    });
    
    btnDesligar?.addEventListener('click', () => {
      console.log('Botão desligar clicado');
      this.desligarAquecedor();
    });

    // Remover referências à tela de configuração

    // Auto-update quando a aba fica visível
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !this.updateInterval) {
        this.startAutoUpdate();
      }
    });

    // Teclas de atalho
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch(event.key) {
        case '1':
          event.preventDefault();
          this.ligarPorTempo(25);
          break;
        case '2':
          event.preventDefault();
          this.ligarPorTempo(60);
          break;
        case '3':
          event.preventDefault();
          this.ligarPorTempo(120);
          break;
        case '0':
          event.preventDefault();
          this.desligarAquecedor();
          break;
        case 'r':
          event.preventDefault();
          this.updateStatus();
          break;
        }
      }
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

  // Métodos de configuração removidos - usando configuração padrão

  async makeApiCall(endpoint, method = 'GET', data = null) {
    try {
      const url = `/api${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiToken}`
      };

      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : null
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Erro na API:', error);
      this.showNotification(`Erro de conexão: ${error.message}`, 'error');
      throw error;
    }
  }

  async ligarPorTempo(minutos) {
    try {
      this.showLoading();
      this.disableAllButtons();
      
      let result;
      
      // Usar endpoints específicos para tempos padrão
      if (minutos === 25) {
        result = await this.makeApiCall('/ligar25', 'POST');
      } else if (minutos === 60) {
        result = await this.makeApiCall('/ligar60', 'POST');
      } else if (minutos === 120) {
        result = await this.makeApiCall('/ligar120', 'POST');
      } else {
        // Para outros tempos, usar o endpoint de temporizador
        result = await this.makeApiCall('/tempo', 'POST', { minutos: minutos });
      }
      
      if (result.success) {
        this.showNotification(`Aquecedor ligado por ${minutos} minutos!`, 'success');
        this.updateStatus();
      } else {
        this.showNotification(`Erro ao ligar aquecedor por ${minutos} minutos`, 'error');
      }
    } catch (error) {
      this.showNotification(`Erro ao ligar aquecedor por ${minutos} minutos`, 'error');
    } finally {
      this.hideLoading();
      this.enableAllButtons();
    }
  }

  async desligarAquecedor() {
    try {
      this.showLoading();
      this.disableAllButtons();
      
      const result = await this.makeApiCall('/desligar', 'POST');
      
      if (result.success) {
        this.showNotification('Aquecedor desligado com sucesso!', 'success');
        this.updateStatus();
      } else {
        this.showNotification('Erro ao desligar aquecedor', 'error');
      }
    } catch (error) {
      this.showNotification('Erro ao desligar aquecedor', 'error');
    } finally {
      this.hideLoading();
      this.enableAllButtons();
    }
  }

  async updateStatus() {
    try {
      const result = await this.makeApiCall('/estado', 'GET');
      
      if (result.success) {
        this.updateUI(result.data);
        this.isConnected = true;
        this.retryCount = 0;
        this.updateConnectionStatus(true);
        this.lastUpdate = new Date().toLocaleTimeString('pt-BR');
        this.updateConnectionInfo();
      } else {
        this.updateUIWithDefaults();
        this.isConnected = false;
        this.updateConnectionStatus(false);
      }
    } catch (error) {
      this.updateUIWithDefaults();
      this.isConnected = false;
      this.updateConnectionStatus(false);
      this.retryCount++;
      
      if (this.retryCount >= this.maxRetries) {
        this.showNotification('Dispositivo offline. Verifique a conexão.', 'error');
      }
    }
  }

  updateUI(data) {
    // Atualizar temperatura
    const temperaturaEl = document.getElementById('temperatura');
    if (temperaturaEl && data.temperatura !== undefined) {
      const temp = data.temperatura === -1 ? '--' : data.temperatura;
      const newTemp = `${temp}°C`;
      if (temperaturaEl.textContent !== newTemp) {
        this.animateValueChange(temperaturaEl);
        temperaturaEl.textContent = newTemp;
      }
    }

    // Atualizar umidade
    const umidadeEl = document.getElementById('umidade');
    if (umidadeEl && data.umidade !== undefined) {
      const humidity = data.umidade === -1 ? '--' : data.umidade;
      const newHumidity = `${humidity}%`;
      if (umidadeEl.textContent !== newHumidity) {
        this.animateValueChange(umidadeEl);
        umidadeEl.textContent = newHumidity;
      }
    }

    // Atualizar status do aquecedor
    const statusAquecedorEl = document.getElementById('status-aquecedor');
    const aquecedorIconEl = document.getElementById('aquecedor-icon');
    if (statusAquecedorEl && aquecedorIconEl) {
      // O ESP retorna: estado (aquecendo/resfriando/desligado) e ativo (boolean)
      const estado = data.estado || 'desligado';
      const isOn = estado === 'aquecendo' || estado === 'resfriando' || data.ativo === true;
      const statusText = estado === 'aquecendo' ? 'Aquecendo' : 
                        estado === 'resfriando' ? 'Resfriando' : 'Desligado';
      
      statusAquecedorEl.textContent = statusText;
      statusAquecedorEl.className = `text-xl font-bold ${isOn ? 'text-green-600' : 'text-gray-800'}`;
      
      if (isOn) {
        aquecedorIconEl.className = 'w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center';
        aquecedorIconEl.innerHTML = '<i class="fas fa-fire text-xl text-green-500"></i>';
      } else {
        aquecedorIconEl.className = 'w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center';
        aquecedorIconEl.innerHTML = '<i class="fas fa-times text-2xl text-red-500"></i>';
      }
    }

    // Atualizar tempo restante
    const tempoRestanteEl = document.getElementById('tempo-restante');
    if (tempoRestanteEl) {
      // ESP retorna 'restante' em segundos e 'minutos' em minutos
      let restante = 0;
      if (data.restante !== undefined && data.restante > 0) {
        restante = Math.ceil(data.restante / 60); // Converter segundos para minutos
      } else if (data.minutos !== undefined && data.minutos > 0) {
        restante = data.minutos;
      }
      
      const newTime = restante > 0 ? `${restante} min` : '-- min';
      if (tempoRestanteEl.textContent !== newTime) {
        this.animateValueChange(tempoRestanteEl);
        tempoRestanteEl.textContent = newTime;
      }
    }

    // Atualizar status do cooler (usando rele2)
    const statusCoolerEl = document.getElementById('status-cooler');
    const coolerIconEl = document.getElementById('cooler-icon');
    if (statusCoolerEl && coolerIconEl) {
      const isCoolerOn = data.rele2 === 1;
      const statusText = isCoolerOn ? 'Ligado' : 'Desligado';
      statusCoolerEl.textContent = statusText;
      statusCoolerEl.className = `text-xl font-bold ${isCoolerOn ? 'text-cyan-600' : 'text-gray-800'}`;
      
      if (isCoolerOn) {
        coolerIconEl.className = 'w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center';
        coolerIconEl.innerHTML = '<i class="fas fa-snowflake text-xl text-cyan-500"></i>';
      } else {
        coolerIconEl.className = 'w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center';
        coolerIconEl.innerHTML = '<i class="fas fa-snowflake text-xl text-gray-400"></i>';
      }
    }

    this.updateButtonStates(data);
  }

  animateValueChange(element) {
    element.style.transform = 'scale(1.1)';
    element.style.transition = 'transform 0.2s ease-in-out';
    setTimeout(() => {
      element.style.transform = 'scale(1)';
    }, 200);
  }

  updateUIWithDefaults() {
    document.getElementById('temperatura').textContent = '--°C';
    document.getElementById('umidade').textContent = '--%';
    document.getElementById('status-aquecedor').textContent = 'Offline';
    document.getElementById('tempo-restante').textContent = '-- min';
    document.getElementById('status-cooler').textContent = 'Offline';
    
    // Resetar ícones para estado offline
    const aquecedorIcon = document.getElementById('aquecedor-icon');
    const coolerIcon = document.getElementById('cooler-icon');
    
    if (aquecedorIcon) {
      aquecedorIcon.className = 'w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center';
      aquecedorIcon.innerHTML = '<i class="fas fa-times text-2xl text-red-500"></i>';
    }
    
    if (coolerIcon) {
      coolerIcon.className = 'w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center';
      coolerIcon.innerHTML = '<i class="fas fa-snowflake text-xl text-gray-400"></i>';
    }
    
    // Desabilitar todos os botões quando offline
    this.disableAllButtons();
  }

  updateButtonStates(data) {
    const btn25 = document.getElementById('btn-25');
    const btn60 = document.getElementById('btn-60');
    const btn120 = document.getElementById('btn-120');
    const btnDesligar = document.getElementById('btn-desligar');
    
    if (btn25 && btn60 && btn120 && btnDesligar) {
      const isConnected = this.isConnected;
      // O ESP retorna: estado (aquecendo/resfriando/desligado) e ativo (boolean)
      const estado = data.estado || 'desligado';
      const isHeaterOn = estado === 'aquecendo' || estado === 'resfriando' || data.ativo === true;
      
      // Botões de ligar: desabilitados se offline ou se aquecedor já ligado
      const shouldDisableLigar = !isConnected || isHeaterOn;
      btn25.disabled = shouldDisableLigar;
      btn60.disabled = shouldDisableLigar;
      btn120.disabled = shouldDisableLigar;
      
      // Botão desligar: desabilitado se offline ou se aquecedor já desligado
      const shouldDisableDesligar = !isConnected || !isHeaterOn;
      btnDesligar.disabled = shouldDisableDesligar;
    }
  }

  disableAllButtons() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      button.disabled = true;
    });
  }

  enableAllButtons() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      button.disabled = false;
    });
  }

  updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connection-status');
    if (statusEl) {
      const indicator = statusEl.querySelector('div');
      const text = statusEl.querySelector('span');
      
      if (connected) {
        indicator.className = 'w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse';
        text.textContent = 'Online';
        text.className = 'text-xs sm:text-sm text-white font-medium';
      } else {
        indicator.className = 'w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse';
        text.textContent = 'Offline';
        text.className = 'text-xs sm:text-sm text-white font-medium';
      }
    }
  }

  startAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    this.updateInterval = setInterval(() => {
      if (!document.hidden) {
        this.updateStatus();
      }
    }, 10000); // Atualizar a cada 10 segundos
  }

  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
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

  saveConnectionSettings(espIp, apiToken) {
    const espUrl = `http://${espIp}`;
    localStorage.setItem('espUrl', espUrl);
    localStorage.setItem('apiToken', apiToken);
    this.espUrl = espUrl;
    this.apiToken = apiToken;
  }
}

// Função global para esconder notificação
function hideNotification() {
  if (window.tSecaApp) {
    window.tSecaApp.hideNotification();
  }
}

// Inicializar aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  window.tSecaApp = new tSecaController();
});