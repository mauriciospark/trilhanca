// Protótipo Web — app.js
const qs = (s) => document.querySelector(s);

let sections = {};
let mapInitialized = false;
let leafletMap = null;
let members = {}; // id -> {name, marker, speakingTimeout, color}
let channel = null;
const MEMBER_EXPIRY_MS = 1000 * 60 * 10; // 10 min (not used yet)
let shareWatchId = null;

// cores para identificar membros (consistentes por id)
const COLOR_PALETTE = ['#E91E63','#9C27B0','#3F51B5','#03A9F4','#00BCD4','#4CAF50','#FF9800','#FF5722','#795548','#607D8B'];
function getColorForId(id){
  if(!id) return COLOR_PALETTE[0];
  let h = 0; for(let i=0;i<id.length;i++){ h = ((h<<5)-h) + id.charCodeAt(i); h |= 0; }
  return COLOR_PALETTE[Math.abs(h) % COLOR_PALETTE.length];
}

// limpeza periódica de membros inativos
setInterval(()=>{
  const now = Date.now();
  Object.keys(members).forEach(id=>{
    const m = members[id];
    if(m && m.lastSeen && (now - m.lastSeen) > MEMBER_EXPIRY_MS){
      if(m.marker && leafletMap){
        try{ if(leafletMap.memberCluster) leafletMap.memberCluster.removeLayer(m.marker); else leafletMap.removeLayer(m.marker); }catch(e){}
      }
      delete members[id];
      logEvent(`Membro ${id} removido por inatividade`);
      try{ renderMembersOverlay(); }catch(e){}
    }
  });
}, 60 * 1000);

function show(section){
  if(!sections || !sections[section]) return;
  Object.values(sections).forEach(s=> s && s.classList && s.classList.add('hidden'));
  sections[section].classList.remove('hidden');
  if(section === 'map'){
    if(!mapInitialized){ if(typeof L !== 'undefined') initializeLeaflet(); else console.warn('Leaflet (L) não disponível'); mapInitialized = true; }
    else if(leafletMap){ setTimeout(()=> leafletMap.invalidateSize(), 200); }
  }
  logEvent('Navegou: '+section);
}
function showPanel(name){ show(name); }
function showGroupMembers(){
  try{
    const raw = localStorage.getItem('grupo_viagem');
    if(!raw) return;
    const g = JSON.parse(raw);
    const count = Array.isArray(g.membros) ? g.membros.length : 0;
    logEvent('Membros do grupo: '+count);
  }catch(e){}
}

qs('#btn-map').addEventListener('click', ()=> show('map'));
qs('#btn-ptt').addEventListener('click', ()=> show('ptt'));
qs('#btn-fuel').addEventListener('click', ()=> show('fuel'));
qs('#btn-sos').addEventListener('click', ()=> show('sos'));

// Diário de bordo (localStorage)
function loadDiary(){
  const raw = localStorage.getItem('diary') || '[]';
  try{ return JSON.parse(raw); } catch(e){ return []; }
}

function saveDiary(list){ localStorage.setItem('diary', JSON.stringify(list)); }

function logEvent(text){
  const list = loadDiary();
  const entry = {ts: new Date().toISOString(), text};
  list.unshift(entry);
  saveDiary(list);
  renderDiary();
}

function renderDiary(){
  const el = qs('#diary-log');
  const list = loadDiary();
  el.innerHTML = list.map(it => `<div><strong>${it.ts}</strong><div style="color:#cfcfcf">${it.text}</div><hr style="opacity:.06"></div>`).join('');
}

qs('#diary-clear').addEventListener('click', ()=>{ localStorage.removeItem('diary'); renderDiary(); });

// PTT UI (stub)
const pttBtn = qs('#ptt-button');
const pttStatus = qs('#ptt-status');
let pttRecording = false;

function startPTT(){
  pttRecording = true; pttBtn.classList.add('recording'); pttBtn.textContent = 'Falando...'; pttStatus.textContent = 'Gravando (simulado)';
  logEvent('PTT: iniciou gravação (simulado)');
  // TODO: iniciar getUserMedia e enviar via mesh
}

function stopPTT(){
  pttRecording = false; pttBtn.classList.remove('recording'); pttBtn.textContent = 'Pressione e segure'; pttStatus.textContent = 'Pronto';
  logEvent('PTT: finalizou gravação (simulado)');
  // TODO: parar e enviar o áudio
}

// PTT UI handlers são anexados em attachPTT() para suportar tanto o painel quanto o overlay no mapa

// Calculadora de combustível
qs('#fuel-form').addEventListener('submit', (ev)=>{
  ev.preventDefault();
  const distance = parseFloat(qs('#distance').value);
  const consumption = parseFloat(qs('#consumption').value);
  if(isNaN(distance) || isNaN(consumption) || consumption===0) return;
  const liters = (distance/100) * consumption;
  qs('#fuel-result').textContent = `Litros necessários: ${liters.toFixed(2)} L`;
  logEvent(`Calculadora: distância ${distance} km, consumo ${consumption} L/100km => ${liters.toFixed(2)} L`);
});

