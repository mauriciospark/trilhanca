// ========================
// MAPA (Leaflet) + Relatos de Condição da Via
// ========================
let map;
let originMarker = null;
let destMarker = null;
let routeLayer = null;
let routeAheadLayer = null;
let routeCoordsLL = null;
let mode = null;
let currentLocation = null;
let roadsLayer = null;
let reportsLayer = null;
let odoActive = false;
let odoWatchId = null;
let odoMeters = 0;
let odoPath = [];
let odoLayer = null;
let lastRoadsFetchTs = 0;
let locActive = true;
let locWatchId = null;
let locMarker = null;
let locAccCircle = null;
let baseNormal = null;
let baseSat = null;
let currentBase = null;
let baseIsSat = false;
let vehicleType = null;
let followMe = false;
let baseTomTomStreets = null;
let baseTomTomSat = null;
window.updateConvoyMember = function(payload){
    if(!payload || typeof payload.lat!=='number' || typeof payload.lng!=='number' || !payload.id) return;
    let m = convoyMarkers.get(payload.id);
    const p = L.latLng(payload.lat, payload.lng);
    if(!m){
      // Esta é a linha que cria o círculo amarelo
      m = L.circleMarker(p, {radius:6, color:'#007bff', fillColor:'#007bff', fillOpacity:0.6, weight:2}).addTo(convoyLayer);
      m.bindTooltip(`ID ${payload.id}`, {permanent:false});
      convoyMarkers.set(payload.id, m);
    }else{
      try{ m.setLatLng(p); }catch(e){}
    }
    // ... (código para atualizar informações do tooltip)
  };let labelsOverlay = null;
let dataViewerGroup = null;
let dataLayers = [];
let lastHeading = null;
let lastPosForBearing = null;
let convoyLayer = null;
const convoyMarkers = new Map();
const convoyPaths = new Map();




const originCoordsEl = document.getElementById('origin-coords');
const destCoordsEl   = document.getElementById('dest-coords');
const latEl = document.getElementById('lat');
const lonEl = document.getElementById('lon');
const lat2El = document.getElementById('lat2');
const lon2El = document.getElementById('lon2');
const toggleLocBtn = document.getElementById('toggle-location');
const locStatusEl = document.getElementById('location-status');
const followBtn = document.getElementById('follow-me');
const geoAccEl = document.getElementById('geo-acc');
const geoSpeedEl = document.getElementById('geo-speed');
const geoHeadEl = document.getElementById('geo-head');
const addressSearchEl = document.getElementById('address-search');
const addressSearchGoBtn = document.getElementById('address-search-go');
const vehicleSelectEl = document.getElementById('vehicle-select');
const vehicleOpenBtn = document.getElementById('vehicle-open');
const vehicleModalEl = document.getElementById('vehicle-modal');
const vehicleCloseBtn = document.getElementById('vehicle-close');
const vehicleApplyBtn = document.getElementById('vehicle-apply');
const vehicleCarouselEl = document.getElementById('vehicle-carousel');
const vehicleColorNameEl = document.getElementById('vehicle-color-name');
const vehicleColorBtns = document.querySelectorAll('.color-dot');
const gdvFileEl = document.getElementById('gdv-file');
const gdvFileAddBtn = document.getElementById('gdv-file-add');
const gdvTextEl = document.getElementById('gdv-text');
const gdvAddBtn = document.getElementById('gdv-add');
const gdvClearBtn = document.getElementById('gdv-clear');
const gdvListEl = document.getElementById('gdv-list');
// A variável VEICULOS é carregada de Transportes.js

// Mapeia os veículos para facilitar a busca
const vehicleMap = new Map(VEICULOS.map(v => [v.id, v]));
// Catálogo para o carrossel (id, icon, label)
const vehicleCatalog = [
    ...VEICULOS.map(v => ({ id: v.id, icon: v.url_icone, label: v.nome })),
    { id: 'ape', icon: './icon/Avatar.png', label: '🚶 A Pé' }
];

function getVehicleIcon(typeId) {
    // Se for modo a pé, usar o ícone Avatar.png
    if (typeId === 'ape') {
        return L.icon({
            iconUrl: './icon/Avatar.png',
            iconSize: [40, 40],
            iconAnchor: [20, 28],
            popupAnchor: [0, -22],
            className: 'vehicle-icon walking-icon'
        });
    }
    
    const vehicle = vehicleMap.get(typeId);
    // Ícone padrão caso o veículo selecionado não seja encontrado
    const fallbackIconUrl = 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png';
    const iconUrl = vehicle ? vehicle.url_icone : fallbackIconUrl;
    
    return L.icon({
        iconUrl: iconUrl,
        iconSize: [40, 40],
        iconAnchor: [20, 28],
        popupAnchor: [0, -22],
        className: 'vehicle-icon'
    });
}

// A lógica de cores permanece, pois é uma customização local do mapa
const vehicleColors = {
  black: {label:'Preto meia-noite', filter:'brightness(0.5) saturate(0.2)'},
  white: {label:'Branco', filter:'brightness(1.2) saturate(0.2)'},
  gray:  {label:'Cinza', filter:'saturate(0) brightness(0.95)'},
  red:   {label:'Vermelho', filter:'hue-rotate(-20deg) saturate(1.6)'},
  blue:  {label:'Azul', filter:'hue-rotate(190deg) saturate(1.6)'},
  green: {label:'Verde', filter:'hue-rotate(90deg) saturate(1.6)'},
  purple:{label:'Roxo', filter:'hue-rotate(270deg) saturate(1.6)'}
};
let vehicleColorKey = 'blue';
let vehicleColorFilter = vehicleColors[vehicleColorKey].filter;

function applyVehicleColorToMarker(){
  try{
    // Não aplicar cores ao modo a pé para manter o ícone Avatar.png original
    if (vehicleType === 'ape') return;
    
    const el = locMarker && locMarker.getElement ? locMarker.getElement() : null;
    const img = el ? el.querySelector('img') : null;
    if(img){ img.style.filter = vehicleColorFilter; }
  }catch(e){}
}

function applyVehicleColorToCarousel(){
  try{
    if(!vehicleCarouselEl) return;
    // O carrossel no mapa agora precisa ser populado com os dados de VEICULOS
    vehicleCarouselEl.querySelectorAll('img').forEach(img=>{ img.style.filter = vehicleColorFilter; });
  }catch(e){}
}

function loadVehicleChoice() {
    try {
        // Lê a escolha feita na página Transportes.html ou modo a pé
        const v = localStorage.getItem('veiculo_selecionado');
        // Define um padrão caso nada tenha sido escolhido ainda (automóvel ou a pé)
        if (v === 'ape') {
            vehicleType = 'ape';
        } else {
            vehicleType = v && vehicleMap.has(v) ? v : 'automovel';
        }
        
        // Sincroniza a UI de seleção de veículo que existe nesta página (se existir)
        if (vehicleSelectEl) vehicleSelectEl.value = vehicleType;
        
        // Atualiza o ícone do marcador de localização
        if(locMarker){
            const icon = getVehicleIcon(vehicleType);
            locMarker.setIcon(icon);
            applyVehicleColorToMarker();
        }
        
        // Atualiza informações do modo de transporte
        updateTransportModeInfo();
        
    } catch (e) {
        console.error('Erro ao carregar escolha de veículo:', e);
    }
}

function loadVehicleColorChoice(){
  try{
    const c = localStorage.getItem('vehicle_color');
    if(c && vehicleColors[c]){ vehicleColorKey = c; vehicleColorFilter = vehicleColors[c].filter; }
    if(vehicleColorNameEl){ vehicleColorNameEl.textContent = vehicleColors[vehicleColorKey].label; }
    vehicleColorBtns.forEach(b=>{ b.classList.toggle('active', b.getAttribute('data-color')===vehicleColorKey); });
    applyVehicleColorToCarousel();
  }catch(e){}
}

function persistVehicleChoice(v) {
    // Aceitar tanto veículos normais quanto o modo a pé
    if (!vehicleMap.has(v) && v !== 'ape') return; // Só persiste se for válido
    vehicleType = v;
    try {
        localStorage.setItem('veiculo_selecionado', vehicleType);
    } catch (e) {}
    
    // Atualiza o ícone do marcador no mapa
    if(locMarker){
        const icon = getVehicleIcon(vehicleType);
        locMarker.setIcon(icon);
        applyVehicleColorToMarker();
    }
    
    // Atualiza informações do modo de transporte
    updateTransportModeInfo();
    
    // Disparar evento de mudança de veículo/modo
    document.dispatchEvent(new CustomEvent('vehicleChanged', {
        detail: { vehicle: v, isWalking: v === 'ape' }
    }));
}

function persistVehicleColor(c){
  if(!vehicleColors[c]) return;
  vehicleColorKey = c;
  vehicleColorFilter = vehicleColors[c].filter;
  try{ localStorage.setItem('vehicle_color', c); }catch(e){}
  if(vehicleColorNameEl){ vehicleColorNameEl.textContent = vehicleColors[c].label; }
  vehicleColorBtns.forEach(b=>{ b.classList.toggle('active', b.getAttribute('data-color')===c); });
  applyVehicleColorToMarker();
  applyVehicleColorToCarousel();
}

// Função para atualizar as informações do modo de transporte
function updateTransportModeInfo() {
    const transportInfo = document.getElementById('transport-mode-info');
    const modeIcon = document.getElementById('mode-icon');
    const modeName = document.getElementById('mode-name');
    const modeDescription = document.getElementById('mode-description');
    const maxSpeed = document.getElementById('max-speed');
    const roadType = document.getElementById('road-type');
    const gpsPrecision = document.getElementById('gps-precision');
    
    if (!transportInfo) return;
    
    const isWalking = vehicleType === 'ape';
    
    if (isWalking) {
        // Modo a pé
        transportInfo.className = 'transport-mode-info walking-mode';
        modeIcon.textContent = '🚶';
        modeName.textContent = 'A Pé';
        modeDescription.textContent = 'Foco em trilhas e caminhos';
        maxSpeed.textContent = '6 km/h';
        roadType.textContent = 'Trilhas';
        gpsPrecision.textContent = 'Alta';
        
        // Ajustar configurações do mapa para modo a pé
        adjustMapForWalkingMode();
    } else {
        // Modo motorizado
        transportInfo.className = 'transport-mode-info vehicle-mode';
        modeIcon.textContent = '🚗';
        modeName.textContent = 'Motorizado';
        modeDescription.textContent = 'Foco em estradas e rodovias';
        maxSpeed.textContent = '120 km/h';
        roadType.textContent = 'Estradas';
        gpsPrecision.textContent = 'Normal';
        
        // Ajustar configurações do mapa para modo veicular
        adjustMapForVehicleMode();
    }
}

// Função para ajustar o mapa para modo a pé
function adjustMapForWalkingMode() {
    if (!map) return;
    
    // Configurações de zoom para modo a pé
    map.setMinZoom(5);
    map.setMaxZoom(20);
    
    // Ajustar precisão do GPS para alta precisão
    adjustGPSForMode('walking');
    
    // Carregar camadas de trilhas/caminhos
    loadWalkingLayers();
    
    console.log('Mapa ajustado para modo a pé');
}

