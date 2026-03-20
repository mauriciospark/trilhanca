// Sistema de Biblioteca de Mapas - Gerenciamento Completo
class MapLibrary {
    constructor() {
        this.maps = [];
        this.storageKey = 'trilhanca_map_library';
        this.maxMaps = 50;
        this.supportedFormats = ['.json', '.geojson', '.kml', '.gpx'];
        
        this.init();
    }

    init() {
        this.loadMaps();
        this.bindEvents();
        this.setupDragAndDrop();
        this.updateUI();
    }

    // Carregar mapas do localStorage
    loadMaps() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.maps = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Erro ao carregar mapas:', error);
            this.maps = [];
        }
    }

    // Salvar mapas no localStorage
    saveMaps() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.maps));
        } catch (error) {
            console.error('Erro ao salvar mapas:', error);
            this.showNotification('Erro ao salvar mapas no armazenamento local', 'error');
        }
    }

    // Vincular eventos
    bindEvents() {
        // Adicionar mapa por URL
        document.getElementById('add-library-map')?.addEventListener('click', () => {
            this.addMapFromURL();
        });

        // Upload de arquivo
        document.getElementById('upload-map-file')?.addEventListener('click', () => {
            document.getElementById('library-map-file')?.click();
        });

        // Processar arquivo selecionado
        document.getElementById('library-map-file')?.addEventListener('change', (e) => {
            this.handleFileUpload(e);
        });

        // Gerenciar biblioteca
        document.getElementById('manage-library')?.addEventListener('click', () => {
            this.openManageModal();
        });

        // Abrir biblioteca
        document.getElementById('open-library')?.addEventListener('click', () => {
            this.openLibraryModal();
        });

        // Exportar biblioteca
        document.getElementById('export-library')?.addEventListener('click', () => {
            this.exportLibrary();
        });

        // Enter no input de URL
        document.getElementById('library-map-url')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addMapFromURL();
            }
        });
    }

    // Configurar drag and drop
    setupDragAndDrop() {
        const listContainer = document.getElementById('saved-maps-list');
        if (!listContainer) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            listContainer.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            listContainer.addEventListener(eventName, () => {
                listContainer.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            listContainer.addEventListener(eventName, () => {
                listContainer.classList.remove('drag-over');
            }, false);
        });

        listContainer.addEventListener('drop', (e) => {
            this.handleDrop(e);
        }, false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Adicionar mapa por URL
    async addMapFromURL() {
        const urlInput = document.getElementById('library-map-url');
        const nameInput = document.getElementById('library-map-name');
        const url = urlInput?.value.trim();
        const customName = nameInput?.value.trim();

        if (!url) {
            this.showNotification('Digite uma URL válida', 'warning');
            return;
        }

        try {
            // Validar URL
            new URL(url);
            
            const mapData = {
                id: this.generateId(),
                name: customName || this.extractNameFromURL(url),
                url: url,
                type: 'url',
                format: this.detectFormat(url),
                addedAt: new Date().toISOString(),
                description: `Mapa adicionado via URL: ${url}`
            };

            await this.addMap(mapData);
            
            // Limpar inputs
            urlInput.value = '';
            if (customName) nameInput.value = '';
            
            this.showNotification('Mapa adicionado com sucesso!', 'success');
            
        } catch (error) {
            this.showNotification('URL inválida', 'error');
        }
    }

    // Processar upload de arquivo
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validar formato
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!this.supportedFormats.includes(fileExtension)) {
            this.showNotification(`Formato não suportado. Use: ${this.supportedFormats.join(', ')}`, 'error');
            return;
        }

        try {
            const content = await this.readFile(file);
            const mapData = {
                id: this.generateId(),
                name: file.name.replace(fileExtension, ''),
                content: content,
                type: 'file',
                format: fileExtension,
                size: file.size,
                addedAt: new Date().toISOString(),
                description: `Mapa carregado do arquivo: ${file.name}`
            };

            await this.addMap(mapData);
            this.showNotification('Arquivo carregado com sucesso!', 'success');
            
        } catch (error) {
            this.showNotification('Erro ao ler o arquivo', 'error');
        }

        // Limpar input
        event.target.value = '';
    }

    // Processar drag and drop
    async handleDrop(event) {
        const files = event.dataTransfer.files;
        if (!files.length) return;

        for (let file of files) {
            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
            if (!this.supportedFormats.includes(fileExtension)) {
                this.showNotification(`Formato não suportado: ${file.name}`, 'warning');
                continue;
            }

            try {
                const content = await this.readFile(file);
                const mapData = {
                    id: this.generateId(),
                    name: file.name.replace(fileExtension, ''),
                    content: content,
                    type: 'file',
                    format: fileExtension,
                    size: file.size,
                    addedAt: new Date().toISOString(),
                    description: `Mapa arrastado: ${file.name}`
                };

                await this.addMap(mapData);
                
            } catch (error) {
                this.showNotification(`Erro ao processar ${file.name}`, 'error');
            }
        }

        if (files.length > 0) {
            this.showNotification(`${files.length} mapa(s) adicionado(s) com sucesso!`, 'success');
        }
    }

    // Ler arquivo
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    // Adicionar mapa à biblioteca
    async addMap(mapData) {
        // Verificar limite
        if (this.maps.length >= this.maxMaps) {
            this.showNotification(`Limite de ${this.maxMaps} mapas atingido`, 'warning');
            return;
        }

        // Verificar duplicados
        const exists = this.maps.some(map => 
            map.name === mapData.name || 
            (map.url && map.url === mapData.url)
        );

        if (exists) {
            this.showNotification('Este mapa já existe na biblioteca', 'warning');
            return;
        }

        // Validar conteúdo se for arquivo
        if (mapData.type === 'file' && mapData.content) {
            try {
                JSON.parse(mapData.content);
            } catch (error) {
                this.showNotification('Arquivo JSON inválido', 'error');
                return;
            }
        }

        this.maps.unshift(mapData);
        this.saveMaps();
        this.updateUI();
    }

    // Remover mapa
    removeMap(mapId) {
        if (!confirm('Tem certeza que deseja remover este mapa?')) return;

        this.maps = this.maps.filter(map => map.id !== mapId);
        this.saveMaps();
        this.updateUI();
        this.showNotification('Mapa removido com sucesso', 'info');
    }

    // Carregar mapa no mapa principal
    async loadMap(mapId) {
        const map = this.maps.find(m => m.id === mapId);
        if (!map) return;

        try {
            // Limpar camadas anteriores se solicitado
            if (confirm('Deseja limpar as camadas atuais antes de carregar este mapa?')) {
                this.clearCurrentLayers();
            }

            if (map.type === 'url') {
                // Carregar via URL
                await this.loadMapFromURL(map.url, map.name);
            } else if (map.type === 'file') {
                // Carregar do conteúdo
                this.loadMapFromContent(map.content, map.name, map.format);
            }
            
            this.showNotification(`Mapa "${map.name}" carregado com sucesso!`, 'success');
            
        } catch (error) {
            console.error('Erro ao carregar mapa:', error);
            this.showNotification('Erro ao carregar mapa: ' + error.message, 'error');
        }
    }

    // Limpar camadas atuais
    clearCurrentLayers() {
        if (!window.map) return;
        
        // Remover todas as camadas exceto a base
        window.map.eachLayer((layer) => {
            if (layer instanceof L.GeoJSON || layer instanceof L.LayerGroup) {
                window.map.removeLayer(layer);
            }
        });
        
        this.showNotification('Camadas anteriores removidas', 'info');
    }

    // Carregar mapa da URL
    async loadMapFromURL(url, name) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            let data;

            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    throw new Error('Resposta não é um JSON válido');
                }
            }

            // Validar estrutura GeoJSON
            if (!this.validateGeoJSON(data)) {
                throw new Error('Formato GeoJSON inválido');
            }

            // Adicionar ao mapa
            const layer = L.geoJSON(data, {
                style: (feature) => {
                    return {
                        color: this.getRandomColor(),
                        weight: 2,
                        opacity: 0.8,
                        fillOpacity: 0.3
                    };
                },
                pointToLayer: (feature, latlng) => {
                    return L.circleMarker(latlng, {
                        radius: 6,
                        fillColor: this.getRandomColor(),
                        color: '#fff',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.8
                    });
                },
                onEachFeature: (feature, layer) => {
                    // Adicionar popup com informações
                    if (feature.properties) {
                        const popupContent = this.createPopupContent(feature.properties);
                        layer.bindPopup(popupContent);
                    }
                }
            });

            layer.addTo(window.map);
            
            // Ajustar zoom para mostrar todo o mapa
            if (layer.getBounds && layer.getBounds().isValid()) {
                window.map.fitBounds(layer.getBounds(), { padding: [20, 20] });
            }

            // Adicionar ao controle de camadas
            this.addToLayerControl(layer, name);

        } catch (error) {
            throw new Error(`Falha ao carregar mapa da URL: ${error.message}`);
        }
    }

    // Carregar mapa do conteúdo
    loadMapFromContent(content, name, format) {
        try {
            let data;
            
            if (format === '.json' || format === '.geojson') {
                data = JSON.parse(content);
            } else if (format === '.kml') {
                data = this.parseKML(content);
            } else if (format === '.gpx') {
                data = this.parseGPX(content);
            }

            // Validar estrutura GeoJSON
            if (!this.validateGeoJSON(data)) {
                throw new Error('Formato de arquivo inválido');
            }

            // Adicionar ao mapa
            const layer = L.geoJSON(data, {
                style: (feature) => {
                    return {
                        color: this.getRandomColor(),
                        weight: 2,
                        opacity: 0.8,
                        fillOpacity: 0.3
                    };
                },
                pointToLayer: (feature, latlng) => {
                    return L.circleMarker(latlng, {
                        radius: 6,
                        fillColor: this.getRandomColor(),
                        color: '#fff',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.8
                    });
                },
                onEachFeature: (feature, layer) => {
                    // Adicionar popup com informações
                    if (feature.properties) {
                        const popupContent = this.createPopupContent(feature.properties);
                        layer.bindPopup(popupContent);
                    }
                }
            });

            layer.addTo(window.map);
            
            // Ajustar zoom para mostrar todo o mapa
            if (layer.getBounds && layer.getBounds().isValid()) {
                window.map.fitBounds(layer.getBounds(), { padding: [20, 20] });
            }

            // Adicionar ao controle de camadas
            this.addToLayerControl(layer, name);

        } catch (error) {
            throw new Error(`Falha ao processar conteúdo do mapa: ${error.message}`);
        }
    }

    // Validar estrutura GeoJSON
    validateGeoJSON(data) {
        if (!data || typeof data !== 'object') return false;
        
        if (data.type === 'FeatureCollection') {
            return Array.isArray(data.features);
        } else if (data.type === 'Feature') {
            return data.geometry && data.properties;
        } else if (['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon'].includes(data.type)) {
            return data.coordinates;
        }
        
        return false;
    }

    // Criar conteúdo do popup
    createPopupContent(properties) {
        let content = '<div style="max-width: 200px;">';
        
        Object.keys(properties).forEach(key => {
            const value = properties[key];
            if (value !== null && value !== undefined) {
                content += `<div><strong>${key}:</strong> ${value}</div>`;
            }
        });
        
        content += '</div>';
        return content;
    }

    // Adicionar ao controle de camadas
    addToLayerControl(layer, name) {
        // Criar controle de camadas se não existir
        if (!window.layerControl) {
            window.layerControl = L.control.layers(null, null, {
                position: 'topright',
                collapsed: false
            }).addTo(window.map);
        }
        
        // Adicionar camada ao controle
        window.layerControl.addOverlay(layer, name);
    }

    // Gerar cor aleatória para camadas
    getRandomColor() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
            '#F8B739', '#52B788', '#FF6B9D', '#C9E4CA', '#55CBCD'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Atualizar interface
    updateUI() {
        this.renderMapsList();
        this.updateCounter();
    }

    // Renderizar lista de mapas
    renderMapsList() {
        const container = document.getElementById('saved-maps-list');
        if (!container) return;

        if (this.maps.length === 0) {
            container.innerHTML = `
                <div class="empty-maps">
                    <i class="fas fa-map-marked-alt" style="font-size: 2rem; color: #666; margin-bottom: 10px;"></i>
                    <div style="color: #999; font-size: 0.85rem;">Nenhum mapa salvo</div>
                    <div style="color: #666; font-size: 0.75rem; margin-top: 5px;">Adicione mapas usando URL, upload ou arrastando arquivos</div>
                </div>
            `;
            return;
        }

        const mapsHTML = this.maps.map(map => `
            <div class="map-item" data-id="${map.id}">
                <div class="map-item-info">
                    <div class="map-item-name">
                        <i class="fas fa-${this.getMapIcon(map.format)}"></i>
                        ${map.name}
                    </div>
                    <div class="map-item-type">${map.format.toUpperCase()}</div>
                    <div class="map-item-date">${this.formatDate(map.addedAt)}</div>
                </div>
                <div class="map-item-actions">
                    <button class="map-item-btn load" onclick="mapLibrary.loadMap('${map.id}')" title="Carregar mapa">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="map-item-btn delete" onclick="mapLibrary.removeMap('${map.id}')" title="Remover mapa">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = mapsHTML;
    }

    // Atualizar contador
    updateCounter() {
        const counter = document.getElementById('maps-count');
        if (counter) {
            counter.textContent = this.maps.length;
        }
    }

    // Abrir modal de gerenciamento
    openManageModal() {
        // Implementar modal de gerenciamento avançado
        this.showNotification('Modal de gerenciamento em desenvolvimento', 'info');
    }

    // Abrir modal da biblioteca
    openLibraryModal() {
        // Implementar modal completa da biblioteca
        this.showNotification('Modal da biblioteca em desenvolvimento', 'info');
    }

    // Exportar biblioteca
    exportLibrary() {
        if (this.maps.length === 0) {
            this.showNotification('Nenhum mapa para exportar', 'warning');
            return;
        }

        const exportData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            maps: this.maps
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `trilhanca-maps-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('Biblioteca exportada com sucesso!', 'success');
    }

    // Utilitários
    generateId() {
        return 'map_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    extractNameFromURL(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            return pathname.split('/').pop().replace(/\.(json|geojson|kml|gpx)$/i, '') || 'Mapa sem nome';
        } catch {
            return 'Mapa da URL';
        }
    }

    detectFormat(url) {
        const extension = url.split('.').pop().toLowerCase();
        if (['json', 'geojson'].includes(extension)) return '.geojson';
        if (['kml'].includes(extension)) return '.kml';
        if (['gpx'].includes(extension)) return '.gpx';
        return '.json';
    }

    getMapIcon(format) {
        const icons = {
            '.json': 'file-code',
            '.geojson': 'map',
            '.kml': 'globe',
            '.gpx': 'route'
        };
        return icons[format] || 'file';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    showNotification(message, type = 'info') {
        // Criar notificação
        const notification = document.createElement('div');
        notification.className = `map-library-notification map-library-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Estilos
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ff8a34' : '#007bff'};
            color: white;
            border-radius: 8px;
            font-size: 0.9rem;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remover após 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Parsers básicos (implementações simples)
    parseKML(content) {
        // Implementar parser KML básico
        return { type: 'FeatureCollection', features: [] };
    }

    parseGPX(content) {
        // Implementar parser GPX básico
        return { type: 'FeatureCollection', features: [] };
    }
}

// Adicionar estilos para a biblioteca
const libraryStyles = document.createElement('style');
libraryStyles.textContent = `
    .map-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: rgba(255,255,255,0.05);
        border-radius: 6px;
        margin-bottom: 8px;
        border: 1px solid rgba(255,255,255,0.1);
        transition: all 0.2s ease;
    }
    
    .map-item:hover {
        background: rgba(0,123,255,0.1);
        border-color: rgba(0,123,255,0.3);
    }
    
    .map-item-info {
        flex: 1;
        min-width: 0;
    }
    
    .map-item-name {
        font-weight: 500;
        color: #fff;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .map-item-type {
        font-size: 0.75rem;
        color: #999;
        background: rgba(255,255,255,0.1);
        padding: 2px 6px;
        border-radius: 4px;
        display: inline-block;
        margin-bottom: 2px;
    }
    
    .map-item-date {
        font-size: 0.7rem;
        color: #666;
    }
    
    .map-item-actions {
        display: flex;
        gap: 4px;
    }
    
    .map-item-btn {
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        color: #fff;
        width: 32px;
        height: 32px;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
    }
    
    .map-item-btn:hover {
        background: rgba(255,255,255,0.2);
    }
    
    .map-item-btn.load:hover {
        background: rgba(40,167,69,0.2);
        border-color: rgba(40,167,69,0.4);
    }
    
    .map-item-btn.delete:hover {
        background: rgba(220,53,69,0.2);
        border-color: rgba(220,53,69,0.4);
    }
    
    .drag-over {
        background: rgba(0,123,255,0.1) !important;
        border: 2px dashed rgba(0,123,255,0.5) !important;
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(libraryStyles);

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.mapLibrary = new MapLibrary();
});

// Exportar para uso global
window.MapLibrary = MapLibrary;
