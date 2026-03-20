// Sistema OBD v3.0 - Trilhança
class OBDSimulator {
    constructor() {
        this.isConnected = false;
        this.connectionType = null;
        this.dataInterval = null;
        this.logData = [];
        this.isLogging = false;
        this.errorCodes = [];
        this.realtimeData = [];
        this.isRealtimePaused = false;
        this.settings = {
            connectionTimeout: 5000,
            readInterval: 1000,
            speedUnit: 'kmh',
            tempUnit: 'celsius',
            autoLog: true,
            exportFormat: 'csv'
        };
        
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
            engineLoad: 25,
            power: 85,
            torque: 120,
            consumption: 8.5,
            range: 450
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startClock();
        this.updateDisplay();
        this.loadSettings();
        this.initRealtimeChart();
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
        document.getElementById('scan-bluetooth')?.addEventListener('click', () => this.scanBluetooth());
        document.getElementById('connect-serial')?.addEventListener('click', () => this.connectSerial());
        document.getElementById('connect-wifi')?.addEventListener('click', () => this.connectWiFi());
        document.getElementById('start-simulator')?.addEventListener('click', () => this.startSimulator());

        // Diagnostic buttons
        document.getElementById('read-codes')?.addEventListener('click', () => this.readErrorCodes());
        document.getElementById('clear-codes')?.addEventListener('click', () => this.clearErrorCodes());

        // Logging buttons
        document.getElementById('start-logging')?.addEventListener('click', () => this.startLogging());
        document.getElementById('stop-logging')?.addEventListener('click', () => this.stopLogging());
        document.getElementById('export-log')?.addEventListener('click', () => this.exportLog());
        document.getElementById('clear-log')?.addEventListener('click', () => this.clearLog());

        // Realtime controls
        document.getElementById('pause-realtime')?.addEventListener('click', () => this.toggleRealtime());
        document.getElementById('clear-realtime')?.addEventListener('click', () => this.clearRealtime());

        // Settings
        document.getElementById('settings-btn')?.addEventListener('click', () => this.showSettings());
        document.getElementById('close-settings')?.addEventListener('click', () => this.hideSettings());
        document.getElementById('save-settings')?.addEventListener('click', () => this.saveSettings());
        document.getElementById('reset-settings')?.addEventListener('click', () => this.resetSettings());

        // Fullscreen
        document.getElementById('fullscreen-btn')?.addEventListener('click', () => this.toggleFullscreen());

        // Settings changes
        document.getElementById('speed-unit')?.addEventListener('change', (e) => this.updateSpeedUnit(e.target.value));
        document.getElementById('temp-unit')?.addEventListener('change', (e) => this.updateTempUnit(e.target.value));
        document.getElementById('export-format')?.addEventListener('change', (e) => this.settings.exportFormat = e.target.value);
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.connectionType = tabName;
    }