// SOS — tenta obter geolocalização e abrir SMS
qs('#sos-send').addEventListener('click', async ()=>{
  const phone = qs('#sos-phone').value.trim();
  if(!phone){ alert('Informe telefone de emergência'); return; }
  qs('#sos-send').disabled = true; qs('#sos-send').textContent = 'Enviando...';
  try{
    const pos = await new Promise((res,rej)=> navigator.geolocation.getCurrentPosition(res,rej,{timeout:8000}));
    const lat = pos.coords.latitude; const lon = pos.coords.longitude;
    const body = `SOS! Minha localização: https://maps.google.com/?q=${lat},${lon}`;
    const smsUri = `sms:${encodeURIComponent(phone)}?body=${encodeURIComponent(body)}`;
    logEvent('SOS: localização obtida e tentativa de envio SMS');
    // abrir link — em muitos navegadores desktop isso pode não funcionar
    window.location.href = smsUri;
  }catch(err){
    const fallback = 'https://maps.google.com';
    alert('Não foi possível obter localização. Abra manualmente: '+fallback);
    logEvent('SOS: falha ao obter localização');
  } finally{ qs('#sos-send').disabled = false; qs('#sos-send').textContent = 'Enviar SOS'; }
});

// Inicialização
document.addEventListener('DOMContentLoaded', ()=>{
  // localizar elementos DOM de forma segura
  sections = {
    map: qs('#section-map'),
    ptt: qs('#section-ptt'),
    fuel: qs('#section-fuel'),
    sos: qs('#section-sos'),
    diary: qs('#section-diary'),
  };

  // ligar botões de navegação somente se existirem
  const btnMap = qs('#btn-map'); if(btnMap) btnMap.addEventListener('click', ()=> show('map'));
  const btnPtt = qs('#btn-ptt'); if(btnPtt) btnPtt.addEventListener('click', ()=> show('ptt'));
  const btnFuel = qs('#btn-fuel'); if(btnFuel) btnFuel.addEventListener('click', ()=> show('fuel'));
  const btnSos = qs('#btn-sos'); if(btnSos) btnSos.addEventListener('click', ()=> show('sos'));

  // inicializar outras funcionalidades com checagens
  try{ renderDiary(); }catch(e){ console.warn('renderDiary falhou', e); }
  try{ attachPTT(); }catch(e){ console.warn('PTT attach falhou', e); }
  try{ attachFuel(); }catch(e){ console.warn('Fuel attach falhou', e); }
  try{ attachSOS(); }catch(e){ console.warn('SOS attach falhou', e); }

  // exibir mapa por padrão (se existir seção)
  if(sections.map) show('map');
  // Se a página não usa painéis, mas existe um contêiner #map, inicializar diretamente
  try{
    const mapEl = qs('#map');
    if(mapEl && !mapInitialized){ if(typeof L !== 'undefined') initializeLeaflet(); else console.warn('Leaflet (L) não disponível'); mapInitialized = true; }
  }catch(e){}
  logEvent('App web carregado');
  try{
    const p = new URLSearchParams(location.search);
    const panel = p.get('panel');
    if(panel) showPanel(panel);
  }catch(e){}
});