// Função para ajustar o mapa para modo veículo
function adjustMapForVehicleMode() {
    if (!map) return;
    
    // Configurações de zoom para modo veículo
    map.setMinZoom(3);
    map.setMaxZoom(18);
    
    // Ajustar precisão do GPS para normal
    adjustGPSForMode('vehicle');
    
    // Carregar camadas de estradas
    loadVehicleLayers();
    
    console.log('Mapa ajustado para modo veicular');
}

// Função para ajustar GPS baseado no modo
function adjustGPSForMode(mode) {
    if (!navigator.geolocation) return;
    
    const options = mode === 'walking' ? {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    } : {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000
    };
    
    // Reiniciar watch de localização se estiver ativo
    if (typeof locWatchId !== 'undefined' && locWatchId !== null) {
        navigator.geolocation.clearWatch(locWatchId);
        
        // Reiniciar com novas opções
        if (typeof locActive !== 'undefined' && locActive) {
            locWatchId = navigator.geolocation.watchPosition(
                handleLocationUpdate,
                handleLocationError,
                options
            );
        }
    }
    
    console.log(`GPS ajustado para modo: ${mode}`);
}

// Função para carregar camadas do modo a pé
function loadWalkingLayers() {
    if (!map) return;
    
    // Buscar trilhas e caminhos pedestres
    const bounds = map.getBounds();
    fetchWalkingTrails(bounds);
}

// Função para carregar camadas do modo veículo
function loadVehicleLayers() {
    if (!map) return;
    
    // Carregar camadas de estradas
    const bounds = map.getBounds();
    if (typeof loadRoads === 'function') {
        loadRoads(bounds);
    }
}

// Função para buscar trilhas (implementação básica)
function fetchWalkingTrails(bounds) {
    // Overpass API query para trilhas e caminhos pedestres
    const query = `
        [out:json][timeout:25];
        (
            way["highway"~"footway|path|track"]["foot"!="no"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
            relation["route"="hiking"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
        );
        (._;>;);
        out geom;
    `;
    
    fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query)
    })
    .then(response => response.json())
    .then(data => {
        displayWalkingTrails(data);
    })
    .catch(error => {
        console.warn('Erro ao carregar trilhas:', error);
    });
}

// Função para exibir trilhas no mapa
function displayWalkingTrails(data) {
    if (!map || !data.elements) return;
    
    // Criar camada para trilhas
    if (!window.trailsLayer) {
        window.trailsLayer = L.layerGroup().addTo(map);
    } else {
        window.trailsLayer.clearLayers();
    }
    
    data.elements.forEach(element => {
        if (element.type === 'way' && element.geometry) {
            const coords = element.geometry.map(point => [point.lat, point.lon]);
            
            // Estilo para trilhas
            const trailStyle = {
                color: '#2ecc71',
                weight: 3,
                opacity: 0.8,
                dashArray: '10, 5'
            };
            
            const polyline = L.polyline(coords, trailStyle).bindPopup(`
                <div style="min-width: 200px;">
                    <strong>🥾 Trilha/Caminho</strong><br>
                    Tipo: ${element.tags.highway || 'Caminho'}<br>
                    ${element.tags.name ? `Nome: ${element.tags.name}<br>` : ''}
                    ${element.tags.surface ? `Superfície: ${element.tags.surface}<br>` : ''}
                </div>
            `);
            
            window.trailsLayer.addLayer(polyline);
        }
    });
}

async function loadMapConfig(){
  // Modo offline: usar configuração padrão sem fetch
  console.log('Carregando configuração de mapa em modo offline...');
  
  return {
    tiles: [
      {
        name: "OpenStreetMap",
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: "© OpenStreetMap contributors"
      }
    ]
  };
}

async function init() {
  console.log('Initializing map with coordinates [-23.5505, -46.6333]');
  map = L.map('map').setView([-23.5505, -46.6333], 13);
  
  console.log('Creating tile layers...');
  
  // Create normal tile layer with error handling
  baseNormal = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors', 
    maxZoom: 19,
    errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
  });
  
  // Create satellite tile layer
  baseSat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '© Esri',
    errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
  });
  
  console.log('Adding base layer to map...');
  currentBase = baseNormal.addTo(map);
  
  // Log when tiles start loading
  baseNormal.on('loading', function() {
    console.log('Tiles are loading...');
  });
  
  baseNormal.on('load', function() {
    console.log('Tiles loaded successfully');
  });
  
  baseNormal.on('tileerror', function(error) {
    console.error('Tile loading error:', error);
  });

  map.createPane('roadsPane');
  map.getPane('roadsPane').style.zIndex = '450';
  map.createPane('reportsPane');
  map.getPane('reportsPane').style.zIndex = '500';
  map.createPane('dataPane');
  map.getPane('dataPane').style.zIndex = '520';
  map.createPane('labelsPane');
  map.getPane('labelsPane').style.zIndex = '600';
  map.getPane('labelsPane').style.pointerEvents = 'none';
  // Garante que o mapa redimensione após o layout estar pronto (evita mapa "sumido")
  setTimeout(()=>{ try{ map.invalidateSize(); }catch(e){} }, 0);
  setTimeout(()=>{ try{ map.invalidateSize(); }catch(e){} }, 200);
  window.addEventListener('resize', ()=>{ try{ map.invalidateSize(); }catch(e){} });

  roadsLayer = L.layerGroup().addTo(map);
  reportsLayer = L.layerGroup().addTo(map);
  dataViewerGroup = L.layerGroup().addTo(map);
  convoyLayer = L.layerGroup().addTo(map);
  

  map.on('moveend', () => {
    const b = map.getBounds();
    loadRoads(b);
  });
  loadRoads(map.getBounds());

  map.on('dragstart', ()=>{
    setFollow(false);
  });
  const getColorById = (id) => { 
     let hash = 0; 
     const strId = String(id); 
     for (let i = 0; i < strId.length; i++) { 
         hash = strId.charCodeAt(i) + ((hash << 5) - hash); 
     } 
     // Gera uma cor em formato HSL para garantir que seja brilhante (vibrante) 
     const h = Math.abs(hash % 360); 
     return `hsl(${h}, 80%, 60%)`;  
 }; 
  
 // 3. Ícone Customizado (Seta/Carro) que não cresce com o zoom 
 const customIcon = L.icon({ 
     iconUrl: 'https://cdn-icons-png.flaticon.com/512/5814/5814144.png', // Exemplo de seta neon 
     iconSize: [20, 20], 
     iconAnchor: [10, 10], 
     className: 'vehicle-icon' 
 }); 
  
 window.updateConvoyMember = function(payload) { 
     if (!payload || !payload.id || typeof payload.lat !== 'number') return; 
      
     const p = [payload.lat, payload.lng]; 
     const id = payload.id; 
     const playerColor = getColorById(id); 
  
     // --- GERENCIAMENTO DO RASTRO (LINHA) --- 
     if (!convoyPaths.has(id)) { 
         // Se é o primeiro movimento, cria a linha com a cor única do ID 
         const polyline = L.polyline([p], { 
             color: playerColor, 
             weight: 3, 
             opacity: 0.8, 
             lineJoin: 'round', 
             smoothFactor: 1 
         }).addTo(convoyLayer); 
          
         convoyPaths.set(id, polyline); 
     } else { 
         // Se já existe, apenas adiciona o novo ponto à linha 
         convoyPaths.get(id).addLatLng(p); 
     } 
  
     // --- GERENCIAMENTO DO ÍCONE (MARCADOR) --- 
     if (!convoyMarkers.has(id)) { 
         // Cria o marcador físico (L.marker NÃO cresce com o zoom como o circleMarker) 
         const marker = L.marker(p, {  
             icon: customIcon, 
             rotationAngle: payload.course || 0 // Opcional: rotaciona se tiver a direção 
         }).addTo(convoyLayer); 
          
         marker.bindTooltip(`Membro: ${id}`, { sticky: true }); 
         convoyMarkers.set(id, marker); 
     } else { 
         // Apenas move o ícone para a nova posição 
         convoyMarkers.get(id).setLatLng(p); 
     } 
 };

    map.on('click', (e) => {
    const { lat, lng } = e.latlng;

    if (mode === 'origin') {
      if (originMarker) map.removeLayer(originMarker);
      originMarker = L.circleMarker([lat, lng], {
        radius: 7,
        color: '#2ecc71'
      }).addTo(map).bindPopup('Origem');

      originCoordsEl.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      mode = null;
    }

    if (mode === 'dest') {
      if (destMarker) map.removeLayer(destMarker);
      destMarker = L.circleMarker([lat, lng], {
        radius: 7,
        color: '#e74c3c'
      }).addTo(map).bindPopup('Destino');

      destCoordsEl.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      mode = null;
    }

    if(latEl) latEl.value = lat.toFixed(6);
    if(lonEl) lonEl.value = lng.toFixed(6);
  });

  const MapControls = L.Control.extend({
    options:{ position:'topright' },
    onAdd:function(){
      const c = L.DomUtil.create('div', 'map-controls leaflet-bar');
      const compass = L.DomUtil.create('button', 'ctrl-btn', c);
      compass.textContent = '▲';
      const btn3d = L.DomUtil.create('button', 'ctrl-btn', c);
      btn3d.textContent = '3D';
      const locate = L.DomUtil.create('button', 'ctrl-btn', c);
      locate.id = 'map-recenter';
      locate.textContent = '◎';
      const plus = L.DomUtil.create('button', 'ctrl-btn', c);
      plus.textContent = '+';
      const minus = L.DomUtil.create('button', 'ctrl-btn', c);
      minus.textContent = '-';
      L.DomEvent.disableClickPropagation(c);
      L.DomEvent.on(compass, 'click', ()=>{
        if(routeLayer){ try{ map.fitBounds(routeLayer.getBounds().pad(0.1)); }catch(e){} }
        else if(currentLocation){ try{ map.setView(currentLocation, Math.max(map.getZoom(), 15)); }catch(e){} }
        else { try{ map.setView([-23.5505, -46.6333], 13); }catch(e){} }
      });
      L.DomEvent.on(btn3d, 'click', ()=>{
        baseIsSat = !baseIsSat;
        setBase(baseIsSat ? 'sat' : 'normal');
      });
      L.DomEvent.on(locate, 'click', ()=>{
        if(!locActive){ startLocation(); return; }
        try{
          if(currentLocation){ map.flyTo(currentLocation, Math.max(map.getZoom(), 16), {animate:true, duration:0.6}); }
          setFollow(true);
        }catch(e){}
      });
      L.DomEvent.on(plus, 'click', ()=> map.zoomIn());
      L.DomEvent.on(minus, 'click', ()=> map.zoomOut());
      return c;
    }
  });
  map.addControl(new MapControls());
  loadVehicleChoice();
  loadVehicleColorChoice();
  if(vehicleOpenBtn && vehicleModalEl){
    vehicleOpenBtn.addEventListener('click', ()=>{
      vehicleModalEl.classList.remove('hidden');
      setTimeout(()=>{
        try{
          const active = vehicleCarouselEl ? vehicleCarouselEl.querySelector('.vehicle-item.active') : null;
          if(active && active.scrollIntoView){ active.scrollIntoView({behavior:'smooth', inline:'center', block:'nearest'}); }
        }catch(e){}
      }, 0);
    });
  }
  if(vehicleCloseBtn && vehicleModalEl){
    vehicleCloseBtn.addEventListener('click', ()=> vehicleModalEl.classList.add('hidden'));
  }
  if(vehicleCarouselEl){
    vehicleCarouselEl.innerHTML = '';
    vehicleCatalog.forEach((v)=>{
      const it = document.createElement('div');
      it.className = 'vehicle-item' + ((vehicleType===v.id)?' active':'');
      it.setAttribute('data-vehicle', v.id);
      const img = document.createElement('img');
      img.src = v.icon;
      img.alt = v.label;
      img.style.filter = vehicleColorFilter;
      it.appendChild(img);
      it.title = v.label;
      it.addEventListener('click', ()=>{
        document.querySelectorAll('.vehicle-item').forEach(e=> e.classList.remove('active'));
        it.classList.add('active');
        persistVehicleChoice(v.id);
        if(vehicleSelectEl) vehicleSelectEl.value = v.id;
        try{ it.scrollIntoView({behavior:'smooth', inline:'center', block:'nearest'}); }catch(e){}
      });
      vehicleCarouselEl.appendChild(it);
    });
  }
  if(vehicleColorBtns && vehicleColorBtns.length){
    vehicleColorBtns.forEach(b=>{
      b.addEventListener('click', ()=> persistVehicleColor(b.getAttribute('data-color')));
    });
  }
  if(vehicleApplyBtn && vehicleModalEl){
    vehicleApplyBtn.addEventListener('click', ()=> vehicleModalEl.classList.add('hidden'));
  }
  if(followBtn){
    followBtn.addEventListener('click', ()=>{
      setFollow(!followMe);
      if(followMe && currentLocation){ try{ map.flyTo(currentLocation, Math.max(map.getZoom(), 16), {animate:true, duration:0.6}); }catch(e){} }
    });
  }
  if(gdvFileAddBtn && gdvFileEl){
    gdvFileAddBtn.addEventListener('click', ()=>{
      if(!gdvFileEl.files || !gdvFileEl.files.length) return;
      const f = gdvFileEl.files[0];
      const reader = new FileReader();
      reader.onload = ()=>{ try{ addGeoDataLayer(f.name, JSON.parse(reader.result)); }catch(e){ alert('Arquivo inválido'); } };
      reader.readAsText(f);
    });
  }
  if(gdvAddBtn && gdvTextEl){
    gdvAddBtn.addEventListener('click', ()=>{
      const t = gdvTextEl.value.trim();
      if(!t) return;
      try{ addGeoDataLayer('GeoJSON colado', JSON.parse(t)); }catch(e){ alert('JSON inválido'); }
    });
  }
  if(gdvClearBtn){
    gdvClearBtn.addEventListener('click', ()=> clearGeoDataLayers());
  }
}

