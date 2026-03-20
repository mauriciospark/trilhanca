// ========================
// MAPA OFFLINE COMPLETO - TRILHANÇA v2.1
// Sistema de navegação offline com GPS em tempo real, 
// alertas de distanciamento e gestão de waypoints
// ========================

class TrilhancaMapOffline {
    constructor() {
        this.map = null;
        this.markers = new Map();
        this.userLocation = null;
        this.convoyMembers = [];
        this.alertThreshold = 500; // metros
        this.waypoints = [];
        this.currentRoute = [];
        this.routeLayer = null;
        this.gpsTracker = null;
        this.convoyAlerts = null;
        this.vehicleMarkers = null;
        this.waypointManager = null;
        this.offlineTiles = null;
        this.mapPerformance = null;
        this.infoPanel = null;
        this.mapControls = null;
        
        // Configurações do mapa
        this.mapConfig = {
            defaultCenter: [-23.5505, -46.6333], // São Paulo
            defaultZoom: 13,
            maxZoom: 18,
            minZoom: 3,
            tileServer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: '© OpenStreetMap contributors'
        };
        
        // Estado do GPS
        this.gpsState = {
            isActive: false,
            accuracy: 0,
            speed: 0,
            heading: 0,
            altitude: 0,
            timestamp: null
        };
        
        // Performance metrics
        this.metrics = {
            renderTime: 0,
            fps: 60,
            memoryUsage: 0,
            tileLoadTime: 0,
            markerCount: 0
        };
    }

    // Inicialização do mapa
    async initializeMap() {
        try {
            console.log('🗺️ Inicializando mapa offline...');
            
            // Criar mapa com Leaflet
            this.map = L.map('map', {
                center: this.mapConfig.defaultCenter,
                zoom: this.mapConfig.defaultZoom,
                zoomControl: true,
                attributionControl: true
            });

            // Adicionar camada de tiles
            L.tileLayer(this.mapConfig.tileServer, {
                attribution: this.mapConfig.attribution,
                maxZoom: this.mapConfig.maxZoom,
                minZoom: this.mapConfig.minZoom
            }).addTo(this.map);

            // Inicializar subsistemas
            this.initializeSubsystems();
            
            // Configurar eventos do mapa
            this.setupMapEvents();
            
            // Iniciar GPS se permitido
            await this.startGPS();
            
            console.log('✅ Mapa offline inicializado com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar mapa:', error);
            this.showNotification('Erro ao inicializar mapa: ' + error.message, 'error');
        }
    }

    // Inicializar subsistemas
    initializeSubsystems() {
        try {
            console.log('🔧 Inicializando subsistemas...');
            
            // Verificar se o mapa existe antes de criar subsistemas
            if (!this.map) {
                throw new Error('Mapa não foi inicializado');
            }
            
            this.gpsTracker = new GPSTracker(this);
            this.convoyAlerts = new ConvoyAlerts(this.alertThreshold);
            this.vehicleMarkers = new VehicleMarkers(this.map);
            this.waypointManager = new WaypointManager(this.map);
            this.offlineTiles = new OfflineTiles(this);
            this.mapPerformance = new MapPerformance();
            this.infoPanel = new InfoPanel(this.map);
            this.mapControls = new MapControls(this.map);
            
            // Inicializar layers
            this.convoyLayer = L.layerGroup().addTo(this.map);
            this.waypointLayer = L.layerGroup().addTo(this.map);
            this.routeLayer = L.layerGroup().addTo(this.map);
            this.alertLayer = L.layerGroup().addTo(this.map);
            
            console.log('✅ Subsistemas inicializados com sucesso');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar subsistemas:', error);
            throw error;
        }
    }

    // Configurar eventos do mapa
    setupMapEvents() {
        // Evento de clique no mapa
        this.map.on('click', (e) => {
            this.onMapClick(e);
        });

        // Evento de zoom
        this.map.on('zoomend', () => {
            this.updateZoomDisplay();
        });

        // Evento de movimento do mapa
        this.map.on('moveend', () => {
            this.updatePositionDisplay();
        });

        // Evento de resize
        window.addEventListener('resize', () => {
            this.map.invalidateSize();
        });
    }

    // Iniciar GPS
    async startGPS() {
        try {
            if (!navigator.geolocation) {
                throw new Error('Geolocalização não suportada pelo navegador');
            }

            console.log('📍 Iniciando GPS...');
            
            // Solicitar permissão e iniciar tracking
            this.gpsTracker.startTracking();
            
            // Atualizar UI
            this.updateGPSStatus(true);
            
            console.log('✅ GPS iniciado com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro ao iniciar GPS:', error);
            this.showNotification('Erro ao iniciar GPS: ' + error.message, 'error');
            this.updateGPSStatus(false);
        }
    }

    // Parar GPS
    stopGPS() {
        if (this.gpsTracker) {
            this.gpsTracker.stopTracking();
            this.updateGPSStatus(false);
            console.log('🛑 GPS parado');
        }
    }