// Função para inicializar mapa Leaflet
async function initializeLeaflet(){
  try{
    if(typeof L === 'undefined'){ console.error('Leaflet não está carregado'); return; }
    leafletMap = L.map('map').setView([-3.4653, -62.2159], 6); // centro aproximado Brasil
    // Camadas base de alta qualidade — carregar opcionalmente de Mapas/map-tiles.json
    let config = null;
    try{ const r = await fetch('../Mapas/map-tiles.json'); if(r.ok) config = await r.json(); }catch(e){ config = null; }
    const baseLayers = {};
    if(config && config.tileLayers){
      Object.keys(config.tileLayers).forEach(name => {
        const t = config.tileLayers[name];
        baseLayers[name] = L.tileLayer(t.url, { maxZoom: t.maxZoom || 19, attribution: t.attribution || '' });
      });
    } else {
      // fallback hardcoded
      baseLayers['Carto Light'] = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors & CartoDB' });
      baseLayers['Esri Imagery (Satélite)'] = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Tiles © Esri — Source: Esri, HERE, Garmin, NGA, USGS' });
      baseLayers['Esri Topo'] = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Tiles © Esri — Source: Esri, HERE, Garmin, NGA, USGS' });
      baseLayers['OpenTopoMap'] = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17, attribution: '© OpenTopoMap (CC-BY-SA) | Data © OpenStreetMap' });
    }
    const hillshade = L.tileLayer('https://tiles.wmflabs.org/hillshading/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: 'Hillshading © Wikimedia Labs'
    });
    baseLayers['Carto Light'].addTo(leafletMap);
    try{ leafletMap.createPane('roadsPane'); leafletMap.getPane('roadsPane').style.zIndex = '450'; }catch(e){}
    // Overlays dinâmicos: rios e estradas (carregados via Overpass)
    const riversLayer = L.layerGroup();
    const roadsLayer = L.layerGroup();
    function overpassToGeoJSON(elements, type){
      const feats = [];
      for(const el of elements || []){
        if(el.type === 'way' && Array.isArray(el.geometry)){
          const coords = el.geometry.map(pt => [pt.lon, pt.lat]);
          feats.push({ type:'Feature', properties:{type, tags: el.tags||{}}, geometry:{ type:'LineString', coordinates: coords } });
        }
      }
      return { type:'FeatureCollection', features: feats };
    }
    async function loadRivers(bounds){
      try{
        const s=bounds.getSouth(), w=bounds.getWest(), n=bounds.getNorth(), e=bounds.getEast();
        const query = `[out:json][timeout:30];(way["waterway"~"river|stream|canal"](${s},${w},${n},${e}););out geom;`;
        const resp = await fetch('https://overpass-api.de/api/interpreter',{method:'POST', body:query, headers:{'Content-Type':'text/plain'}});
        if(!resp.ok) throw new Error();
        const data = await resp.json();
        riversLayer.clearLayers();
        const geo = overpassToGeoJSON(data.elements,'river');
        riversLayer.addLayer(L.geoJSON(geo,{style:{color:'#3fa7ff',weight:2,opacity:0.9}}));
      }catch(e){}
    }
    async function loadRoads(bounds){
      try{
        const s=bounds.getSouth(), w=bounds.getWest(), n=bounds.getNorth(), e=bounds.getEast();
        const query = `[out:json][timeout:30];(way["highway"~"motorway|trunk|primary|secondary|tertiary|unclassified|residential|service"](${s},${w},${n},${e}););out geom;`;
        const resp = await fetch('https://overpass-api.de/api/interpreter',{method:'POST', body:query, headers:{'Content-Type':'text/plain'}});
        if(!resp.ok) throw new Error();
        const data = await resp.json();
        roadsLayer.clearLayers();
        const geo = overpassToGeoJSON(data.elements,'road');
        const halo = L.geoJSON(geo,{pane:'roadsPane',style:{color:'#ffffff',weight:12,opacity:0.45,lineCap:'round',lineJoin:'round'}});
        const core = L.geoJSON(geo,{pane:'roadsPane',style:{color:'#ffcc33',weight:7,opacity:1,lineCap:'round',lineJoin:'round'}});
        roadsLayer.addLayer(halo);
        roadsLayer.addLayer(core);
        try{ core.bringToFront(); }catch(e){}
      }catch(e){}
    }
    // camada de trilhas (inicialmente vazia)
    leafletMap.trailsLayer = L.geoJSON(null, {style: {color: '#ff8a34', weight: 3, opacity: 0.9}}).addTo(leafletMap);
    // controle de camadas
    L.control.layers(baseLayers, {
      'Trilhas': leafletMap.trailsLayer,
      'Relevo (Hillshading)': hillshade,
      'Rios (OSM)': riversLayer,
      'Estradas (OSM)': roadsLayer
    }, {collapsed: true}).addTo(leafletMap);
    leafletMap.on('overlayadd',(ev)=>{
      const b = leafletMap.getBounds();
      if(ev.layer === riversLayer) loadRivers(b);
      if(ev.layer === roadsLayer) loadRoads(b);
    });
    leafletMap.on('moveend',()=>{
      const b = leafletMap.getBounds();
      if(leafletMap.hasLayer(riversLayer)) loadRivers(b);
      if(leafletMap.hasLayer(roadsLayer)) loadRoads(b);
    });
    // anexar controles do mapa (share/trails/rota)
    try{ attachMapShareControls(); }catch(e){ console.warn('attachMapShareControls failed', e); }
    setTimeout(()=> leafletMap.invalidateSize(), 200);
    logEvent('Mapa Leaflet inicializado');
    // inicializar canal de comunicação entre abas
    try{ setupChannel(); }catch(e){ console.warn('channel setup failed', e); }
    // opcional: criar grupo de cluster para marcadores de membros (melhora performance com muitos membros)
    try{
      if(typeof L.markerClusterGroup === 'function'){
        leafletMap.memberCluster = L.markerClusterGroup({chunkedLoading:true, maxClusterRadius: 60});
        leafletMap.addLayer(leafletMap.memberCluster);
      }
    }catch(e){ console.warn('Cluster init failed', e); }
  }catch(e){ console.error('Erro ao inicializar Leaflet', e); }
}

  // ligar controles do overlay (botão share)
  function attachMapShareControls(){
    const shareBtn = qs('#share-loc');
    if(!shareBtn) return;
    shareBtn.addEventListener('click', ()=>{
      if(shareWatchId == null) startSharingLocation(); else stopSharingLocation();
      shareBtn.classList.toggle('active');
    });
    // ligar botão de trilhas
    const trailsBtn = qs('#toggle-trails');
    if(trailsBtn){
      trailsBtn.addEventListener('click', async ()=>{
        const active = trailsBtn.classList.toggle('active');
        if(active){
          trailsBtn.textContent = 'Carregando...';
          try{ await loadTrailsForMap(); }catch(e){ console.warn('loadTrails err', e); }
          trailsBtn.textContent = 'Ocultar trilhas';
        }else{
          if(leafletMap && leafletMap.trailsLayer) leafletMap.trailsLayer.clearLayers();
          trailsBtn.textContent = 'Mostrar trilhas';
        }
      });
    }
    // rota controls
    const setOriginBtn = qs('#set-origin');
    const setDestBtn = qs('#set-dest');
    const calcBtn = qs('#calc-route');
    const clearBtn = qs('#clear-route');
    const routeInfo = qs('#route-info');
    let mode = null; // 'origin'|'dest'
    if(setOriginBtn) setOriginBtn.addEventListener('click', ()=>{ mode = 'origin'; setOriginBtn.classList.add('active'); setDestBtn && setDestBtn.classList.remove('active'); if(routeInfo) routeInfo.textContent = 'Clique no mapa para definir origem'; });
    if(setDestBtn) setDestBtn.addEventListener('click', ()=>{ mode = 'dest'; setDestBtn.classList.add('active'); setOriginBtn && setOriginBtn.classList.remove('active'); if(routeInfo) routeInfo.textContent = 'Clique no mapa para definir destino'; });
    if(clearBtn) clearBtn.addEventListener('click', ()=>{ clearRoute(); if(routeInfo) routeInfo.textContent = ''; setOriginBtn && setOriginBtn.classList.remove('active'); setDestBtn && setDestBtn.classList.remove('active'); mode = null; });
    if(calcBtn) calcBtn.addEventListener('click', ()=>{ calculateRoute(); });
    // map click handler to set origin/dest
    leafletMap.on('click', (ev)=>{
      if(!mode) return;
      const lat = ev.latlng.lat; const lon = ev.latlng.lng;
      if(mode === 'origin'){
        setOrigin([lat, lon]);
        setOriginBtn && setOriginBtn.classList.remove('active');
        mode = null; if(routeInfo) routeInfo.textContent = 'Origem definida';
      }else if(mode === 'dest'){
        setDest([lat, lon]);
        setDestBtn && setDestBtn.classList.remove('active');
        mode = null; if(routeInfo) routeInfo.textContent = 'Destino definido';
      }
    });
  }

