const targetsEl = document.getElementById('targets');
const statusEl = document.getElementById('target-status');
const feedEl = document.getElementById('feed');
const pttEl = document.getElementById('ptt');
const pttFabEl = document.getElementById('ptt-fab');
const sosEl = document.getElementById('sos-sms');
const altRoutesEl = document.getElementById('alt-routes');
const me = { id: 'me', nome: 'Você' };
const participantes = [
  { id: 'car1', nome: 'Líder' },
  { id: 'car2', nome: 'Pedro' },
  { id: 'car3', nome: 'Ana' },
  { id: 'car4', nome: 'Bruno' }
];
let destino = 'todos';
let mensagens = [];
let mediaRecorder = null;
let mediaStream = null;
let mediaChunks = [];
const clientId = Math.random().toString(36).slice(2);
let bc = null;
let isRecording = false;
try{
  const d = localStorage.getItem('comms_destino');
  if(d) destino = d;
  const raw = localStorage.getItem('comms_messages');
  if(raw){
    const arr = JSON.parse(raw);
    if(Array.isArray(arr)) mensagens = arr.filter(m=> m && m.tipo === 'audio');
  }
}catch(e){}
try{ bc = new BroadcastChannel('trilhanca-pp'); }catch(e){ bc = null; }
if(bc){
  bc.onmessage = (ev)=>{
    const m = ev.data;
    if(!m || m.origin === clientId) return;
    if(m.type === 'audio'){
      addAudioMensagem(m.dataUrl, m.de, m.para, m.ts);
    }
  };
}
function renderTargets(){
  participantes.forEach(p=>{
    const b = document.createElement('button');
    b.className = 'chip';
    b.textContent = p.nome;
    b.dataset.id = p.id;
    b.addEventListener('click', ()=>{
      destino = p.id;
      document.querySelectorAll('.chip').forEach(x=>x.classList.remove('selected'));
      b.classList.add('selected');
      statusEl.textContent = 'Enviando para ' + p.nome;
      try{ localStorage.setItem('comms_destino', destino); }catch(e){}
    });
    targetsEl.appendChild(b);
  });
  const all = document.getElementById('target-todos');
  all.addEventListener('click', ()=>{
    destino = 'todos';
    document.querySelectorAll('.chip').forEach(x=>x.classList.remove('selected'));
    all.classList.add('selected');
    statusEl.textContent = 'Enviando para Todos';
    try{ localStorage.setItem('comms_destino', destino); }catch(e){}
  });
  document.querySelectorAll('.chip').forEach(x=>x.classList.remove('selected'));
  if(destino === 'todos'){
    all.classList.add('selected');
    statusEl.textContent = 'Enviando para Todos';
  }else{
    const targetBtn = Array.from(document.querySelectorAll('.chip')).find(x=>x.dataset.id===destino);
    if(targetBtn){
      targetBtn.classList.add('selected');
      const nome = participantes.find(p=>p.id===destino)?.nome || 'Destino';
      statusEl.textContent = 'Enviando para ' + nome;
    }else{
      all.classList.add('selected');
      statusEl.textContent = 'Enviando para Todos';
    }
  }
}
function addAudioMensagem(dataUrl, de, para, ts){
  const msg = { tipo:'audio', audio:dataUrl, de, para, ts: ts || Date.now() };
  mensagens.push(msg);
  renderFeed();
  try{ localStorage.setItem('comms_messages', JSON.stringify(mensagens)); }catch(e){}
}
function renderFeed(){
  feedEl.innerHTML = '';
  mensagens.forEach(m=>{
    const row = document.createElement('div');
    const out = m.de.id === me.id;
    row.className = 'msg ' + (out ? 'out' : 'in');
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.src = m.audio;
    bubble.appendChild(audio);
    const meta = document.createElement('div');
    meta.className = 'meta';
    const toName = m.para === 'todos' ? 'Todos' : participantes.find(x=>x.id===m.para)?.nome || 'Destino';
    meta.textContent = m.de.nome + ' → ' + toName;
    const wrap = document.createElement('div');
    wrap.appendChild(bubble);
    wrap.appendChild(meta);
    row.appendChild(wrap);
    feedEl.appendChild(row);
    feedEl.scrollTop = feedEl.scrollHeight;
  });
}
async function startRecording(){
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
  if(isRecording) return;
  if(!mediaStream){
    try{
      mediaStream = await navigator.mediaDevices.getUserMedia({audio:true});
    }catch(e){ return; }
  }
  mediaChunks = [];
  try{
    mediaRecorder = new MediaRecorder(mediaStream, {mimeType:'audio/webm'});
  }catch(e){
    mediaRecorder = new MediaRecorder(mediaStream);
  }
  mediaRecorder.ondataavailable = (e)=>{ if(e.data && e.data.size) mediaChunks.push(e.data); };
  mediaRecorder.onstop = async ()=>{
    try{
      const blob = new Blob(mediaChunks, {type: mediaRecorder.mimeType || 'audio/webm'});
      const reader = new FileReader();
      reader.onloadend = ()=>{
        const url = reader.result;
        addAudioMensagem(url, me, destino);
        if(bc){ bc.postMessage({type:'audio', dataUrl:url, de:me, para:destino, ts:Date.now(), origin:clientId}); }
      };
      reader.readAsDataURL(blob);
    }catch(e){}
    mediaChunks = [];
  };
  mediaRecorder.start();
  isRecording = true;
  if(pttEl){ pttEl.classList.add('active'); }
  if(pttFabEl){ pttFabEl.classList.add('active'); pttFabEl.classList.add('pulse'); }
}
function stopRecording(){
  if(!isRecording) return;
  try{
    if(mediaRecorder && mediaRecorder.state === 'recording'){ mediaRecorder.stop(); }
  }catch(e){}
  isRecording = false;
  if(pttEl){ pttEl.classList.remove('active'); }
  if(pttFabEl){ pttFabEl.classList.remove('active'); pttFabEl.classList.remove('pulse'); }
}
if(pttEl){ pttEl.addEventListener('click', ()=>{ if(isRecording){ stopRecording(); } else { startRecording(); } }); }
if(pttFabEl){ pttFabEl.addEventListener('click', ()=>{ if(isRecording){ stopRecording(); } else { startRecording(); } }); }
if(sosEl){
  sosEl.addEventListener('click', async ()=>{
    let body = 'SOS TRILHANÇA';
    try{
      const pos = await new Promise((res,rej)=>{ if(!navigator.geolocation) rej(); navigator.geolocation.getCurrentPosition(res, rej, {enableHighAccuracy:true, timeout:6000}); });
      const lat = pos.coords.latitude.toFixed(6);
      const lon = pos.coords.longitude.toFixed(6);
      body += ' • ' + lat + ',' + lon;
    }catch(e){}
    const url = 'sms:?body=' + encodeURIComponent(body);
    window.location.href = url;
  });
}
if(altRoutesEl){
  altRoutesEl.addEventListener('click', ()=>{
    window.open('./mapa.html', '_self');
  });
}
renderTargets();
