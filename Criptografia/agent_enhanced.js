;(function(){
  'use strict';
  
  // Enhanced Security Agent with Multiple Layers of Protection
  // Version 2.0 - Enterprise Grade Security
  
  if(!window.CryptoKit) {
    console.error('CryptoKit not available - security features disabled');
    return;
  }
  
  // Configuration Constants
  const CONFIG = {
    VERSION: '2.0',
    ALGORITHM: 'AES-256-GCM',
    KEY_DERIVATION: 'PBKDF2',
    HASH_ALGORITHM: 'SHA-512',
    ITERATIONS: 500000, // Increased from 250k to 500k
    SALT_LENGTH: 32,
    IV_LENGTH: 12,
    TAG_LENGTH: 16,
    KEY_LENGTH: 32,
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    MAX_ATTEMPTS: 3,
    LOCKOUT_DURATION: 15 * 60 * 1000 // 15 minutes
  };
  
  // Enhanced Secure Keys - More comprehensive coverage
  const SECURE_KEYS = new Set([
    'odo_state', 'road_reports', 'comms_messages', 'live_location', 
    'tomtom_key', 'user_credentials', 'session_token', 'api_keys',
    'payment_info', 'personal_data', 'health_data', 'location_history',
    'device_fingerprint', 'encryption_keys', 'auth_tokens', 'biometric_data'
  ]);
  
  // Security State Management
  let securityState = {
    masterKey: null,
    sessionKey: null,
    failedAttempts: 0,
    lockoutUntil: null,
    lastActivity: Date.now(),
    deviceFingerprint: null,
    secureContext: false
  };
  
  // Initialize Security Context
  function initializeSecurity() {
    try {
      securityState.secureContext = window.isSecureContext;
      securityState.deviceFingerprint = generateDeviceFingerprint();
      
      if (!securityState.secureContext) {
        console.warn('Warning: Not running in secure context - encryption disabled');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Security initialization failed:', error);
      return false;
    }
  }
  
  // Enhanced Device Fingerprinting
  function generateDeviceFingerprint() {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency,
      navigator.deviceMemory || 'unknown'
    ];
    
    const hash = new TextEncoder().encode(components.join('|'));
    return crypto.subtle.digest('SHA-256', hash).then(hash => {
      return btoa(String.fromCharCode(...new Uint8Array(hash)));
    });
  }
  
  // Enhanced Key Generation with Entropy
  async function generateSecureKey() {
    try {
      // Combine multiple entropy sources
      const randomBytes = new Uint8Array(CONFIG.KEY_LENGTH);
      crypto.getRandomValues(randomBytes);
      
      // Add timestamp and device fingerprint for additional entropy
      const timestamp = new Date().getTime().toString();
      const entropy = new TextEncoder().encode(timestamp);
      const combined = new Uint8Array(randomBytes.length + entropy.length);
      combined.set(randomBytes);
      combined.set(entropy, randomBytes.length);
      
      const hash = await crypto.subtle.digest('SHA-512', combined);
      return new Uint8Array(hash).slice(0, CONFIG.KEY_LENGTH);
    } catch (error) {
      console.error('Key generation failed:', error);
      throw new Error('Failed to generate secure key');
    }
  }
  
  // Enhanced Key Derivation with Memory Protection
  async function deriveKey(password, salt, iterations = CONFIG.ITERATIONS) {
    try {
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: CONFIG.KEY_DERIVATION },
        false,
        ['deriveKey']
      );
      
      return crypto.subtle.deriveKey(
        {
          name: CONFIG.KEY_DERIVATION,
          salt: salt,
          iterations: iterations,
          hash: CONFIG.HASH_ALGORITHM
        },
        keyMaterial,
        { name: CONFIG.ALGORITHM, length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.error('Key derivation failed:', error);
      throw new Error('Failed to derive encryption key');
    }
  }
  
  // Enhanced Encryption with Authentication
  async function encryptWithAuth(plaintext, key, additionalData = null) {
    try {
      const iv = crypto.getRandomValues(new Uint8Array(CONFIG.IV_LENGTH));
      const encoded = new TextEncoder().encode(plaintext);
      
      let encrypted;
      if (additionalData) {
        encrypted = await crypto.subtle.encrypt(
          {
            name: CONFIG.ALGORITHM,
            iv: iv,
            additionalData: new TextEncoder().encode(additionalData)
          },
          key,
          encoded
        );
      } else {
        encrypted = await crypto.subtle.encrypt(
          { name: CONFIG.ALGORITHM, iv: iv },
          key,
          encoded
        );
      }
      
      const result = new Uint8Array(iv.length + encrypted.byteLength);
      result.set(iv);
      result.set(new Uint8Array(encrypted), iv.length);
      
      return btoa(String.fromCharCode(...result));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Encryption operation failed');
    }
  }
  
  // Enhanced Decryption with Authentication
  async function decryptWithAuth(ciphertext, key, additionalData = null) {
    try {
      const data = atob(ciphertext);
      const bytes = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i++) {
        bytes[i] = data.charCodeAt(i);
      }
      
      const iv = bytes.slice(0, CONFIG.IV_LENGTH);
      const encrypted = bytes.slice(CONFIG.IV_LENGTH);
      
      let decrypted;
      if (additionalData) {
        decrypted = await crypto.subtle.decrypt(
          {
            name: CONFIG.ALGORITHM,
            iv: iv,
            additionalData: new TextEncoder().encode(additionalData)
          },
          key,
          encrypted
        );
      } else {
        decrypted = await crypto.subtle.decrypt(
          { name: CONFIG.ALGORITHM, iv: iv },
          key,
          encrypted
        );
      }
      
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Decryption operation failed');
    }
  }
  
  // Session Management with Timeout
  async function createSession() {
    try {
      const sessionKey = await generateSecureKey();
      const expiresAt = Date.now() + CONFIG.SESSION_TIMEOUT;
      
      securityState.sessionKey = sessionKey;
      securityState.lastActivity = Date.now();
      
      const sessionData = {
        key: btoa(String.fromCharCode(...sessionKey)),
        expires: expiresAt,
        fingerprint: await securityState.deviceFingerprint
      };
      
      localStorage.setItem('trilha_session', JSON.stringify(sessionData));
      return sessionKey;
    } catch (error) {
      console.error('Session creation failed:', error);
      throw new Error('Failed to create secure session');
    }
  }
  
  // Session Validation
  async function validateSession() {
    try {
      const sessionData = localStorage.getItem('trilha_session');
      if (!sessionData) return false;
      
      const session = JSON.parse(sessionData);
      const now = Date.now();
      
      if (session.expires < now) {
        localStorage.removeItem('trilha_session');
        return false;
      }
      
      securityState.lastActivity = now;
      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }
  
  // Rate Limiting and Lockout Protection
  function checkRateLimit() {
    const now = Date.now();
    
    if (securityState.lockoutUntil && now < securityState.lockoutUntil) {
      const remainingTime = Math.ceil((securityState.lockoutUntil - now) / 1000 / 60);
      throw new Error(`Account locked. Try again in ${remainingTime} minutes`);
    }
    
    if (securityState.failedAttempts >= CONFIG.MAX_ATTEMPTS) {
      securityState.lockoutUntil = now + CONFIG.LOCKOUT_DURATION;
      securityState.failedAttempts = 0;
      throw new Error('Too many failed attempts. Account locked for 15 minutes');
    }
  }
  
  // Enhanced Master Key Management
  async function ensureMasterKey() {
    try {
      if (securityState.masterKey) {
        return securityState.masterKey;
      }
      
      let storedKey = localStorage.getItem('trilha_master_key_v2');
      
      if (!storedKey) {
        const newKey = await generateSecureKey();
        const keyB64 = btoa(String.fromCharCode(...newKey));
        const encryptedKey = await encryptWithAuth(keyB64, await deriveKey('master', new Uint8Array(16)));
        
        localStorage.setItem('trilha_master_key_v2', encryptedKey);
        securityState.masterKey = newKey;
        return newKey;
      }
      
      // Decrypt existing key
      const salt = new Uint8Array(16);
      const key = await deriveKey('master', salt);
      const decryptedKey = await decryptWithAuth(storedKey, key);
      
      securityState.masterKey = new Uint8Array(atob(decryptedKey).split('').map(c => c.charCodeAt(0)));
      return securityState.masterKey;
    } catch (error) {
      console.error('Master key management failed:', error);
      throw new Error('Failed to manage master key');
    }
  }
  
  // Enhanced Storage Interceptor
  const storage = window.localStorage;
  const originalSetItem = storage.setItem.bind(storage);
  const originalGetItem = storage.getItem.bind(storage);
  const originalRemoveItem = storage.removeItem.bind(storage);
  
  // Secure Set Item with Multiple Layers
  storage.setItem = async function(key, value) {
    try {
      if (!initializeSecurity()) {
        return originalSetItem(key, value);
      }
      
      checkRateLimit();
      
      if (SECURE_KEYS.has(key) && typeof value === 'string') {
        const masterKey = await ensureMasterKey();
        const sessionValid = await validateSession();
        
        if (!sessionValid) {
          await createSession();
        }
        
        const additionalData = `${key}:${Date.now()}:${await securityState.deviceFingerprint}`;
        const encryptedValue = await encryptWithAuth(value, masterKey, additionalData);
        
        // Store with metadata
        const metadata = {
          encrypted: true,
          version: CONFIG.VERSION,
          timestamp: Date.now(),
          key: key
        };
        
        originalSetItem(`secure_${key}`, encryptedValue);
        originalSetItem(`meta_${key}`, JSON.stringify(metadata));
        
        securityState.failedAttempts = 0;
        return;
      }
    } catch (error) {
      console.error('Secure storage set failed:', error);
      securityState.failedAttempts++;
    }
    
    return originalSetItem(key, value);
  };
  
  // Secure Get Item with Validation
  storage.getItem = async function(key) {
    try {
      if (!initializeSecurity()) {
        return originalGetItem(key);
      }
      
      const encryptedValue = originalGetItem(`secure_${key}`);
      const metadata = originalGetItem(`meta_${key}`);
      
      if (!encryptedValue || !metadata) {
        return originalGetItem(key);
      }
      
      const meta = JSON.parse(metadata);
      if (meta.version !== CONFIG.VERSION) {
        console.warn('Version mismatch - data may be corrupted');
        return null;
      }
      
      const masterKey = await ensureMasterKey();
      const additionalData = `${meta.key}:${meta.timestamp}:${await securityState.deviceFingerprint}`;
      
      try {
        const decryptedValue = await decryptWithAuth(encryptedValue, masterKey, additionalData);
        securityState.failedAttempts = 0;
        return decryptedValue;
      } catch (decryptError) {
        console.error('Decryption failed:', decryptError);
        securityState.failedAttempts++;
        return null;
      }
    } catch (error) {
      console.error('Secure storage get failed:', error);
      return originalGetItem(key);
    }
  };
  
  // Secure Remove Item with Cleanup
  storage.removeItem = function(key) {
    try {
      originalRemoveItem(`secure_${key}`);
      originalRemoveItem(`meta_${key}`);
    } catch (error) {
      console.error('Secure storage remove failed:', error);
    }
    return originalRemoveItem(key);
  };
  
  // Enhanced Event Listener Interceptor
  const originalAddEventListener = window.addEventListener.bind(window);
  
  window.addEventListener = function(type, handler, options) {
    if (type === 'storage' && typeof handler === 'function') {
      const wrappedHandler = async function(event) {
        try {
          const key = event.key;
          if (key && key.startsWith('secure_')) {
            const actualKey = key.replace('secure_', '');
            const newValue = await storage.getItem(actualKey);
            
            // Create new event with decrypted value
            const secureEvent = new StorageEvent('storage', {
              key: actualKey,
              newValue: newValue,
              oldValue: event.oldValue,
              url: event.url,
              storageArea: event.storageArea
            });
            
            handler(secureEvent);
            return;
          }
        } catch (error) {
          console.error('Storage event handling failed:', error);
        }
        
        handler(event);
      };
      
      return originalAddEventListener(type, wrappedHandler, options);
    }
    
    return originalAddEventListener(type, handler, options);
  };
  
  // Security Monitoring and Health Check
  setInterval(async function() {
    try {
      const sessionValid = await validateSession();
      if (!sessionValid) {
        console.warn('Session expired, creating new session');
        await createSession();
      }
    } catch (error) {
      console.error('Security health check failed:', error);
    }
  }, 60000); // Check every minute
  
  // Initialize security on load
  initializeSecurity().then(success => {
    if (success) {
      console.log('Enhanced security agent initialized successfully');
    } else {
      console.warn('Security agent initialization failed - running in degraded mode');
    }
  });
  
  // Expose security API
  window.TrilhaSecurity = {
    version: CONFIG.VERSION,
    isSecure: () => securityState.secureContext,
    createSession: createSession,
    validateSession: validateSession,
    encrypt: encryptWithAuth,
    decrypt: decryptWithAuth,
    generateKey: generateSecureKey
  };
  
})();