// Inicializa o mapa quando DOM e Leaflet estiverem prontos
function startMap() {
  console.log('Starting map initialization...');
  const mapEl = document.getElementById('map');
  if (!mapEl) {
    console.error('Map container not found');
    return;
  }
  if (typeof L === 'undefined') {
    console.error('Leaflet (L) not loaded.');
    return;
  }
  
  try {
    console.log('Initializing map...');
    init();
    
    // Ensure map is properly sized after initialization
    setTimeout(function () {
      try {
        if (map && map.invalidateSize) {
          map.invalidateSize();
          console.log('Map size invalidated');
        }
      } catch (e) {
        console.error('Error invalidating map size:', e);
      }
    }, 300);
    
    // Additional size check
    setTimeout(function () {
      try {
        if (map && map.invalidateSize) {
          map.invalidateSize();
          console.log('Second map size invalidation');
        }
      } catch (e) {
        console.error('Error in second map size invalidation:', e);
      }
    }, 1000);
    
  } catch (e) {
    console.error('Error initializing map:', e);
  }
}

// Biblioteca de Mapas Integrada
let savedMaps = JSON.parse(localStorage.getItem('trilhanca_maps') || '[]');
let mapUrlsData = null;

// Carregar dados do arquivo JSON de URLs
async function loadMapUrlsFromJSON() {
  // Modo offline: usar dados diretamente sem fetch
  console.log('Carregando mapas em modo offline...');
  
  // Dados padrão para funcionamento offline
  mapUrlsData = {
    maps: [
      {
        id: 'default-1',
        name: 'Mapa Padrão',
        url: 'data:application/json,{"type":"FeatureCollection","features":[]}',
        type: 'url',
        format: 'geojson',
        date: new Date().toISOString()
      }
    ]
  };
  
  // Tentar carregar do localStorage
  try {
    const stored = localStorage.getItem('mapUrlsData');
    if (stored) {
      const storedData = JSON.parse(stored);
      if (storedData.maps && storedData.maps.length > 0) {
        mapUrlsData = storedData;
        console.log('Mapas carregados do localStorage:', mapUrlsData);
      }
    }
  } catch (e) {
    console.warn('Erro ao carregar do localStorage:', e);
  }
  
  console.log('Usando dados de mapas:', mapUrlsData);
  return true;
}

// Sincronizar mapas do JSON com localStorage
function syncMapsWithJSON() {
  if (!mapUrlsData || !mapUrlsData.maps) return;
  
  mapUrlsData.maps.forEach(jsonMap => {
    // Verificar se já existe no localStorage
    const exists = savedMaps.find(map => map.url === jsonMap.url);
    
    if (!exists) {
      // Adicionar ao localStorage
      const newMap = {
        id: jsonMap.id,
        name: jsonMap.name,
        url: jsonMap.url,
        type: jsonMap.type,
        format: jsonMap.format,
        date: jsonMap.date || new Date().toISOString(),
        coordinates: jsonMap.coordinates,
        description: jsonMap.description,
        tags: jsonMap.tags || [],
        favorite: jsonMap.favorite || false
      };
      
      savedMaps.push(newMap);
    }
  });
  
  // Salvar no localStorage
  localStorage.setItem('trilhanca_maps', JSON.stringify(savedMaps));
}

// Carregar mapa específico do JSON
function loadMapFromJSON(mapId) {
  if (!mapUrlsData || !mapUrlsData.maps) return null;
  
  const mapData = mapUrlsData.maps.find(map => map.id === mapId);
  if (!mapData) return null;
  
  // Incrementar contador de acesso
  mapData.access_count = (mapData.access_count || 0) + 1;
  
  // Salvar no JSON (simulado via localStorage)
  saveMapAccessCount(mapId, mapData.access_count);
  
  return mapData;
}

// Salvar contador de acesso
function saveMapAccessCount(mapId, count) {
  const accessKey = `map_access_${mapId}`;
  localStorage.setItem(accessKey, count.toString());
}

// Função para carregar mapa na tela principal
function loadMapInMainView(mapData) {
  try {
    if (!mapData) {
      showNotification('Dados do mapa não encontrados', 'error');
      return;
    }
    
    // Se temos coordenadas, usar no mapa Leaflet
    if (mapData.coordinates && window.map) {
      const { lat, lng, zoom } = mapData.coordinates;
      
      // Centralizar mapa
      window.map.setView([lat, lng], zoom || 13);
      
      // Adicionar ou atualizar marcador
      if (!window.currentMarker) {
        window.currentMarker = L.marker([lat, lng]).addTo(window.map);
      } else {
        window.currentMarker.setLatLng([lat, lng]);
      }
      
      // Adicionar popup com informações
      const popupContent = `
        <div style="min-width: 200px;">
          <h4 style="margin: 0 0 8px 0; color: #333;">${mapData.name}</h4>
          <p style="margin: 4px 0; font-size: 12px; color: #666;">${mapData.description || ''}</p>
          <p style="margin: 4px 0; font-size: 11px; color: #999;">
            <strong>Tipo:</strong> ${mapData.type}<br>
            <strong>Coordenadas:</strong> ${lat.toFixed(4)}, ${lng.toFixed(4)}<br>
            <strong>Acessos:</strong> ${mapData.access_count || 0}
          </p>
          <button onclick="window.open('${mapData.url}', '_blank')" 
                  style="background: #007bff; color: white; border: none; 
                         padding: 6px 12px; border-radius: 4px; cursor: pointer;
                         margin-top: 8px;">
            Abrir Mapa Original
          </button>
        </div>
      `;
      
      window.currentMarker.bindPopup(popupContent).openPopup();
      
      showNotification(`Mapa "${mapData.name}" carregado com sucesso!`, 'success');
    }
    
    // Abrir mapa original em nova aba
    if (mapData.url) {
      window.open(mapData.url, '_blank');
    }
    
  } catch (error) {
    console.error('Erro ao carregar mapa:', error);
    showNotification('Erro ao carregar mapa', 'error');
    
    // Fallback: abrir apenas a URL
    if (mapData && mapData.url) {
      window.open(mapData.url, '_blank');
    }
  }
}

// Inicialização da biblioteca
async function initMapLibrary() {
  // Carregar dados do JSON primeiro
  await loadMapUrlsFromJSON();
  
  // Carregar lista de mapas
  loadSavedMapsList();
  
  // Event listeners
  bindMapLibraryEvents();
  
  console.log('Map library initialized successfully');
}

function bindMapLibraryEvents() {
  // Adicionar mapa por URL
  const addBtn = document.getElementById('add-library-map');
  const urlInput = document.getElementById('library-map-url');
  
  if(addBtn && urlInput) {
    addBtn.addEventListener('click', () => {
      addLibraryMap();
    });
    
    urlInput.addEventListener('keypress', (e) => {
      if(e.key === 'Enter') {
        addLibraryMap();
      }
    });
  }
  
  // Upload de arquivo
  const uploadBtn = document.getElementById('upload-map-file');
  const fileInput = document.getElementById('library-map-file');
  
  if(uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', () => {
      fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
      if(e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const geoData = JSON.parse(event.target.result);
            addLibraryMapFromData(file.name, geoData);
          } catch(error) {
            alert('Arquivo inválido. Use um arquivo GeoJSON válido.');
          }
        };
        reader.readAsText(file);
      }
    });
  }
  
  // Gerenciar biblioteca
  const manageBtn = document.getElementById('manage-library');
  if(manageBtn) {
    manageBtn.addEventListener('click', () => {
      openLibraryManager();
    });
  }
  
  // Abrir biblioteca
  const openBtn = document.getElementById('open-library');
  if(openBtn) {
    openBtn.addEventListener('click', () => {
      openLibraryPage();
    });
  }
}

function addLibraryMap() {
  const urlInput = document.getElementById('library-map-url');
  const url = urlInput.value.trim();
  
  if (!url) {
    showNotification('Por favor, informe o link do mapa', 'error');
    return;
  }
  
  if (!isValidUrl(url)) {
    showNotification('URL inválida', 'error');
    return;
  }
  
  // Verificar se já existe
  if (savedMaps.find(map => map.url === url)) {
    showNotification('Este mapa já está salvo', 'warning');
    return;
  }
  
  // Adicionar mapa
  const newMap = {
    id: Date.now(),
    name: extractMapName(url),
    url: url,
    type: detectMapType(url),
    date: new Date().toISOString()
  };
  
  savedMaps.push(newMap);
  localStorage.setItem('trilhanca_maps', JSON.stringify(savedMaps));
  
  // Limpar input e atualizar lista
  urlInput.value = '';
  loadSavedMapsList();
  
  showNotification('Mapa adicionado com sucesso!', 'success');
}

