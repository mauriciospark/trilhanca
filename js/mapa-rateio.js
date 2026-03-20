// ========================
   SISTEMA DE RATEIO DE MAPA - TRILHANÇA v2.1
   Divide o mapa em tiles e regiões para processamento distribuído
   ========================

class MapaRateio {
    constructor(map) {
        this.map = map;
        this.tiles = new Map();
        this.regions = new Map();
        this.currentTileLayer = null;
        this.highlightedTile = null;
        this.config = {
            tileSize: 256, // pixels
            maxZoom: 18,
            minZoom: 1,
            tileGrid: true,
            showCoordinates: true,
            colorScheme: 'default',
            exportFormat: 'json'
        };
        
        this.init();
    }

    // Inicializar sistema de rateio
    init() {
        console.log('🗺️ Inicializando sistema de rateio de mapa...');
        
        // Criar controles de rateio
        this.createRateioControls();
        
        // Configurar eventos
        this.setupRateioEvents();
        
        console.log('✅ Sistema de rateio inicializado');
    }

    // Criar controles de rateio
    createRateioControls() {
        const rateioControl = L.control({ position: 'topright' });
        
        rateioControl.onAdd = () => {
            const div = L.DomUtil.create('div', 'rateio-control');
            div.innerHTML = `
                <div class="rateio-header">
                    <h4>🗺️ Rateio do Mapa</h4>
                </div>
                <div class="rateio-controls">
                    <div class="control-group">
                        <label>Zoom:</label>
                        <input type="range" id="rateio-zoom" min="1" max="18" value="13">
                        <span id="rateio-zoom-value">13</span>
                    </div>
                    <div class="control-group">
                        <label>Tamanho do Tile:</label>
                        <select id="rateio-tile-size">
                            <option value="128">128x128</option>
                            <option value="256" selected>256x256</option>
                            <option value="512">512x512</option>
                            <option value="1024">1024x1024</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <label>Esquema de Cores:</label>
                        <select id="rateio-colors">
                            <option value="default">Padrão</option>
                            <option value="terrain">Terreno</option>
                            <option value="satellite">Satélite</option>
                            <option value="heatmap">Mapa de Calor</option>
                        </select>
                    </div>
                    <div class="control-actions">
                        <button id="rateio-generate" class="btn primary">🔄 Gerar Rateio</button>
                        <button id="rateio-clear" class="btn">🗑️ Limpar</button>
                        <button id="rateio-export" class="btn">📥 Exportar</button>
                    </div>
                    <div class="control-group">
                        <label>
                            <input type="checkbox" id="rateio-grid" checked>
                            Mostrar Grade
                        </label>
                        <label>
                            <input type="checkbox" id="rateio-coords" checked>
                            Mostrar Coordenadas
                        </label>
                    </div>
                </div>
                <div class="rateio-info">
                    <div class="info-item">
                        <span class="label">Tiles:</span>
                        <span class="value" id="rateio-tiles-count">0</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Área:</span>
                        <span class="value" id="rateio-area">0 km²</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Tile Atual:</span>
                        <span class="value" id="rateio-current-tile">-</span>
                    </div>
                </div>
            `;
            
            return div;
        };
        
        rateioControl.addTo(this.map);
    }

    // Configurar eventos de rateio
    setupRateioEvents() {
        // Evento de zoom
        document.getElementById('rateio-zoom').addEventListener('input', (e) => {
            document.getElementById('rateio-zoom-value').textContent = e.target.value;
            this.config.maxZoom = parseInt(e.target.value);
        });

        // Evento de tamanho do tile
        document.getElementById('rateio-tile-size').addEventListener('change', (e) => {
            this.config.tileSize = parseInt(e.target.value);
        });

        // Evento de esquema de cores
        document.getElementById('rateio-colors').addEventListener('change', (e) => {
            this.config.colorScheme = e.target.value;
            this.updateTileColors();
        });

        // Evento de mostrar grade
        document.getElementById('rateio-grid').addEventListener('change', (e) => {
            this.config.tileGrid = e.target.checked;
            this.updateTileGrid();
        });

        // Evento de mostrar coordenadas
        document.getElementById('rateio-coords').addEventListener('change', (e) => {
            this.config.showCoordinates = e.target.checked;
            this.updateTileLabels();
        });

        // Evento de gerar rateio
        document.getElementById('rateio-generate').addEventListener('click', () => {
            this.generateRateio();
        });

        // Evento de limpar
        document.getElementById('rateio-clear').addEventListener('click', () => {
            this.clearRateio();
        });

        // Evento de exportar
        document.getElementById('rateio-export').addEventListener('click', () => {
            this.exportRateio();
        });

        // Evento de clique no mapa
        this.map.on('click', (e) => {
            this.onMapClick(e);
        });

        // Evento de movimento do mouse
        this.map.on('mousemove', (e) => {
            this.onMapMouseMove(e);
        });
    }