    // Evento de clique no mapa
    onMapClick(e) {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);
        
        console.log(`📍 Clique no mapa: ${lat}, ${lng}`);
        
        // Atualizar campos de coordenadas
        this.updateCoordinateFields(lat, lng);
        
        // Adicionar marcador temporário se estiver em modo de waypoint
        if (this.waypointManager.isAddingWaypoint) {
            this.waypointManager.addTemporaryMarker(e.latlng);
        }
    }

    // Atualizar campos de coordenadas
    updateCoordinateFields(lat, lng) {
        const latEl = document.getElementById('lat');
        const lonEl = document.getElementById('lon');
        const lat2El = document.getElementById('lat2');
        const lon2El = document.getElementById('lon2');
        
        if (latEl) latEl.value = lat;
        if (lonEl) lonEl.value = lng;
        if (lat2El) lat2El.value = lat;
        if (lon2El) lon2El.value = lng;
    }

    // Atualizar display de zoom
    updateZoomDisplay() {
        const zoomEl = document.getElementById('current-zoom');
        if (zoomEl) {
            zoomEl.textContent = this.map.getZoom();
        }
    }

    // Atualizar display de posição
    updatePositionDisplay() {
        const center = this.map.getCenter();
        const posEl = document.getElementById('current-position');
        if (posEl) {
            posEl.textContent = `${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`;
        }
    }

    // Atualizar status do GPS
    updateGPSStatus(isActive) {
        const statusEl = document.getElementById('location-status');
        const toggleBtn = document.getElementById('toggle-location');
        
        if (statusEl) {
            statusEl.textContent = isActive ? 'GPS Ativo' : 'GPS Inativo';
            statusEl.className = isActive ? 'status-text success' : 'status-text muted';
        }
        
        if (toggleBtn) {
            toggleBtn.textContent = isActive ? 'Parar Localização' : 'Ativar Localização';
            toggleBtn.className = isActive ? 'btn full-width active' : 'btn full-width';
        }
        
        this.gpsState.isActive = isActive;
    }

    // Adicionar membro do comboio
    addConvoyMember(member) {
        this.convoyMembers.push(member);
        
        // Verificar se vehicleMarkers existe antes de usar
        if (this.vehicleMarkers) {
            this.vehicleMarkers.addVehicle(member);
        } else {
            console.warn('⚠️ vehicleMarkers não inicializado, membro adicionado apenas na lista');
        }
        
        this.updateConvoyDisplay();
    }

    // Atualizar posição do membro do comboio
    updateConvoyMemberPosition(memberId, position) {
        const member = this.convoyMembers.find(m => m.id === memberId);
        if (member) {
            member.position = position;
            
            // Verificar se vehicleMarkers existe antes de usar
            if (this.vehicleMarkers) {
                this.vehicleMarkers.updateVehiclePosition(memberId, position);
            }
            
            this.convoyAlerts.checkDistances(this.userLocation, this.convoyMembers);
        }
    }

    // Atualizar display do comboio
    updateConvoyDisplay() {
        const vehiclesEl = document.getElementById('active-vehicles');
        if (vehiclesEl) {
            vehiclesEl.textContent = `${this.convoyMembers.length} ativos`;
        }
        
        const markersEl = document.getElementById('total-markers');
        if (markersEl) {
            markersEl.textContent = `${this.markers.size} marcações`;
        }
    }

    // Centralizar no usuário
    centerOnUser() {
        if (this.userLocation) {
            this.map.setView(this.userLocation, 16);
            console.log('🎯 Centralizado na posição do usuário');
        } else {
            this.showNotification('Posição do usuário não disponível', 'warning');
        }
    }

    // Mostrar notificação
    showNotification(message, type = 'info') {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // Adicionar ao DOM
        document.body.appendChild(notification);
        
        // Remover após 3 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
        
        // Evento de fechar
        notification.querySelector('.notification-close').addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }

    // Exportar dados do mapa
    exportMapData() {
        const data = {
            convoy: this.convoyMembers,
            waypoints: this.waypoints,
            route: this.currentRoute,
            userLocation: this.userLocation,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `trilhanca_map_data_${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        console.log('📥 Dados do mapa exportados');
    }

    // Importar dados do mapa
    importMapData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Importar comboio
                if (data.convoy) {
                    data.convoy.forEach(member => {
                        this.addConvoyMember(member);
                    });
                }
                
                // Importar waypoints
                if (data.waypoints) {
                    data.waypoints.forEach(waypoint => {
                        this.waypointManager.addWaypoint(waypoint);
                    });
                }
                
                // Importar rota
                if (data.route) {
                    this.currentRoute = data.route;
                    this.drawRoute();
                }
                
                this.showNotification('Dados importados com sucesso!', 'success');
                console.log('📤 Dados do mapa importados');
                
            } catch (error) {
                console.error('❌ Erro ao importar dados:', error);
                this.showNotification('Erro ao importar dados: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    }

    // Desenhar rota
    drawRoute() {
        if (this.routeLayer) {
            this.routeLayer.clearLayers();
        }
        
        if (this.currentRoute.length > 1) {
            const latlngs = this.currentRoute.map(point => 
                L.latLng(point.lat, point.lng)
            );
            
            L.polyline(latlngs, {
                color: '#007bff',
                weight: 4,
                opacity: 0.7,
                smoothFactor: 1
            }).addTo(this.routeLayer);
        }
    }

    // Limpar mapa
    clearMap() {
        this.markers.clear();
        this.convoyMembers = [];
        this.waypoints = [];
        this.currentRoute = [];
        
        if (this.convoyLayer) this.convoyLayer.clearLayers();
        if (this.waypointLayer) this.waypointLayer.clearLayers();
        if (this.routeLayer) this.routeLayer.clearLayers();
        if (this.alertLayer) this.alertLayer.clearLayers();
        
        this.updateConvoyDisplay();
        console.log('🧹 Mapa limpo');
    }

    // Atualizar métricas de performance
    updateMetrics() {
        this.metrics.markerCount = this.markers.size;
        this.mapPerformance.updateMetrics(this.metrics);
    }

    // Destruir mapa
    destroy() {
        if (this.gpsTracker) {
            this.gpsTracker.stopTracking();
        }
        
        if (this.map) {
            this.map.remove();
        }
        
        console.log('🗑️ Mapa destruído');
    }
}

// ========================
// SISTEMA DE GPS
// ========================
class GPSTracker {
    constructor(mapSystem) {
        this.mapSystem = mapSystem;
        this.watchId = null;
        this.currentPosition = null;
        this.accuracy = 0;
        this.updateInterval = 1000; // 1 segundo
        this.marker = null;
        this.accuracyCircle = null;
    }

    async startTracking() {
        if (!navigator.geolocation) {
            throw new Error('Geolocalização não suportada');
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

        console.log('📍 GPS tracking iniciado');
    }

    stopTracking() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }

        if (this.marker) {
            this.mapSystem.map.removeLayer(this.marker);
            this.marker = null;
        }

        if (this.accuracyCircle) {
            this.mapSystem.map.removeLayer(this.accuracyCircle);
            this.accuracyCircle = null;
        }

        console.log('🛑 GPS tracking parado');
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

        // Atualizar sistema do mapa
        this.mapSystem.userLocation = L.latLng(
            this.currentPosition.lat,
            this.currentPosition.lng
        );

        // Atualizar marcador
        this.updateMarker();

        // Atualizar display
        this.updateDisplay();

        // Verificar distâncias do comboio
        this.mapSystem.convoyAlerts.checkDistances(
            this.mapSystem.userLocation,
            this.mapSystem.convoyMembers
        );

        // Salvar em localStorage
        this.saveToLocalStorage();
    }

    onPositionError(error) {
        console.error('❌ GPS Error:', error);
        this.mapSystem.showNotification('Erro de GPS: ' + this.getErrorMessage(error), 'error');
    }

    getErrorMessage(error) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                return 'Permissão de GPS negada';
            case error.POSITION_UNAVAILABLE:
                return 'Posição indisponível';
            case error.TIMEOUT:
                return 'Timeout ao obter posição';
            default:
                return 'Erro desconhecido';
        }
    }

    updateMarker() {
        if (!this.currentPosition) return;

        const latlng = L.latLng(
            this.currentPosition.lat,
            this.currentPosition.lng
        );

        // Criar ou atualizar marcador
        if (!this.marker) {
            this.marker = L.marker(latlng, {
                icon: L.divIcon({
                    className: 'gps-marker',
                    html: '<div class="gps-marker-icon">📍</div>',
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                })
            }).addTo(this.mapSystem.map);
        } else {
            this.marker.setLatLng(latlng);
        }

        // Criar ou atualizar círculo de precisão
        if (!this.accuracyCircle) {
            this.accuracyCircle = L.circle(latlng, {
                radius: this.currentPosition.accuracy,
                color: '#007bff',
                fillColor: '#007bff',
                fillOpacity: 0.1,
                weight: 2
            }).addTo(this.mapSystem.map);
        } else {
            this.accuracyCircle.setLatLng(latlng);
            this.accuracyCircle.setRadius(this.currentPosition.accuracy);
        }
    }

    updateDisplay() {
        if (!this.currentPosition) return;

        // Atualizar display de GPS
        const accEl = document.getElementById('geo-acc');
        const speedEl = document.getElementById('geo-speed');
        const headEl = document.getElementById('geo-head');

        if (accEl) {
            accEl.textContent = `±${this.currentPosition.accuracy.toFixed(0)} m`;
        }

        if (speedEl && this.currentPosition.speed) {
            speedEl.textContent = `${(this.currentPosition.speed * 3.6).toFixed(1)} km/h`;
        }

        if (headEl && this.currentPosition.heading) {
            headEl.textContent = `${this.currentPosition.heading.toFixed(0)}°`;
        }

        // Atualizar estado do sistema
        this.mapSystem.gpsState = {
            ...this.mapSystem.gpsState,
            accuracy: this.currentPosition.accuracy,
            speed: this.currentPosition.speed,
            heading: this.currentPosition.heading,
            altitude: this.currentPosition.altitude,
            timestamp: this.currentPosition.timestamp
        };
    }

    saveToLocalStorage() {
        if (this.currentPosition) {
            localStorage.setItem('trilhanca_gps_position', JSON.stringify(this.currentPosition));
        }
    }

    loadFromLocalStorage() {
        const saved = localStorage.getItem('trilhanca_gps_position');
        if (saved) {
            try {
                this.currentPosition = JSON.parse(saved);
                return true;
            } catch (error) {
                console.error('❌ Erro ao carregar posição salva:', error);
            }
        }
        return false;
    }
}

// ========================
// SISTEMA DE ALERTAS DE COMBOIO
// ========================
class ConvoyAlerts {
    constructor(threshold = 500) {
        this.threshold = threshold; // metros
        this.alerts = new Map();
        this.blinkingMarkers = new Set();
        this.alertSound = null;
    }

    checkDistances(userPosition, convoyMembers) {
        convoyMembers.forEach(member => {
            if (!member.position) return;

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

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(pos1.lat)) *
                  Math.cos(this.toRadians(pos2.lat)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
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

    clearAlert(memberId) {
        const alert = this.alerts.get(memberId);
        if (alert) {
            alert.active = false;
            this.alerts.delete(memberId);
        }
    }

    startBlinking(memberId) {
        if (this.blinkingMarkers.has(memberId)) return;

        this.blinkingMarkers.add(memberId);
        console.log(`⚠️ Iniciando alerta de distanciamento para membro ${memberId}`);
    }

    stopBlinking(memberId) {
        this.blinkingMarkers.delete(memberId);
        console.log(`✅ Alerta de distanciamento removido para membro ${memberId}`);
    }

    showNotification(alert) {
        const message = `⚠️ Membro ${alert.id} está a ${alert.distance.toFixed(0)}m do comboio!`;
        
        // Criar notificação visual
        const notification = document.createElement('div');
        notification.className = 'convoy-alert';
        notification.innerHTML = `
            <div class="alert-content">
                <span class="alert-icon">⚠️</span>
                <span class="alert-message">${message}</span>
                <button class="alert-close">&times;</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);

        // Evento de fechar
        notification.querySelector('.alert-close').addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }

    playAlertSound() {
        // Tocar som de alerta (se disponível)
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
            audio.play();
        } catch (error) {
            console.log('🔇 Não foi possível tocar som de alerta');
        }
    }

    getActiveAlerts() {
        return Array.from(this.alerts.values()).filter(alert => alert.active);
    }

    clearAllAlerts() {
        this.alerts.clear();
        this.blinkingMarkers.clear();
        console.log('🧹 Todos os alertas removidos');
    }
}

