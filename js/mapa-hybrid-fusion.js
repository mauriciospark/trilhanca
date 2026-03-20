// ========================
   MAPA HYBRID FUSION - TRILHANÇA v2.1
   Sistema inteligente que funde online e offline com transição suave
   ========================

class MapaHybridFusion {
    constructor() {
        this.map = null;
        this.isOnline = navigator.onLine;
        this.currentMode = 'hybrid'; // online, offline, hybrid
        this.onlineLayer = null;
        this.offlineLayer = null;
        this.tileCache = new Map();
        this.connectionMonitor = null;
        this.syncManager = null;
        this.performanceMonitor = null;
        
        // Configurações de tiles
        this.tileServers = {
            online: {
                normal: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                attribution: '© OpenStreetMap contributors'
            },
            offline: {
                normal: 'mbtiles://trilhanca_tiles_normal',
                satellite: 'mbtiles://trilhanca_tiles_satellite',
                attribution: '© TRILHANÇA Offline Maps'
            }
        };
        
        // Estado da fusão
        this.fusionState = {
            onlineQuality: 'high',
            offlineQuality: 'medium',
            autoSwitch: true,
            cacheSize: 1000, // tiles
            syncInterval: 30000, // 30 segundos
            lastSync: null,
            pendingUpdates: []
        };
        
        this.init();
    }

