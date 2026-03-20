// Sistema OBD - Trilhança
class OBDSimulator {
  constructor() {
    this.isConnected = false;
    this.connectionType = null;
    this.dataInterval = null;
    this.logData = [];
    this.isLogging = false;
    this.errorCodes = [];
    
    // Simulated data
    this.simulatedData = {
      speed: 0,
      rpm: 0,
      temperature: 85,
      fuel: 75,
      odometer: 123456,
      trip: 0,
      oilPressure: 2.5,
      batteryVoltage: 12.6,
      maf: 15.2,
      throttlePosition: 0,
      o2Sensor: 0.45,
      mapSensor: 101,
      tpsSensor: 0,
      iatSensor: 25,
      injectorTime: 2.5,
      ignitionTiming: 15,
      engineLoad: 25
    };
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.startClock();
    this.updateDisplay();
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    // Diagnostic tabs
    document.querySelectorAll('.diag-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchDiagnosticTab(e.target.dataset.diag));
    });

    // Connection buttons
    document.getElementById('connect-btn').addEventListener('click', () => this.connect());
    document.getElementById('disconnect-btn').addEventListener('click', () => this.disconnect());
    
    // Scan buttons
    document.getElementById('scan-bluetooth').addEventListener('click', () => this.scanBluetooth());
    document.getElementById('scan-serial').addEventListener('click', () => this.scanSerial());

    // Error codes
    document.getElementById('read-codes-btn').addEventListener('click', () => this.readErrorCodes());
    document.getElementById('clear-codes-btn').addEventListener('click', () => this.clearErrorCodes());

