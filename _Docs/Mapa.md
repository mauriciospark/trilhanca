# Mapa de Comboio - TRILHANÇA v2.1

## 🎯 **Visão Geral**

**Sistema de navegação offline com GPS em tempo real, mapas vetoriais, alertas de distanciamento e gestão de waypoints para comboios off-road.**

## ✅ **Status Atual**

### **Interface Implementada**
- **mapa.html**: Interface completa de navegação
- **CSS responsivo**: Design mobile-first
- **JavaScript básico**: Funcionalidades visuais
- **Layout adaptativo**: Desktop e mobile
- **Dark mode**: Tema escuro para condução noturna

### **🚧 Em Desenvolvimento**
- **MapLibre GL**: Integração com tiles .mbtiles
- **GPS Tracking**: Localização em tempo real
- **Markers**: Posição dos veículos
- **Alertas**: Distanciamento do comboio
- **Waypoints**: Pontos de interesse

## 🗺️ **Arquitetura do Mapa**

### **MapLibre GL Integration**
```javascript
// Configuração do mapa offline
class TrilhancaMap {
    constructor() {
        this.map = null;
        this.markers = new Map();
        this.userLocation = null;
        this.convoyMembers = [];
        this.alertThreshold = 500; // metros
    }
    
    async initializeMap() {
        this.map = new maplibregl.Map({
            container: 'map-container',
            style: this.getOfflineStyle(),
            center: [-46.625, -23.533], // São Paulo
            zoom: 10,
            pitch: 45,
            bearing: 0,
            antialias: true
        });
        
        this.setupEventListeners();
        this.startGPS();
    }
    
    getOfflineStyle() {
        return {
            version: 8,
            sources: {
                'offline-tiles': {
                    type: 'vector',
                    tiles: ['mbtiles://trilhanca_tiles'],
                    minzoom: 0,
                    maxzoom: 15
                }
            },
            layers: [
                {
                    id: 'background',
                    type: 'background',
                    paint: {
                        'background-color': '#1a1a2e'
                    }
                },
                {
                    id: 'roads',
                    type: 'line',
                    source: 'offline-tiles',
                    'source-layer': 'roads',
                    paint: {
                        'line-color': '#4a5568',
                        'line-width': 2
                    }
                },
                {
                    id: 'terrain',
                    type: 'fill',
                    source: 'offline-tiles',
                    'source-layer': 'terrain',
                    paint: {
                        'fill-color': '#2d3748'
                    }
                }
            ]
        };
    }
}
```

### **GPS em Tempo Real**
```javascript
// Sistema de GPS
class GPSTracker {
    constructor() {
        this.watchId = null;
        this.currentPosition = null;
        this.accuracy = 0;
        this.updateInterval = 1000; // 1 segundo
    }
    
    async startTracking() {
        if (!navigator.geolocation) {
            throw new Error('Geolocation not supported');
        }
        
        this.watchId = navigator.geolocation.watchPosition(
            this.onPositionUpdate.bind(this),
            this.onPositionError.bind(this),
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    }
    
    onPositionUpdate(position) {
        this.currentPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            altitude: position.coords.altitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
            timestamp: position.timestamp
        };
        
        this.updateMapMarker();
        this.checkConvoyDistance();
        this.saveToLocalStorage();
    }
    
    onPositionError(error) {
        console.error('GPS Error:', error);
        this.showGPSAlert(error.message);
    }
}
```

## 🚨 **Sistema de Alertas**

### **Alertas de Distanciamento**
```javascript
// Verificação de distância do comboio
class ConvoyAlerts {
    constructor(threshold = 500) {
        this.threshold = threshold; // metros
        this.alerts = new Map();
        this.blinkingMarkers = new Set();
    }
    
    checkDistances(userPosition, convoyMembers) {
        convoyMembers.forEach(member => {
            const distance = this.calculateDistance(userPosition, member.position);
            
            if (distance > this.threshold) {
                this.triggerAlert(member.id, distance);
                this.startBlinking(member.id);
            } else {
                this.clearAlert(member.id);
                this.stopBlinking(member.id);
            }
        });
    }
    
    calculateDistance(pos1, pos2) {
        // Fórmula de Haversine
        const R = 6371000; // Raio da Terra em metros
        const dLat = this.toRadians(pos2.lat - pos1.lat);
        const dLng = this.toRadians(pos2.lng - pos1.lng);
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(this.toRadians(pos1.lat)) * 
                  Math.cos(this.toRadians(pos2.lat)) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    triggerAlert(memberId, distance) {
        const alert = {
            id: memberId,
            type: 'DISTANCE_ALERT',
            distance: distance,
            threshold: this.threshold,
            timestamp: Date.now(),
            active: true
        };
        
        this.alerts.set(memberId, alert);
        this.showNotification(alert);
        this.playAlertSound();
    }
}
```

