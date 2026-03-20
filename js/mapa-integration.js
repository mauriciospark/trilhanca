// Mapa Offline Integration - TRILHANÇA v2.1
// Conecta o sistema de mapa offline com o HTML existente

class MapaOfflineIntegration {
    constructor() {
        this.mapaOffline = null;
        this.isInitialized = false;
        this.eventListeners = new Map();
        
        // Elementos da interface existente
        this.elements = {
            // Controles do mapa
            gpsCenter: document.getElementById('gps-center'),
            convoyPanel: document.getElementById('convoy-panel'),
            addWaypoint: document.getElementById('add-waypoint'),
            exportMap: document.getElementById('export-map'),
            importMap: document.getElementById('import-map'),
            mapImportFile: document.getElementById('map-import-file'),
            hybridSettings: document.getElementById('hybrid-settings'),
            hybridSettingsPanel: document.getElementById('hybrid-settings-panel'),
            hybridSettingsClose: document.getElementById('hybrid-settings-close'),
            saveHybridSettings: document.getElementById('save-hybrid-settings'),
            resetHybridSettings: document.getElementById('reset-hybrid-settings'),
            
            // Status do sistema
            toggleLocation: document.getElementById('toggle-location'),
            locationStatus: document.getElementById('location-status'),
            followMe: document.getElementById('follow-me'),
            
            // Geolocalização
            geoAcc: document.getElementById('geo-acc'),
            geoSpeed: document.getElementById('geo-speed'),
            geoHead: document.getElementById('geo-head'),
            
            // Coordenadas
            lat: document.getElementById('lat'),
            lon: document.getElementById('lon'),
            lat2: document.getElementById('lat2'),
            lon2: document.getElementById('lon2'),
            
            // Informações do mapa
            currentPosition: document.getElementById('current-position'),
            currentZoom: document.getElementById('current-zoom'),
            activeVehicles: document.getElementById('active-vehicles'),
            totalMarkers: document.getElementById('total-markers'),
            
            // Controles de rota
            originCoords: document.getElementById('origin-coords'),
            destCoords: document.getElementById('dest-coords'),
            setOrigin: document.getElementById('set-origin'),
            setDest: document.getElementById('set-dest'),
            calcRoute: document.getElementById('calc-route'),
            clearRoute: document.getElementById('clear-route'),
            
            // Veículos
            vehicleSelect: document.getElementById('vehicle-select'),
            vehicleOpen: document.getElementById('vehicle-open'),
            
            // Hodômetro
            odoValue: document.getElementById('odo-value'),
            odoStartStop: document.getElementById('odo-start-stop'),
            odoReset: document.getElementById('odo-reset'),
            odoExport: document.getElementById('odo-export'),
            odoStatus: document.getElementById('odo-status'),
            
            // Condição da via
            roadType: document.getElementById('road-type'),
            roadSeverity: document.getElementById('road-severity'),
            roadDesc: document.getElementById('road-desc'),
            roadSave: document.getElementById('road-save'),
            roadUseGps: document.getElementById('road-use-gps'),
            roadList: document.getElementById('road-list'),
            
            // Nova marcação
            privacy: document.getElementById('privacy'),
            desc: document.getElementById('desc'),
            image: document.getElementById('image'),
            imgPreview: document.getElementById('img-preview'),
            save: document.getElementById('save'),
            clear: document.getElementById('clear'),
            
            // Geo Data Viewer
            gdvFile: document.getElementById('gdv-file'),
            gdvFileAdd: document.getElementById('gdv-file-add'),
            gdvText: document.getElementById('gdv-text'),
            gdvAdd: document.getElementById('gdv-add'),
            gdvClear: document.getElementById('gdv-clear'),
            gdvList: document.getElementById('gdv-list')
        };
        
        this.init();
    }