// ========================
// SISTEMA DE MARKERS DE VEÍCULOS
// ========================
class VehicleMarkers {
    constructor(map) {
        // Validar se o mapa foi fornecido
        if (!map) {
            throw new Error('Mapa é obrigatório para VehicleMarkers');
        }
        
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
        // Validar dados do veículo
        if (!vehicle || !vehicle.id || !vehicle.position) {
            console.error('❌ Dados do veículo inválidos:', vehicle);
            return;
        }
        
        // Validar se o mapa ainda existe
        if (!this.map) {
            console.error('❌ Mapa não disponível para adicionar veículo');
            return;
        }
        
        try {
            const markerElement = this.createMarkerElement(vehicle);
            const marker = L.marker([vehicle.position.lat, vehicle.position.lng], {
                icon: L.divIcon({
                    className: 'vehicle-marker',
                    html: markerElement,
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                })
            }).addTo(this.map);

            // Adicionar popup
            marker.bindPopup(this.createPopupContent(vehicle));

            this.markers.set(vehicle.id, marker);
            console.log(`✅ Veículo ${vehicle.id} adicionado ao mapa`);
            
        } catch (error) {
            console.error('❌ Erro ao adicionar veículo:', error);
        }
    }

    createMarkerElement(vehicle) {
        const icon = this.markerIcons[vehicle.role] || '🚗';
        return `
            <div class="vehicle-marker-content ${vehicle.role}">
                <div class="vehicle-icon">${icon}</div>
                <div class="vehicle-label">${vehicle.name}</div>
                <div class="vehicle-distance">${this.getDistanceText(vehicle.distance)}</div>
            </div>
        `;
    }