### **Animação de Blinking**
```javascript
// Animação de alerta visual
class BlinkingMarker {
    constructor(markerId, map) {
        this.markerId = markerId;
        this.map = map;
        this.isBlinking = false;
        this.blinkInterval = null;
        this.blinkSpeed = 500; // ms
    }
    
    startBlinking() {
        if (this.isBlinking) return;
        
        this.isBlinking = true;
        let visible = true;
        
        this.blinkInterval = setInterval(() => {
            const marker = this.map.getLayer(this.markerId);
            if (marker) {
                marker.setLayout('visibility', visible ? 'visible' : 'none');
                visible = !visible;
            }
        }, this.blinkSpeed);
    }
    
    stopBlinking() {
        if (!this.isBlinking) return;
        
        clearInterval(this.blinkInterval);
        this.isBlinking = false;
        
        const marker = this.map.getLayer(this.markerId);
        if (marker) {
            marker.setLayout('visibility', 'visible');
        }
    }
}
```

## 📍 **Markers e Waypoints**

### **Markers de Veículos**
```javascript
// Sistema de markers
class VehicleMarkers {
    constructor(map) {
        this.map = map;
        this.markers = new Map();
        this.markerIcons = {
            leader: '🚗',
            member: '🚙',
            support: '🚐',
            medical: '🚑'
        };
    }
    
    addVehicle(vehicle) {
        const markerElement = this.createMarkerElement(vehicle);
        const marker = new maplibregl.Marker({
            element: markerElement,
            anchor: 'center'
        })
        .setLngLat([vehicle.position.lng, vehicle.position.lat])
        .addTo(this.map);
        
        this.markers.set(vehicle.id, marker);
        this.updateMarkerPopup(marker, vehicle);
    }
    
    createMarkerElement(vehicle) {
        const element = document.createElement('div');
        element.className = `vehicle-marker ${vehicle.role}`;
        element.innerHTML = `
            <div class="marker-icon">${this.markerIcons[vehicle.role]}</div>
            <div class="marker-label">${vehicle.name}</div>
            <div class="marker-distance">${this.getDistanceText(vehicle.distance)}</div>
        `;
        return element;
    }
    
    updateVehiclePosition(vehicleId, position) {
        const marker = this.markers.get(vehicleId);
        if (marker) {
            marker.setLngLat([position.lng, position.lat]);
            
            // Animação suave
            marker.addTo(this.map);
        }
    }
}
```

### **Waypoints e Pontos de Interesse**
```javascript
// Gestão de waypoints
class WaypointManager {
    constructor(map) {
        this.map = map;
        this.waypoints = [];
        this.currentRoute = [];
        this.routeLayer = null;
    }
    
    addWaypoint(waypoint) {
        const waypointData = {
            id: this.generateId(),
            name: waypoint.name,
            position: waypoint.position,
            type: waypoint.type, // GAS, FOOD, SLEEP, DANGER
            description: waypoint.description,
            timestamp: Date.now()
        };
        
        this.waypoints.push(waypointData);
        this.addWaypointMarker(waypointData);
        this.updateRoute();
    }
    
    addWaypointMarker(waypoint) {
        const markerElement = this.createWaypointElement(waypoint);
        const marker = new maplibregl.Marker({
            element: markerElement,
            anchor: 'center'
        })
        .setLngLat([waypoint.position.lng, waypoint.position.lat])
        .addTo(this.map);
        
        this.addWaypointPopup(marker, waypoint);
    }
    
    createWaypointElement(waypoint) {
        const element = document.createElement('div');
        element.className = `waypoint-marker ${waypoint.type}`;
        element.innerHTML = `
            <div class="waypoint-icon">${this.getWaypointIcon(waypoint.type)}</div>
            <div class="waypoint-label">${waypoint.name}</div>
        `;
        return element;
    }
    
    getWaypointIcon(type) {
        const icons = {
            GAS: '⛽',
            FOOD: '🍔',
            SLEEP: '🏕️',
            DANGER: '⚠️',
            BRIDGE: '🌉',
            FERRY: '⛴️'
        };
        return icons[type] || '📍';
    }
}
```

## 💾 **Tiles Offline**