function loadSavedMapsList() {
  const container = document.getElementById('saved-maps-list');
  if (!container) return;
  
  if (savedMaps.length === 0) {
    container.innerHTML = `
      <div class="empty-maps">
        <span style="color: #999; font-size: 0.85rem;">Nenhum mapa salvo</span>
      </div>
    `;
    return;
  }
  
  container.innerHTML = '';
  savedMaps.slice(0, 5).forEach(map => { // Mostrar apenas os 5 mais recentes
    const mapItem = createMapListItem(map);
    container.appendChild(mapItem);
  });
}

function createMapListItem(map) {
  const item = document.createElement('div');
  item.className = 'map-item';
  
  // Verificar se é favorito
  const isFavorite = map.favorite || false;
  const favoriteIcon = isFavorite ? '⭐' : '☆';
  
  // Obter contador de acesso
  const accessCount = map.access_count || 0;
  
  item.innerHTML = `
    <div class="map-item-info">
      <div class="map-item-name">
        ${favoriteIcon} ${map.name}
        ${isFavorite ? '<span style="color: #007bff; font-size: 0.8rem;">FAV</span>' : ''}
      </div>
      <div class="map-item-type">${map.type}</div>
      ${accessCount > 0 ? `<div style="color: #666; font-size: 0.7rem;">Acessos: ${accessCount}</div>` : ''}
    </div>
    <div class="map-item-actions">
      <button class="map-item-btn" onclick="loadMapFromLibrary('${map.url}', ${map.id || 'null'})" title="Carregar mapa">📍</button>
      <button class="map-item-btn delete" onclick="deleteLibraryMap(${map.id})" title="Excluir">🗑️</button>
    </div>
  `;
  
  return item;
}

function loadMapFromLibrary(url, mapId) {
  try {
    let mapData = null;
    
    // Tentar carregar do JSON primeiro
    if (mapId && mapUrlsData) {
      mapData = loadMapFromJSON(mapId);
    }
    
    // Se não encontrou no JSON, criar objeto básico
    if (!mapData) {
      mapData = {
        name: extractMapName(url),
        url: url,
        type: detectMapType(url),
        coordinates: extractCoordinatesFromUrl(url)
      };
    }
    
    // Carregar na vista principal
    loadMapInMainView(mapData);
    
  } catch (error) {
    console.error('Erro ao carregar mapa da biblioteca:', error);
    
    // Fallback: abrir URL diretamente
    window.open(url, '_blank');
    showNotification('Mapa aberto em nova aba', 'success');
  }
}

function deleteLibraryMap(id) {
  if (confirm('Tem certeza que deseja excluir este mapa?')) {
    savedMaps = savedMaps.filter(map => map.id !== id);
    localStorage.setItem('trilhanca_maps', JSON.stringify(savedMaps));
    loadSavedMapsList();
    showNotification('Mapa excluído', 'success');
  }
}

function addLibraryMapFromData(fileName, geoData) {
  const newMap = {
    id: 'map_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    name: fileName.replace(/\.[^/.]+$/, ""), // Remover extensão
    url: 'data:application/json,' + encodeURIComponent(JSON.stringify(geoData)),
    type: 'file',
    format: 'geojson',
    date: new Date().toISOString(),
    coordinates: null,
    description: `Arquivo: ${fileName}`,
    tags: ['upload'],
    favorite: false
  };
  
  savedMaps.push(newMap);
  localStorage.setItem('trilhanca_maps', JSON.stringify(savedMaps));
  loadSavedMapsList();
  showNotification('Mapa adicionado com sucesso!', 'success');
}

function openLibraryManager() {
  window.open('./Mapas/map-library.html', '_blank');
}

function openLibraryPage() {
  window.open('./Mapas/map-library.html', '_blank');
}

function extractMapName(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    if (hostname.includes('openstreetmap')) return 'OpenStreetMap';
    if (hostname.includes('google')) return 'Google Maps';
    if (hostname.includes('mapbox')) return 'Mapbox';
    if (hostname.includes('leaflet')) return 'Leaflet';
    
    return hostname || 'Mapa sem nome';
  } catch {
    return 'Mapa sem nome';
  }
}

function detectMapType(url) {
  if (url.includes('openstreetmap') || url.includes('osm')) return 'OpenStreetMap';
  if (url.includes('google') && url.includes('maps')) return 'Google Maps';
  if (url.includes('leaflet')) return 'Leaflet';
  if (url.includes('mapbox')) return 'Mapbox';
  return 'Outro';
}

function extractCoordinatesFromUrl(url) {
  // OpenStreetMap: #map=zoom/lat/lng
  const osmMatch = url.match(/#map=(\d+)\/(-?\d+\.?\d*)\/(-?\d+\.?\d*)/);
  if (osmMatch) {
    return {
      lat: parseFloat(osmMatch[2]),
      lng: parseFloat(osmMatch[3]),
      zoom: parseInt(osmMatch[1])
    };
  }
  
  // Google Maps: @lat,lng,zoom
  const googleMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*),(\d+)z/);
  if (googleMatch) {
    return {
      lat: parseFloat(googleMatch[1]),
      lng: parseFloat(googleMatch[2]),
      zoom: parseInt(googleMatch[3])
    };
  }
  
  return null;
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function showNotification(message, type = 'info') {
  // Criar elemento de notificação
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease;
  `;
  
  // Definir cor baseada no tipo
  const colors = {
    success: '#28a745',
    error: '#dc3545',
    warning: '#ff8a34',
    info: '#007bff'
  };
  
  notification.style.background = colors[type] || colors.info;
  notification.textContent = message;
  
  // Adicionar ao DOM
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

// Adicionar animações CSS
const customStylesElement = document.createElement('style');
customStylesElement.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(customStylesElement);

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing...');
    initMapLibrary();
    startMap();
  });
} else {
  console.log('DOM already ready - initializing...');
  initMapLibrary();
  startMap();
}

// Funções de localização e seguimento
function updateLocUI(){
  if(toggleLocBtn){
    toggleLocBtn.textContent = locActive ? 'Parar' : 'Iniciar';
    toggleLocBtn.classList.toggle('primary', locActive);
  }
  if(locStatusEl){
    if(locActive){
      locStatusEl.textContent = 'GPS ativo';
      locStatusEl.classList.remove('status-error', 'status-warn');
      locStatusEl.classList.add('status-ok');
    } else {
      locStatusEl.textContent = 'GPS inativo';
      locStatusEl.classList.remove('status-ok', 'status-warn');
      locStatusEl.classList.add('status-error');
    }
  }
}

function updateFollowUI(){
  if(followBtn){ followBtn.classList.toggle('primary', followMe); }
  const recenter = document.getElementById('map-recenter');
  if(recenter){ recenter.style.display = followMe ? 'none' : 'block'; }
}

function setFollow(state){
  followMe = !!state;
  updateFollowUI();
}

function startLocation(){
  if(locActive) return;
  if(!navigator.geolocation){ if(locStatusEl){ locStatusEl.textContent='Geolocalização não suportada'; locStatusEl.classList.add('status-error'); } return; }
  locActive = true;
  updateLocUI();
  let first = true;
  let lastFixTs = Date.now();
  let animFrame = null;
  let animFrom = null;
  let animTo = null;
  let animStart = 0;
  let animDur = 800;
  function step(){
    if(!animTo || !animFrom || !locMarker){ animFrame = null; return; }
    const t = Math.min(1, (Date.now()-animStart)/animDur);
    const lat = animFrom.lat + (animTo.lat - animFrom.lat)*t;
    const lng = animFrom.lng + (animTo.lng - animFrom.lng)*t;
    try{ locMarker.setLatLng([lat, lng]); }catch(e){}
    if(t<1){ animFrame = requestAnimationFrame(step); } else { animFrame = null; animFrom = animTo; }
  }
  function animateTo(p){
    animFrom = locMarker ? (locMarker.getLatLng? locMarker.getLatLng() : p) : p;
    animTo = p;
    animStart = Date.now();
    if(!animFrame) animFrame = requestAnimationFrame(step);
  }
  locWatchId = navigator.geolocation.watchPosition((pos)=>{
    const lat = pos.coords.latitude, lon = pos.coords.longitude, acc = pos.coords.accuracy || 0;
    currentLocation = L.latLng(lat, lon);
    lastFixTs = Date.now();
    if(geoAccEl){ geoAccEl.textContent = `±${Math.round(acc)} m`; }
    const sp = typeof pos.coords.speed === 'number' && !isNaN(pos.coords.speed) ? Math.max(0, pos.coords.speed) : null;
    if(geoSpeedEl){ geoSpeedEl.textContent = sp != null ? `${(sp*3.6).toFixed(1)} km/h` : '— km/h'; }
    let hd = typeof pos.coords.heading === 'number' && !isNaN(pos.coords.heading) ? Math.round(pos.coords.heading) : null;
    if(hd == null && lastPosForBearing){
      const toRad = (d)=> d*Math.PI/180, toDeg = (r)=> r*180/Math.PI;
      const φ1 = toRad(lastPosForBearing.lat), φ2 = toRad(lat);
      const Δλ = toRad(lon - lastPosForBearing.lng);
      const y = Math.sin(Δλ) * Math.cos(φ2);
      const x = Math.cos(φ1)*Math.sin(φ2) - Math.sin(φ1)*Math.cos(φ2)*Math.cos(Δλ);
      const θ = Math.atan2(y, x);
      let brg = (toDeg(θ) + 360) % 360;
      const dist = map ? map.distance(lastPosForBearing, currentLocation) : 0;
      if(dist > 3) hd = Math.round(brg);
    }
    lastPosForBearing = currentLocation;
    if(geoHeadEl){ geoHeadEl.textContent = hd != null ? `${hd}°` : '—°'; }
    if(!locMarker){
      if(vehicleSelectEl){
        const ic = getVehicleIcon(vehicleSelectEl.value || vehicleType);
        locMarker = L.marker(currentLocation, {icon: ic}).addTo(map).bindPopup('Você');
      }else{
        locMarker = L.circleMarker(currentLocation, {radius:8, color:'#00d1ff', weight:3, fillColor:'#00d1ff', fillOpacity:0.35}).addTo(map).bindPopup('Você');
      }
    }else{ animateTo(currentLocation); }
    if(hd != null){
      try{
        const el = locMarker && locMarker.getElement ? locMarker.getElement() : null;
        const img = el ? el.querySelector('img') : null;
        if(img){
          const lerp = (a,b,t)=>{ const d=((b-a+540)%360)-180; return (a + t*d + 360)%360; };
          const adapt = (typeof sp==='number' && sp<1.5) ? 0.15 : 0.25;
          lastHeading = lastHeading == null ? hd : lerp(lastHeading, hd, adapt);
          img.style.transform = `rotate(${lastHeading}deg)`;
        }
      }catch(e){}
    }
    if(acc && acc > 0){
      if(!locAccCircle){ locAccCircle = L.circle(currentLocation, {radius: acc, color:'#6aa4ff', weight:1, fillColor:'#6aa4ff', fillOpacity:0.15}).addTo(map); }
      else{ locAccCircle.setLatLng(currentLocation); locAccCircle.setRadius(acc); }
    }
    if(first){ 
      try{ map.flyTo(currentLocation, Math.max(map.getZoom(), 15), {animate:true, duration:0.75}); }catch(e){}
      if(followBtn){ followMe = true; followBtn.classList.add('primary'); }
      first = false; 
    }
    else if(followMe){ try{ map.flyTo(currentLocation, Math.max(map.getZoom(), 16), {animate:true, duration:0.6}); }catch(e){} }
    try{ localStorage.setItem('live_location', JSON.stringify({lat, lon, acc, ts: Date.now()})); }catch(e){}
    if(locStatusEl){ locStatusEl.textContent = `Lat ${lat.toFixed(5)} • Lon ${lon.toFixed(5)} • ±${Math.round(acc)}m`; locStatusEl.classList.add('status-ok'); }
    if(routeCoordsLL && routeCoordsLL.length>1){ 
      try{
        let nearestIdx = 0;
        let bestDist = Infinity;
        for(let i=0;i<routeCoordsLL.length;i++){
          const d = map.distance(currentLocation, routeCoordsLL[i]);
          if(d < bestDist){ bestDist = d; nearestIdx = i; }
        }
        const ahead = routeCoordsLL.slice(nearestIdx);
        if(ahead.length>1){
          if(routeAheadLayer){ map.removeLayer(routeAheadLayer); }
          routeAheadLayer = L.polyline(ahead, {color:'#3b82f6', weight:6, opacity:0.95}).addTo(map);
        }
      }catch(e){}
    }
  }, (err)=>{
    if(locStatusEl){ locStatusEl.textContent = 'Erro de localização'; locStatusEl.classList.add('status-error'); }
  }, {enableHighAccuracy:true, maximumAge:2000, timeout:8000});
  setInterval(()=>{
    if(!locActive) return;
    const now = Date.now();
    const diff = now - lastFixTs;
    if(diff > 10000){
      if(locStatusEl){ locStatusEl.textContent = 'Sem atualização de GPS recente'; locStatusEl.classList.add('status-warn'); }
      setFollow(false);
    }
  }, 3000);
}
function stopLocation(){
  if(!locActive) return;
  try{ if(locWatchId != null) navigator.geolocation.clearWatch(locWatchId); }catch(e){}
  locWatchId = null;
  locActive = false;
  try{ if(locMarker){ map.removeLayer(locMarker); } }catch(e){} locMarker = null;
  try{ if(locAccCircle){ map.removeLayer(locAccCircle); } }catch(e){} locAccCircle = null;
  updateLocUI();
}
if(toggleLocBtn){
  toggleLocBtn.addEventListener('click', ()=>{ if(locActive) stopLocation(); else startLocation(); });
}
updateLocUI();
window.addEventListener('storage', (e)=>{
  if(e.key === 'live_location' && !locActive){
    try{
      const obj = JSON.parse(e.newValue||'{}');
      if(obj && typeof obj.lat === 'number' && typeof obj.lon === 'number'){
        const p = L.latLng(obj.lat, obj.lon);
        if(!locMarker){ locMarker = L.circleMarker(p, {radius:8, color:'#00d1ff', weight:3, fillColor:'#00d1ff', fillOpacity:0.35}).addTo(map); }
        else{ locMarker.setLatLng(p); }
        if(locStatusEl){ locStatusEl.textContent = `Localização recebida • Lat ${obj.lat.toFixed(5)} • Lon ${obj.lon.toFixed(5)}`; locStatusEl.classList.add('status-warn'); }
      }
    }catch(e){}
  }
});

let searchMarker = null;
async function searchAddress(){
  if(!addressSearchEl || !addressSearchEl.value) return;
  const q = addressSearchEl.value.trim();
  if(!q) return;
  try{
    const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`, { headers: { 'Accept': 'application/json' } });
    const data = await resp.json();
    if(Array.isArray(data) && data.length){
      const lat = parseFloat(data[0].lat), lon = parseFloat(data[0].lon);
      const p = L.latLng(lat, lon);
      if(searchMarker) map.removeLayer(searchMarker);
      searchMarker = L.circleMarker(p, {radius:9, color:'#9b59b6', weight:3, fillColor:'#9b59b6', fillOpacity:0.35}).addTo(map).bindPopup(data[0].display_name||'Local');
      try{ map.setView(p, Math.max(map.getZoom(), 15)); }catch(e){}
      if(latEl) latEl.value = lat.toFixed(6);
      if(lonEl) lonEl.value = lon.toFixed(6);
      if(lat2El) lat2El.value = lat.toFixed(6);
      if(lon2El) lon2El.value = lon.toFixed(6);
    }
  }catch(e){}
}
if(addressSearchGoBtn){ addressSearchGoBtn.addEventListener('click', ()=> searchAddress()); }
if(addressSearchEl){ addressSearchEl.addEventListener('keydown', (e)=>{ if(e.key === 'Enter'){ e.preventDefault(); searchAddress(); } }); }