    // Gerar rateio do mapa
    generateRateio() {
        console.log('🔄 Gerando rateio do mapa...');
        
        // Limpar rateio anterior
        this.clearRateio();
        
        // Obter bounds visíveis do mapa
        const bounds = this.map.getBounds();
        const zoom = this.map.getZoom();
        
        // Calcular tiles visíveis
        const tiles = this.calculateTiles(bounds, zoom);
        
        // Criar layer de tiles
        this.currentTileLayer = L.layerGroup().addTo(this.map);
        
        // Gerar cada tile
        tiles.forEach(tile => {
            this.createTile(tile);
        });
        
        // Atualizar informações
        this.updateRateioInfo(tiles);
        
        console.log(`✅ Rateio gerado: ${tiles.length} tiles`);
    }

    // Calcular tiles para uma área
    calculateTiles(bounds, zoom) {
        const tiles = [];
        
        // Converter bounds para coordenadas de tile
        const minTile = this.latLngToTile(bounds.getSouth(), bounds.getWest(), zoom);
        const maxTile = this.latLngToTile(bounds.getNorth(), bounds.getEast(), zoom);
        
        // Gerar tiles no intervalo
        for (let x = minTile.x; x <= maxTile.x; x++) {
            for (let y = minTile.y; y <= maxTile.y; y++) {
                const tileBounds = this.tileToBounds(x, y, zoom);
                tiles.push({
                    x: x,
                    y: y,
                    z: zoom,
                    bounds: tileBounds,
                    center: tileBounds.getCenter(),
                    id: `${zoom}/${x}/${y}`
                });
            }
        }
        
        return tiles;
    }

    // Converter lat/lng para coordenadas de tile
    latLngToTile(lat, lng, zoom) {
        const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
        const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
        
        return { x, y };
    }

    // Converter coordenadas de tile para bounds
    tileToBounds(x, y, zoom) {
        const n = Math.pow(2, zoom);
        const x1 = (x / n) * 360 - 180;
        const x2 = ((x + 1) / n) * 360 - 180;
        
        const lat1 = this.tileToLat(y, zoom);
        const lat2 = this.tileToLat(y + 1, zoom);
        
        return L.latLngBounds([lat1, x1], [lat2, x2]);
    }

    // Converter coordenada de tile para latitude
    tileToLat(y, zoom) {
        const n = Math.PI - 2 * Math.PI * y / Math.pow(2, zoom);
        return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
    }

    // Criar tile visual
    createTile(tile) {
        const color = this.getTileColor(tile);
        const bounds = tile.bounds;
        
        // Criar retângulo do tile
        const rectangle = L.rectangle(bounds, {
            color: color.border,
            weight: this.config.tileGrid ? 2 : 0,
            fillColor: color.fill,
            fillOpacity: 0.3,
            className: 'rateio-tile'
        });
        
        // Adicionar popup com informações
        const popupContent = this.createTilePopup(tile);
        rectangle.bindPopup(popupContent);
        
        // Adicionar label se configurado
        if (this.config.showCoordinates) {
            const label = this.createTileLabel(tile);
            this.currentTileLayer.addLayer(label);
        }
        
        // Adicionar ao layer
        this.currentTileLayer.addLayer(rectangle);
        
        // Salvar referência
        this.tiles.set(tile.id, {
            tile: tile,
            rectangle: rectangle,
            color: color
        });
    }