### **MBTiles Integration**
```javascript
// Sistema de tiles offline
class OfflineTiles {
    constructor() {
        this.tileCache = new Map();
        this.tileDatabase = null;
        this.tileSize = 512;
        this.maxZoom = 15;
    }
    
    async initializeDatabase() {
        // Abrir banco de dados MBTiles
        this.tileDatabase = await this.openMBTiles('trilhanca_tiles.mbtiles');
        
        // Configurar interceptor para MapLibre
        this.setupTileInterceptor();
    }
    
    setupTileInterceptor() {
        // Interceptar requisições de tiles
        const originalFetch = window.fetch;
        window.fetch = async (url, options) => {
            if (url.includes('mbtiles://')) {
                const tileUrl = url.replace('mbtiles://', '');
                const tileData = await this.getTileData(tileUrl);
                return new Response(tileData, {
                    headers: { 'Content-Type': 'application/x-protobuf' }
                });
            }
            return originalFetch(url, options);
        };
    }
    
    async getTileData(tileUrl) {
        // Extrair z, x, y da URL
        const [z, x, y] = tileUrl.split('/').map(Number);
        
        // Buscar no banco de dados
        const tile = await this.tileDatabase.get('tiles', {
            zoom_level: z,
            tile_column: x,
            tile_row: y
        });
        
        if (tile) {
            return tile.tile_data;
        }
        
        // Tile não encontrado - retornar placeholder
        return this.generatePlaceholderTile();
    }
    
    generatePlaceholderTile() {
        // Gerar tile vazio
        const canvas = document.createElement('canvas');
        canvas.width = this.tileSize;
        canvas.height = this.tileSize;
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);
        
        // Adicionar texto de "no data"
        ctx.fillStyle = '#4a5568';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No Data', this.tileSize/2, this.tileSize/2);
        
        return canvas.toBuffer();
    }
}
```

### **Download Progressivo**
```javascript
// Download de tiles por região
class TileDownloader {
    constructor() {
        this.downloadQueue = [];
        this.downloadedTiles = new Set();
        this.maxConcurrentDownloads = 3;
        this.activeDownloads = 0;
    }
    
    async downloadRegion(bounds, zoomLevels) {
        const tiles = this.generateTileList(bounds, zoomLevels);
        this.downloadQueue = [...tiles];
        
        await this.processDownloadQueue();
    }
    
    generateTileList(bounds, zoomLevels) {
        const tiles = [];
        
        zoomLevels.forEach(zoom => {
            const minTile = this.lngLatToTile(bounds.sw.lng, bounds.sw.lat, zoom);
            const maxTile = this.lngLatToTile(bounds.ne.lng, bounds.ne.lat, zoom);
            
            for (let x = minTile.x; x <= maxTile.x; x++) {
                for (let y = minTile.y; y <= maxTile.y; y++) {
                    tiles.push({ zoom, x, y });
                }
            }
        });
        
        return tiles;
    }
    
    async processDownloadQueue() {
        while (this.downloadQueue.length > 0 && this.activeDownloads < this.maxConcurrentDownloads) {
            const tile = this.downloadQueue.shift();
            this.activeDownloads++;
            
            this.downloadTile(tile).finally(() => {
                this.activeDownloads--;
                this.processDownloadQueue();
            });
        }
    }
    
    async downloadTile(tile) {
        try {
            const tileData = await this.fetchTileFromServer(tile);
            await this.saveTileToDatabase(tile, tileData);
            this.downloadedTiles.add(`${tile.zoom}/${tile.x}/${tile.y}`);
            this.updateProgress();
        } catch (error) {
            console.error('Tile download error:', error);
            // Re-queue failed tiles
            this.downloadQueue.push(tile);
        }
    }
}
```

## 🎛️ **Interface e UX**

### **Controles do Mapa**
```javascript
// Controles customizados
class MapControls {
    constructor(map) {
        this.map = map;
        this.controls = new Map();
        this.setupControls();
    }
    
    setupControls() {
        this.addGPSControl();
        this.addConvoyControl();
        this.addWaypointControl();
        this.addLayersControl();
        this.addZoomControl();
    }
    
    addGPSControl() {
        const gpsControl = document.createElement('div');
        gpsControl.className = 'map-control gps-control';
        gpsControl.innerHTML = `
            <button class="control-btn" id="gps-btn">
                <i class="fas fa-crosshairs"></i>
                <span>GPS</span>
            </button>
        `;
        
        gpsControl.querySelector('#gps-btn').addEventListener('click', () => {
            this.centerOnUser();
        });
        
        this.map.addControl(gpsControl, 'top-left');
    }
    
    addConvoyControl() {
        const convoyControl = document.createElement('div');
        convoyControl.className = 'map-control convoy-control';
        convoyControl.innerHTML = `
            <button class="control-btn" id="convoy-btn">
                <i class="fas fa-users"></i>
                <span>Comboio</span>
            </button>
        `;
        
        convoyControl.querySelector('#convoy-btn').addEventListener('click', () => {
            this.showConvoyPanel();
        });
        
        this.map.addControl(convoyControl, 'top-left');
    }
    
    addWaypointControl() {
        const waypointControl = document.createElement('div');
        waypointControl.className = 'map-control waypoint-control';
        waypointControl.innerHTML = `
            <button class="control-btn" id="waypoint-btn">
                <i class="fas fa-map-marker-alt"></i>
                <span>Waypoint</span>
            </button>
        `;
        
        waypointControl.querySelector('#waypoint-btn').addEventListener('click', () => {
            this.addWaypointMode();
        });
        
        this.map.addControl(waypointControl, 'top-left');
    }
}
```