function setBase(mode){
  try{
    if(currentBase) map.removeLayer(currentBase);
  }catch(e){}
  try{
    if(labelsOverlay){ map.removeLayer(labelsOverlay); labelsOverlay = null; }
  }catch(e){}
  if(mode === 'sat'){ currentBase = baseSat.addTo(map); }
  else { currentBase = baseNormal.addTo(map); }
  if(mode === 'sat'){
    try{
      labelsOverlay = L.tileLayer(
        'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        {pane:'labelsPane', attribution:'© Esri', maxZoom: 20, opacity: 0.9}
      ).addTo(map);
    }catch(e){}
  }
}
const baseNormalBtn = document.getElementById('base-normal');
if(baseNormalBtn){ baseNormalBtn.addEventListener('click', ()=>{ baseIsSat=false; setBase('normal'); }); }
const baseSatBtn = document.getElementById('base-sat');
if(baseSatBtn){ baseSatBtn.addEventListener('click', ()=>{ baseIsSat=true; setBase('sat'); }); }
if(vehicleSelectEl){
  vehicleSelectEl.addEventListener('change', ()=> persistVehicleChoice(vehicleSelectEl.value));
}
const saveTomTomBtn = document.getElementById('save-tomtom-key');
if(saveTomTomBtn){
  saveTomTomBtn.addEventListener('click', async ()=>{
    const input = document.getElementById('tomtom-key');
    if(!input || !input.value) return;
    const pass = prompt('Defina uma senha para proteger a chave');
    if(!pass) return;
    if(!window.CryptoKit){ alert('Módulo de criptografia não carregado'); return; }
    try{
      await window.CryptoKit.setSecureItem('tomtom_key', input.value.trim(), pass);
      localStorage.setItem('tomtom_key_present','1');
      input.value='';
      alert('Chave TomTom salva com criptografia');
    }catch(e){ alert('Falha ao salvar a chave'); }
  });
}
async function loadTomTomKeyWithPrompt(){
  if(!window.CryptoKit){ alert('Módulo de criptografia não carregado'); return null; }
  const tokenExists = !!localStorage.getItem('tomtom_key_present');
  if(!tokenExists){ alert('Nenhuma chave TomTom salva'); return null; }
  const pass = prompt('Digite a senha da chave TomTom');
  if(!pass) return null;
  const key = await window.CryptoKit.getSecureItem('tomtom_key', pass);
  if(!key){ alert('Senha incorreta ou dados inválidos'); return null; }
  return key;
}
const baseTomStBtn = document.getElementById('base-tomtom-streets');
if(baseTomStBtn){
  baseTomStBtn.addEventListener('click', async ()=>{
    const key = await loadTomTomKeyWithPrompt();
    if(!key) return;
    try{
      if(currentBase) map.removeLayer(currentBase);
    }catch(e){}
    baseTomTomStreets = L.tileLayer(`https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=${encodeURIComponent(key)}`, {attribution:'© TomTom', maxZoom:20});
    currentBase = baseTomTomStreets.addTo(map);
    baseIsSat=false;
    try{ if(labelsOverlay){ map.removeLayer(labelsOverlay); labelsOverlay = null; } }catch(e){}
  });
}
const baseTomSatBtn = document.getElementById('base-tomtom-sat');
if(baseTomSatBtn){
  baseTomSatBtn.addEventListener('click', async ()=>{
    const key = await loadTomTomKeyWithPrompt();
    if(!key) return;
    try{
      if(currentBase) map.removeLayer(currentBase);
    }catch(e){}
    baseTomTomSat = L.tileLayer(`https://api.tomtom.com/map/1/tile/sat/main/{z}/{x}/{y}.png?key=${encodeURIComponent(key)}`, {attribution:'© TomTom', maxZoom:20});
    currentBase = baseTomTomSat.addTo(map);
    baseIsSat=true;
    try{
      if(labelsOverlay){ map.removeLayer(labelsOverlay); labelsOverlay = null; }
      labelsOverlay = L.tileLayer(
        `https://api.tomtom.com/map/1/tile/hybrid/main/{z}/{x}/{y}.png?key=${encodeURIComponent(key)}`,
        {pane:'labelsPane', attribution:'© TomTom', maxZoom: 20, opacity: 0.9}
      ).addTo(map);
    }catch(e){}
  });
}

async function loadRoads(bounds){
  try{
    const now = Date.now();
    if(now - lastRoadsFetchTs < 3000) return;
    lastRoadsFetchTs = now;
    
    // Validar bounds
    if(!bounds || !bounds.getSouth || !bounds.getNorth || !bounds.getWest || !bounds.getEast) {
      console.warn('Bounds inválidos para loadRoads');
      return;
    }
    
    const s = bounds.getSouth();
    const w = bounds.getWest(); 
    const n = bounds.getNorth();
    const e = bounds.getEast();
    
    // Validar coordenadas
    if(s < -90 || s > 90 || n < -90 || n > 90 || w < -180 || w > 180 || e < -180 || e > 180) {
      console.warn('Coordenadas fora dos limites válidos:', {s, w, n, e});
      return;
    }
    
    // Reduzir área para evitar query muito grande
    const padding = 0.01; // ~1km de padding
    const queryS = Math.max(s - padding, -90);
    const queryW = Math.max(w - padding, -180);
    const queryN = Math.min(n + padding, 90);
    const queryE = Math.min(e + padding, 180);
    
    // Query Overpass otimizada
    const query = `[out:json][timeout:25];
    (
      way["highway"~"motorway|trunk|primary|secondary"](${queryS},${queryW},${queryN},${queryE});
    );
    out geom;`;
    
    console.log('Query Overpass:', query);
    
    const resp = await fetch('https://overpass-api.de/api/interpreter',{
      method:'POST', 
      body:query, 
      headers:{
        'Content-Type':'text/plain; charset=utf-8'
      }
    });
    
    if(!resp.ok) {
      console.warn('Erro na requisição Overpass:', resp.status, resp.statusText);
      return;
    }
    
    const data = await resp.json();
    
    if(!data.elements || data.elements.length === 0) {
      console.log('Nenhuma estrada encontrada na área');
      roadsLayer.clearLayers();
      return;
    }
    
    roadsLayer.clearLayers();
    const features = [];
    for(const el of data.elements){
      if(el.type === 'way' && Array.isArray(el.geometry)){
        const coords = el.geometry.map(pt=> [pt.lon, pt.lat]);
        features.push({type:'Feature', properties:{}, geometry:{type:'LineString', coordinates: coords}});
      }
    }
    
    if(features.length === 0) {
      console.log('Nenhuma geometria válida encontrada');
      return;
    }
    
    const geo = {type:'FeatureCollection', features};
    const halo = L.geoJSON(geo,{pane:'roadsPane', style:{color:'#ffffff',weight:12,opacity:0.45, lineCap:'round', lineJoin:'round'}});
    const core = L.geoJSON(geo,{pane:'roadsPane', style:{color:'#ffcc33',weight:7,opacity:1, lineCap:'round', lineJoin:'round'}});
    roadsLayer.addLayer(halo);
    roadsLayer.addLayer(core);
    try{ core.bringToFront(); }catch(e){}
    
    console.log(`Carregadas ${features.length} estradas`);
  }catch(error){
    console.error('Erro ao carregar estradas:', error);
  }
}