    // Inicializar integração
    async init() {
        try {
            console.log('🔗 Inicializando integração do mapa offline...');
            
            // Aguardar o mapa offline estar disponível
            await this.waitForMapaOffline();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Sincronizar estado inicial
            this.syncInitialState();
            
            // Configurar atualizações periódicas
            this.setupPeriodicUpdates();
            
            this.isInitialized = true;
            console.log('✅ Integração do mapa offline inicializada com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro na inicialização da integração:', error);
        }
    }

    // Aguardar o mapa offline estar disponível
    async waitForMapaOffline() {
        const maxWaitTime = 10000; // 10 segundos
        const startTime = Date.now();
        
        while (!window.trilhancaMap && (Date.now() - startTime) < maxWaitTime) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (!window.trilhancaMap) {
            throw new Error('Mapa offline não disponível após timeout');
        }
        
        this.mapaOffline = window.trilhancaMap;
    }

    // Configurar event listeners
    setupEventListeners() {
        // Controles do mapa
        if (this.elements.gpsCenter) {
            this.elements.gpsCenter.addEventListener('click', () => {
                this.mapaOffline.centerOnUser();
            });
        }

        if (this.elements.convoyPanel) {
            this.elements.convoyPanel.addEventListener('click', () => {
                this.showConvoyPanel();
            });
        }

        if (this.elements.addWaypoint) {
            this.elements.addWaypoint.addEventListener('click', () => {
                this.toggleWaypointMode();
            });
        }

        if (this.elements.exportMap) {
            this.elements.exportMap.addEventListener('click', () => {
                this.mapaOffline.exportMapData();
            });
        }

        if (this.elements.importMap) {
            this.elements.importMap.addEventListener('click', () => {
                this.elements.mapImportFile.click();
            });
        }

        if (this.elements.mapImportFile) {
            this.elements.mapImportFile.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.mapaOffline.importMapData(e.target.files[0]);
                }
            });
        }

        // Controles híbridos
        if (this.elements.hybridSettings) {
            this.elements.hybridSettings.addEventListener('click', () => {
                this.showHybridSettings();
            });
        }

        if (this.elements.hybridSettingsClose) {
            this.elements.hybridSettingsClose.addEventListener('click', () => {
                this.hideHybridSettings();
            });
        }

        if (this.elements.saveHybridSettings) {
            this.elements.saveHybridSettings.addEventListener('click', () => {
                this.saveHybridSettings();
            });
        }

        if (this.elements.resetHybridSettings) {
            this.elements.resetHybridSettings.addEventListener('click', () => {
                this.resetHybridSettings();
            });
        }

        // Controles de GPS
        if (this.elements.toggleLocation) {
            this.elements.toggleLocation.addEventListener('click', () => {
                this.toggleGPS();
            });
        }

        if (this.elements.followMe) {
            this.elements.followMe.addEventListener('click', () => {
                this.toggleFollowMe();
            });
        }

        // Controles de rota
        if (this.elements.setOrigin) {
            this.elements.setOrigin.addEventListener('click', () => {
                this.setRouteOrigin();
            });
        }

        if (this.elements.setDest) {
            this.elements.setDest.addEventListener('click', () => {
                this.setRouteDestination();
            });
        }

        if (this.elements.calcRoute) {
            this.elements.calcRoute.addEventListener('click', () => {
                this.calculateRoute();
            });
        }

        if (this.elements.clearRoute) {
            this.elements.clearRoute.addEventListener('click', () => {
                this.clearRoute();
            });
        }

        // Controles de veículo
        if (this.elements.vehicleSelect) {
            this.elements.vehicleSelect.addEventListener('change', (e) => {
                this.updateVehicleType(e.target.value);
            });
        }

        // Hodômetro
        if (this.elements.odoStartStop) {
            this.elements.odoStartStop.addEventListener('click', () => {
                this.toggleOdometer();
            });
        }

        if (this.elements.odoReset) {
            this.elements.odoReset.addEventListener('click', () => {
                this.resetOdometer();
            });
        }

        if (this.elements.odoExport) {
            this.elements.odoExport.addEventListener('click', () => {
                this.exportOdometer();
            });
        }

        // Condição da via
        if (this.elements.roadSave) {
            this.elements.roadSave.addEventListener('click', () => {
                this.saveRoadCondition();
            });
        }

        if (this.elements.roadUseGps) {
            this.elements.roadUseGps.addEventListener('click', () => {
                this.useGPSForRoad();
            });
        }

        // Nova marcação
        if (this.elements.save) {
            this.elements.save.addEventListener('click', () => {
                this.saveMarker();
            });
        }

        if (this.elements.clear) {
            this.elements.clear.addEventListener('click', () => {
                this.clearMarker();
            });
        }

        if (this.elements.image) {
            this.elements.image.addEventListener('change', (e) => {
                this.previewImage(e.target.files[0]);
            });
        }

        // Geo Data Viewer
        if (this.elements.gdvFileAdd) {
            this.elements.gdvFileAdd.addEventListener('click', () => {
                this.elements.gdvFile.click();
            });
        }

        if (this.elements.gdvFile) {
            this.elements.gdvFile.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.loadGeoDataFile(e.target.files[0]);
                }
            });
        }

        if (this.elements.gdvAdd) {
            this.elements.gdvAdd.addEventListener('click', () => {
                this.addGeoDataText();
            });
        }

        if (this.elements.gdvClear) {
            this.elements.gdvClear.addEventListener('click', () => {
                this.clearGeoData();
            });
        }

        // Eventos do mapa
        this.setupMapEvents();
    }

    // Configurar eventos do mapa
    setupMapEvents() {
        if (!this.mapaOffline || !this.mapaOffline.map) return;

        // Evento de clique no mapa
        this.mapaOffline.map.on('click', (e) => {
            this.onMapClick(e);
        });

        // Evento de zoom
        this.mapaOffline.map.on('zoomend', () => {
            this.updateZoomDisplay();
        });

        // Evento de movimento
        this.mapaOffline.map.on('moveend', () => {
            this.updatePositionDisplay();
        });
    }

    // Sincronizar estado inicial
    syncInitialState() {
        // Atualizar displays
        this.updatePositionDisplay();
        this.updateZoomDisplay();
        this.updateGPSDisplay();
        this.updateConvoyDisplay();
    }

    // Configurar atualizações periódicas
    setupPeriodicUpdates() {
        // Atualizar displays a cada 1 segundo
        setInterval(() => {
            if (this.isInitialized) {
                this.updateGPSDisplay();
                this.updateConvoyDisplay();
            }
        }, 1000);
    }

    // Evento de clique no mapa
    onMapClick(e) {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);
        
        // Atualizar campos de coordenadas
        if (this.elements.lat) this.elements.lat.value = lat;
        if (this.elements.lon) this.elements.lon.value = lng;
        if (this.elements.lat2) this.elements.lat2.value = lat;
        if (this.elements.lon2) this.elements.lon2.value = lng;
    }

    // Atualizar display de posição
    updatePositionDisplay() {
        if (this.elements.currentPosition && this.mapaOffline && this.mapaOffline.map) {
            const center = this.mapaOffline.map.getCenter();
            this.elements.currentPosition.textContent = 
                `${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`;
        }
    }

    // Atualizar display de zoom
    updateZoomDisplay() {
        if (this.elements.currentZoom && this.mapaOffline && this.mapaOffline.map) {
            this.elements.currentZoom.textContent = this.mapaOffline.map.getZoom();
        }
    }

    // Atualizar display de GPS
    updateGPSDisplay() {
        if (!this.mapaOffline || !this.mapaOffline.gpsState) return;

        const gpsState = this.mapaOffline.gpsState;

        // Atualizar precisão
        if (this.elements.geoAcc && gpsState.accuracy) {
            this.elements.geoAcc.textContent = `±${gpsState.accuracy.toFixed(0)} m`;
        }

        // Atualizar velocidade
        if (this.elements.geoSpeed && gpsState.speed) {
            this.elements.geoSpeed.textContent = `${(gpsState.speed * 3.6).toFixed(1)} km/h`;
        }

        // Atualizar direção
        if (this.elements.geoHead && gpsState.heading) {
            this.elements.geoHead.textContent = `${gpsState.heading.toFixed(0)}°`;
        }

        // Atualizar status
        if (this.elements.locationStatus) {
            this.elements.locationStatus.textContent = gpsState.isActive ? 'GPS Ativo' : 'GPS Inativo';
            this.elements.locationStatus.className = gpsState.isActive ? 
                'status-text success' : 'status-text muted';
        }

        // Atualizar botão de toggle
        if (this.elements.toggleLocation) {
            this.elements.toggleLocation.textContent = gpsState.isActive ? 
                'Parar Localização' : 'Ativar Localização';
            this.elements.toggleLocation.className = gpsState.isActive ? 
                'btn full-width active' : 'btn full-width';
        }
    }

    // Atualizar display do comboio
    updateConvoyDisplay() {
        if (!this.mapaOffline) return;

        // Atualizar veículos ativos
        if (this.elements.activeVehicles && this.mapaOffline.convoyMembers) {
            this.elements.activeVehicles.textContent = 
                `${this.mapaOffline.convoyMembers.length} ativos`;
        }

        // Atualizar marcações
        if (this.elements.totalMarkers && this.mapaOffline.markers) {
            this.elements.totalMarkers.textContent = 
                `${this.mapaOffline.markers.size} marcações`;
        }
    }

    // Toggle GPS
    toggleGPS() {
        if (!this.mapaOffline) return;

        if (this.mapaOffline.gpsState.isActive) {
            this.mapaOffline.stopGPS();
        } else {
            this.mapaOffline.startGPS();
        }
    }

    // Toggle Follow Me
    toggleFollowMe() {
        if (!this.mapaOffline) return;

        if (this.elements.followMe.classList.contains('active')) {
            this.elements.followMe.classList.remove('active');
            this.elements.followMe.textContent = 'Seguir Minha Localização';
        } else {
            this.elements.followMe.classList.add('active');
            this.elements.followMe.textContent = 'Parar de Seguir';
            this.mapaOffline.centerOnUser();
        }
    }

    // Mostrar painel do comboio
    showConvoyPanel() {
        if (!this.mapaOffline || !this.mapaOffline.convoyMembers.length) {
            alert('Nenhum membro do comboio disponível');
            return;
        }

        // Mostrar informações do primeiro membro (poderia ser um modal)
        const member = this.mapaOffline.convoyMembers[0];
        if (this.mapaOffline.infoPanel) {
            this.mapaOffline.infoPanel.showVehicleInfo(member);
        } else {
            alert(`Comboio: ${this.mapaOffline.convoyMembers.length} membros\nLíder: ${member.name}`);
        }
    }

    // Toggle modo de waypoint
    toggleWaypointMode() {
        if (!this.mapaOffline || !this.mapaOffline.waypointManager) return;

        if (this.elements.addWaypoint.classList.contains('active')) {
            this.elements.addWaypoint.classList.remove('active');
            this.elements.addWaypoint.textContent = '📍 Adicionar Waypoint';
            this.mapaOffline.waypointManager.stopAddingWaypoint();
        } else {
            this.elements.addWaypoint.classList.add('active');
            this.elements.addWaypoint.textContent = '🛑 Cancelar Waypoint';
            this.mapaOffline.waypointManager.startAddingWaypoint();
        }
    }

    // Definir origem da rota
    setRouteOrigin() {
        if (!this.mapaOffline || !this.mapaOffline.userLocation) {
            alert('Posição atual não disponível');
            return;
        }

        const pos = this.mapaOffline.userLocation;
        if (this.elements.originCoords) {
            this.elements.originCoords.value = `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`;
        }
    }

    // Definir destino da rota
    setRouteDestination() {
        if (!this.mapaOffline || !this.mapaOffline.userLocation) {
            alert('Posição atual não disponível');
            return;
        }

        const pos = this.mapaOffline.userLocation;
        if (this.elements.destCoords) {
            this.elements.destCoords.value = `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`;
        }
    }

    // Calcular rota
    calculateRoute() {
        const originText = this.elements.originCoords?.value;
        const destText = this.elements.destCoords?.value;

        if (!originText || !destText) {
            alert('Defina origem e destino');
            return;
        }

        try {
            const origin = this.parseCoordinates(originText);
            const dest = this.parseCoordinates(destText);

            if (!origin || !dest) {
                alert('Coordenadas inválidas');
                return;
            }

            // Criar rota simples (linha reta)
            this.mapaOffline.currentRoute = [
                { lat: origin.lat, lng: origin.lng },
                { lat: dest.lat, lng: dest.lng }
            ];

            this.mapaOffline.drawRoute();

            // Centralizar mapa na rota
            const bounds = L.latLngBounds([origin, dest]);
            this.mapaOffline.map.fitBounds(bounds, { padding: [50, 50] });

            alert('Rota calculada com sucesso!');

        } catch (error) {
            console.error('Erro ao calcular rota:', error);
            alert('Erro ao calcular rota');
        }
    }

    // Limpar rota
    clearRoute() {
        if (!this.mapaOffline) return;

        this.mapaOffline.currentRoute = [];
        if (this.mapaOffline.routeLayer) {
            this.mapaOffline.routeLayer.clearLayers();
        }

        if (this.elements.originCoords) this.elements.originCoords.value = '';
        if (this.elements.destCoords) this.elements.destCoords.value = '';

        alert('Rota limpa');
    }

    // Parse coordenadas
    parseCoordinates(text) {
        const parts = text.split(',');
        if (parts.length !== 2) return null;

        const lat = parseFloat(parts[0].trim());
        const lng = parseFloat(parts[1].trim());

        if (isNaN(lat) || isNaN(lng)) return null;

        return { lat, lng };
    }

    // Atualizar tipo de veículo
    updateVehicleType(vehicleType) {
        if (!this.mapaOffline) return;

        // Atualizar informações do modo de transporte
        const modeInfo = document.getElementById('transport-mode-info');
        if (modeInfo) {
            const modeIcon = modeInfo.querySelector('#mode-icon');
            const modeName = modeInfo.querySelector('#mode-name');
            const modeDesc = modeInfo.querySelector('#mode-description');

            // Atualizar com base no tipo de veículo
            const vehicleInfo = this.getVehicleInfo(vehicleType);
            if (modeIcon) modeIcon.textContent = vehicleInfo.icon;
            if (modeName) modeName.textContent = vehicleInfo.name;
            if (modeDesc) modeDesc.textContent = vehicleInfo.description;
        }
    }

    // Obter informações do veículo
    getVehicleInfo(vehicleType) {
        const vehicles = {
            'ape': { icon: '🚶', name: 'A Pé', description: 'Foco em trilhas e caminhadas' },
            'sport': { icon: '🚗', name: 'Carro Esportivo', description: 'Foco em estradas asfaltadas' },
            'suv-urban': { icon: '🚙', name: 'SUV Urbano', description: 'Versátil para cidade e estradas' },
            'suv-offroad-1': { icon: '🚙', name: 'SUV Off-Road 1', description: 'Capacidade off-road média' },
            'suv-offroad-2': { icon: '🚙', name: 'SUV Off-Road 2', description: 'Capacidade off-road avançada' },
            'moto-adventure': { icon: '🏍️', name: 'Moto Adventure', description: 'Ágil para trilhas e estradas' },
            'jeep-open': { icon: '🚗', name: 'Jeep Aberto', description: 'Off-road com visibilidade ampla' },
            'pickup-4x4': { icon: '🚚', name: 'Caminhonete 4x4', description: 'Carga e off-road' },
            'expedition': { icon: '🚐', name: 'Veículo de Expedição', description: 'Máxima capacidade off-road' }
        };

        return vehicles[vehicleType] || vehicles['ape'];
    }

    // Toggle hodômetro
    toggleOdometer() {
        if (!this.mapaOffline) return;

        // Implementar lógica do hodômetro
        if (this.elements.odoStartStop.textContent.includes('Iniciar')) {
            this.elements.odoStartStop.textContent = '⏸️ Pausar';
            this.elements.odoStartStop.classList.add('active');
            if (this.elements.odoStatus) {
                this.elements.odoStatus.textContent = 'Hodômetro ativo';
                this.elements.odoStatus.className = 'status-text success';
            }
        } else {
            this.elements.odoStartStop.textContent = '▶️ Iniciar';
            this.elements.odoStartStop.classList.remove('active');
            if (this.elements.odoStatus) {
                this.elements.odoStatus.textContent = 'Hodômetro pausado';
                this.elements.odoStatus.className = 'status-text muted';
            }
        }
    }

    // Resetar hodômetro
    resetOdometer() {
        if (this.elements.odoValue) {
            this.elements.odoValue.textContent = '0,00 km';
        }
        if (this.elements.odoStatus) {
            this.elements.odoStatus.textContent = 'Hodômetro zerado';
            this.elements.odoStatus.className = 'status-text info';
        }
    }

    // Exportar hodômetro
    exportOdometer() {
        const data = {
            distance: this.elements.odoValue?.textContent || '0,00 km',
            timestamp: new Date().toISOString(),
            vehicle: this.elements.vehicleSelect?.value || 'unknown'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `odometer_${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);
    }

    // Salvar condição da via
    saveRoadCondition() {
        const roadType = this.elements.roadType?.value;
        const roadSeverity = this.elements.roadSeverity?.value;
        const roadDesc = this.elements.roadDesc?.value;
        const lat = this.elements.lat?.value;
        const lon = this.elements.lon?.value;

        if (!lat || !lon) {
            alert('Clique no mapa para definir a localização');
            return;
        }

        const roadData = {
            type: roadType,
            severity: roadSeverity,
            description: roadDesc,
            position: { lat: parseFloat(lat), lng: parseFloat(lon) },
            timestamp: Date.now()
        };

        // Adicionar ao mapa como waypoint especial
        if (this.mapaOffline.waypointManager) {
            this.mapaOffline.waypointManager.addWaypoint({
                name: `Condição da Via: ${roadType}`,
                position: roadData.position,
                type: 'DANGER',
                description: `${roadSeverity}: ${roadDesc}`
            });
        }

        // Limpar formulário
        if (this.elements.roadDesc) this.elements.roadDesc.value = '';
        if (this.elements.lat) this.elements.lat.value = '';
        if (this.elements.lon) this.elements.lon.value = '';

        alert('Condição da via salva com sucesso!');
    }

    // Usar GPS para condição da via
    useGPSForRoad() {
        if (!this.mapaOffline || !this.mapaOffline.userLocation) {
            alert('Posição GPS não disponível');
            return;
        }

        const pos = this.mapaOffline.userLocation;
        if (this.elements.lat) this.elements.lat.value = pos.lat.toFixed(6);
        if (this.elements.lon) this.elements.lon.value = pos.lng.toFixed(6);
    }

    // Salvar marcador
    saveMarker() {
        const lat = this.elements.lat2?.value;
        const lon = this.elements.lon2?.value;
        const privacy = this.elements.privacy?.value;
        const desc = this.elements.desc?.value;

        if (!lat || !lon) {
            alert('Clique no mapa para definir a localização');
            return;
        }

        const markerData = {
            name: 'Marcador Personalizado',
            position: { lat: parseFloat(lat), lng: parseFloat(lon) },
            type: 'DEFAULT',
            description: desc,
            privacy: privacy,
            timestamp: Date.now()
        };

        // Adicionar ao mapa
        if (this.mapaOffline.waypointManager) {
            this.mapaOffline.waypointManager.addWaypoint(markerData);
        }

        // Limpar formulário
        this.clearMarker();

        alert('Marcador salvo com sucesso!');
    }

    // Limpar marcador
    clearMarker() {
        if (this.elements.lat2) this.elements.lat2.value = '';
        if (this.elements.lon2) this.elements.lon2.value = '';
        if (this.elements.desc) this.elements.desc.value = '';
        if (this.elements.privacy) this.elements.privacy.value = 'public';
        if (this.elements.imgPreview) this.elements.imgPreview.innerHTML = '';
        if (this.elements.image) this.elements.image.value = '';
    }

    // Preview de imagem
    previewImage(file) {
        if (!file || !this.elements.imgPreview) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.elements.imgPreview.innerHTML = 
                `<img src="${e.target.result}" style="max-width: 100%; max-height: 200px; border-radius: 8px;">`;
        };
        reader.readAsDataURL(file);
    }

    // Carregar arquivo GeoData
    loadGeoDataFile(file) {
        if (!this.mapaOffline) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.processGeoData(data);
            } catch (error) {
                alert('Erro ao ler arquivo GeoJSON');
            }
        };
        reader.readAsText(file);
    }

    // Adicionar GeoData do texto
    addGeoDataText() {
        const text = this.elements.gdvText?.value;
        if (!text) {
            alert('Cole o GeoJSON no campo acima');
            return;
        }

        try {
            const data = JSON.parse(text);
            this.processGeoData(data);
            this.elements.gdvText.value = '';
        } catch (error) {
            alert('GeoJSON inválido');
        }
    }

    // Processar GeoData
    processGeoData(data) {
        if (!this.mapaOffline || !data.type) {
            alert('Formato GeoJSON inválido');
            return;
        }

        // Adicionar features como waypoints
        if (data.type === 'FeatureCollection' && data.features) {
            data.features.forEach((feature, index) => {
                if (feature.geometry && feature.geometry.coordinates) {
                    const coords = feature.geometry.coordinates;
                    const position = {
                        lat: coords[1],
                        lng: coords[0]
                    };

                    this.mapaOffline.waypointManager.addWaypoint({
                        name: feature.properties?.name || `GeoData ${index + 1}`,
                        position: position,
                        type: 'DEFAULT',
                        description: feature.properties?.description || ''
                    });
                }
            });

            alert(`${data.features.length} features adicionadas ao mapa!`);
        }
    }

    // Limpar GeoData
    clearGeoData() {
        if (this.elements.gdvText) this.elements.gdvText.value = '';
        if (this.elements.gdvFile) this.elements.gdvFile.value = '';
        
        // Limpar layers de GeoData se existirem
        if (this.mapaOffline && this.mapaOffline.dataLayers) {
            this.mapaOffline.dataLayers.forEach(layer => {
                this.mapaOffline.map.removeLayer(layer);
            });
            this.mapaOffline.dataLayers = [];
        }

        alert('GeoData limpo');
    }

    // Mostrar painel de configurações híbridas
    showHybridSettings() {
        if (this.elements.hybridSettingsPanel) {
            this.elements.hybridSettingsPanel.classList.add('visible');
            this.loadHybridSettings();
        }
    }

    // Esconder painel de configurações híbridas
    hideHybridSettings() {
        if (this.elements.hybridSettingsPanel) {
            this.elements.hybridSettingsPanel.classList.remove('visible');
        }
    }

    // Carregar configurações híbridas
    loadHybridSettings() {
        if (!window.mapaFusion) return;

        const settings = window.mapaFusion.fusionState;
        
        // Atualizar modo
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === window.mapaFusion.currentMode);
        });

        // Atualizar toggle de auto-switch
        const autoSwitchToggle = document.getElementById('auto-switch-toggle');
        if (autoSwitchToggle) {
            autoSwitchToggle.classList.toggle('active', settings.autoSwitch);
        }

        // Atualizar slider de cache
        const cacheSlider = document.getElementById('cache-size-slider');
        const cacheValue = document.getElementById('cache-size-value');
        if (cacheSlider && cacheValue) {
            cacheSlider.value = settings.cacheSize;
            cacheValue.textContent = `${settings.cacheSize} tiles`;
        }

        // Atualizar qualidade online
        const qualitySelect = document.getElementById('online-quality-select');
        if (qualitySelect) {
            qualitySelect.value = settings.onlineQuality;
        }

        // Atualizar intervalo de sincronização
        const syncSelect = document.getElementById('sync-interval-select');
        if (syncSelect) {
            syncSelect.value = settings.syncInterval;
        }
    }

    // Salvar configurações híbridas
    saveHybridSettings() {
        if (!window.mapaFusion) return;

        // Obter valores do formulário
        const mode = document.querySelector('.mode-btn.active')?.dataset.mode || 'hybrid';
        const autoSwitch = document.getElementById('auto-switch-toggle')?.classList.contains('active') ?? true;
        const cacheSize = parseInt(document.getElementById('cache-size-slider')?.value) || 1000;
        const onlineQuality = document.getElementById('online-quality-select')?.value || 'medium';
        const syncInterval = parseInt(document.getElementById('sync-interval-select')?.value) || 30000;

        // Atualizar configurações
        window.mapaFusion.currentMode = mode;
        window.mapaFusion.fusionState.autoSwitch = autoSwitch;
        window.mapaFusion.fusionState.cacheSize = cacheSize;
        window.mapaFusion.fusionState.onlineQuality = onlineQuality;
        window.mapaFusion.fusionState.syncInterval = syncInterval;

        // Salvar no localStorage
        window.mapaFusion.saveSettings();

        // Aplicar mudanças
        window.mapaFusion.updateLayerVisibility();
        window.mapaFusion.updateUI();

        alert('Configurações híbridas salvas com sucesso!');
        this.hideHybridSettings();
    }

    // Resetar configurações híbridas
    resetHybridSettings() {
        if (!window.mapaFusion) return;

        // Resetar para valores padrão
        window.mapaFusion.currentMode = 'hybrid';
        window.mapaFusion.fusionState = {
            onlineQuality: 'high',
            offlineQuality: 'medium',
            autoSwitch: true,
            cacheSize: 1000,
            syncInterval: 30000,
            lastSync: null,
            pendingUpdates: []
        };

        // Salvar e aplicar
        window.mapaFusion.saveSettings();
        window.mapaFusion.updateLayerVisibility();
        window.mapaFusion.updateUI();

        // Recarregar UI do painel
        this.loadHybridSettings();

        alert('Configurações híbridas resetadas para os valores padrão!');
    }

    // Destruir integração
    destroy() {
        this.isInitialized = false;
        this.eventListeners.clear();
        console.log('🗑️ Integração do mapa offline destruída');
    }
}

// Inicializar integração automaticamente quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um pouco para garantir que o mapa offline foi inicializado
    setTimeout(() => {
        window.mapaIntegration = new MapaOfflineIntegration();
        
        // Configurar event listeners para controles híbridos adicionais
        setupHybridEventListeners();
    }, 1000);
});

// Configurar event listeners para controles híbridos
function setupHybridEventListeners() {
    // Event listeners para botões de modo no painel de configurações
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const mode = e.target.dataset.mode;
            if (window.mapaFusion) {
                window.mapaFusion.switchMode(mode);
                
                // Atualizar UI
                document.querySelectorAll('.mode-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.mode === mode);
                });
            }
        });
    });

    // Event listener para slider de cache
    const cacheSlider = document.getElementById('cache-size-slider');
    const cacheValue = document.getElementById('cache-size-value');
    
    if (cacheSlider && cacheValue) {
        cacheSlider.addEventListener('input', (e) => {
            cacheValue.textContent = `${e.target.value} tiles`;
        });
    }

    // Event listeners para toggles
    document.querySelectorAll('.hybrid-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
        });
    });
}

// Exportar para uso global
window.MapaOfflineIntegration = MapaOfflineIntegration;