### **Painel de Informações**
```javascript
// Painel lateral com informações
class InfoPanel {
    constructor(map) {
        this.map = map;
        this.isVisible = false;
        this.currentVehicle = null;
        this.setupPanel();
    }
    
    setupPanel() {
        this.panel = document.createElement('div');
        this.panel.className = 'info-panel';
        this.panel.innerHTML = `
            <div class="panel-header">
                <h3>Informações do Comboio</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="panel-content">
                <div class="vehicle-info">
                    <div class="vehicle-avatar">
                        <img src="/icon/Usuario.png" alt="Vehicle">
                    </div>
                    <div class="vehicle-details">
                        <h4 class="vehicle-name">-</h4>
                        <p class="vehicle-role">-</p>
                        <p class="vehicle-status">-</p>
                    </div>
                </div>
                <div class="vehicle-metrics">
                    <div class="metric">
                        <span class="metric-label">Distância</span>
                        <span class="metric-value">-</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Velocidade</span>
                        <span class="metric-value">-</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Altitude</span>
                        <span class="metric-value">-</span>
                    </div>
                </div>
                <div class="vehicle-actions">
                    <button class="action-btn" id="call-btn">
                        <i class="fas fa-phone"></i>
                        Chamar
                    </button>
                    <button class="action-btn" id="message-btn">
                        <i class="fas fa-comment"></i>
                        Mensagem
                    </button>
                    <button class="action-btn" id="navigate-btn">
                        <i class="fas fa-route"></i>
                        Navegar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.panel);
        this.setupEventListeners();
    }
    
    showVehicleInfo(vehicle) {
        this.currentVehicle = vehicle;
        this.updatePanelContent(vehicle);
        this.showPanel();
    }
    
    updatePanelContent(vehicle) {
        this.panel.querySelector('.vehicle-name').textContent = vehicle.name;
        this.panel.querySelector('.vehicle-role').textContent = vehicle.role;
        this.panel.querySelector('.vehicle-status').textContent = vehicle.status;
        
        // Atualizar métricas
        this.panel.querySelector('.metric-value').textContent = 
            `${vehicle.distance?.toFixed(0) || 0}m`;
    }
}
```

## 📊 **Métricas e Performance**

### **Performance do Mapa**
```javascript
// Monitoramento de performance
class MapPerformance {
    constructor() {
        this.metrics = {
            renderTime: 0,
            fps: 60,
            memoryUsage: 0,
            tileLoadTime: 0,
            markerCount: 0
        };
        
        this.startMonitoring();
    }
    
    startMonitoring() {
        // Monitorar FPS
        this.monitorFPS();
        
        // Monitorar uso de memória
        this.monitorMemory();
        
        // Monitorar tempo de renderização
        this.monitorRenderTime();
    }
    
    monitorFPS() {
        let lastTime = performance.now();
        let frames = 0;
        
        const measureFPS = () => {
            frames++;
            const currentTime = performance.now();
            
            if (currentTime >= lastTime + 1000) {
                this.metrics.fps = frames;
                frames = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }
    
    optimizePerformance() {
        if (this.metrics.fps < 30) {
            // Reduzir qualidade de renderização
            this.reduceRenderQuality();
        }
        
        if (this.metrics.memoryUsage > 100) {
            // Limpar caches não utilizados
            this.cleanupCaches();
        }
    }
}
```

## 📋 **Roadmap Mapa**

### **v2.2 (Próximo)**
- [ ] **MapLibre GL**: Integração completa
- [ ] **GPS Tracking**: Localização em tempo real
- [ ] **Markers**: Posição dos veículos
- [ ] **Alertas**: Sistema de distanciamento
- [ ] **Tiles Offline**: MBTiles integration

### **v2.3 (Futuro)**
- [ ] **Waypoints**: Pontos de interesse
- [ ] **Rotas**: Cálculo de melhor caminho
- [ ] **Offline Routing**: Navegação sem internet
- [ ] **Traffic**: Informações de trânsito
- [ ] **Weather**: Condições climáticas

### **v3.0 (Long-term)**
- [ ] **3D Terrain**: Terreno 3D
- [ ] **Satellite View**: Imagens de satélite
- [ ] **AR Navigation**: Realidade aumentada
- [ ] **AI Routing**: Rotas inteligentes
- [ ] **Predictive Analytics**: Previsão de condições

---

**Status Atual**: Interface implementada v2.1  
**Próxima Milestone**: MapLibre GL + GPS Tracking  
**Timeline Estimada**: 2-3 semanas para v2.2  

**Última atualização**: 09/03/2026  
**Versão**: v2.1  
**Implementação**: 60% do planejado