    switchDiagnosticTab(tabName) {
        // Update diagnostic tab buttons
        document.querySelectorAll('.diag-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-diag="${tabName}"]`).classList.add('active');

        // Update diagnostic content
        document.querySelectorAll('.diag-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(`${tabName}-pane`).classList.add('active');
    }

    async scanBluetooth() {
        this.showLoading(true, 'Escaneando dispositivos Bluetooth...');
        
        // Simulate Bluetooth scanning
        setTimeout(() => {
            const devices = [
                { name: 'Trilhança OBD', id: 'OBD001' },
                { name: 'Carro Diagnóstico', id: 'OBD002' }
            ];
            
            this.updateBluetoothDevices(devices);
            this.showLoading(false);
        }, 2000);
    }

    updateBluetoothDevices(devices) {
        const deviceList = document.getElementById('bluetooth-devices');
        deviceList.innerHTML = '';
        
        devices.forEach(device => {
            const deviceItem = document.createElement('div');
            deviceItem.className = 'device-item';
            deviceItem.innerHTML = `
                <i class="fas fa-car"></i>
                <span>${device.name}</span>
                <button class="btn btn-sm btn-primary" onclick="obd.connectToDevice('${device.id}')">
                    <i class="fas fa-link"></i>
                </button>
            `;
            deviceList.appendChild(deviceItem);
        });
    }

    async connectSerial() {
        const port = document.getElementById('serial-port').value;
        const baudRate = document.getElementById('baud-rate').value;
        
        if (!port) {
            this.showError('Selecione uma porta serial');
            return;
        }

        this.showLoading(true, 'Conectando via porta serial...');
        
        // Simulate connection
        setTimeout(() => {
            this.isConnected = true;
            this.updateConnectionStatus(true);
            this.showLoading(false);
            this.startDataStream();
        }, 1500);
    }

    async connectWiFi() {
        const ip = document.getElementById('wifi-ip').value;
        const port = document.getElementById('wifi-port').value;
        
        if (!ip || !port) {
            this.showError('Preencha IP e porta');
            return;
        }

        this.showLoading(true, 'Conectando via WiFi...');
        
        // Simulate connection
        setTimeout(() => {
            this.isConnected = true;
            this.updateConnectionStatus(true);
            this.showLoading(false);
            this.startDataStream();
        }, 2000);
    }

    startSimulator() {
        this.showLoading(true, 'Iniciando simulador...');
        
        setTimeout(() => {
            this.isConnected = true;
            this.connectionType = 'simulator';
            this.updateConnectionStatus(true);
            this.showLoading(false);
            this.startDataStream();
            this.showSuccess('Simulador iniciado com sucesso!');
        }, 1000);
    }

    startDataStream() {
        if (this.dataInterval) {
            clearInterval(this.dataInterval);
        }

        this.dataInterval = setInterval(() => {
            this.updateSimulatedData();
        }, this.settings.readInterval);
    }

    updateSimulatedData() {
        // Simulate realistic data changes
        const data = this.simulatedData;
        
        // Speed simulation
        if (data.speed < 120) {
            data.speed += Math.random() * 5;
        } else {
            data.speed -= Math.random() * 3;
        }
        
        // RPM simulation
        const targetRPM = 600 + (data.speed * 50);
        if (data.rpm < targetRPM) {
            data.rpm += Math.random() * 100;
        } else {
            data.rpm -= Math.random() * 50;
        }
        
        // Temperature simulation
        data.temperature = 85 + Math.sin(Date.now() / 10000) * 10;
        
        // Fuel simulation
        if (Math.random() > 0.95) {
            data.fuel -= 0.5;
        }
        
        // Engine load simulation
        data.engineLoad = 10 + (data.rpm / 100) * 60;
        
        // Throttle position
        data.throttlePosition = (data.speed / 120) * 100;
        
        // Update display
        this.updateDisplay();
        
        // Log data if logging
        if (this.isLogging) {
            this.logDataPoint(data);
        }
        
        // Update realtime chart
        if (!this.isRealtimePaused) {
            this.updateRealtimeChart(data);
        }
    }

    updateDisplay() {
        const data = this.simulatedData;
        
        // Update gauges
        this.updateGauge('speed-gauge', 'speed-fill', 'speed-needle', data.speed, 120);
        this.updateGauge('rpm-gauge', 'rpm-fill', 'rpm-needle', data.rpm, 8000);
        this.updateGauge('temp-gauge', 'temp-fill', 'temp-needle', data.temperature, 130);
        
        // Update fuel
        this.updateFuelGauge(data.fuel);
        
        // Update odometer
        this.updateOdometer(data.odometer);
        
        // Update engine status
        this.updateEngineStatus(data);
        
        // Update sensors
        this.updateSensors(data);
        
        // Update performance
        this.updatePerformance(data);
    }

    updateGauge(gaugeId, fillId, needleId, value, maxValue) {
        const percentage = Math.min(value / maxValue, 1);
        const rotation = (percentage * 270) - 135;
        
        document.getElementById(fillId).style.setProperty('--gauge-percent', `${percentage * 100}%`);
        document.getElementById(needleId).style.transform = `translate(-50%, -100%) rotate(${rotation}deg)`;
        
        // Update value display
        const valueElement = document.getElementById(gaugeId.replace('-gauge', '-value'));
        if (valueElement) {
            valueElement.textContent = Math.round(value);
        }
    }

    updateFuelGauge(percentage) {
        document.getElementById('fuel-fill').style.height = `${percentage}%`;
        document.getElementById('fuel-value').textContent = `${Math.round(percentage)}%`;
    }

    updateOdometer(km) {
        document.getElementById('odometer-value').textContent = km.toLocaleString('pt-BR');
    }

    updateEngineStatus(data) {
        document.getElementById('engine-load-fill').style.width = `${data.engineLoad}%`;
        document.getElementById('engine-load-value').textContent = `${Math.round(data.engineLoad)}%`;
        
        document.getElementById('throttle-fill').style.width = `${data.throttlePosition}%`;
        document.getElementById('throttle-value').textContent = `${Math.round(data.throttlePosition)}%`;
        
        document.getElementById('injector-value').textContent = `${data.injectorTime.toFixed(1)}ms`;
    }

    updateSensors(data) {
        document.getElementById('maf-value').textContent = `${data.maf.toFixed(1)} g/s`;
        document.getElementById('o2-value').textContent = `${data.o2Sensor.toFixed(2)}V`;
        document.getElementById('map-value').textContent = `${data.mapSensor} kPa`;
        document.getElementById('tps-value').textContent = `${data.tpsSensor}%`;
        document.getElementById('iat-value').textContent = `${data.iatSensor}°C`;
        document.getElementById('oil-pressure-value').textContent = `${data.oilPressure.toFixed(1)} bar`;
    }

    updatePerformance(data) {
        document.getElementById('power-value').textContent = `${Math.round(data.power)} HP`;
        document.getElementById('torque-value').textContent = `${Math.round(data.torque)} Nm`;
        document.getElementById('consumption-value').textContent = `${data.consumption.toFixed(1)} L/100km`;
        document.getElementById('range-value').textContent = `${Math.round(data.range)} km`;
    }

    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connection-status');
        const statusText = connected ? 'Conectado' : 'Desconectado';
        const statusClass = connected ? 'status-connected' : 'status-disconnected';
        
        statusElement.className = statusClass;
        statusElement.innerHTML = `
            <i class="fas fa-circle"></i>
            ${statusText}
        `;
    }

    readErrorCodes() {
        this.showLoading(true, 'Lendo códigos de erro...');
        
        setTimeout(() => {
            // Simulate error codes
            this.errorCodes = [
                { code: 'P0101', description: 'Mass Air Flow Circuit Range/Performance Problem', severity: 'warning' },
                { code: 'P0300', description: 'Random/Multiple Cylinder Misfire Detected', severity: 'error' }
            ];
            
            this.updateErrorCodes();
            this.showLoading(false);
            this.showSuccess('Códigos de erro lidos com sucesso!');
        }, 2000);
    }

    clearErrorCodes() {
        this.showLoading(true, 'Limpando códigos de erro...');
        
        setTimeout(() => {
            this.errorCodes = [];
            this.updateErrorCodes();
            this.showLoading(false);
            this.showSuccess('Códigos de erro limpos com sucesso!');
        }, 1500);
    }

    updateErrorCodes() {
        const codesList = document.getElementById('error-codes');
        
        if (this.errorCodes.length === 0) {
            codesList.innerHTML = `
                <div class="no-codes">
                    <i class="fas fa-check-circle"></i>
                    <p>Nenhum código de erro detectado</p>
                </div>
            `;
        } else {
            codesList.innerHTML = this.errorCodes.map(code => `
                <div class="code-item ${code.severity}">
                    <div class="code-header">
                        <span class="code-number">${code.code}</span>
                        <span class="code-severity ${code.severity}">
                            <i class="fas fa-${code.severity === 'error' ? 'exclamation-triangle' : 'exclamation-circle'}"></i>
                            ${code.severity === 'error' ? 'Erro' : 'Aviso'}
                        </span>
                    </div>
                    <div class="code-description">${code.description}</div>
                </div>
            `).join('');
        }
    }

    startLogging() {
        if (this.isLogging) return;
        
        this.isLogging = true;
        this.logStartTime = Date.now();
        this.updateLoggingControls();
        
        if (this.settings.autoLog) {
            this.showSuccess('Gravação de dados iniciada!');
        }
    }

    stopLogging() {
        if (!this.isLogging) return;
        
        this.isLogging = false;
        this.updateLoggingControls();
        this.showSuccess('Gravação de dados parada!');
    }

    logDataPoint(data) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            speed: data.speed,
            rpm: data.rpm,
            temperature: data.temperature,
            fuel: data.fuel,
            engineLoad: data.engineLoad
        };
        