    createPopupContent(vehicle) {
        return `
            <div class="vehicle-popup">
                <h4>${vehicle.name}</h4>
                <p><strong>Tipo:</strong> ${vehicle.role}</p>
                <p><strong>Status:</strong> ${vehicle.status || 'Ativo'}</p>
                ${vehicle.distance ? `<p><strong>Distância:</strong> ${vehicle.distance.toFixed(0)}m</p>` : ''}
                <div class="vehicle-actions">
                    <button onclick="callVehicle('${vehicle.id}')">📞 Chamar</button>
                    <button onclick="messageVehicle('${vehicle.id}')">💬 Mensagem</button>
                    <button onclick="navigateToVehicle('${vehicle.id}')">🧭 Navegar</button>
                </div>
            </div>
        `;
    }

    getDistanceText(distance) {
        if (!distance) return '';
        if (distance < 1000) {
            return `${distance.toFixed(0)}m`;
        } else {
            return `${(distance / 1000).toFixed(1)}km`;
        }
    }

    updateVehiclePosition(vehicleId, position) {
        const marker = this.markers.get(vehicleId);
        if (marker && position) {
            marker.setLatLng([position.lat, position.lng]);
        }
    }

    removeVehicle(vehicleId) {
        const marker = this.markers.get(vehicleId);
        if (marker) {
            this.map.removeLayer(marker);
            this.markers.delete(vehicleId);
        }
    }