// ========================
// BOTÕES DE DEFINIÇÃO
// ========================
document.getElementById('set-origin').onclick = () => {
  mode = 'origin';
  document.getElementById('route-info').textContent =
    'Clique no mapa para definir a origem';
};

document.getElementById('set-dest').onclick = () => {
  mode = 'dest';
  document.getElementById('route-info').textContent =
    'Clique no mapa para definir o destino';
};

// ========================
// GPS – MINHA LOCALIZAÇÃO
// ========================
document.getElementById('use-gps').addEventListener('click', (e) => {
  e.preventDefault();

  if (!navigator.geolocation) {
    alert('Geolocalização não suportada');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      currentLocation = L.latLng(lat, lng);

      if (originMarker) map.removeLayer(originMarker);
      originMarker = L.circleMarker(currentLocation, {
        radius: 7,
        color: '#2ecc71'
      }).addTo(map).bindPopup('Origem (Você)');

      originCoordsEl.value = 'Minha Localização';
      map.setView(currentLocation, 15);
      if(latEl) latEl.value = lat.toFixed(6);
      if(lonEl) lonEl.value = lng.toFixed(6);
    },
    () => alert('Não foi possível obter sua localização'),
    { enableHighAccuracy: true }
  );
});

// ========================
// RESOLVER LOCAL (TEXTO → COORD)
// ========================
async function resolveLocation(text, marker) {
  if (!text) return null;

  if (text === 'Minha Localização' && currentLocation) {
    return currentLocation;
  }

  const parts = text.split(',').map(v => parseFloat(v.trim()));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return L.latLng(parts[0], parts[1]);
  }

  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=1`,
      { headers: { 'Accept': 'application/json' } }
    );
    const data = await resp.json();
    if (data && data.length) {
      return L.latLng(data[0].lat, data[0].lon);
    }
  } catch (e) {
    console.error(e);
  }

  return marker ? marker.getLatLng() : null;
}

// ========================
// CALCULAR ROTA
// ========================
document.getElementById('calc-route').addEventListener('click', async () => {
  const infoEl = document.getElementById('route-info');

  if (!originCoordsEl.value) {
    alert('Defina a origem');
    return;
  }

  if (!destCoordsEl.value) {
    alert('Defina o destino');
    return;
  }

  infoEl.textContent = 'Calculando rota...';

  const origin = await resolveLocation(originCoordsEl.value, originMarker);
  const dest   = await resolveLocation(destCoordsEl.value, destMarker);

  if (!origin || !dest) {
    alert('Origem ou destino inválidos');
    infoEl.textContent = '';
    return;
  }

  if (originMarker) map.removeLayer(originMarker);
  originMarker = L.circleMarker(origin, {
    radius: 7,
    color: '#2ecc71'
  }).addTo(map);

  if (destMarker) map.removeLayer(destMarker);
  destMarker = L.circleMarker(dest, {
    radius: 7,
    color: '#e74c3c'
  }).addTo(map);

  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;

  try {
    const resp = await fetch(url);
    const data = await resp.json();

    if (!data.routes || !data.routes.length) {
      throw new Error('Sem rota');
    }

    if (routeLayer) map.removeLayer(routeLayer);
    if (routeAheadLayer){ map.removeLayer(routeAheadLayer); routeAheadLayer = null; }

    routeLayer = L.geoJSON(data.routes[0].geometry, {
      style: { color: '#00d1ff', weight: 5, opacity: 0.9 }
    }).addTo(map);

    const coords = data.routes[0].geometry.coordinates || [];
    routeCoordsLL = coords.map(c=> L.latLng(c[1], c[0]));

    map.fitBounds(routeLayer.getBounds().pad(0.1));

    const km = (data.routes[0].distance / 1000).toFixed(2);
    const min = Math.round(data.routes[0].duration / 60);

    infoEl.textContent = `Distância: ${km} km • Tempo: ${min} min`;
  } catch (e) {
    alert('Erro ao calcular rota');
    infoEl.textContent = '';
  }
});

async function applyOriginFromInput(){
  if(!originCoordsEl || !originCoordsEl.value) return null;
  const p = await resolveLocation(originCoordsEl.value, originMarker);
  if(!p) return null;
  if(originMarker) map.removeLayer(originMarker);
  originMarker = L.circleMarker(p, {radius:7, color:'#2ecc71'}).addTo(map).bindPopup('Origem');
  try{ map.setView(p, Math.max(map.getZoom(), 15)); }catch(e){}
  return p;
}
async function applyDestFromInput(){
  if(!destCoordsEl || !destCoordsEl.value) return null;
  const p = await resolveLocation(destCoordsEl.value, destMarker);
  if(!p) return null;
  if(destMarker) map.removeLayer(destMarker);
  destMarker = L.circleMarker(p, {radius:7, color:'#e74c3c'}).addTo(map).bindPopup('Destino');
  try{ map.setView(p, Math.max(map.getZoom(), 15)); }catch(e){}
  return p;
}
if(originCoordsEl){
  originCoordsEl.addEventListener('keydown', async (e)=>{ if(e.key === 'Enter'){ e.preventDefault(); await applyOriginFromInput(); } });
  originCoordsEl.addEventListener('blur', async ()=>{ await applyOriginFromInput(); });
}
if(destCoordsEl){
  destCoordsEl.addEventListener('keydown', async (e)=>{ if(e.key === 'Enter'){ e.preventDefault(); await applyDestFromInput(); } });
  destCoordsEl.addEventListener('blur', async ()=>{ await applyDestFromInput(); });
}

// ========================
// LIMPAR ROTA
// ========================
document.getElementById('clear-route').onclick = () => {
  if (originMarker) map.removeLayer(originMarker);
  if (destMarker) map.removeLayer(destMarker);
  if (routeLayer) map.removeLayer(routeLayer);

  originMarker = destMarker = routeLayer = null;
  originCoordsEl.value = '';
  destCoordsEl.value = '';
  document.getElementById('route-info').textContent = '';
};

const swapBtn = document.getElementById('swap-route');
if(swapBtn){
  swapBtn.addEventListener('click', async ()=>{
    const o = originCoordsEl.value;
    originCoordsEl.value = destCoordsEl.value;
    destCoordsEl.value = o;
    await applyOriginFromInput();
    await applyDestFromInput();
  });
}

function formatKm(m){ return (m/1000).toFixed(2).replace('.', ',') + ' km'; }
function hav(lat1, lon1, lat2, lon2){
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI/180;
  const dLon = (lon2 - lon1) * Math.PI/180;
  const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
function updateOdoUI(){
  const v = document.getElementById('odo-value');
  const s = document.getElementById('odo-status');
  const b = document.getElementById('odo-start-stop');
  if(v) v.textContent = formatKm(odoMeters);
  if(s) s.textContent = odoActive ? 'Hodômetro ativo' : 'Hodômetro parado';
  if(b) b.textContent = odoActive ? 'Parar' : 'Iniciar';
}
function startOdo(){
  if(odoActive) return;
  if(!navigator.geolocation){ alert('Geolocalização não suportada'); return; }
  odoActive = true;
  updateOdoUI();
  odoWatchId = navigator.geolocation.watchPosition((pos)=>{
    const lat = pos.coords.latitude, lon = pos.coords.longitude;
    const last = odoPath.length ? odoPath[odoPath.length-1] : null;
    const cur = [lat, lon];
    if(last){
      const d = hav(last[0], last[1], lat, lon);
      if(d > 5 && d < 5000) odoMeters += d;
    }
    odoPath.push(cur);
    if(!odoLayer){ odoLayer = L.polyline(odoPath.map(p=> [p[0], p[1]]), {color:'#00d1ff', weight:4, opacity:0.9}).addTo(map); }
    else { odoLayer.setLatLngs(odoPath.map(p=> [p[0], p[1]])); }
    updateOdoUI();
  }, ()=>{}, {enableHighAccuracy:true, maximumAge:5000, timeout:8000});
}
function stopOdo(){
  if(!odoActive) return;
  try{ if(odoWatchId != null) navigator.geolocation.clearWatch(odoWatchId); }catch(e){}
  odoWatchId = null;
  odoActive = false;
  updateOdoUI();
}
function resetOdo(){
  stopOdo();
  odoMeters = 0;
  odoPath = [];
  if(odoLayer){ try{ map.removeLayer(odoLayer); }catch(e){} odoLayer = null; }
  updateOdoUI();
}
const odoBtn = document.getElementById('odo-start-stop');
if(odoBtn){ odoBtn.addEventListener('click', ()=>{ if(odoActive) stopOdo(); else startOdo(); }); }
const odoReset = document.getElementById('odo-reset');
if(odoReset){ odoReset.addEventListener('click', ()=> resetOdo()); }
const odoExport = document.getElementById('odo-export');
if(odoExport){
  odoExport.addEventListener('click', ()=>{
    const fc = {type:'FeatureCollection', features: []};
    if(odoPath.length > 1){
      const line = {type:'Feature', properties:{type:'odo'}, geometry:{type:'LineString', coordinates: odoPath.map(p=> [p[1], p[0]])}};
      fc.features.push(line);
    }
    const blob = new Blob([JSON.stringify(fc)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'trilha_odo.geojson';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}
function saveOdoState(){
  try{
    const state = {meters: odoMeters, path: odoPath};
    localStorage.setItem('odo_state', JSON.stringify(state));
  }catch(e){}
}
function loadOdoState(){
  try{
    const raw = localStorage.getItem('odo_state');
    if(!raw) return;
    const st = JSON.parse(raw);
    if(typeof st.meters === 'number') odoMeters = st.meters;
    if(Array.isArray(st.path)) odoPath = st.path;
    if(odoPath.length > 1){
      odoLayer = L.polyline(odoPath.map(p=> [p[0], p[1]]), {color:'#00d1ff', weight:4, opacity:0.9}).addTo(map);
    }
    updateOdoUI();
  }catch(e){}
}
loadOdoState();
const origUpdateOdoUI = updateOdoUI;
updateOdoUI = function(){ origUpdateOdoUI(); saveOdoState(); };
updateOdoUI();
function styleForFeature(f){
  const g = f && f.geometry ? f.geometry : null;
  const t = g ? g.type : '';
  if(t === 'LineString' || t === 'MultiLineString') return {pane:'dataPane', color:'#00d1ff', weight:4, opacity:0.9};
  if(t === 'Polygon' || t === 'MultiPolygon') return {pane:'dataPane', color:'#3b82f6', weight:2, opacity:0.9, fillColor:'#3b82f6', fillOpacity:0.15};
  return {pane:'dataPane', radius:7, color:'#10b981', weight:3, fillColor:'#10b981', fillOpacity:0.35};
}
function addGeoDataLayer(name, geo){
  if(!geo) return;
  const layer = L.geoJSON(geo, {
    pane:'dataPane',
    style: (f)=> styleForFeature(f),
    pointToLayer: (f, latlng)=> L.circleMarker(latlng, styleForFeature(f)),
    onEachFeature: (f, l)=> {
      const props = f && f.properties ? f.properties : {};
      const text = Object.keys(props).length ? JSON.stringify(props, null, 2) : 'Sem propriedades';
      l.bindPopup(`<pre style="max-width:260px;white-space:pre-wrap">${text}</pre>`);
    }
  }).addTo(dataViewerGroup);
  const id = 'gdv_'+Date.now()+'_'+Math.floor(Math.random()*1000);
  dataLayers.push({id, name: name || id, layer});
  rebuildGdvList();
  try{ map.fitBounds(layer.getBounds().pad(0.1)); }catch(e){}
}
function clearGeoDataLayers(){
  try{ dataViewerGroup.clearLayers(); }catch(e){}
  dataLayers = [];
  rebuildGdvList();
}
function rebuildGdvList(){
  if(!gdvListEl) return;
  gdvListEl.innerHTML = '';
  dataLayers.forEach((it)=>{
    const div = document.createElement('div');
    div.className = 'item';
    const cbId = it.id+'_cb';
    const visible = map.hasLayer(it.layer);
    div.innerHTML = `<h4>${it.name}</h4>
    <div class="row" style="align-items:center">
      <label style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="${cbId}" ${visible?'checked':''}/> Visível</label>
      <button class="btn" data-act="zoom">Zoom</button>
      <button class="btn" data-act="export">Exportar</button>
      <button class="btn" data-act="remove">Remover</button>
    </div>`;
    const cb = div.querySelector('#'+cbId);
    cb.addEventListener('change', ()=>{
      if(cb.checked){ it.layer.addTo(map); }
      else { try{ map.removeLayer(it.layer); }catch(e){} }
    });
    div.querySelector('[data-act="zoom"]').addEventListener('click', ()=>{ try{ map.fitBounds(it.layer.getBounds().pad(0.1)); }catch(e){} });
    div.querySelector('[data-act="export"]').addEventListener('click', ()=>{
      try{
        const gj = it.layer.toGeoJSON();
        const blob = new Blob([JSON.stringify(gj)], {type:'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = (it.name||'camada')+'.geojson';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }catch(e){}
    });
    div.querySelector('[data-act="remove"]').addEventListener('click', ()=>{
      try{ map.removeLayer(it.layer); dataViewerGroup.removeLayer(it.layer); }catch(e){}
      dataLayers = dataLayers.filter(x=> x.id !== it.id);
      rebuildGdvList();
    });
    gdvListEl.appendChild(div);
  });
}
// ========================
// RELATOS DE CONDIÇÃO DA VIA
// ========================
function severityColor(sev){
  if(sev === 'grave') return '#e74c3c';
  if(sev === 'moderada') return '#f1c40f';
  return '#4cd137';
}

function loadRoadReports(){
  try{
    const raw = localStorage.getItem('road_reports') || '[]';
    const arr = JSON.parse(raw);
    reportsLayer.clearLayers();
    const listEl = document.getElementById('road-list');
    if(listEl) listEl.innerHTML = '';
    arr.forEach(r=>{
      const marker = L.circleMarker([r.lat, r.lon], {
        pane:'reportsPane',
        radius: 8,
        color: severityColor(r.severity),
        weight: 3,
        fillColor: severityColor(r.severity),
        fillOpacity: 0.35
      }).addTo(reportsLayer);
      const label = `${new Date(r.ts).toLocaleString()} • ${r.type} (${r.severity})`;
      marker.bindPopup(`<strong>${label}</strong><br>${r.desc ? r.desc : ''}`);
      if(listEl){
        const item = document.createElement('div');
        item.className = 'item';
        item.innerHTML = `<h4>${label}</h4><div class="muted">${r.desc ? r.desc : ''}</div>`;
        listEl.appendChild(item);
      }
    });
  }catch(e){}
}

function saveRoadReport(r){
  try{
    const raw = localStorage.getItem('road_reports') || '[]';
    const arr = JSON.parse(raw);
    arr.unshift(r);
    localStorage.setItem('road_reports', JSON.stringify(arr));
  }catch(e){}
}

const roadUseGpsBtn = document.getElementById('road-use-gps');
if(roadUseGpsBtn){
  roadUseGpsBtn.addEventListener('click', ()=>{
    if(!navigator.geolocation){ alert('Geolocalização não suportada'); return; }
    navigator.geolocation.getCurrentPosition((pos)=>{
      const lat = pos.coords.latitude, lon = pos.coords.longitude;
      currentLocation = L.latLng(lat, lon);
      if(latEl) latEl.value = lat.toFixed(6);
      if(lonEl) lonEl.value = lon.toFixed(6);
      map.setView(currentLocation, 15);
    }, ()=> alert('Não foi possível obter sua localização'), {enableHighAccuracy:true});
  });
}

const roadSaveBtn = document.getElementById('road-save');
if(roadSaveBtn){
  roadSaveBtn.addEventListener('click', ()=>{
    const lat = parseFloat(latEl && latEl.value ? latEl.value : (currentLocation ? currentLocation.lat : NaN));
    const lon = parseFloat(lonEl && lonEl.value ? lonEl.value : (currentLocation ? currentLocation.lng : NaN));
    if(isNaN(lat) || isNaN(lon)){ alert('Selecione um ponto no mapa ou use o GPS'); return; }
    const type = (document.getElementById('road-type')?.value) || 'indefinido';
    const severity = (document.getElementById('road-severity')?.value) || 'leve';
    const desc = (document.getElementById('road-desc')?.value || '').trim();
    const report = {lat, lon, type, severity, desc, ts: Date.now()};
    saveRoadReport(report);
    loadRoadReports();
    alert('Condição salva');
  });
}

loadRoadReports();
function updateLastMsg(){
  try{
    const raw = localStorage.getItem('comms_messages') || '[]';
    const arr = JSON.parse(raw);
    const el = document.getElementById('last-msg');
    if(!el) return;
    if(Array.isArray(arr) && arr.length){
      const m = arr[arr.length-1];
      const time = new Date(m.ts).toLocaleTimeString();
      el.textContent = time + ' • ' + (m.de && m.de.nome ? m.de.nome : 'Integrante') + ': ' + m.texto;
    }else{
      el.textContent = 'Sem mensagens';
    }
  }catch(e){}
}
updateLastMsg();
window.addEventListener('storage', (e)=>{ if(e.key === 'comms_messages') updateLastMsg(); });

(function(){
  'use strict';
  function hideElement(el, focusEl){ el.style.display='none'; if(focusEl) focusEl.focus(); }
  function showElement(el, focusEl){ el.style.display='block'; if(focusEl) focusEl.focus(); }
  function hasHiddenContent(el){ const noscroll = window.getComputedStyle(el).overflowY.includes('hidden'); return noscroll && el.scrollHeight > el.clientHeight; }
  function formatPlaceType(str){ const capitalized = str.charAt(0).toUpperCase()+str.slice(1); return capitalized.replace(/_/g,' '); }
  function initArray(n){ const a=[]; while(a.length<n)a.push(0); return a; }
  function addStarIcons(obj){ if(!obj.rating) return; const s=Math.round(2*obj.rating); const f=Math.floor(s/2); const h=f!==s/2?1:0; const e=5-f-h; obj.fullStarIcons=initArray(f); obj.halfStarIcons=initArray(h); obj.emptyStarIcons=initArray(e); }
  function parseDaysHours(openingHours){
    const daysHours = openingHours.weekday_text.map((e)=> e.split(/\:\s+/)).map((e)=>({days:e[0].substr(0,3), hours:e[1]}));
    for(let i=1;i<daysHours.length;i++){
      if(daysHours[i-1].hours===daysHours[i].hours){
        if(daysHours[i-1].days.indexOf('-')!==-1){ daysHours[i-1].days = daysHours[i-1].days.replace(/\w+$/, daysHours[i].days); }
        else { daysHours[i-1].days += ' - ' + daysHours[i].days; }
        daysHours.splice(i--,1);
      }
    }
    return daysHours;
  }
  const ND_NUM_PLACES_INITIAL=5;
  const ND_NUM_PLACES_SHOW_MORE=5;
  const ND_NUM_PLACE_PHOTOS_MAX=6;
  const ND_DEFAULT_POI_MIN_ZOOM=18;
  const ND_MARKER_ICONS_BY_TYPE={_default:'circle', park:'park', museum:'museum', shopping_mall:'local_mall'};
  function NeighborhoodDiscovery(configuration){
    const widget = this;
    const widgetEl = document.querySelector('.neighborhood-discovery');
    widget.center = configuration.mapOptions.center;
    widget.places = configuration.pois || [];
    function initializeMap(){
      const mapOptions = configuration.mapOptions;
      widget.mapBounds = new google.maps.Circle({center:widget.center, radius:configuration.mapRadius}).getBounds();
      mapOptions.restriction = {latLngBounds: widget.mapBounds};
      mapOptions.mapTypeControlOptions = {position: google.maps.ControlPosition.TOP_RIGHT};
      widget.map = new google.maps.Map(widgetEl.querySelector('.map'), mapOptions);
      widget.map.fitBounds(widget.mapBounds, 0);
      widget.map.addListener('click', (e)=>{ if(e.placeId){ e.stop(); widget.selectPlaceById(e.placeId);} });
      widget.map.addListener('zoom_changed', ()=>{
        const hideDefaultPoiPins = widget.map.getZoom() < ND_DEFAULT_POI_MIN_ZOOM;
        widget.map.setOptions({styles:[{featureType:'poi', elementType: hideDefaultPoiPins?'labels':'labels.text', stylers:[{visibility:'off'}]}]});
      });
      const markerPath = widgetEl.querySelector('.marker-pin path').getAttribute('d');
      const drawMarker = function(title, position, fillColor, strokeColor, labelText){
        return new google.maps.Marker({
          title, position, map: widget.map,
          icon:{path:markerPath, fillColor, fillOpacity:1, strokeColor, anchor:new google.maps.Point(13,35), labelOrigin:new google.maps.Point(13,13)},
          label:{text:labelText, color:'white', fontSize:'16px', fontFamily:'Material Icons'}
        });
      };
      if(configuration.centerMarker && configuration.centerMarker.icon){
        drawMarker('Home', widget.center, '#1A73E8', '#185ABC', configuration.centerMarker.icon);
      }
      widget.addPlaceMarker = function(place){
        place.marker = drawMarker(place.name, place.coords, '#EA4335', '#C5221F', place.icon);
        place.marker.addListener('click', ()=> void widget.selectPlaceById(place.placeId));
      };
      widget.updateBounds = function(places){
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(widget.center);
        for(let place of places){ bounds.extend(place.marker.getPosition()); }
        widget.map.fitBounds(bounds, 100);
      };
      widget.selectedPlaceMarker = new google.maps.Marker({title:'Point of Interest'});
    }
    function initializePlaceDetails(){
      const detailsService = new google.maps.places.PlacesService(widget.map);
      const placeIdsToDetails = new Map();
      for(let place of widget.places){ placeIdsToDetails.set(place.placeId, place); place.fetchedFields=new Set(['place_id']); }
      widget.fetchPlaceDetails = function(placeId, fields, callback){
        if(!placeId || !fields) return;
        let place = placeIdsToDetails.get(placeId);
        if(!place){ place = {placeId: placeId, fetchedFields:new Set(['place_id'])}; placeIdsToDetails.set(placeId, place); }
        const missingFields = fields.filter((field)=> !place.fetchedFields.has(field));
        if(missingFields.length===0){ callback(place); return; }
        const request = {placeId: placeId, fields: missingFields};
        let retryCount = 0;
        const processResult = function(result, status){
          if(status !== google.maps.places.PlacesServiceStatus.OK){
            if(status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT && retryCount < 5){
              const delay = (Math.pow(2, retryCount) + Math.random()) * 500;
              setTimeout(()=> void detailsService.getDetails(request, processResult), delay);
              retryCount++;
            }
            return;
          }
          if(result.name) place.name = result.name;
          if(result.geometry) place.coords = result.geometry.location;
          if(result.formatted_address) place.address = result.formatted_address;
          if(result.photos){
            place.photos = result.photos.map((photo)=>({urlSmall: photo.getUrl({maxWidth:200, maxHeight:200}), urlLarge: photo.getUrl({maxWidth:1200, maxHeight:1200}), attrs: photo.html_attributions})).slice(0, ND_NUM_PLACE_PHOTOS_MAX);
          }
          if(result.types){
            place.type = formatPlaceType(result.types[0]);
            place.icon = ND_MARKER_ICONS_BY_TYPE['_default'];
            for(let type of result.types){
              if(type in ND_MARKER_ICONS_BY_TYPE){ place.type = formatPlaceType(type); place.icon = ND_MARKER_ICONS_BY_TYPE[type]; break; }
            }
          }
          if(result.url) place.url = result.url;
          if(result.website){ place.website = result.website; const url = new URL(place.website); place.websiteDomain = url.hostname; }
          if(result.formatted_phone_number) place.phoneNumber = result.formatted_phone_number;
          if(result.opening_hours) place.openingHours = parseDaysHours(result.opening_hours);
          if(result.rating){ place.rating = result.rating; addStarIcons(place); }
          if(result.user_ratings_total) place.numReviews = result.user_ratings_total;
          if(result.price_level){ place.priceLevel = result.price_level; place.dollarSigns = initArray(result.price_level); }
          if(result.reviews){ place.reviews = result.reviews; for(let review of place.reviews){ addStarIcons(review); } }
          for(let field of missingFields){ place.fetchedFields.add(field); }
          callback(place);
        };
        if(widget.placeIdsToAutocompleteResults){
          const autoResult = widget.placeIdsToAutocompleteResults.get(placeId);
          if(autoResult){ processResult(autoResult, google.maps.places.PlacesServiceStatus.OK); return; }
        }
        detailsService.getDetails(request, processResult);
      };
    }
    function initializeSidePanel(){
      const placesPanelEl = document.querySelector('.neighborhood-discovery .places-panel');
      const detailsPanelEl = document.querySelector('.neighborhood-discovery .details-panel');
      const placeResultsEl = document.querySelector('.neighborhood-discovery .place-results-list');
      const showMoreButtonEl = document.querySelector('.neighborhood-discovery .show-more-button');
      const detailsTemplate = window.Handlebars ? Handlebars.compile(document.getElementById('nd-place-details-tmpl')?.innerHTML||'') : (x)=>x;
      const resultsTemplate = window.Handlebars ? Handlebars.compile(document.getElementById('nd-place-results-tmpl')?.innerHTML||'') : (x)=>x;
      const showPhotoModal = function(photo, placeName){
        const photoModalEl = document.querySelector('.neighborhood-discovery .photo-modal');
        if(!photoModalEl) return;
        const prevFocusEl = document.activeElement;
        const imgEl = photoModalEl.querySelector('img');
        imgEl.src = photo.urlLarge;
        const backButtonEl = photoModalEl.querySelector('.back-button');
        backButtonEl.addEventListener('click', ()=>{
          hideElement(photoModalEl, prevFocusEl);
          imgEl.src='';
        });
        photoModalEl.querySelector('.photo-place').innerHTML = placeName;
        photoModalEl.querySelector('.photo-attrs span').innerHTML = photo.attrs;
        const attributionEl = photoModalEl.querySelector('.photo-attrs a');
        if(attributionEl) attributionEl.setAttribute('target','_blank');
        photoModalEl.addEventListener('click', (e)=>{ if(e.target===photoModalEl){ hideElement(photoModalEl, prevFocusEl); imgEl.src=''; } });
        showElement(photoModalEl, backButtonEl);
      };
      let selectedPlaceId;
      const widget = this;
      widget.selectPlaceById = function(placeId, panToMarker){
        if(selectedPlaceId === placeId) return;
        selectedPlaceId = placeId;
        const prevFocusEl = document.activeElement;
        const showDetailsPanel = function(place){
          detailsPanelEl.innerHTML = detailsTemplate(place);
          const backButtonEl = detailsPanelEl.querySelector('.back-button');
          backButtonEl.addEventListener('click', ()=>{
            hideElement(detailsPanelEl, prevFocusEl);
            selectedPlaceId = undefined;
            widget.selectedPlaceMarker.setMap(null);
          });
          detailsPanelEl.querySelectorAll('.photo').forEach((photoEl,i)=>{ photoEl.addEventListener('click', ()=> showPhotoModal(place.photos[i], place.name)); });
          showElement(detailsPanelEl, backButtonEl);
          detailsPanelEl.scrollTop = 0;
        };
        const processResult = function(place){
          if(place.marker){ widget.selectedPlaceMarker.setMap(null); }
          else { widget.selectedPlaceMarker.setPosition(place.coords); widget.selectedPlaceMarker.setMap(widget.map); }
          if(panToMarker){ widget.map.panTo(place.coords); }
          showDetailsPanel(place);
        };
        widget.fetchPlaceDetails(placeId, ['name','types','geometry.location','formatted_address','photo','url','website','formatted_phone_number','opening_hours','rating','user_ratings_total','price_level','review'], processResult);
      }.bind(this);
      const renderPlaceResults = function(places, startIndex){
        placeResultsEl.insertAdjacentHTML('beforeend', resultsTemplate({places: places}));
        placeResultsEl.querySelectorAll('.place-result').forEach((resultEl,i)=>{
          const place = places[i - startIndex];
          if(!place) return;
          resultEl.addEventListener('click', ()=> widget.selectPlaceById(place.placeId, true));
          resultEl.querySelector('.name').addEventListener('click', (e)=>{ widget.selectPlaceById(place.placeId, true); e.stopPropagation(); });
          resultEl.querySelector('.photo').addEventListener('click', (e)=>{ if(place.photos && place.photos[0]) showPhotoModal(place.photos[0], place.name); e.stopPropagation(); });
          widget.addPlaceMarker(place);
        });
      };
      let nextPlaceIndex = 0;
      const showNextPlaces = function(n){
        const nextPlaces = widget.places.slice(nextPlaceIndex, nextPlaceIndex+n);
        if(nextPlaces.length<1){ hideElement(showMoreButtonEl); return; }
        showMoreButtonEl.disabled = true;
        let count = nextPlaces.length;
        for(let place of nextPlaces){
          const processResult = function(place){
            count--; if(count>0) return;
            renderPlaceResults(nextPlaces, nextPlaceIndex);
            nextPlaceIndex += n;
            widget.updateBounds(widget.places.slice(0, nextPlaceIndex));
            const hasMore = nextPlaceIndex < widget.places.length;
            if(hasMore || hasHiddenContent(placesPanelEl)){ showElement(showMoreButtonEl); showMoreButtonEl.disabled = false; }
            else { hideElement(showMoreButtonEl); }
          };
          widget.fetchPlaceDetails(place.placeId, ['name','types','geometry.location','photo','rating','user_ratings_total','price_level'], processResult);
        }
      };
      showNextPlaces(ND_NUM_PLACES_INITIAL);
      showMoreButtonEl.addEventListener('click', ()=>{
        placesPanelEl.classList.remove('no-scroll');
        showMoreButtonEl.classList.remove('sticky');
        showNextPlaces(ND_NUM_PLACES_SHOW_MORE);
      });
    }
    function initializeSearchInput(){
      const searchInputEl = document.querySelector('.neighborhood-discovery .place-search-input');
      const widget = this;
      widget.placeIdsToAutocompleteResults = new Map();
      const autocomplete = new google.maps.places.Autocomplete(searchInputEl, {
        types:['establishment'],
        fields:['place_id','name','types','geometry.location','formatted_address','photo','url','website','formatted_phone_number','opening_hours','rating','user_ratings_total','price_level','review'],
        bounds: widget.mapBounds, strictBounds:true
      });
      autocomplete.addListener('place_changed', ()=>{
        const place = autocomplete.getPlace();
        widget.placeIdsToAutocompleteResults.set(place.place_id, place);
        widget.selectPlaceById(place.place_id, true);
      });
    }
    // Inicialização do widget é opcional e depende do carregamento do Google Maps.
    // Use window.initMap() (definido abaixo) para inicializar quando desejar.
  }
  const CONFIGURATION = {"pois":[{"placeId":"ChIJwxT3mL5v5kcRAsTd3v0lJOY"},{"placeId":"ChIJ6SJcCP5x5kcRJt8m9_lR7_Q"}],"centerMarker":{"icon":"circle"},"mapRadius":2000,"mapOptions":{"center":{"lat":48.8773,"lng":2.33},"fullscreenControl":true,"mapTypeControl":true,"streetViewControl":false,"zoom":16,"zoomControl":true,"maxZoom":20,"mapId":""},"mapsApiKey":"YOUR_API_KEY_HERE"};
  function initMap(){ new NeighborhoodDiscovery(CONFIGURATION); }
  window.NeighborhoodDiscovery = NeighborhoodDiscovery;
  window.initMap = initMap;
})();


// Armazenamento para não duplicar objetos - já declarado no início do arquivo

window.updateConvoyMember = function(payload) {
    if (!payload || !payload.id) return;
    const p = [payload.lat, payload.lng];

    // 1. Gerenciar a Linha (Rastro)
    if (!convoyPaths.has(payload.id)) {
        const line = L.polyline([p], {
            color: '#00f2ff', // Cor estilo neon/tecnológica
            weight: 2,
            opacity: 0.6
        }).addTo(convoyLayer);
        convoyPaths.set(payload.id, line);
    } else {
        convoyPaths.get(payload.id).addLatLng(p);
    }

    // 2. Gerenciar o Marcador (Ícone)
    if (!convoyMarkers.has(payload.id)) {
        const marker = L.marker(p, {
            icon: L.icon({
                iconUrl: 'URL_DA_SUA_SETA_AQUI.png',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            })
        }).addTo(convoyLayer);
        convoyMarkers.set(payload.id, marker);
    } else {
        convoyMarkers.get(payload.id).setLatLng(p);
    }
};

// Event listener para mudança no seletor de veículos
if (vehicleSelectEl) {
    vehicleSelectEl.addEventListener('change', function() {
        persistVehicleChoice(this.value);
    });
}

// Inicializar informações do modo de transporte quando o mapa carregar
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar um pouco para garantir que o mapa esteja inicializado
    setTimeout(() => {
        updateTransportModeInfo();
    }, 1000);
});