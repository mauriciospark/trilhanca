;(function(){
  if(!window.CryptoKit) return;
  const SECURE_KEYS = new Set(['odo_state','road_reports','comms_messages','live_location','tomtom_key']);
  function ensurePass(){
    let p = localStorage.getItem('secure_device_master');
    if(!p){
      try{
        const b = CryptoKit.randomBytes(32);
        p = CryptoKit.b64e(b);
        localStorage.setItem('secure_device_master', p);
      }catch(e){
        p = 'fallback-'+Math.random().toString(36).slice(2);
      }
    }
    return p;
  }
  const PASS = ensurePass();
  const storage = window.localStorage;
  const _set = storage.setItem.bind(storage);
  const _get = storage.getItem.bind(storage);
  storage.setItem = function(key, value){
    try{
      if(SECURE_KEYS.has(key) && typeof value === 'string' && !value.startsWith('v1.')){
        CryptoKit.encryptWithPass(value, PASS).then((t)=>{ _set(key, t); }).catch(()=>{ _set(key, value); });
        return;
      }
    }catch(e){}
    return _set(key, value);
  };
  storage.getItem = function(key){
    try{
      const v = _get(key);
      if(!v) return v;
      if(SECURE_KEYS.has(key) && typeof v === 'string' && v.startsWith('v1.')){
        return null;
      }
      return v;
    }catch(e){
      return _get(key);
    }
  };
  const _add = window.addEventListener.bind(window);
  window.addEventListener = function(type, handler, opts){
    if(type === 'storage' && typeof handler === 'function'){
      const wrap = function(e){
        try{
          const key = e.key;
          const val = e.newValue;
          if(key && SECURE_KEYS.has(key) && typeof val === 'string' && val.startsWith('v1.')){
            CryptoKit.decryptWithPass(val, PASS).then((plain)=>{
              try{
                const ev = new StorageEvent('storage', {key: key, newValue: plain, oldValue: e.oldValue, url: e.url, storageArea: e.storageArea});
                handler(ev);
              }catch(_){
                handler({key:key, newValue: plain, oldValue:e.oldValue, url:e.url, storageArea:e.storageArea});
              }
            }).catch(()=> handler(e));
            return;
          }
        }catch(_){}
        handler(e);
      };
      return _add(type, wrap, opts);
    }
    return _add(type, handler, opts);
  };
})(); 