    getAllMarkers() {
        return Array.from(this.markers.values());
    }

    clearAllMarkers() {
        this.markers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.markers.clear();
    }
}

// SISTEMA DE WAYPOINTS
// ========================
class WaypointManager {
    constructor(map) {
        // Validar se o mapa foi fornecido
        if (!map) {
            throw new Error('Mapa é obrigatório para WaypointManager');
        }
        
        this.map = map;
        this.waypoints = [];
        this.currentRoute = [];
        this.routeLayer = null;
        this.isAddingWaypoint = false;
        this.tempMarker = null;
        this.waypointTypes = {
            GAS: { icon: '⛽', color: '#ff6b6b', name: 'Gasolina' },
            FOOD: { icon: '🍔', color: '#4ecdc4', name: 'Alimentação' },
            SLEEP: { icon: '🏨', color: '#45b7d1', name: 'Descanso' },
            DANGER: { icon: '⚠️', color: '#ff9f43', name: 'Perigo' },
            REST: { icon: '🏖️', color: '#26de81', name: 'Área de Descanso' },
            MEDICAL: { icon: '🏥', color: '#fd79a8', name: 'Assistência Médica' },
            MECHANICAL: { icon: '🔧', color: '#a29bfe', name: 'Assistência Mecânica' },
            INFO: { icon: 'ℹ️', color: '#636e72', name: 'Informação' },
            DEFAULT: { icon: '📍', color: '#778ca3', name: 'Padrão' }
        };
    }

    startAddingWaypoint() {
        this.isAddingWaypoint = true;
        this.map.getContainer().style.cursor = 'crosshair';
        console.log('📍 Modo de adicionar waypoint ativado');
    }

    stopAddingWaypoint() {
        this.isAddingWaypoint = false;
        this.map.getContainer().style.cursor = '';
        
        if (this.tempMarker) {
            this.map.removeLayer(this.tempMarker);
            this.tempMarker = null;
        }
        
        console.log('🛑 Modo de adicionar waypoint desativado');
    }

    addTemporaryMarker(latlng) {
        if (this.tempMarker) {
            this.map.removeLayer(this.tempMarker);
        }

        this.tempMarker = L.marker(latlng, {
            icon: L.divIcon({
                className: 'temp-waypoint-marker',
                html: '<div class="temp-marker-icon">📍</div>',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            })
        }).addTo(this.map);
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
        
        console.log(`✅ Waypoint "${waypointData.name}" adicionado`);
    }

    addWaypointMarker(waypoint) {
        const markerElement = this.createWaypointElement(waypoint);
        const marker = L.marker([waypoint.position.lat, waypoint.position.lng], {
            icon: L.divIcon({
                className: 'waypoint-marker',
                html: markerElement,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            })
        }).addTo(this.map);

        // Adicionar popup
        marker.bindPopup(this.createWaypointPopup(waypoint));
    }

    createWaypointElement(waypoint) {
        const icon = this.getWaypointIcon(waypoint.type);
        return `
            <div class="waypoint-marker-content ${waypoint.type}">
                <div class="waypoint-icon">${icon}</div>
                <div class="waypoint-label">${waypoint.name}</div>
            </div>
        `;
    }