    // Inicializar sistema híbrido
    async init() {
        try {
            console.log('🔄 Inicializando Mapa Hybrid Fusion...');
            
            // Iniciar monitoramento de conexão
            this.startConnectionMonitoring();
            
            // Iniciar gerenciador de sincronização
            this.syncManager = new HybridSyncManager(this);
            
            // Iniciar monitor de performance
            this.performanceMonitor = new HybridPerformanceMonitor(this);
            
            // Configurar handlers de eventos
            this.setupEventHandlers();
            
            // Carregar configurações salvas
            this.loadSettings();
            
            console.log('✅ Mapa Hybrid Fusion inicializado com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
        }
    }

    // Iniciar monitoramento de conexão
    startConnectionMonitoring() {
        this.connectionMonitor = new ConnectionMonitor();
        
        this.connectionMonitor.on('online', () => {
            this.handleConnectionChange(true);
        });
        
        this.connectionMonitor.on('offline', () => {
            this.handleConnectionChange(false);
        });
        
        this.connectionMonitor.on('quality-change', (quality) => {
            this.handleQualityChange(quality);
        });
        
        this.connectionMonitor.start();
    }

    // Configurar handlers de eventos
    setupEventHandlers() {
        // Eventos de navegador
        window.addEventListener('online', () => this.handleConnectionChange(true));
        window.addEventListener('offline', () => this.handleConnectionChange(false));
        
        // Eventos de visibilidade
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseBackgroundTasks();
            } else {
                this.resumeBackgroundTasks();
            }
        });
        
        // Eventos de bateria
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                battery.addEventListener('levelchange', () => {
                    this.handleBatteryChange(battery.level);
                });
            });
        }
    }

    // Criar mapa com fusão inteligente
    async createHybridMap(containerId) {
        try {
            console.log('🗺️ Criando mapa híbrido...');
            
            // Criar instância do mapa
            this.map = L.map(containerId, {
                center: [-23.5505, -46.6333],
                zoom: 13,
                zoomControl: true,
                attributionControl: false
            });

            // Adicionar layers de fusão
            await this.setupFusionLayers();
            
            // Configurar controles personalizados
            this.setupHybridControls();
            
            // Iniciar modo híbrido
            this.startHybridMode();
            
            console.log('✅ Mapa híbrido criado com sucesso!');
            return this.map;
            
        } catch (error) {
            console.error('❌ Erro ao criar mapa híbrido:', error);
            throw error;
        }
    }

    // Configurar layers de fusão
    async setupFusionLayers() {
        // Layer online (prioridade quando online)
        this.onlineLayer = L.tileLayer(this.tileServers.online.normal, {
            maxZoom: 18,
            minZoom: 1,
            attribution: this.tileServers.online.attribution,
            updateWhenZooming: false,
            updateWhenIdle: true,
            keepBuffer: 4,
            className: 'online-tiles'
        });

        // Layer offline (fallback quando offline)
        this.offlineLayer = L.tileLayer(this.tileServers.offline.normal, {
            maxZoom: 15,
            minZoom: 1,
            attribution: this.tileServers.offline.attribution,
            updateWhenZooming: false,
            updateWhenIdle: true,
            keepBuffer: 2,
            className: 'offline-tiles'
        });

        // Adicionar layer inicial baseado no status
        const initialLayer = this.isOnline ? this.onlineLayer : this.offlineLayer;
        initialLayer.addTo(this.map);

        // Configurar interceptador de tiles
        this.setupTileInterceptor();
    }

    // Configurar interceptador de tiles inteligente
    setupTileInterceptor() {
        const originalGetTileUrl = L.TileLayer.prototype.getTileUrl;
        
        L.TileLayer.prototype.getTileUrl = function(coords) {
            const tileUrl = originalGetTileUrl.call(this, coords);
            
            // Adicionar lógica de fusão
            if (window.mapaFusion) {
                return window.mapaFusion.processTileRequest(tileUrl, coords, this);
            }
            
            return tileUrl;
        };
    }

    // Processar requisição de tile com fusão
    async processTileRequest(tileUrl, coords, layer) {
        const cacheKey = `${coords.z}/${coords.x}/${coords.y}`;
        
        // Verificar cache
        if (this.tileCache.has(cacheKey)) {
            return this.tileCache.get(cacheKey);
        }

        // Lógica de fusão baseada no modo
        if (this.currentMode === 'hybrid') {
            return this.processHybridTile(tileUrl, coords, layer);
        } else if (this.currentMode === 'offline') {
            return this.processOfflineTile(tileUrl, coords);
        } else {
            return this.processOnlineTile(tileUrl, coords);
        }
    }

    // Processar tile no modo híbrido
    async processHybridTile(tileUrl, coords, layer) {
        try {
            // Tentar online primeiro se tiver conexão boa
            if (this.isOnline && this.connectionQuality === 'good') {
                const onlineTile = await this.fetchOnlineTile(tileUrl);
                if (onlineTile) {
                    this.cacheTile(coords, onlineTile);
                    return onlineTile;
                }
            }
            
            // Fallback para offline
            const offlineTile = await this.fetchOfflineTile(coords);
            if (offlineTile) {
                this.cacheTile(coords, offlineTile);
                return offlineTile;
            }
            
            // Último recurso: placeholder
            return this.generatePlaceholderTile(coords);
            
        } catch (error) {
            console.warn('Erro no processamento híbrido de tile:', error);
            return this.generatePlaceholderTile(coords);
        }
    }

    // Buscar tile online
    async fetchOnlineTile(tileUrl) {
        try {
            const response = await fetch(tileUrl, {
                signal: AbortSignal.timeout(3000) // 3 segundos timeout
            });
            
            if (response.ok) {
                const blob = await response.blob();
                return URL.createObjectURL(blob);
            }
        } catch (error) {
            console.warn('Falha ao buscar tile online:', error);
        }
        
        return null;
    }

    // Buscar tile offline
    async fetchOfflineTile(coords) {
        try {
            // Simulação - em produção seria busca no banco MBTiles
            const offlineUrl = this.tileServers.offline.normal
                .replace('{z}', coords.z)
                .replace('{x}', coords.x)
                .replace('{y}', coords.y);
            
            // Verificar se existe tile offline
            if (await this.offlineTileExists(coords)) {
                return offlineUrl;
            }
        } catch (error) {
            console.warn('Falha ao buscar tile offline:', error);
        }
        
        return null;
    }

    // Verificar se tile offline existe
    async offlineTileExists(coords) {
        // Simulação - em produção verificaria no banco de dados
        return coords.z <= 15; // Apenas até zoom 15 offline
    }

    // Gerar tile placeholder
    generatePlaceholderTile(coords) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        
        const ctx = canvas.getContext('2d');
        
        // Fundo baseado no modo
        ctx.fillStyle = this.currentMode === 'offline' ? '#2d3748' : '#1a202c';
        ctx.fillRect(0, 0, 256, 256);
        
        // Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 256; i += 32) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 256);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(256, i);
            ctx.stroke();
        }
        
        // Texto informativo
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Tile ${coords.z}/${coords.x}/${coords.y}`, 128, 128);
        
        return canvas.toDataURL();
    }

    // Cache de tiles
    cacheTile(coords, tileUrl) {
        const cacheKey = `${coords.z}/${coords.x}/${coords.y}`;
        
        // Limitar tamanho do cache
        if (this.tileCache.size >= this.fusionState.cacheSize) {
            const firstKey = this.tileCache.keys().next().value;
            this.tileCache.delete(firstKey);
        }
        
        this.tileCache.set(cacheKey, tileUrl);
        
        // Agendar cleanup do cache
        setTimeout(() => {
            if (this.tileCache.has(cacheKey)) {
                URL.revokeObjectURL(this.tileCache.get(cacheKey));
                this.tileCache.delete(cacheKey);
            }
        }, 300000); // 5 minutos
    }

    // Iniciar modo híbrido
    startHybridMode() {
        this.currentMode = 'hybrid';
        this.updateLayerVisibility();
        this.updateUI();
        console.log('🔄 Modo híbrido iniciado');
    }

    // Alternar para modo online
    switchToOnlineMode() {
        this.currentMode = 'online';
        this.updateLayerVisibility();
        this.updateUI();
        this.syncManager.syncPendingData();
        console.log('🌐 Mudado para modo online');
    }

    // Alternar para modo offline
    switchToOfflineMode() {
        this.currentMode = 'offline';
        this.updateLayerVisibility();
        this.updateUI();
        console.log('📱 Mudado para modo offline');
    }

    // Atualizar visibilidade dos layers
    updateLayerVisibility() {
        if (!this.map) return;

        // Remover layers existentes
        this.map.eachLayer(layer => {
            if (layer instanceof L.TileLayer) {
                this.map.removeLayer(layer);
            }
        });

        // Adicionar layer baseado no modo
        let activeLayer;
        
        switch (this.currentMode) {
            case 'online':
                activeLayer = this.onlineLayer;
                break;
            case 'offline':
                activeLayer = this.offlineLayer;
                break;
            case 'hybrid':
                activeLayer = this.isOnline ? this.onlineLayer : this.offlineLayer;
                break;
        }

        if (activeLayer) {
            activeLayer.addTo(this.map);
        }
    }

    // Configurar controles híbridos
    setupHybridControls() {
        // Controle de modo
        const modeControl = L.control({ position: 'topright' });
        
        modeControl.onAdd = () => {
            const div = L.DomUtil.create('div', 'hybrid-mode-control');
            div.innerHTML = `
                <div class="mode-buttons">
                    <button class="mode-btn ${this.currentMode === 'online' ? 'active' : ''}" data-mode="online" title="Online">
                        🌐
                    </button>
                    <button class="mode-btn ${this.currentMode === 'offline' ? 'active' : ''}" data-mode="offline" title="Offline">
                        📱
                    </button>
                    <button class="mode-btn ${this.currentMode === 'hybrid' ? 'active' : ''}" data-mode="hybrid" title="Híbrido">
                        🔄
                    </button>
                </div>
                <div class="connection-status">
                    <span class="status-indicator ${this.isOnline ? 'online' : 'offline'}"></span>
                    <span class="status-text">${this.isOnline ? 'Online' : 'Offline'}</span>
                </div>
            `;
            
            // Event listeners
            div.querySelectorAll('.mode-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const mode = e.target.dataset.mode;
                    this.switchMode(mode);
                });
            });
            
            return div;
        };
        
        modeControl.addTo(this.map);

        // Controle de qualidade
        const qualityControl = L.control({ position: 'topright' });
        
        qualityControl.onAdd = () => {
            const div = L.DomUtil.create('div', 'quality-control');
            div.innerHTML = `
                <div class="quality-info">
                    <span class="quality-label">Qualidade:</span>
                    <span class="quality-value">${this.connectionQuality || 'Desconhecida'}</span>
                </div>
                <div class="cache-info">
                    <span class="cache-label">Cache:</span>
                    <span class="cache-value">${this.tileCache.size} tiles</span>
                </div>
            `;
            
            return div;
        };
        
        qualityControl.addTo(this.map);
    }

    // Alternar modo
    switchMode(mode) {
        if (this.currentMode === mode) return;
        
        this.currentMode = mode;
        this.updateLayerVisibility();
        this.updateUI();
        
        // Salvar preferência
        this.saveSettings();
        
        console.log(`🔄 Modo alterado para: ${mode}`);
    }

    // Lidar com mudança de conexão
    handleConnectionChange(isOnline) {
        const wasOnline = this.isOnline;
        this.isOnline = isOnline;
        
        console.log(`🌐 Conexão alterada: ${wasOnline} → ${isOnline}`);
        
        if (this.currentMode === 'hybrid') {
            this.updateLayerVisibility();
        }
        
        // Sincronizar dados se voltou online
        if (isOnline && !wasOnline) {
            this.syncManager.syncPendingData();
        }
        
        this.updateUI();
    }

    // Lidar com mudança de qualidade
    handleQualityChange(quality) {
        this.connectionQuality = quality;
        
        // Ajustar comportamento baseado na qualidade
        if (quality === 'poor') {
            this.fusionState.onlineQuality = 'low';
            this.reduceOnlineUsage();
        } else if (quality === 'good') {
            this.fusionState.onlineQuality = 'high';
            this.enableFullOnlineUsage();
        }
        
        this.updateUI();
    }

    // Reduzir uso online quando conexão ruim
    reduceOnlineUsage() {
        if (this.currentMode === 'online' && this.fusionState.autoSwitch) {
            this.switchToHybridMode();
        }
        
        // Reduzir cache
        this.fusionState.cacheSize = 500;
        this.cleanupCache();
    }

    // Habilitar uso online completo
    enableFullOnlineUsage() {
        this.fusionState.cacheSize = 1000;
        
        // Voltar para online se estava em híbrido por causa da conexão ruim
        if (this.currentMode === 'hybrid' && this.fusionState.autoSwitch) {
            this.switchToOnlineMode();
        }
    }

    // Lidar com mudança de bateria
    handleBatteryChange(level) {
        if (level < 0.2) {
            // Bateria baixa - economizar recursos
            this.fusionState.cacheSize = 200;
            this.cleanupCache();
            
            if (this.currentMode === 'online' && this.fusionState.autoSwitch) {
                this.switchToOfflineMode();
            }
        } else if (level > 0.5) {
            // Bateria boa - uso normal
            this.fusionState.cacheSize = 1000;
        }
    }

    // Pausar tarefas em background
    pauseBackgroundTasks() {
        if (this.syncManager) {
            this.syncManager.pause();
        }
        
        if (this.performanceMonitor) {
            this.performanceMonitor.pause();
        }
    }

    // Retomar tarefas em background
    resumeBackgroundTasks() {
        if (this.syncManager) {
            this.syncManager.resume();
        }
        
        if (this.performanceMonitor) {
            this.performanceMonitor.resume();
        }
    }

    // Limpar cache
    cleanupCache() {
        while (this.tileCache.size > this.fusionState.cacheSize) {
            const firstKey = this.tileCache.keys().next().value;
            const tileUrl = this.tileCache.get(firstKey);
            URL.revokeObjectURL(tileUrl);
            this.tileCache.delete(firstKey);
        }
    }

    // Atualizar UI
    updateUI() {
        // Atualizar indicadores de modo
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === this.currentMode);
        });
        
        // Atualizar status de conexão
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = document.querySelector('.status-text');
        
        if (statusIndicator) {
            statusIndicator.className = `status-indicator ${this.isOnline ? 'online' : 'offline'}`;
        }
        
        if (statusText) {
            statusText.textContent = this.isOnline ? 'Online' : 'Offline';
        }
        
        // Atualizar informações de qualidade
        const qualityValue = document.querySelector('.quality-value');
        if (qualityValue) {
            qualityValue.textContent = this.connectionQuality || 'Desconhecida';
        }
        
        // Atualizar informações de cache
        const cacheValue = document.querySelector('.cache-value');
        if (cacheValue) {
            cacheValue.textContent = `${this.tileCache.size} tiles`;
        }
    }

    // Salvar configurações
    saveSettings() {
        const settings = {
            mode: this.currentMode,
            autoSwitch: this.fusionState.autoSwitch,
            cacheSize: this.fusionState.cacheSize,
            lastSync: this.fusionState.lastSync
        };
        
        localStorage.setItem('trilhanca_hybrid_settings', JSON.stringify(settings));
    }

    // Carregar configurações
    loadSettings() {
        try {
            const saved = localStorage.getItem('trilhanca_hybrid_settings');
            if (saved) {
                const settings = JSON.parse(saved);
                
                this.currentMode = settings.mode || 'hybrid';
                this.fusionState.autoSwitch = settings.autoSwitch !== false;
                this.fusionState.cacheSize = settings.cacheSize || 1000;
                this.fusionState.lastSync = settings.lastSync;
                
                this.updateUI();
            }
        } catch (error) {
            console.warn('Erro ao carregar configurações:', error);
        }
    }

    // Obter status atual
    getStatus() {
        return {
            mode: this.currentMode,
            isOnline: this.isOnline,
            connectionQuality: this.connectionQuality,
            cacheSize: this.tileCache.size,
            lastSync: this.fusionState.lastSync,
            pendingUpdates: this.fusionState.pendingUpdates.length
        };
    }

    // Destruir sistema híbrido
    destroy() {
        if (this.connectionMonitor) {
            this.connectionMonitor.stop();
        }
        
        if (this.syncManager) {
            this.syncManager.destroy();
        }
        
        if (this.performanceMonitor) {
            this.performanceMonitor.destroy();
        }
        
        // Limpar cache
        this.tileCache.forEach(tileUrl => {
            URL.revokeObjectURL(tileUrl);
        });
        this.tileCache.clear();
        
        console.log('🗑️ Sistema híbrido destruído');
    }
}

// ========================
   MONITOR DE CONEXÃO
// ========================
class ConnectionMonitor {
    constructor() {
        this.isOnline = navigator.onLine;
        this.quality = 'unknown';
        this.listeners = new Map();
        this.checkInterval = null;
        this.lastCheck = null;
        
        // Métricas de conexão
        this.metrics = {
            latency: null,
            downloadSpeed: null,
            uploadSpeed: null,
            packetLoss: null
        };
    }

    // Adicionar listener de evento
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    // Remover listener de evento
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    // Disparar evento
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Erro no listener de evento:', error);
                }
            });
        }
    }

    // Iniciar monitoramento
    start() {
        this.checkInterval = setInterval(() => {
            this.checkConnection();
        }, 5000); // Verificar a cada 5 segundos
        
        // Verificação inicial
        this.checkConnection();
        
        console.log('🔍 Monitor de conexão iniciado');
    }

    // Parar monitoramento
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        
        console.log('🛑 Monitor de conexão parado');
    }

    // Verificar conexão
    async checkConnection() {
        const wasOnline = this.isOnline;
        this.isOnline = navigator.onLine;
        
        // Disparar evento de mudança de conexão
        if (wasOnline !== this.isOnline) {
            this.emit('connection-change', { online: this.isOnline });
            this.emit(this.isOnline ? 'online' : 'offline');
        }
        
        // Verificar qualidade se online
        if (this.isOnline) {
            await this.checkQuality();
        } else {
            this.quality = 'offline';
        }
        
        this.lastCheck = Date.now();
    }

    // Verificar qualidade da conexão
    async checkQuality() {
        try {
            // Medir latência
            const startTime = performance.now();
            const response = await fetch('https://httpbin.org/json', {
                signal: AbortSignal.timeout(3000)
            });
            const endTime = performance.now();
            
            if (response.ok) {
                this.metrics.latency = endTime - startTime;
                
                // Determinar qualidade baseada na latência
                if (this.metrics.latency < 200) {
                    this.quality = 'excellent';
                } else if (this.metrics.latency < 500) {
                    this.quality = 'good';
                } else if (this.metrics.latency < 1000) {
                    this.quality = 'fair';
                } else {
                    this.quality = 'poor';
                }
                
                this.emit('quality-change', this.quality);
            }
        } catch (error) {
            this.quality = 'poor';
            this.emit('quality-change', this.quality);
        }
    }

    // Obter status atual
    getStatus() {
        return {
            online: this.isOnline,
            quality: this.quality,
            metrics: { ...this.metrics },
            lastCheck: this.lastCheck
        };
    }
}

// ========================
   GERENCIADOR DE SINCRONIZAÇÃO HÍBRIDA
// ========================
class HybridSyncManager {
    constructor(fusionSystem) {
        this.fusionSystem = fusionSystem;
        this.isPaused = false;
        this.syncQueue = [];
        this.lastSync = null;
        this.syncInterval = null;
        
        this.startSyncInterval();
    }

    // Iniciar intervalo de sincronização
    startSyncInterval() {
        this.syncInterval = setInterval(() => {
            if (!this.isPaused && this.fusionSystem.isOnline) {
                this.syncPendingData();
            }
        }, this.fusionSystem.fusionState.syncInterval);
    }

    // Adicionar dados para sincronizar
    queueSync(data) {
        this.syncQueue.push({
            id: this.generateId(),
            data: data,
            timestamp: Date.now(),
            attempts: 0
        });
        
        // Sincronizar imediatamente se online
        if (this.fusionSystem.isOnline && !this.isPaused) {
            this.syncPendingData();
        }
    }

    // Sincronizar dados pendentes
    async syncPendingData() {
        if (this.syncQueue.length === 0) return;
        
        console.log(`🔄 Sincronizando ${this.syncQueue.length} itens pendentes...`);
        
        const failedItems = [];
        
        for (const item of this.syncQueue) {
            try {
                await this.syncItem(item);
                console.log(`✅ Item ${item.id} sincronizado`);
            } catch (error) {
                console.error(`❌ Erro ao sincronizar item ${item.id}:`, error);
                item.attempts++;
                
                if (item.attempts < 3) {
                    failedItems.push(item);
                }
            }
        }
        
        this.syncQueue = failedItems;
        this.lastSync = Date.now();
        this.fusionSystem.fusionState.lastSync = this.lastSync;
        
        // Atualizar UI
        this.fusionSystem.updateUI();
    }

    // Sincronizar item individual
    async syncItem(item) {
        // Simulação - em produção enviaria para servidor
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.1) { // 90% sucesso
                    resolve();
                } else {
                    reject(new Error('Falha na sincronização'));
                }
            }, 100 + Math.random() * 200);
        });
    }

    // Pausar sincronização
    pause() {
        this.isPaused = true;
        console.log('⏸️ Sincronização pausada');
    }

    // Retomar sincronização
    resume() {
        this.isPaused = false;
        console.log('▶️ Sincronização retomada');
    }

    // Gerar ID único
    generateId() {
        return 'sync_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Obter status da sincronização
    getStatus() {
        return {
            queueSize: this.syncQueue.length,
            lastSync: this.lastSync,
            isPaused: this.isPaused
        };
    }

    // Destruir gerenciador
    destroy() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        console.log('🗑️ Gerenciador de sincronização destruído');
    }
}

// ========================
   MONITOR DE PERFORMANCE HÍBRIDA
// ========================
class HybridPerformanceMonitor {
    constructor(fusionSystem) {
        this.fusionSystem = fusionSystem;
        this.isPaused = false;
        this.metrics = {
            fps: 60,
            memoryUsage: 0,
            tileLoadTime: 0,
            cacheHitRate: 0,
            networkRequests: 0
        };
        
        this.startMonitoring();
    }

    // Iniciar monitoramento
    startMonitoring() {
        this.monitorFPS();
        this.monitorMemory();
        this.monitorNetwork();
    }

    // Monitorar FPS
    monitorFPS() {
        let lastTime = performance.now();
        let frames = 0;
        
        const measureFPS = () => {
            if (this.isPaused) {
                requestAnimationFrame(measureFPS);
                return;
            }
            
            frames++;
            const currentTime = performance.now();
            
            if (currentTime >= lastTime + 1000) {
                this.metrics.fps = frames;
                frames = 0;
                lastTime = currentTime;
                
                // Ajustar comportamento baseado no FPS
                if (this.metrics.fps < 30) {
                    this.optimizePerformance();
                }
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }

    // Monitorar uso de memória
    monitorMemory() {
        setInterval(() => {
            if (this.isPaused) return;
            
            if (performance.memory) {
                this.metrics.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
                
                // Otimizar se uso de memória for alto
                if (this.metrics.memoryUsage > 100) {
                    this.fusionSystem.cleanupCache();
                }
            }
        }, 1000);
    }

    // Monitorar rede
    monitorNetwork() {
        // Interceptar requisições para medir performance
        const originalFetch = window.fetch;
        
        window.fetch = async (...args) => {
            const startTime = performance.now();
            this.metrics.networkRequests++;
            
            try {
                const response = await originalFetch(...args);
                const endTime = performance.now();
                
                // Medir tempo de carregamento de tiles
                if (args[0].includes('/tiles/')) {
                    this.metrics.tileLoadTime = endTime - startTime;
                }
                
                return response;
            } catch (error) {
                return Promise.reject(error);
            }
        };
    }

    // Otimizar performance
    optimizePerformance() {
        console.log('⚡ Otimizando performance...');
        
        // Reduzir cache
        this.fusionSystem.fusionState.cacheSize = Math.max(200, this.fusionSystem.fusionState.cacheSize * 0.7);
        this.fusionSystem.cleanupCache();
        
        // Reduzir qualidade se estiver online
        if (this.fusionSystem.currentMode === 'online') {
            this.fusionSystem.switchToHybridMode();
        }
    }

    // Pausar monitoramento
    pause() {
        this.isPaused = true;
    }

    // Retomar monitoramento
    resume() {
        this.isPaused = false;
    }

    // Obter métricas
    getMetrics() {
        return { ...this.metrics };
    }

    // Destruir monitor
    destroy() {
        console.log('🗑️ Monitor de performance destruído');
    }
}

// ========================
   INICIALIZAÇÃO GLOBAL
// ========================

// Criar instância global
document.addEventListener('DOMContentLoaded', () => {
    window.mapaFusion = new MapaHybridFusion();
    
    // Tornar disponível globalmente
    window.MapaHybridFusion = MapaHybridFusion;
    window.ConnectionMonitor = ConnectionMonitor;
    window.HybridSyncManager = HybridSyncManager;
    window.HybridPerformanceMonitor = HybridPerformanceMonitor;
    
    console.log('🌐 Sistema de Mapa Hybrid Fusion carregado');
});
