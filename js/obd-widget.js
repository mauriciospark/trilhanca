// OBD Widget para Mapa - Sistema Compacto de Monitoramento
class OBDWidget {
    constructor() {
        this.isConnected = false;
        this.data = {
            speed: 0,
            rpm: 0,
            temperature: 0,
            fuel: 0,
            errors: []
        };
        this.updateInterval = null;
        this.simulationInterval = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.startSimulation();
    }

    bindEvents() {
        // Botão de conectar/desconectar
        document.getElementById('obd-toggle')?.addEventListener('click', () => {
            this.toggleConnection();
        });

        // Botão de tela cheia
        document.getElementById('obd-fullscreen')?.addEventListener('click', () => {
            this.openFullscreen();
        });
    }

    toggleConnection() {
        const btn = document.getElementById('obd-toggle');
        const statusEl = document.getElementById('obd-connection');
        const indicator = statusEl?.querySelector('.status-indicator');
        const text = statusEl?.querySelector('.status-text');

        if (this.isConnected) {
            // Desconectar
            this.disconnect();
            btn.textContent = 'Conectar';
            indicator?.classList.remove('online');
            text.textContent = 'Offline';
        } else {
            // Conectar
            this.connect();
            btn.textContent = 'Desconectar';
            indicator?.classList.add('online');
            text.textContent = 'Online';
        }
    }

    connect() {
        this.isConnected = true;
        this.startDataUpdates();
        this.showNotification('Conectado ao sistema OBD', 'success');
    }

    disconnect() {
        this.isConnected = false;
        this.stopDataUpdates();
        this.showNotification('Desconectado do sistema OBD', 'info');
    }

    startDataUpdates() {
        this.updateInterval = setInterval(() => {
            this.updateDisplay();
        }, 1000);
    }

    stopDataUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    startSimulation() {
        // Simulação de dados realistas
        this.simulationInterval = setInterval(() => {
            if (this.isConnected) {
                this.data.speed = Math.max(0, this.data.speed + (Math.random() - 0.5) * 10);
                this.data.rpm = Math.max(800, Math.min(6000, this.data.rpm + (Math.random() - 0.5) * 200));
                this.data.temperature = Math.max(70, Math.min(110, this.data.temperature + (Math.random() - 0.5) * 2));
                this.data.fuel = Math.max(0, this.data.fuel - Math.random() * 0.1);
                
                // Simular erros aleatórios
                if (Math.random() < 0.01) {
                    this.addRandomError();
                }
            }
        }, 2000);
    }

    updateDisplay() {
        // Atualizar velocidade
        const speedEl = document.getElementById('obd-speed');
        if (speedEl) {
            const speed = Math.round(this.data.speed);
            speedEl.textContent = `${speed} km/h`;
            speedEl.className = 'metric-value';
            if (speed > 120) speedEl.classList.add('danger');
            else if (speed > 80) speedEl.classList.add('warning');
        }

        // Atualizar RPM
        const rpmEl = document.getElementById('obd-rpm');
        if (rpmEl) {
            const rpm = Math.round(this.data.rpm);
            rpmEl.textContent = rpm;
            rpmEl.className = 'metric-value';
            if (rpm > 5000) rpmEl.classList.add('danger');
            else if (rpm > 3500) rpmEl.classList.add('warning');
        }

        // Atualizar temperatura
        const tempEl = document.getElementById('obd-temp');
        if (tempEl) {
            const temp = Math.round(this.data.temperature);
            tempEl.textContent = `${temp}°C`;
            tempEl.className = 'metric-value';
            if (temp > 100) tempEl.classList.add('danger');
            else if (temp > 90) tempEl.classList.add('warning');
        }

        // Atualizar combustível
        const fuelEl = document.getElementById('obd-fuel');
        if (fuelEl) {
            const fuel = Math.round(this.data.fuel);
            fuelEl.textContent = `${fuel}%`;
            fuelEl.className = 'metric-value';
            if (fuel < 15) fuelEl.classList.add('danger');
            else if (fuel < 30) fuelEl.classList.add('warning');
        }

        // Atualizar contador de erros
        this.updateErrorCount();
    }

    updateErrorCount() {
        const errorCountEl = document.getElementById('error-count');
        const errorContainer = document.getElementById('obd-errors');
        const errorDiv = errorContainer?.querySelector('.error-count');
        
        if (errorCountEl && errorDiv) {
            const count = this.data.errors.length;
            errorCountEl.textContent = count === 1 ? '1 erro' : `${count} erros`;
            
            if (count === 0) {
                errorDiv.classList.add('no-errors');
            } else {
                errorDiv.classList.remove('no-errors');
            }
        }
    }

    addRandomError() {
        const errorCodes = [
            { code: 'P0300', description: 'Falha de ignição aleatória' },
            { code: 'P0440', description: 'Sistema de evaporação' },
            { code: 'P0171', description: 'Sistema muito pobre' },
            { code: 'P0136', description: 'Sensor O₂' }
        ];
        
        const randomError = errorCodes[Math.floor(Math.random() * errorCodes.length)];
        this.data.errors.push({
            ...randomError,
            timestamp: new Date().toISOString()
        });
        
        this.showNotification(`Erro OBD: ${randomError.code} - ${randomError.description}`, 'warning');
    }

    clearErrors() {
        this.data.errors = [];
        this.updateErrorCount();
        this.showNotification('Códigos de erro limpos', 'success');
    }

    openFullscreen() {
        // Abrir tela OBD em nova janela
        window.open('./Obd.html', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    }

    showNotification(message, type = 'info') {
        // Criar notificação simples
        const notification = document.createElement('div');
        notification.className = `obd-notification obd-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            background: ${type === 'success' ? '#28a745' : type === 'warning' ? '#ff8a34' : '#007bff'};
            color: white;
            border-radius: 6px;
            font-size: 0.9rem;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Método para integração com o mapa
    getCurrentData() {
        return {
            ...this.data,
            isConnected: this.isConnected,
            timestamp: new Date().toISOString()
        };
    }

    destroy() {
        this.stopDataUpdates();
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
        }
    }
}

// Adicionar animações CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.obdWidget = new OBDWidget();
});

// Exportar para uso global
window.OBDWidget = OBDWidget;