    // Obter cor para tile baseado no esquema
    getTileColor(tile) {
        const schemes = {
            default: {
                fill: this.getRandomColor(tile.x, tile.y),
                border: '#ffffff'
            },
            terrain: {
                fill: this.getTerrainColor(tile.x, tile.y),
                border: '#8B4513'
            },
            satellite: {
                fill: this.getSatelliteColor(tile.x, tile.y),
                border: '#FFD700'
            },
            heatmap: {
                fill: this.getHeatmapColor(tile.x, tile.y),
                border: '#FF0000'
            }
        };
        
        return schemes[this.config.colorScheme] || schemes.default;
    }

    // Gerar cor aleatória consistente
    getRandomColor(x, y) {
        const hash = (x * 31 + y) * 7;
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue}, 70%, 50%)`;
    }

    // Gerar cor baseada em terreno
    getTerrainColor(x, y) {
        const types = ['#228B22', '#8FBC8F', '#F0E68C', '#DEB887', '#8B7355'];
        const index = Math.abs((x + y) * 13) % types.length;
        return types[index];
    }

    // Gerar cor baseada em satélite
    getSatelliteColor(x, y) {
        const intensity = Math.abs((x * y) % 100) / 100;
        const gray = Math.floor(intensity * 255);
        return `rgb(${gray}, ${gray}, ${gray})`;
    }

    // Gerar cor baseada em heatmap
    getHeatmapColor(x, y) {
        const intensity = Math.abs((x + y) % 10) / 10;
        const hue = (1 - intensity) * 240; // De azul a vermelho
        return `hsl(${hue}, 100%, 50%)`;
    }

    // Criar popup do tile
    createTilePopup(tile) {
        const area = this.calculateTileArea(tile);
        return `
            <div class="tile-popup">
                <h4>Tile ${tile.id}</h4>
                <div class="tile-info">
                    <p><strong>Coordenadas:</strong> ${tile.x}, ${tile.y}</p>
                    <p><strong>Zoom:</strong> ${tile.z}</p>
                    <p><strong>Centro:</strong> ${tile.center.lat.toFixed(4)}, ${tile.center.lng.toFixed(4)}</p>
                    <p><strong>Área:</strong> ${area.toFixed(2)} km²</p>
                    <p><strong>Bounds:</strong></p>
                    <ul>
                        <li>SW: ${tile.bounds.getSouth().toFixed(4)}, ${tile.bounds.getWest().toFixed(4)}</li>
                        <li>NE: ${tile.bounds.getNorth().toFixed(4)}, ${tile.bounds.getEast().toFixed(4)}</li>
                    </ul>
                </div>
                <div class="tile-actions">
                    <button onclick="window.mapaRateio.selectTile('${tile.id}')" class="btn small">Selecionar</button>
                    <button onclick="window.mapaRateio.exportTile('${tile.id}')" class="btn small">Exportar</button>
                </div>
            </div>
        `;
    }

    // Criar label do tile
    createTileLabel(tile) {
        const label = L.marker(tile.center, {
            icon: L.divIcon({
                className: 'tile-label',
                html: `<div class="tile-label-content">${tile.x},${tile.y}</div>`,
                iconSize: [40, 20],
                iconAnchor: [20, 10]
            })
        });
        
        return label;
    }

    // Calcular área do tile em km²
    calculateTileArea(tile) {
        const sw = tile.bounds.getSouthWest();
        const ne = tile.bounds.getNorthEast();
        
        // Aproximação para área (simplificada)
        const latDiff = ne.lat - sw.lat;
        const lngDiff = ne.lng - sw.lng;
        
        // Converter para km (aproximado)
        const latKm = latDiff * 111.32; // 1 grau ≈ 111.32 km
        const lngKm = lngDiff * 111.32 * Math.cos(sw.lat * Math.PI / 180);
        
        return Math.abs(latKm * lngKm);
    }

    // Atualizar informações do rateio
    updateRateioInfo(tiles) {
        // Contar tiles
        document.getElementById('rateio-tiles-count').textContent = tiles.length;
        
        // Calcular área total
        const totalArea = tiles.reduce((sum, tile) => {
            return sum + this.calculateTileArea(tile);
        }, 0);
        document.getElementById('rateio-area').textContent = `${totalArea.toFixed(2)} km²`;
    }

    // Evento de clique no mapa
    onMapClick(e) {
        if (!this.currentTileLayer) return;
        
        const zoom = this.map.getZoom();
        const tile = this.latLngToTile(e.latlng.lat, e.latlng.lng, zoom);
        const tileId = `${zoom}/${tile.x}/${tile.y}`;
        
        // Selecionar tile
        this.selectTile(tileId);
    }

    // Evento de movimento do mouse
    onMapMouseMove(e) {
        if (!this.currentTileLayer) return;
        
        const zoom = this.map.getZoom();
        const tile = this.latLngToTile(e.latlng.lat, e.latlng.lng, zoom);
        const tileId = `${zoom}/${tile.x}/${tile.y}`;
        
        // Atualizar tile atual
        document.getElementById('rateio-current-tile').textContent = tileId;
        
        // Highlight tile no hover
        this.highlightTile(tileId);
    }

    // Selecionar tile
    selectTile(tileId) {
        // Remover seleção anterior
        if (this.selectedTile) {
            const tileData = this.tiles.get(this.selectedTile);
            if (tileData) {
                tileData.rectangle.setStyle({ fillOpacity: 0.3 });
            }
        }
        
        // Selecionar novo tile
        const tileData = this.tiles.get(tileId);
        if (tileData) {
            tileData.rectangle.setStyle({ fillOpacity: 0.6 });
            this.selectedTile = tileId;
            
            // Centralizar mapa no tile
            this.map.fitBounds(tileData.tile.bounds, { padding: [20, 20] });
            
            // Abrir popup
            tileData.rectangle.openPopup();
        }
    }

    // Highlight tile no hover
    highlightTile(tileId) {
        // Remover highlight anterior
        if (this.highlightedTile && this.highlightedTile !== tileId) {
            const tileData = this.tiles.get(this.highlightedTile);
            if (tileData) {
                tileData.rectangle.setStyle({ weight: 2 });
            }
        }
        
        // Adicionar highlight
        const tileData = this.tiles.get(tileId);
        if (tileData) {
            tileData.rectangle.setStyle({ weight: 4 });
            this.highlightedTile = tileId;
        }
    }

    // Atualizar cores dos tiles
    updateTileColors() {
        this.tiles.forEach((tileData, tileId) => {
            const color = this.getTileColor(tileData.tile);
            tileData.rectangle.setStyle({
                fillColor: color.fill,
                color: color.border
            });
        });
    }

    // Atualizar grade dos tiles
    updateTileGrid() {
        this.tiles.forEach((tileData) => {
            tileData.rectangle.setStyle({
                weight: this.config.tileGrid ? 2 : 0
            });
        });
    }

    // Atualizar labels dos tiles
    updateTileLabels() {
        // Recarregar todos os tiles para atualizar labels
        if (this.currentTileLayer) {
            this.generateRateio();
        }
    }

    // Limpar rateio
    clearRateio() {
        if (this.currentTileLayer) {
            this.map.removeLayer(this.currentTileLayer);
            this.currentTileLayer = null;
        }
        
        this.tiles.clear();
        this.selectedTile = null;
        this.highlightedTile = null;
        
        // Resetar informações
        document.getElementById('rateio-tiles-count').textContent = '0';
        document.getElementById('rateio-area').textContent = '0 km²';
        document.getElementById('rateio-current-tile').textContent = '-';
        
        console.log('🗑️ Rateio limpo');
    }

    // Exportar rateio
    exportRateio() {
        const exportData = {
            timestamp: new Date().toISOString(),
            config: this.config,
            mapBounds: this.map.getBounds(),
            zoom: this.map.getZoom(),
            tiles: []
        };
        
        // Adicionar dados de cada tile
        this.tiles.forEach((tileData, tileId) => {
            exportData.tiles.push({
                id: tileId,
                x: tileData.tile.x,
                y: tileData.tile.y,
                z: tileData.tile.z,
                bounds: {
                    sw: {
                        lat: tileData.tile.bounds.getSouth(),
                        lng: tileData.tile.bounds.getWest()
                    },
                    ne: {
                        lat: tileData.tile.bounds.getNorth(),
                        lng: tileData.tile.bounds.getEast()
                    }
                },
                center: {
                    lat: tileData.tile.center.lat,
                    lng: tileData.tile.center.lng
                },
                area: this.calculateTileArea(tileData.tile),
                color: tileData.color
            });
        });
        
        // Criar blob e download
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `rateio-mapa-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        console.log(`📥 Rateio exportado: ${exportData.tiles.length} tiles`);
    }

    // Exportar tile individual
    exportTile(tileId) {
        const tileData = this.tiles.get(tileId);
        if (!tileData) return;
        
        const tileExport = {
            id: tileId,
            tile: tileData.tile,
            bounds: tileData.tile.bounds,
            area: this.calculateTileArea(tileData.tile),
            color: tileData.color,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(tileExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `tile-${tileId}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    // Destruir sistema de rateio
    destroy() {
        this.clearRateio();
        console.log('🗑️ Sistema de rateio destruído');
    }
}

// ========================
   ESTILOS CSS PARA RATEIO
// ========================
const rateioStyles = `
<style>
.rateio-control {
    background: rgba(26, 26, 26, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 1rem;
    min-width: 280px;
    max-width: 320px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.rateio-header h4 {
    margin: 0 0 1rem 0;
    color: #ffffff;
    font-size: 1rem;
    text-align: center;
}

.rateio-controls {
    margin-bottom: 1rem;
}

.control-group {
    margin-bottom: 0.75rem;
}

.control-group label {
    display: block;
    margin-bottom: 0.25rem;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.85rem;
}

.control-group input[type="range"] {
    width: 100%;
    margin-bottom: 0.25rem;
}

.control-group select {
    width: 100%;
    padding: 0.25rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    color: #ffffff;
}

.control-group input[type="checkbox"] {
    margin-right: 0.5rem;
}

.control-actions {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.control-actions .btn {
    flex: 1;
    padding: 0.5rem;
    font-size: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    cursor: pointer;
    transition: all 0.2s ease;
}

.control-actions .btn:hover {
    background: rgba(255, 255, 255, 0.2);
}

.control-actions .btn.primary {
    background: var(--primary-color, #007bff);
    border-color: var(--primary-color, #007bff);
}

.control-actions .btn.primary:hover {
    background: #0056b3;
}

.rateio-info {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 1rem;
}

.info-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    font-size: 0.85rem;
}

.info-item .label {
    color: rgba(255, 255, 255, 0.6);
}

.info-item .value {
    color: #ffffff;
    font-weight: 600;
}

.tile-popup {
    min-width: 200px;
}

.tile-popup h4 {
    margin: 0 0 0.5rem 0;
    color: #333;
}

.tile-popup p {
    margin: 0.25rem 0;
    font-size: 0.85rem;
    color: #666;
}

.tile-popup ul {
    margin: 0.25rem 0;
    padding-left: 1rem;
}

.tile-popup li {
    font-size: 0.75rem;
    color: #666;
}

.tile-actions {
    margin-top: 0.5rem;
    display: flex;
    gap: 0.5rem;
}

.tile-actions .btn {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    border: 1px solid #ccc;
    border-radius: 3px;
    background: #f8f9fa;
    color: #333;
    cursor: pointer;
}

.tile-actions .btn:hover {
    background: #e9ecef;
}

.tile-label {
    background: rgba(0, 0, 0, 0.7);
    color: #ffffff;
    border-radius: 3px;
    padding: 2px 6px;
    font-size: 10px;
    font-weight: bold;
    text-align: center;
    pointer-events: none;
}

.rateio-tile {
    cursor: pointer;
    transition: all 0.2s ease;
}

.rateio-tile:hover {
    fill-opacity: 0.5 !important;
}
</style>
`;

// Adicionar estilos ao documento
document.head.insertAdjacentHTML('beforeend', rateioStyles);

// ========================
   INICIALIZAÇÃO GLOBAL
// ========================

// Inicializar sistema de rateio quando o mapa estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar o mapa principal estar disponível
    setTimeout(() => {
        if (window.trilhancaMap && window.trilhancaMap.map) {
            window.mapaRateio = new MapaRateio(window.trilhancaMap.map);
            console.log('🗺️ Sistema de rateio de mapa carregado');
        }
    }, 2000);
});

// Exportar para uso global
window.MapaRateio = MapaRateio;