// Funções para anexar handlers de forma segura
function attachPTT(){
  // aceitar botão do painel ou do mapa (sidebar)
  const pttBtn = qs('#ptt-button') || qs('#ptt-button-map');
  const pttStatus = qs('#ptt-status') || qs('#ptt-indicator');
  if(!pttBtn) return;
  let pttRecording = false;
  const nameInput = qs('#ptt-name');
  const mapNameInput = qs('#ptt-name-map');
  const pttBtnMap = qs('#ptt-button-map');
  const pttIndicatorMap = qs('#ptt-indicator');
  // identificar membro local
  const localId = (function(){ try{ return localStorage.getItem('memberId') || crypto.randomUUID(); }catch(e){ return localStorage.getItem('memberId') || ('id-'+Date.now()); } })();
  try{ localStorage.setItem('memberId', localId); }catch(e){}
  // carregar nome salvo
  let localName = localStorage.getItem('memberName') || (`Membro-${localId.toString().slice(-4)}`);
  if(nameInput){ nameInput.value = localName; nameInput.addEventListener('change', ()=>{ localName = nameInput.value.trim() || localName; try{ localStorage.setItem('memberName', localName); }catch(e){}; if(mapNameInput) mapNameInput.value = localName; }); }
  if(mapNameInput){ mapNameInput.value = localName; mapNameInput.addEventListener('change', ()=>{ localName = mapNameInput.value.trim() || localName; try{ localStorage.setItem('memberName', localName); }catch(e){}; if(nameInput) nameInput.value = localName; }); }
  function startPTT(){
    pttRecording = true;
    pttBtn.classList.add('recording');
    pttBtn.textContent = 'Falando...';
    pttBtn.setAttribute('aria-pressed', 'true');
    if(pttBtnMap){ pttBtnMap.classList.add('recording'); pttBtnMap.textContent = 'Falando...'; pttBtnMap.setAttribute('aria-pressed','true'); }
    if(pttIndicatorMap) pttIndicatorMap.textContent = 'Gravando (simulado)';
    if(pttStatus) pttStatus.textContent = 'Gravando (simulado)';
    logEvent('PTT: iniciou gravação (simulado)');
    // obter localização e anunciar para outras abas
    try{
      navigator.geolocation.getCurrentPosition((pos)=>{
        const lat = pos.coords.latitude; const lon = pos.coords.longitude;
        const avatar = (function(){ try{ return localStorage.getItem('memberAvatar'); }catch(e){ return null; } })();
        const markerColor = (function(){ try{ return localStorage.getItem('markerColor'); }catch(e){ return null; } })();
        const markerStyle = (function(){ try{ return localStorage.getItem('markerStyle'); }catch(e){ return null; } })();
        announcePTT('ptt-start', localId, localName, lat, lon);
        // adicionar/atualizar nosso próprio marcador com preferências visuais
        createOrUpdateMember(localId, localName, lat, lon, true, avatar, markerColor, markerStyle);
      }, (err)=>{
        console.warn('geoloc err', err);
        announcePTT('ptt-start', localId, localName, null, null);
      }, {timeout:8000});
    }catch(e){ announcePTT('ptt-start', localId, localName, null, null); }
  }
  function stopPTT(){
    pttRecording = false;
    pttBtn.classList.remove('recording');
    pttBtn.textContent = 'Pressione para falar';
    pttBtn.setAttribute('aria-pressed', 'false');
    if(pttBtnMap){ pttBtnMap.classList.remove('recording'); pttBtnMap.textContent = 'Falar'; pttBtnMap.setAttribute('aria-pressed','false'); }
    if(pttIndicatorMap) pttIndicatorMap.textContent = 'Pronto';
    if(pttStatus) pttStatus.textContent = 'Pronto';
    logEvent('PTT: finalizou gravação (simulado)');
    announcePTT('ptt-stop', localId, localName, null, null);
  }

  // Toggle on click/tap or keyboard activation
  function togglePTT(){ if(pttRecording) stopPTT(); else startPTT(); }
  pttBtn.addEventListener('click', togglePTT);
  pttBtn.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); togglePTT(); }
  });
  // bind map overlay button if exists
  if(pttBtnMap){ pttBtnMap.addEventListener('click', togglePTT); pttBtnMap.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); togglePTT(); } }); }
}

// BroadcastChannel para simular mensagens entre membros (abas)
function setupChannel(){
  if(typeof BroadcastChannel === 'undefined') return; // não suportado
  channel = new BroadcastChannel('trilha-channel');
  channel.onmessage = (ev)=>{
    const msg = ev.data;
    if(!msg || !msg.type) return;
    if(msg.type === 'ptt-start'){
      createOrUpdateMember(msg.id, msg.name, msg.lat, msg.lon, true, msg.avatar, msg.markerColor, msg.markerStyle);
    }else if(msg.type === 'ptt-stop'){
      createOrUpdateMember(msg.id, msg.name, msg.lat, msg.lon, false, msg.avatar, msg.markerColor, msg.markerStyle);
    }else if(msg.type === 'loc-update'){
      createOrUpdateMember(msg.id, msg.name, msg.lat, msg.lon, false, msg.avatar, msg.markerColor, msg.markerStyle);
    }
  };
}