    // Log controls
    document.getElementById('start-log-btn').addEventListener('click', () => this.startLogging());
    document.getElementById('stop-log-btn').addEventListener('click', () => this.stopLogging());
    document.getElementById('download-log-btn').addEventListener('click', () => this.downloadLog());
    document.getElementById('clear-log-btn').addEventListener('click', () => this.clearLog());
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
  }

  switchDiagnosticTab(tabName) {
    // Update diagnostic tab buttons
    document.querySelectorAll('.diag-tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-diag="${tabName}"]`).classList.add('active');

    // Update diagnostic content
    document.querySelectorAll('.diag-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-content`).classList.add('active');
  }

  async connect() {
    const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
    this.connectionType = activeTab;
    
    this.updateConnectionStatus('connecting');
    this.addLog('info', `Conectando via ${activeTab.toUpperCase()}...`);

    // Simulate connection delay
    await this.delay(2000);

    try {
      let success = false;
      
      switch (activeTab) {
        case 'bluetooth':
          success = await this.connectBluetooth();
          break;
        case 'serial':
          success = await this.connectSerial();
          break;
        case 'wifi':
          success = await this.connectWiFi();
          break;
      }

      if (success) {
        this.isConnected = true;
        this.updateConnectionStatus('connected');
        this.addLog('success', `Conectado com sucesso via ${activeTab.toUpperCase()}`);
        this.startDataStreaming();
        this.showConnectionControls(true);
      } else {
        this.updateConnectionStatus('disconnected');
        this.addLog('error', `Falha na conexão via ${activeTab.toUpperCase()}`);
      }
    } catch (error) {
      this.updateConnectionStatus('disconnected');
      this.addLog('error', `Erro de conexão: ${error.message}`);
    }
  }

  async connectBluetooth() {
    const device = document.getElementById('bluetooth-device').value;
    if (!device) {
      this.addLog('warning', 'Selecione um dispositivo Bluetooth');
      return false;
    }
    
    // Simulate Bluetooth connection
    return true;
  }

  async connectSerial() {
    const port = document.getElementById('serial-port').value;
    if (!port) {
      this.addLog('warning', 'Selecione uma porta serial');
      return false;
    }
    
    // Simulate serial connection
    return true;
  }

  async connectWiFi() {
    const ip = document.getElementById('wifi-ip').value;
    const port = document.getElementById('wifi-port').value;
    
    if (!ip || !port) {
      this.addLog('warning', 'Preencha IP e porta WiFi');
      return false;
    }
    
    // Simulate WiFi connection
    return true;
  }

  disconnect() {
    this.isConnected = false;
    this.stopDataStreaming();
    this.updateConnectionStatus('disconnected');
    this.addLog('info', 'Desconectado do sistema OBD');
    this.showConnectionControls(false);
  }

  updateConnectionStatus(status) {
    const statusElement = document.getElementById('connection-status');
    const statusText = {
      connected: '<i class="fas fa-circle"></i> Conectado',
      disconnected: '<i class="fas fa-circle"></i> Desconectado',
      connecting: '<i class="fas fa-circle"></i> Conectando...'
    };

    statusElement.innerHTML = statusText[status];
    statusElement.className = status === 'connected' ? 'status-connected' : 
                                   status === 'connecting' ? 'status-connecting' : 'status-disconnected';

    // Update ECU status
    const ecuStatus = document.getElementById('ecu-status');
    ecuStatus.textContent = status === 'connected' ? 'ECU: Conectada' : 'ECU: Desconectada';
  }

  showConnectionControls(connected) {
    document.getElementById('connect-btn').classList.toggle('hidden', connected);
    document.getElementById('disconnect-btn').classList.toggle('hidden', !connected);
  }

  async scanBluetooth() {
    this.addLog('info', 'Buscando dispositivos Bluetooth...');
    
    // Simulate scanning
    await this.delay(1500);
    
    const select = document.getElementById('bluetooth-device');
    select.innerHTML = `
      <option value="">Selecione um dispositivo</option>
      <option value="obd-adapter-1">OBD Adapter v2.1</option>
      <option value="obd-adapter-2">ELM327 WiFi</option>
      <option value="obd-adapter-3">VeePeak OBD</option>
    `;
    
    this.addLog('success', '3 dispositivos Bluetooth encontrados');
  }

  async scanSerial() {
    this.addLog('info', 'Buscando portas seriais...');
    
    // Simulate scanning
    await this.delay(1000);
    
    const select = document.getElementById('serial-port');
    select.innerHTML = `
      <option value="">Selecione uma porta</option>
      <option value="COM3">COM3</option>
      <option value="COM4">COM4</option>
      <option value="COM5">COM5</option>
    `;
    
    this.addLog('success', '3 portas seriais encontradas');
  }

  startDataStreaming() {
    if (this.dataInterval) return;
    
    this.dataInterval = setInterval(() => {
      this.simulateData();
      this.updateDisplay();
    }, 1000);
    
    this.addLog('info', 'Streaming de dados iniciado');
  }

  stopDataStreaming() {
    if (this.dataInterval) {
      clearInterval(this.dataInterval);
      this.dataInterval = null;
      this.addLog('info', 'Streaming de dados parado');
    }
  }

  simulateData() {
    // Simulate realistic vehicle data changes
    const time = Date.now() / 1000;
    
    // Speed simulation
    if (this.simulatedData.speed < 80 && Math.random() > 0.7) {
      this.simulatedData.speed += Math.random() * 5;
    } else if (this.simulatedData.speed > 0 && Math.random() > 0.8) {
      this.simulatedData.speed -= Math.random() * 3;
    }
    this.simulatedData.speed = Math.max(0, Math.min(120, this.simulatedData.speed));
    
    // RPM simulation
    const targetRpm = this.simulatedData.speed * 30 + Math.random() * 500;
    this.simulatedData.rpm += (targetRpm - this.simulatedData.rpm) * 0.1;
    this.simulatedData.rpm = Math.max(800, Math.min(6000, this.simulatedData.rpm));
    
    // Temperature simulation
    this.simulatedData.temperature += (Math.random() - 0.5) * 2;
    this.simulatedData.temperature = Math.max(70, Math.min(110, this.simulatedData.temperature));
    
    // Fuel simulation
    if (Math.random() > 0.95) {
      this.simulatedData.fuel -= Math.random() * 0.5;
    }
    this.simulatedData.fuel = Math.max(0, this.simulatedData.fuel);
    
    // Odometer simulation
    this.simulatedData.odometer += this.simulatedData.speed / 3600; // km per second
    this.simulatedData.trip += this.simulatedData.speed / 3600;
    
    // Other sensors
    this.simulatedData.oilPressure = 2.5 + Math.sin(time) * 0.5;
    this.simulatedData.batteryVoltage = 12.6 + Math.sin(time * 0.1) * 0.4;
    this.simulatedData.maf = 15.2 + Math.sin(time * 0.5) * 5;
    this.simulatedData.throttlePosition = Math.max(0, this.simulatedData.speed / 120 * 100);
    this.simulatedData.o2Sensor = 0.45 + Math.sin(time * 2) * 0.2;
    this.simulatedData.mapSensor = 101 + Math.sin(time * 0.3) * 10;
    this.simulatedData.tpsSensor = this.simulatedData.throttlePosition;
    this.simulatedData.iatSensor = 25 + Math.sin(time * 0.2) * 10;
    this.simulatedData.injectorTime = 2.5 + this.simulatedData.throttlePosition / 100 * 5;
    this.simulatedData.ignitionTiming = 15 + Math.sin(time * 0.4) * 5;
    this.simulatedData.engineLoad = 25 + this.simulatedData.throttlePosition / 2;
  }

  updateDisplay() {
    // Update speed
    document.getElementById('speed-value').textContent = Math.round(this.simulatedData.speed);
    this.updateSpeedNeedle(this.simulatedData.speed);
    
    // Update RPM
    document.getElementById('rpm-value').textContent = Math.round(this.simulatedData.rpm);
    document.getElementById('rpm-fill').style.width = `${(this.simulatedData.rpm / 6000) * 100}%`;
    
    // Update temperature
    document.getElementById('temp-value').textContent = Math.round(this.simulatedData.temperature);
    this.updateTemperatureIndicator(this.simulatedData.temperature);
    
    // Update fuel
    document.getElementById('fuel-value').textContent = Math.round(this.simulatedData.fuel);
    document.getElementById('fuel-fill').style.width = `${this.simulatedData.fuel}%`;
    
    // Update odometer
    document.getElementById('odometer-value').textContent = Math.round(this.simulatedData.odometer);
    document.getElementById('trip-value').textContent = Math.round(this.simulatedData.trip);
    
    // Update sensors
    document.getElementById('oil-pressure').textContent = this.simulatedData.oilPressure.toFixed(1);
    document.getElementById('battery-voltage').textContent = this.simulatedData.batteryVoltage.toFixed(1);
    document.getElementById('maf-value').textContent = this.simulatedData.maf.toFixed(1);
    document.getElementById('throttle-pos').textContent = Math.round(this.simulatedData.throttlePosition);
    
    document.getElementById('o2-sensor').textContent = this.simulatedData.o2Sensor.toFixed(2);
    document.getElementById('map-sensor').textContent = Math.round(this.simulatedData.mapSensor);
    document.getElementById('tps-sensor').textContent = Math.round(this.simulatedData.tpsSensor);
    document.getElementById('iat-sensor').textContent = Math.round(this.simulatedData.iatSensor);
    
    document.getElementById('injector-time').textContent = this.simulatedData.injectorTime.toFixed(1);
    document.getElementById('ignition-timing').textContent = Math.round(this.simulatedData.ignitionTiming);
    document.getElementById('engine-load').textContent = Math.round(this.simulatedData.engineLoad);
    
    // Update data rate
    if (this.isConnected) {
      document.getElementById('data-rate').textContent = '10 dados/s';
    } else {
      document.getElementById('data-rate').textContent = '0 dados/s';
    }
  }

  updateSpeedNeedle(speed) {
    const needle = document.getElementById('speed-needle');
    const maxSpeed = 120;
    const angle = (speed / maxSpeed) * 180 - 90; // -90 to 90 degrees
    
    const x = 100 + 90 * Math.cos(angle * Math.PI / 180);
    const y = 110 - 90 * Math.sin(angle * Math.PI / 180);
    
    needle.setAttribute('d', `M 100 110 L ${x} ${y}`);
  }

  updateTemperatureIndicator(temp) {
    const indicator = document.getElementById('temp-indicator');
    let icon, color;
    
    if (temp < 80) {
      icon = 'fa-thermometer-empty';
      color = '#28a745';
    } else if (temp < 95) {
      icon = 'fa-thermometer-half';
      color = '#ffc107';
    } else {
      icon = 'fa-thermometer-full';
      color = '#dc3545';
    }
    
    indicator.innerHTML = `<i class="fas ${icon}" style="color: ${color};"></i>`;
  }

  async readErrorCodes() {
    if (!this.isConnected) {
      this.addLog('warning', 'Conecte-se ao sistema OBD primeiro');
      return;
    }
    
    this.addLog('info', 'Lendo códigos de erro...');
    
    // Simulate reading codes
    await this.delay(1500);
    
    // Randomly generate some error codes for demonstration
    this.errorCodes = [
      { code: 'P0171', description: 'System Too Lean (Bank 1)' },
      { code: 'P0442', description: 'Evaporative Emission Control System Leak Detected' }
    ];
    
    this.displayErrorCodes();
    this.addLog('success', `${this.errorCodes.length} códigos de erro encontrados`);
  }

  clearErrorCodes() {
    if (!this.isConnected) {
      this.addLog('warning', 'Conecte-se ao sistema OBD primeiro');
      return;
    }
    
    this.errorCodes = [];
    this.displayErrorCodes();
    this.addLog('success', 'Códigos de erro limpos');
  }

  displayErrorCodes() {
    const errorList = document.getElementById('error-codes-list');
    
    if (this.errorCodes.length === 0) {
      errorList.innerHTML = `
        <div class="no-errors">
          <i class="fas fa-check-circle" style="color: var(--success-color);"></i>
          Nenhum erro detectado
        </div>
      `;
    } else {
      errorList.innerHTML = this.errorCodes.map(error => `
        <div class="error-item">
          <span class="error-code">${error.code}</span>
          <span class="error-description">${error.description}</span>
        </div>
      `).join('');
    }
  }

  startLogging() {
    if (!this.isConnected) {
      this.addLog('warning', 'Conecte-se ao sistema OBD primeiro');
      return;
    }
    
    this.isLogging = true;
    document.getElementById('start-log-btn').classList.add('hidden');
    document.getElementById('stop-log-btn').classList.remove('hidden');
    this.addLog('info', 'Log de dados iniciado');
  }

  stopLogging() {
    this.isLogging = false;
    document.getElementById('start-log-btn').classList.remove('hidden');
    document.getElementById('stop-log-btn').classList.add('hidden');
    this.addLog('info', 'Log de dados parado');
  }

  addLog(type, message) {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const logEntry = {
      timestamp,
      type,
      message
    };
    
    this.logData.push(logEntry);
    
    // Update display
    const logContent = document.getElementById('log-content');
    const logElement = document.createElement('div');
    logElement.className = `log-entry ${type}`;
    logElement.innerHTML = `
      <span class="log-timestamp">[${timestamp}]</span> ${message}
    `;
    
    logContent.appendChild(logElement);
    logContent.scrollTop = logContent.scrollHeight;
    
    // Keep only last 100 entries in display
    while (logContent.children.length > 100) {
      logContent.removeChild(logContent.firstChild);
    }
  }

  downloadLog() {
    if (this.logData.length === 0) {
      this.addLog('warning', 'Nenhum dado para baixar');
      return;
    }
    
    const csvContent = this.generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `obd-log-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.addLog('success', 'Log baixado com sucesso');
  }

  generateCSV() {
    const headers = ['Timestamp', 'Type', 'Message', 'Speed', 'RPM', 'Temperature', 'Fuel', 'Oil Pressure', 'Battery Voltage'];
    const rows = this.logData.map(entry => [
      entry.timestamp,
      entry.type,
      entry.message,
      this.simulatedData.speed,
      this.simulatedData.rpm,
      this.simulatedData.temperature,
      this.simulatedData.fuel,
      this.simulatedData.oilPressure,
      this.simulatedData.batteryVoltage
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  clearLog() {
    this.logData = [];
    document.getElementById('log-content').innerHTML = '';
    this.addLog('info', 'Log limpo');
  }

  startClock() {
    setInterval(() => {
      const now = new Date();
      document.getElementById('timestamp').textContent = now.toLocaleTimeString('pt-BR');
    }, 1000);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize the OBD system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.obdSystem = new OBDSimulator();
});

// Handle page visibility to pause/resume data streaming
document.addEventListener('visibilitychange', () => {
  if (window.obdSystem) {
    if (document.hidden) {
      window.obdSystem.stopDataStreaming();
    } else if (window.obdSystem.isConnected) {
      window.obdSystem.startDataStreaming();
    }
  }
});