    createWaypointPopup(waypoint) {
        return `
            <div class="waypoint-popup">
                <h4>${waypoint.name}</h4>
                <p><strong>Tipo:</strong> ${this.getWaypointTypeName(waypoint.type)}</p>
                ${waypoint.description ? `<p><strong>Descrição:</strong> ${waypoint.description}</p>` : ''}
                <div class="waypoint-actions">
                    <button onclick="navigateToWaypoint('${waypoint.id}')">🧭 Navegar</button>
                    <button onclick="editWaypoint('${waypoint.id}')">✏️ Editar</button>
                    <button onclick="removeWaypoint('${waypoint.id}')">🗑️ Remover</button>
                </div>
            </div>
        `;
    }

    getWaypointIcon(type) {
        const icons = {
            GAS: '⛽',
            FOOD: '🍔',
            SLEEP: '🏕️',
            DANGER: '⚠️',
            BRIDGE: '🌉',
            FERRY: '⛴️',
            DEFAULT: '📍'
        };
        return icons[type] || icons.DEFAULT;
    }

    getWaypointTypeName(type) {
        const names = {
            GAS: 'Posto de Gasolina',
            FOOD: 'Alimentação',
            SLEEP: 'Acomodação',
            DANGER: 'Perigo',
            BRIDGE: 'Ponte',
            FERRY: 'Balsa',
            DEFAULT: 'Ponto de Interesse'
        };
        return names[type] || names.DEFAULT;
    }

    updateRoute() {
        if (this.waypoints.length < 2) return;

        // Limpar rota anterior
        if (this.routeLayer) {
            this.map.removeLayer(this.routeLayer);
        }

        // Criar nova rota
        const latlngs = this.waypoints.map(wp => [wp.position.lat, wp.position.lng]);
        
        this.routeLayer = L.polyline(latlngs, {
            color: '#ff6b6b',
            weight: 3,
            opacity: 0.7,
            dashArray: '10, 10'
        }).addTo(this.map);

        console.log(`🛣️ Rota atualizada com ${this.waypoints.length} waypoints`);
    }

    removeWaypoint(waypointId) {
        const index = this.waypoints.findIndex(wp => wp.id === waypointId);
        if (index !== -1) {
            this.waypoints.splice(index, 1);
            this.updateRoute();
            console.log(`🗑️ Waypoint ${waypointId} removido`);
        }
    }

    generateId() {
        return 'wp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getAllWaypoints() {
        return [...this.waypoints];
    }

    clearAllWaypoints() {
        this.waypoints = [];
        if (this.routeLayer) {
            this.map.removeLayer(this.routeLayer);
            this.routeLayer = null;
        }
        console.log('🧹 Todos os waypoints removidos');
    }
}

// ========================
// SISTEMA DE TILES OFFLINE
// ========================
class OfflineTiles {
    constructor(mapSystem) {
        this.mapSystem = mapSystem;
        this.tileCache = new Map();
        this.tileDatabase = null;
        this.tileSize = 512;
        this.maxZoom = 15;
    }

    async initializeDatabase() {
        // Simulação de banco de dados offline
        console.log('💾 Inicializando sistema de tiles offline...');
        
        // Em uma implementação real, aqui seria aberto o banco de dados MBTiles
        // this.tileDatabase = await this.openMBTiles('trilhanca_tiles.mbtiles');
        
        console.log('✅ Sistema de tiles offline inicializado');
    }

    setupTileInterceptor() {
        // Em uma implementação real, aqui seria configurado o interceptor
        // para servir tiles do banco de dados local
        console.log('🔧 Interceptor de tiles configurado');
    }

    async downloadRegion(bounds, zoomLevels) {
        console.log('📥 Iniciando download de tiles para região...');
        
        // Em uma implementação real, aqui seria feito o download dos tiles
        const tiles = this.generateTileList(bounds, zoomLevels);
        
        for (const tile of tiles) {
            await this.downloadTile(tile);
        }
        
        console.log(`✅ Download concluído: ${tiles.length} tiles`);
    }

    generateTileList(bounds, zoomLevels) {
        const tiles = [];
        
        zoomLevels.forEach(zoom => {
            const minTile = this.latLngToTile(bounds.sw.lat, bounds.sw.lng, zoom);
            const maxTile = this.latLngToTile(bounds.ne.lat, bounds.ne.lng, zoom);
            
            for (let x = minTile.x; x <= maxTile.x; x++) {
                for (let y = minTile.y; y <= maxTile.y; y++) {
                    tiles.push({ zoom, x, y });
                }
            }
        });
        
        return tiles;
    }

    latLngToTile(lat, lng, zoom) {
        const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
        const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
        
        return { x, y };
    }

    async downloadTile(tile) {
        // Simulação de download
        console.log(`📦 Baixando tile ${tile.zoom}/${tile.x}/${tile.y}`);
        
        // Em uma implementação real, aqui seria baixado o tile do servidor
        // e salvo no banco de dados local
    }

    getTileFromCache(tileUrl) {
        return this.tileCache.get(tileUrl);
    }

    saveTileToCache(tileUrl, tileData) {
        this.tileCache.set(tileUrl, tileData);
    }