function announcePTT(type, id, name, lat, lon){
  if(!channel) return;
  const avatar = (function(){ try{ return localStorage.getItem('memberAvatar'); }catch(e){ return null; } })();
  const markerColor = (function(){ try{ return localStorage.getItem('markerColor'); }catch(e){ return null; } })();
  const markerStyle = (function(){ try{ return localStorage.getItem('markerStyle'); }catch(e){ return null; } })();
  channel.postMessage({type, id, name, lat, lon, avatar, markerColor, markerStyle, ts: Date.now()});
}

function announceLocation(id, name, lat, lon){
  if(!channel) return;
  const avatar = (function(){ try{ return localStorage.getItem('memberAvatar'); }catch(e){ return null; } })();
  const markerColor = (function(){ try{ return localStorage.getItem('markerColor'); }catch(e){ return null; } })();
  const markerStyle = (function(){ try{ return localStorage.getItem('markerStyle'); }catch(e){ return null; } })();
  channel.postMessage({type:'loc-update', id, name, lat, lon, avatar, markerColor, markerStyle, ts: Date.now()});
}

function startSharingLocation(){
  if(shareWatchId != null) return;
  if(!navigator.geolocation) { alert('Geolocalização não suportada'); return; }
  // garantir memberId/nome locais
  let id = localStorage.getItem('memberId');
  if(!id){ try{ id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : ('id-'+Date.now()); localStorage.setItem('memberId', id); }catch(e){ id = ('id-'+Date.now()); }}
  let name = localStorage.getItem('memberName') || ('Membro-'+(id.toString().slice(-4)));
  shareWatchId = navigator.geolocation.watchPosition((pos)=>{
    const lat = pos.coords.latitude; const lon = pos.coords.longitude;
    // anunciar e atualizar marcador local — incluir preferências visuais
    const avatar = (function(){ try{ return localStorage.getItem('memberAvatar'); }catch(e){ return null; } })();
    const markerColor = (function(){ try{ return localStorage.getItem('markerColor'); }catch(e){ return null; } })();
    const markerStyle = (function(){ try{ return localStorage.getItem('markerStyle'); }catch(e){ return null; } })();
    announceLocation(id, name, lat, lon);
    createOrUpdateMember(id, name, lat, lon, false, avatar, markerColor, markerStyle);
  }, (err)=>{ console.warn('watchPosition err', err); }, {maximumAge:5000, timeout:8000, enableHighAccuracy:true});
  logEvent('Compartilhamento de posição iniciado');
}

function stopSharingLocation(){
  if(shareWatchId == null) return;
  try{ navigator.geolocation.clearWatch(shareWatchId); }catch(e){}
  shareWatchId = null;
  logEvent('Compartilhamento de posição parado');
}