        this.logData.push(logEntry);
        this.updateLogDisplay();
    }

    updateLogDisplay() {
        const logCount = document.getElementById('log-count');
        const logDuration = document.getElementById('log-duration');
        const logEntries = document.getElementById('log-entries');
        
        logCount.textContent = this.logData.length;
        
        if (this.logStartTime) {
            const duration = Date.now() - this.logStartTime;
            const hours = Math.floor(duration / 3600000);
            const minutes = Math.floor((duration % 3600000) / 60000);
            const seconds = Math.floor((duration % 60000) / 1000);
            
            logDuration.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
        
        if (this.logData.length === 0) {
            logEntries.innerHTML = `
                <div class="no-logs">
                    <i class="fas fa-info-circle"></i>
                    <p>Nenhum registro de dados</p>
                </div>
            `;
        } else {
            const recentLogs = this.logData.slice(-10).reverse();
            logEntries.innerHTML = recentLogs.map(log => `
                <div class="log-entry">
                    <span class="log-time">${new Date(log.timestamp).toLocaleTimeString('pt-BR')}</span>
                    <span class="log-data">
                        Vel: ${Math.round(log.speed)}km/h | 
                        RPM: ${Math.round(log.rpm)} | 
                        Temp: ${Math.round(log.temperature)}°C
                    </span>
                </div>
            `).join('');
        }
    }

    updateLoggingControls() {
        const startBtn = document.getElementById('start-logging');
        const stopBtn = document.getElementById('stop-logging');
        
        if (this.isLogging) {
            startBtn.disabled = true;
            stopBtn.disabled = false;
        } else {
            startBtn.disabled = false;
            stopBtn.disabled = true;
        }
    }

    exportLog() {
        if (this.logData.length === 0) {
            this.showError('Nenhum dado para exportar');
            return;
        }
        
        let content;
        const filename = `obd_log_${new Date().toISOString().split('T')[0]}`;
        
        switch (this.settings.exportFormat) {
            case 'csv':
                content = this.exportToCSV();
                filename += '.csv';
                break;
            case 'json':
                content = JSON.stringify(this.logData, null, 2);
                filename += '.json';
                break;
            case 'xml':
                content = this.exportToXML();
                filename += '.xml';
                break;
        }
        
        this.downloadFile(content, filename);
        this.showSuccess(`Dados exportados como ${filename}`);
    }

    exportToCSV() {
        const headers = ['Timestamp', 'Speed (km/h)', 'RPM', 'Temperature (°C)', 'Fuel (%)', 'Engine Load (%)'];
        const rows = this.logData.map(log => [
            log.timestamp,
            log.speed,
            log.rpm,
            log.temperature,
            log.fuel,
            log.engineLoad
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    exportToXML() {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<obd_logs>\n';
        
        this.logData.forEach(log => {
            xml += `  <log_entry>\n`;
            xml += `    <timestamp>${log.timestamp}</timestamp>\n`;
            xml += `    <speed>${log.speed}</speed>\n`;
            xml += `    <rpm>${log.rpm}</rpm>\n`;
            xml += `    <temperature>${log.temperature}</temperature>\n`;
            xml += `    <fuel>${log.fuel}</fuel>\n`;
            xml += `    <engine_load>${log.engineLoad}</engine_load>\n`;
            xml += `  </log_entry>\n`;
        });
        
        xml += '</obd_logs>';
        return xml;
    }

    downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    clearLog() {
        if (confirm('Tem certeza que deseja limpar todos os registros?')) {
            this.logData = [];
            this.updateLogDisplay();
            this.showSuccess('Registros limpos com sucesso!');
        }
    }

    initRealtimeChart() {
        const canvas = document.getElementById('realtime-canvas');
        if (!canvas) return;
        
        this.chartContext = canvas.getContext('2d');
        this.chartData = [];
        this.maxChartPoints = 50;
    }

    updateRealtimeChart(data) {
        if (!this.chartContext) return;
        
        this.chartData.push({
            time: Date.now(),
            speed: data.speed,
            rpm: data.rpm
        });
        
        if (this.chartData.length > this.maxChartPoints) {
            this.chartData.shift();
        }
        
        this.drawChart();
    }

    drawChart() {
        const ctx = this.chartContext;
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        // Draw grid
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 5; i++) {
            const y = (height / 5) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Draw data
        if (this.chartData.length < 2) return;
        
        // Speed line
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        this.chartData.forEach((point, index) => {
            const x = (index / (this.maxChartPoints - 1)) * width;
            const y = height - (point.speed / 120) * height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // RPM line
        ctx.strokeStyle = '#28a745';
        ctx.beginPath();
        
        this.chartData.forEach((point, index) => {
            const x = (index / (this.maxChartPoints - 1)) * width;
            const y = height - (point.rpm / 8000) * height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
    }

    toggleRealtime() {
        this.isRealtimePaused = !this.isRealtimePaused;
        const btn = document.getElementById('pause-realtime');
        
        if (this.isRealtimePaused) {
            btn.innerHTML = '<i class="fas fa-play"></i> Continuar';
            btn.classList.remove('btn-danger');
            btn.classList.add('btn-success');
        } else {
            btn.innerHTML = '<i class="fas fa-pause"></i> Pausar';
            btn.classList.remove('btn-success');
            btn.classList.add('btn-danger');
        }
    }

    clearRealtime() {
        this.chartData = [];
        this.drawChart();
        this.showSuccess('Gráfico limpo!');
    }

    showSettings() {
        document.getElementById('settings-modal').classList.add('active');
    }

    hideSettings() {
        document.getElementById('settings-modal').classList.remove('active');
    }

    loadSettings() {
        const saved = localStorage.getItem('obd_settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
            this.applySettings();
        }
    }

    saveSettings() {
        localStorage.setItem('obd_settings', JSON.stringify(this.settings));
        this.showSuccess('Configurações salvas com sucesso!');
        this.hideSettings();
    }

    resetSettings() {
        if (confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
            this.settings = {
                connectionTimeout: 5000,
                readInterval: 1000,
                speedUnit: 'kmh',
                tempUnit: 'celsius',
                autoLog: true,
                exportFormat: 'csv'
            };
            this.applySettings();
            this.showSuccess('Configurações restauradas com sucesso!');
        }
    }

    applySettings() {
        document.getElementById('connection-timeout').value = this.settings.connectionTimeout;
        document.getElementById('read-interval').value = this.settings.readInterval;
        document.getElementById('speed-unit').value = this.settings.speedUnit;
        document.getElementById('temp-unit').value = this.settings.tempUnit;
        document.getElementById('export-format').value = this.settings.exportFormat;
        document.getElementById('auto-log').checked = this.settings.autoLog;
    }

    updateSpeedUnit(unit) {
        this.settings.speedUnit = unit;
        // Update display logic for unit conversion
        this.updateDisplay();
    }

    updateTempUnit(unit) {
        this.settings.tempUnit = unit;
        // Update display logic for unit conversion
        this.updateDisplay();
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    startClock() {
        setInterval(() => {
            const now = new Date();
            // Update any clock displays if needed
        }, 1000);
    }

    showLoading(show, message = 'Processando...') {
        const overlay = document.getElementById('loading');
        const textElement = overlay.querySelector('p');
        
        if (show) {
            overlay.classList.add('active');
            textElement.textContent = message;
        } else {
            overlay.classList.remove('active');
        }
    }

    showSuccess(message) {
        // Create success notification
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            ${message}
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showError(message) {
        // Create error notification
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            ${message}
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize the OBD system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.obd = new OBDSimulator();
});