    clearCache() {
        this.tileCache.clear();
        console.log('🧹 Cache de tiles limpo');
    }
}

// ========================
// SISTEMA DE PERFORMANCE
// ========================
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
        this.monitorFPS();
        this.monitorMemory();
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

    monitorMemory() {
        if (performance.memory) {
            setInterval(() => {
                this.metrics.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
            }, 1000);
        }
    }

    monitorRenderTime() {
        // Monitorar tempo de renderização
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                if (entry.name.includes('render')) {
                    this.metrics.renderTime = entry.duration;
                }
            });
        });
        
        observer.observe({ entryTypes: ['measure'] });
    }

    updateMetrics(newMetrics) {
        Object.assign(this.metrics, newMetrics);
    }

    getMetrics() {
        return { ...this.metrics };
    }

    optimizePerformance() {
        if (this.metrics.fps < 30) {
            console.log('⚡ Otimizando performance...');
            this.reduceRenderQuality();
        }
        
        if (this.metrics.memoryUsage > 100) {
            console.log('🧹 Limpando caches...');
            this.cleanupCaches();
        }
    }

    reduceRenderQuality() {
        // Reduzir qualidade de renderização
        console.log('📉 Qualidade de renderização reduzida');
    }

    cleanupCaches() {
        // Limpar caches não utilizados
        console.log('🗑️ Caches limpos');
    }
}

// ========================
// PAINEL DE INFORMAÇÕES
// ========================
class InfoPanel {
    constructor(map) {
        // Validar se o mapa foi fornecido
        if (!map) {
            throw new Error('Mapa é obrigatório para InfoPanel');
        }
        
        this.map = map;
        this.isVisible = false;
        this.currentVehicle = null;
        this.panelElement = null;
    }

    setupPanel() {
        // Criar painel lateral
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

    setupEventListeners() {
        const closeBtn = this.panel.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            this.hidePanel();
        });
    }

    showVehicleInfo(vehicle) {
        this.currentVehicle = vehicle;
        this.updatePanelContent(vehicle);
        this.showPanel();
    }

    updatePanelContent(vehicle) {
        this.panel.querySelector('.vehicle-name').textContent = vehicle.name || 'Veículo';
        this.panel.querySelector('.vehicle-role').textContent = vehicle.role || 'Membro';
        this.panel.querySelector('.vehicle-status').textContent = vehicle.status || 'Ativo';
        
        // Atualizar métricas
        const distanceEl = this.panel.querySelector('.metric-value');
        if (distanceEl && vehicle.distance) {
            distanceEl.textContent = `${vehicle.distance.toFixed(0)}m`;
        }
    }

    showPanel() {
        this.panel.classList.add('visible');
        this.isVisible = true;
    }

    hidePanel() {
        this.panel.classList.remove('visible');
        this.isVisible = false;
    }
}

// ========================
// CONTROLES DO MAPA
// ========================
class MapControls {
    constructor(map) {
        // Validar se o mapa foi fornecido
        if (!map) {
            throw new Error('Mapa é obrigatório para MapControls');
        }
        
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
        const gpsControl = L.control({ position: 'topleft' });
        
        gpsControl.onAdd = () => {
            const div = L.DomUtil.create('div', 'map-control gps-control');
            div.innerHTML = `
                <button class="control-btn" id="gps-btn" title="Centralizar na minha posição">
                    <i class="fas fa-crosshairs"></i>
                    <span>GPS</span>
                </button>
            `;
            
            div.querySelector('#gps-btn').addEventListener('click', () => {
                this.centerOnUser();
            });
            
            return div;
        };
        
        gpsControl.addTo(this.map);
    }

    addConvoyControl() {
        const convoyControl = L.control({ position: 'topleft' });
        
        convoyControl.onAdd = () => {
            const div = L.DomUtil.create('div', 'map-control convoy-control');
            div.innerHTML = `
                <button class="control-btn" id="convoy-btn" title="Mostrar painel do comboio">
                    <i class="fas fa-users"></i>
                    <span>Comboio</span>
                </button>
            `;
            
            div.querySelector('#convoy-btn').addEventListener('click', () => {
                this.showConvoyPanel();
            });
            
            return div;
        };
        
        convoyControl.addTo(this.map);
    }

    addWaypointControl() {
        const waypointControl = L.control({ position: 'topleft' });
        
        waypointControl.onAdd = () => {
            const div = L.DomUtil.create('div', 'map-control waypoint-control');
            div.innerHTML = `
                <button class="control-btn" id="waypoint-btn" title="Adicionar waypoint">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>Waypoint</span>
                </button>
            `;
            
            div.querySelector('#waypoint-btn').addEventListener('click', () => {
                this.addWaypointMode();
            });
            
            return div;
        };
        
        waypointControl.addTo(this.map);
    }

    addLayersControl() {
        const layersControl = L.control.layers({
            'Mapa Normal': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
            'Satélite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}')
        });
        