function createOrUpdateMember(id, name, lat, lon, speaking, avatar, markerColor, markerStyle){
  if(!id) return;
  // manter dados
  if(!members[id]) members[id] = {name, marker: null, speakingTimeout: null, lastSeen: Date.now(), avatar:null, markerColor:null, markerStyle:null};
  members[id].name = name || members[id].name;
  // atualizar preferências visuais quando recebidas
  try{ if(avatar) members[id].avatar = avatar; }catch(e){}
  try{ if(markerColor) members[id].markerColor = markerColor; }catch(e){}
  try{ if(markerStyle) members[id].markerStyle = markerStyle; }catch(e){}
  members[id].lastSeen = Date.now();
  // converter coords
  const hasCoords = (typeof lat === 'number' && typeof lon === 'number');
  const position = hasCoords ? [lat, lon] : (leafletMap ? leafletMap.getCenter() : null);

  // criar marcador se necessário
  if(leafletMap && position){
    // atribuir cor consistente para este membro quando não houver preferência explícita
    if(!members[id].color) members[id].color = getColorForId(id);
    const initials = (members[id].name || id).split(' ').map(p=>p[0]).filter(Boolean).slice(0,2).join('').toUpperCase() || id.toString().slice(0,2).toUpperCase();
    const popupHtml = `${escapeHtml(members[id].name)}<br><small>Última atualização: ${new Date(members[id].lastSeen).toLocaleString()}</small>`;
    if(!members[id].marker){
      const div = document.createElement('div');
      div.className = 'member-marker';
      div.innerHTML = `<div class="member-avatar" title="${escapeHtml(members[id].name)}" style="width:36px;height:36px;border-radius:18px;background:${members[id].color};display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:700;border:3px solid rgba(0,0,0,0.25);box-shadow:0 2px 6px rgba(0,0,0,0.4);">${escapeHtml(initials)}</div><div class="member-label" style="display:inline-block;margin-left:8px;color:#fff;font-weight:600">${escapeHtml(members[id].name)}</div>`;
      const icon = L.divIcon({className: '', html: div.outerHTML, iconSize: [160, 40], iconAnchor: [16, 18]});
      members[id].marker = L.marker(position, {icon});
      // adicionar ao cluster se disponível, senão direto ao mapa
      if(leafletMap && leafletMap.memberCluster){ leafletMap.memberCluster.addLayer(members[id].marker); }
      else if(leafletMap){ members[id].marker.addTo(leafletMap); }
      members[id].marker.bindPopup(popupHtml);
    }else{
      // atualizar posição
      members[id].marker.setLatLng(position);
      members[id].marker.setPopupContent(popupHtml);
    }
    // aplicar estilos dinâmicos (fala / efeito)
    const el = members[id].marker.getElement();
    if(el){
      const avatar = el.querySelector('.member-avatar');
      if(avatar){
        try{
          avatar.style.background = members[id].color;
          if(speaking){ avatar.style.boxShadow = `0 0 10px ${members[id].color}, 0 0 18px rgba(255,77,77,0.35)`; }
          else { avatar.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)'; }
        }catch(e){}
      }
      // adicionar badge vermelho pequeno ao lado quando falando
      let talkBadge = el.querySelector('.talk-badge');
      if(speaking){
        if(!talkBadge){
          // atribuir cor consistente para este membro
          if(!members[id].color) members[id].color = getColorForId(id);
          const initials = (members[id].name || id).split(' ').map(p=>p[0]).filter(Boolean).slice(0,2).join('').toUpperCase() || id.toString().slice(0,2).toUpperCase();
          const popupHtml = `${escapeHtml(members[id].name)}<br><small>Última atualização: ${new Date(members[id].lastSeen).toLocaleString()}</small>`;
          if(!members[id].marker){
            const div = document.createElement('div');
            div.className = 'member-marker';
            // determinar visual do marcador: preferir dados recebidos para este membro, senão usar localStorage (para o membro local)
            const storedAvatar = members[id].avatar || (function(){ try{ return localStorage.getItem('memberAvatar'); }catch(e){ return null; } })();
            const storedMarkerColor = members[id].markerColor || (function(){ try{ return localStorage.getItem('markerColor'); }catch(e){ return null; } })();
            const storedMarkerStyle = members[id].markerStyle || (function(){ try{ return localStorage.getItem('markerStyle'); }catch(e){ return null; } })();
            let inner = '';
            if(storedAvatar && (storedMarkerStyle === 'avatar-circle' || storedMarkerStyle === 'avatar-square')){
              const radius = storedMarkerStyle === 'avatar-circle' ? '50%' : '6px';
              inner += `<span class="member-avatar" style="display:inline-block;width:28px;height:28px;background-image:url(${escapeHtml(storedAvatar)});background-size:cover;background-position:center;border-radius:${radius};overflow:hidden;border:2px solid rgba(0,0,0,0.25);margin-right:8px"></span>`;
            }else{
              const color = storedMarkerColor || '#4cd137';
              inner += `<span class="member-dot" style="background:${escapeHtml(color)}"></span>`;
            }
            inner += `<span class="member-label">${escapeHtml(members[id].name)}</span>`;
            div.innerHTML = inner;
      if(members[id] && members[id].marker){
        const el2 = members[id].marker.getElement(); if(el2){ const d = el2.querySelector('.member-dot'); if(d) d.style.background = '#4cd137'; }
      }
    }, 7000);
  }

  // atualizar overlay de membros (lista lateral / overlay visual)
  try{ renderMembersOverlay(); }catch(e){ console.warn('renderMembersOverlay falhou', e); }
}

// Renderiza o painel/overlay com os membros atuais
function renderMembersOverlay(){
  const container = qs('#members-overlay');
  if(!container) return;
  // preservar o ícone "self" se existir e substituir o restante
  const selfEl = container.querySelector('.self');
  const entries = Object.keys(members).map(id=>({id, name: members[id].name || id, lastSeen: members[id].lastSeen, speaking: !!members[id].speakingTimeout, color: members[id].color || getColorForId(id)}));
  // ordenar por lastSeen decrescente
  entries.sort((a,b)=> (b.lastSeen||0) - (a.lastSeen||0));
  // construir HTML
  const listHtml = entries.map(e=>{
    const m = members[e.id] || {};
    const short = escapeHtml(String(e.name));
    const speakBadge = e.speaking ? '<span style="width:10px;height:10px;background:#ff4d4d;border-radius:6px;display:inline-block;margin-left:8px;box-shadow:0 0 6px #ff4d4d"></span>' : '';
    // escolher ícone: avatar (círculo/quadrado) ou ponto colorido
    let iconHtml = '';
    const color = m.markerColor || e.color || '#4cd137';
    if(m.avatar && (m.markerStyle === 'avatar-circle' || m.markerStyle === 'avatar-square')){
      const radius = m.markerStyle === 'avatar-circle' ? '50%' : '6px';
      iconHtml = `<div style="width:40px;height:40px;border-radius:${radius};background-image:url(${escapeHtml(m.avatar)});background-size:cover;background-position:center;border:2px solid rgba(0,0,0,0.25);overflow:hidden;margin-right:8px"></div>`;
    }else{
      iconHtml = `<div style="width:40px;height:40px;border-radius:20px;background:${escapeHtml(color)};display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:700;border:2px solid rgba(0,0,0,0.25);margin-right:8px"></div>`;
    }
    return `<div class="member-icon" data-member="${escapeHtml(e.id)}" title="${short}" style="display:flex;align-items:center;gap:8px;padding:6px;border-radius:8px">${iconHtml}<div style="font-weight:600;color:#fff">${short}${speakBadge}</div></div>`;
  }).join('');
  // substituir o conteúdo mas preservar .self (se existir)
  container.innerHTML = '';
  if(selfEl) container.appendChild(selfEl.cloneNode(true));
  container.insertAdjacentHTML('beforeend', listHtml);
  // adicionar handlers para focar no mapa ao clicar
  container.querySelectorAll('.member-icon').forEach(el=>{
    el.style.cursor = 'pointer';
    el.addEventListener('click', ()=>{
      const id = el.getAttribute('data-member');
      const m = members[id];
      if(m && m.marker && leafletMap){
        const latlng = m.marker.getLatLng();
        leafletMap.panTo(latlng);
        try{ m.marker.openPopup(); }catch(e){}
      }
    });
  });
}

// Rota: origem/destino e camada
let originMarker = null;
let destMarker = null;
let routeLayer = null;

function setOrigin(coord){
  if(!leafletMap) return;
  if(originMarker) leafletMap.removeLayer(originMarker);
  originMarker = L.marker(coord, {title:'Origem'}).addTo(leafletMap).bindPopup('Origem');
  leafletMap.panTo(coord);
}

function setDest(coord){
  if(!leafletMap) return;
  if(destMarker) leafletMap.removeLayer(destMarker);
  destMarker = L.marker(coord, {title:'Destino'}).addTo(leafletMap).bindPopup('Destino');
  leafletMap.panTo(coord);
}

async function calculateRoute(){
  if(!originMarker || !destMarker) { alert('Defina origem e destino primeiro'); return; }
  const o = originMarker.getLatLng(); const d = destMarker.getLatLng();
  const url = `https://router.project-osrm.org/route/v1/driving/${o.lng},${o.lat};${d.lng},${d.lat}?overview=full&geometries=geojson&steps=false`;
  try{
    const resp = await fetch(url);
    if(!resp.ok) throw new Error('Erro na rota');
    const data = await resp.json();
    if(!data.routes || !data.routes.length) throw new Error('Nenhuma rota encontrada');
    const route = data.routes[0];
    const geo = route.geometry;
    if(routeLayer) routeLayer.remove();
    routeLayer = L.geoJSON(geo, {style:{color:'#00d1ff',weight:4,opacity:0.9}}).addTo(leafletMap);
    const bounds = routeLayer.getBounds();
    leafletMap.fitBounds(bounds.pad(0.1));
    const distKm = (route.distance/1000).toFixed(2);
    const durMin = Math.round(route.duration/60);
    const infoEl = qs('#route-info');
    if(infoEl) infoEl.textContent = `Distância: ${distKm} km · Duração aprox: ${durMin} min`;
    logEvent(`Rota calculada: ${distKm} km, ${durMin} min`);
    try{ await updateWeatherNotificationForRoute(o.lat, o.lng, d.lat, d.lng, durMin); }catch(e){ console.warn('Falha clima', e); }
  }catch(e){ alert('Falha ao calcular rota: '+e.message); console.error(e); }
}

function clearRoute(){
  if(originMarker){ leafletMap.removeLayer(originMarker); originMarker = null; }
  if(destMarker){ leafletMap.removeLayer(destMarker); destMarker = null; }
  if(routeLayer){ routeLayer.remove(); routeLayer = null; }
  const infoEl = qs('#route-info'); if(infoEl) infoEl.textContent = '';
}

function escapeHtml(s){ return String(s).replace(/[&<>"]/g, (c)=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

// Busca trilhas via Overpass (way highway=track|path|footway|bridleway) na bbox atual
async function loadTrailsForMap(){
  if(!leafletMap) throw new Error('map not initialized');
  const b = leafletMap.getBounds();
  const south = b.getSouth(); const west = b.getWest(); const north = b.getNorth(); const east = b.getEast();
  // Overpass query — retorna JSON com geometry
  const query = `[out:json][timeout:25];(way["highway"~"track|path|footway|bridleway"](${south},${west},${north},${east}););out geom;`;
  const url = 'https://overpass-api.de/api/interpreter';
  const resp = await fetch(url, {method:'POST', body: query, headers: {'Content-Type':'text/plain'}});
  if(!resp.ok) throw new Error('Overpass request failed');
  const data = await resp.json();
  const features = [];
  if(Array.isArray(data.elements)){
    for(const el of data.elements){
      if(el.type === 'way' && Array.isArray(el.geometry)){
        const coords = el.geometry.map(pt=> [pt.lon, pt.lat]);
        features.push({type:'Feature', properties: {id: el.id, tags: el.tags||{}}, geometry: {type:'LineString', coordinates: coords}});
      }
    }
  }
  const geojson = {type:'FeatureCollection', features};
  if(leafletMap.trailsLayer) leafletMap.trailsLayer.clearLayers();
  const newLayer = L.geoJSON(geojson, {style:{color:'#ff8a34', weight:3, opacity:0.9}}).addTo(leafletMap);
  try{ if(newLayer && typeof newLayer.bringToBack === 'function') newLayer.bringToBack(); }catch(e){}
  leafletMap.trailsLayer = newLayer;
}

// ========================
// Clima no trajeto (Open-Meteo)
// ========================
async function fetchOpenMeteo(lat, lon){
  const cache = (fetchOpenMeteo.__cache = fetchOpenMeteo.__cache || new Map());
  const key = `${Math.round(lat*100)/100},${Math.round(lon*100)/100}`;
  const now = Date.now();
  const hit = cache.get(key);
  if(hit && (now - hit.ts) < 30*60*1000) return hit.hourly;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,precipitation_probability,wind_speed_10m&timezone=auto`;
  const resp = await fetch(url);
  if(!resp.ok) throw new Error('Falha ao obter previsão');
  const data = await resp.json();
  const hourly = data && data.hourly ? data.hourly : null;
  cache.set(key, {ts: now, hourly});
  return hourly;
}

function summarizeWindow(hourly, start, end){
  if(!hourly || !Array.isArray(hourly.time)) return null;
  let tempMin = Infinity, tempMax = -Infinity;
  let windMax = 0, precipMax = 0, precipProbMax = 0;
  const startMs = start.getTime(); const endMs = end.getTime();
  let firstHour = null, lastHour = null;
  for(let i=0;i<hourly.time.length;i++){
    const tStr = hourly.time[i];
    const t = new Date(tStr);
    const ms = t.getTime();
    if(ms >= startMs && ms <= endMs){
      const temp = Number(hourly.temperature_2m?.[i] ?? NaN);
      const wind = Number(hourly.wind_speed_10m?.[i] ?? NaN);
      const prec = Number(hourly.precipitation?.[i] ?? NaN);
      const prob = Number(hourly.precipitation_probability?.[i] ?? NaN);
      if(!Number.isNaN(temp)){ tempMin = Math.min(tempMin, temp); tempMax = Math.max(tempMax, temp); }
      if(!Number.isNaN(wind)) windMax = Math.max(windMax, wind);
      if(!Number.isNaN(prec)) precipMax = Math.max(precipMax, prec);
      if(!Number.isNaN(prob)) precipProbMax = Math.max(precipProbMax, prob);
      if(firstHour == null) firstHour = t; lastHour = t;
    }
  }
  if(firstHour == null) return null;
  return { tempMin, tempMax, windMax, precipMax, precipProbMax, firstHour, lastHour };
}

function formatHour(h){
  try{ return h.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}); }catch(e){ return `${h.getHours().toString().padStart(2,'0')}:${h.getMinutes().toString().padStart(2,'0')}`; }
}

async function updateWeatherNotificationForRoute(lat1, lon1, lat2, lon2, durMin){
  const alertEl = qs('#weather-alert'); if(!alertEl) return;
  alertEl.textContent = 'Consultando previsão de clima...';
  const start = new Date();
  const end = new Date(start.getTime() + durMin*60*1000);
  try{
    const [h1, h2] = await Promise.all([fetchOpenMeteo(lat1, lon1), fetchOpenMeteo(lat2, lon2)]);
    const s1 = summarizeWindow(h1, start, end);
    const s2 = summarizeWindow(h2, start, end);
    const s = (!s1 && !s2) ? null :
      (!s1 ? s2 :
        (!s2 ? s1 :
          {
            tempMin: Math.min(s1.tempMin, s2.tempMin),
            tempMax: Math.max(s1.tempMax, s2.tempMax),
            windMax: Math.max(s1.windMax, s2.windMax),
            precipMax: Math.max(s1.precipMax, s2.precipMax),
            precipProbMax: Math.max(s1.precipProbMax, s2.precipProbMax),
            firstHour: s1.firstHour < s2.firstHour ? s1.firstHour : s2.firstHour,
            lastHour: s1.lastHour > s2.lastHour ? s1.lastHour : s2.lastHour
          }
        )
      );
    if(!s){
      alertEl.textContent = 'Sem dados de clima para o período da rota';
      return;
    }
    const chuva = (s.precipProbMax >= 50) || (s.precipMax >= 1.0);
    const ventoForte = s.windMax >= 30; // km/h
    const faixa = `${formatHour(s.firstHour)}–${formatHour(s.lastHour)}`;
    const partes = [];
    partes.push(`Janela: ${faixa}`);
    partes.push(`Temperatura: ${Math.round(s.tempMin)}–${Math.round(s.tempMax)}°C`);
    partes.push(`Vento máx: ${Math.round(s.windMax)} km/h`);
    partes.push(`Chuva: ${Math.round(s.precipProbMax)}% (até ${s.precipMax.toFixed(1)} mm/h)`);
    let alerta = '';
    if(chuva) alerta += 'Atenção: possibilidade de chuva no trajeto. ';
    if(ventoForte) alerta += 'Vento forte em trechos. ';
    alertEl.textContent = `${alerta}${partes.join(' • ')}`;
    logEvent(`Clima no trajeto: ${alertEl.textContent}`);
  }catch(e){
    alertEl.textContent = 'Não foi possível obter previsão de clima';
    console.warn(e);
  }
}

function attachFuel(){
  const fuelForm = qs('#fuel-form'); if(!fuelForm) return;
  fuelForm.addEventListener('submit', (ev)=>{
    ev.preventDefault();
    const distance = parseFloat(qs('#distance').value);
    const consumption = parseFloat(qs('#consumption').value);
    if(isNaN(distance) || isNaN(consumption) || consumption===0) return;
    const liters = (distance/100) * consumption;
    const resEl = qs('#fuel-result'); if(resEl) resEl.textContent = `Litros necessários: ${liters.toFixed(2)} L`;
    logEvent(`Calculadora: distância ${distance} km, consumo ${consumption} L/100km => ${liters.toFixed(2)} L`);
  });
}

function attachSOS(){
  const sosBtn = qs('#sos-send'); if(!sosBtn) return;
  sosBtn.addEventListener('click', async ()=>{
    const phoneEl = qs('#sos-phone'); const phone = phoneEl ? phoneEl.value.trim() : '';
    if(!phone){ alert('Informe telefone de emergência'); return; }
    sosBtn.disabled = true; sosBtn.textContent = 'Enviando...';
    try{
      const pos = await new Promise((res,rej)=> navigator.geolocation.getCurrentPosition(res,rej,{timeout:8000}));
      const lat = pos.coords.latitude; const lon = pos.coords.longitude;
      const body = `SOS! Minha localização: https://maps.google.com/?q=${lat},${lon}`;
      const smsUri = `sms:${encodeURIComponent(phone)}?body=${encodeURIComponent(body)}`;
      logEvent('SOS: localização obtida e tentativa de envio SMS');
      window.location.href = smsUri;
    }catch(err){
      const fallback = 'https://maps.google.com';
      alert('Não foi possível obter localização. Abra manualmente: '+fallback);
      logEvent('SOS: falha ao obter localização');
    } finally{ sosBtn.disabled = false; sosBtn.textContent = 'Enviar SOS'; }
  });
}