        layersControl.addTo(this.map);
    }

    addZoomControl() {
        const zoomControl = L.control.zoom({
            position: 'topright'
        });
        
        zoomControl.addTo(this.map);
    }

    centerOnUser() {
        if (window.trilhancaMap && window.trilhancaMap.userLocation) {
            window.trilhancaMap.map.setView(window.trilhancaMap.userLocation, 16);
            console.log('🎯 Centralizado na posição do usuário');
        } else {
            alert('Posição do usuário não disponível');
        }
    }

    showConvoyPanel() {
        // Mostrar painel do comboio
        console.log('👥 Painel do comboio');
    }

    addWaypointMode() {
        if (window.trilhancaMap && window.trilhancaMap.waypointManager) {
            window.trilhancaMap.waypointManager.startAddingWaypoint();
            console.log('📍 Modo de adicionar waypoint ativado');
        }
    }
}

// ========================
// FUNÇÕES GLOBAIS
// ========================
window.callVehicle = function(vehicleId) {
    console.log(`📞 Chamando veículo ${vehicleId}`);
    // Implementar chamada
};

window.messageVehicle = function(vehicleId) {
    console.log(`💬 Enviando mensagem para veículo ${vehicleId}`);
    // Implementar mensagem
};

window.navigateToVehicle = function(vehicleId) {
    console.log(`🧭 Navegando para veículo ${vehicleId}`);
    // Implementar navegação
};

window.navigateToWaypoint = function(waypointId) {
    console.log(`🧭 Navegando para waypoint ${waypointId}`);
    // Implementar navegação
};

window.editWaypoint = function(waypointId) {
    console.log(`✏️ Editando waypoint ${waypointId}`);
    // Implementar edição
};

window.removeWaypoint = function(waypointId) {
    if (window.trilhancaMap && window.trilhancaMap.waypointManager) {
        window.trilhancaMap.waypointManager.removeWaypoint(waypointId);
    }
};

// ========================
// INICIALIZAÇÃO
// ========================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🚀 Inicializando Mapa Offline TRILHANÇA v2.1...');
        
        // Criar instância do mapa
        window.trilhancaMap = new TrilhancaMapOffline();
        
        // Inicializar mapa
        await window.trilhancaMap.initializeMap();
        
        // Adicionar dados de exemplo (opcional)
        addExampleData();
        
        console.log('✅ Mapa Offline TRILHANÇA inicializado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        alert('Erro ao inicializar o mapa: ' + error.message);
    }
});

// Adicionar dados de exemplo
function addExampleData() {
    // Verificar se o mapa foi inicializado corretamente
    if (!window.trilhancaMap || !window.trilhancaMap.vehicleMarkers) {
        console.warn('⚠️ Mapa não está completamente inicializado, pulando dados de exemplo');
        return;
    }
    
    // Adicionar membros do comboio de exemplo
    const exampleMembers = [
        {
            id: 'leader_001',
            name: 'Líder do Comboio',
            role: 'leader',
            position: { lat: -23.5505, lng: -46.6333 },
            status: 'Ativo',
            distance: 0
        },
        {
            id: 'member_002',
            name: 'Veículo de Apoio',
            role: 'support',
            position: { lat: -23.5520, lng: -46.6350 },
            status: 'Ativo',
            distance: 250
        },
        {
            id: 'member_003',
            name: 'Membro do Comboio',
            role: 'member',
            position: { lat: -23.5490, lng: -46.6310 },
            status: 'Ativo',
            distance: 180
        }
    ];
    
    exampleMembers.forEach(member => {
        try {
            window.trilhancaMap.addConvoyMember(member);
        } catch (error) {
            console.error('Erro ao adicionar membro do comboio:', error);
        }
    });
    
    // Adicionar waypoints de exemplo
    const exampleWaypoints = [
        {
            name: 'Posto de Gasolina',
            position: { lat: -23.5480, lng: -46.6300 },
            type: 'GAS',
            description: 'Posto com combustível e conveniência'
        },
        {
            name: 'Área de Descanso',
            position: { lat: -23.5530, lng: -46.6360 },
            type: 'SLEEP',
            description: 'Área segura para pernoite'
        }
    ];
    
    exampleWaypoints.forEach(waypoint => {
        try {
            window.trilhancaMap.waypointManager.addWaypoint(waypoint);
        } catch (error) {
            console.error('Erro ao adicionar waypoint:', error);
        }
    });
}

// Exportar classes para uso global
window.TrilhancaMapOffline = TrilhancaMapOffline;
window.GPSTracker = GPSTracker;
window.ConvoyAlerts = ConvoyAlerts;
window.VehicleMarkers = VehicleMarkers;
window.WaypointManager = WaypointManager;
window.OfflineTiles = OfflineTiles;
window.MapPerformance = MapPerformance;
window.InfoPanel = InfoPanel;
window.MapControls = MapControls;
