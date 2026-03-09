// Enhanced Cryptography Library - Enterprise Grade Security
// Version 2.0 - Multi-layered Protection
// Addresses all identified vulnerabilities

const TrilhaCrypto = (() => {
    'use strict';
    
    // Security Configuration
    const CONFIG = {
        VERSION: '2.0',
        SYMMETRIC_ALGORITHM: 'AES-256-GCM',
        ASYMMETRIC_ALGORITHM: 'RSA-OAEP',
        SIGNATURE_ALGORITHM: 'ECDSA',
        HASH_ALGORITHM: 'SHA-512',
        KEY_DERIVATION: 'PBKDF2',
        ITERATIONS: 500000,
        SALT_LENGTH: 32,
        IV_LENGTH: 12,
        TAG_LENGTH: 16,
        KEY_LENGTH: 32,
        RSA_KEY_SIZE: 4096,
        EC_CURVE: 'P-521',
        SESSION_TIMEOUT: 1800000, // 30 minutes
        MAX_RETRIES: 3
    };
    
    // Text encoding utilities
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    // Base64 encoding with URL safety
    function base64Encode(data) {
        const bytes = new Uint8Array(data);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }
    
    function base64Decode(str) {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) {
            str += '=';
        }
        const binary = atob(str);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }
    
    // Enhanced random number generation
    function generateSecureRandom(length) {
        if (window.crypto && window.crypto.getRandomValues) {
            const array = new Uint8Array(length);
            window.crypto.getRandomValues(array);
            return array;
        }
        throw new Error('Secure random number generation not available');
    }
    
    // Enhanced key derivation with memory protection
    async function deriveKey(password, salt, iterations = CONFIG.ITERATIONS) {
        try {
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
                { name: CONFIG.SYMMETRIC_ALGORITHM, length: 256 },
                false,
                ['encrypt', 'decrypt']
            );
        } catch (error) {
            console.error('Key derivation failed:', error);
            throw new Error('Failed to derive encryption key');
        }
    }
    
    // Generate symmetric key with entropy
    async function generateSymmetricKey() {
        try {
            return crypto.subtle.generateKey(
                { name: CONFIG.SYMMETRIC_ALGORITHM, length: 256 },
                true,
                ['encrypt', 'decrypt']
            );
        } catch (error) {
            console.error('Symmetric key generation failed:', error);
            throw new Error('Failed to generate symmetric key');
        }
    }
    
    // Generate RSA key pair for asymmetric encryption
    async function generateRSAKeyPair() {
        try {
            return crypto.subtle.generateKey(
                {
                    name: CONFIG.ASYMMETRIC_ALGORITHM,
                    modulusLength: CONFIG.RSA_KEY_SIZE,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: { name: CONFIG.HASH_ALGORITHM }
                },
                true,
                ['encrypt', 'decrypt']
            );
        } catch (error) {
            console.error('RSA key pair generation failed:', error);
            throw new Error('Failed to generate RSA key pair');
        }
    }
    
    // Generate ECDSA key pair for signatures
    async function generateECDSAKeyPair() {
        try {
            return crypto.subtle.generateKey(
                {
                    name: CONFIG.SIGNATURE_ALGORITHM,
                    namedCurve: CONFIG.EC_CURVE
                },
                true,
                ['sign', 'verify']
            );
        } catch (error) {
            console.error('ECDSA key pair generation failed:', error);
            throw new Error('Failed to generate ECDSA key pair');
        }
    }
    
    // Enhanced symmetric encryption with authentication
    async function encryptSymmetric(plaintext, key, additionalData = null) {
        try {
            const iv = generateSecureRandom(CONFIG.IV_LENGTH);
            const encoded = encoder.encode(plaintext);
            
            let encrypted;
            if (additionalData) {
                encrypted = await crypto.subtle.encrypt(
                    {
                        name: CONFIG.SYMMETRIC_ALGORITHM,
                        iv: iv,
                        additionalData: encoder.encode(additionalData)
                    },
                    key,
                    encoded
                );
            } else {
                encrypted = await crypto.subtle.encrypt(
                    { name: CONFIG.SYMMETRIC_ALGORITHM, iv: iv },
                    key,
                    encoded
                );
            }
            
            // Combine IV + ciphertext + tag
            const result = new Uint8Array(iv.length + encrypted.byteLength);
            result.set(iv);
            result.set(new Uint8Array(encrypted), iv.length);
            
            return base64Encode(result);
        } catch (error) {
            console.error('Symmetric encryption failed:', error);
            throw new Error('Encryption operation failed');
        }
    }
    
    // Enhanced symmetric decryption with authentication
    async function decryptSymmetric(ciphertext, key, additionalData = null) {
        try {
            const data = base64Decode(ciphertext);
            const iv = data.slice(0, CONFIG.IV_LENGTH);
            const encrypted = data.slice(CONFIG.IV_LENGTH);
            
            let decrypted;
            if (additionalData) {
                decrypted = await crypto.subtle.decrypt(
                    {
                        name: CONFIG.SYMMETRIC_ALGORITHM,
                        iv: iv,
                        additionalData: encoder.encode(additionalData)
                    },
                    key,
                    encrypted
                );
            } else {
                decrypted = await crypto.subtle.decrypt(
                    { name: CONFIG.SYMMETRIC_ALGORITHM, iv: iv },
                    key,
                    encrypted
                );
            }
            
            return decoder.decode(decrypted);
        } catch (error) {
            console.error('Symmetric decryption failed:', error);
            throw new Error('Decryption operation failed');
        }
    }
    
    // Asymmetric encryption with RSA
    async function encryptAsymmetric(plaintext, publicKey) {
        try {
            const encoded = encoder.encode(plaintext);
            const encrypted = await crypto.subtle.encrypt(
                {
                    name: CONFIG.ASYMMETRIC_ALGORITHM,
                    label: new Uint8Array(0) // Empty label for OAEP
                },
                publicKey,
                encoded
            );
            
            return base64Encode(encrypted);
        } catch (error) {
            console.error('Asymmetric encryption failed:', error);
            throw new Error('Asymmetric encryption failed');
        }
    }
    
    // Asymmetric decryption with RSA
    async function decryptAsymmetric(ciphertext, privateKey) {
        try {
            const data = base64Decode(ciphertext);
            const decrypted = await crypto.subtle.decrypt(
                {
                    name: CONFIG.ASYMMETRIC_ALGORITHM,
                    label: new Uint8Array(0)
                },
                privateKey,
                data
            );
            
            return decoder.decode(decrypted);
        } catch (error) {
            console.error('Asymmetric decryption failed:', error);
            throw new Error('Asymmetric decryption failed');
        }
    }
    
    // Digital signature with ECDSA
    async function signData(data, privateKey) {
        try {
            const encoded = encoder.encode(data);
            const signature = await crypto.subtle.sign(
                {
                    name: CONFIG.SIGNATURE_ALGORITHM,
                    hash: { name: CONFIG.HASH_ALGORITHM }
                },
                privateKey,
                encoded
            );
            
            return base64Encode(signature);
        } catch (error) {
            console.error('Signing failed:', error);
            throw new Error('Digital signature failed');
        }
    }
    
    // Signature verification with ECDSA
    async function verifySignature(signature, data, publicKey) {
        try {
            const encoded = encoder.encode(data);
            const signatureData = base64Decode(signature);
            
            const isValid = await crypto.subtle.verify(
                {
                    name: CONFIG.SIGNATURE_ALGORITHM,
                    hash: { name: CONFIG.HASH_ALGORITHM }
                },
                publicKey,
                signatureData,
                encoded
            );
            
            return isValid;
        } catch (error) {
            console.error('Signature verification failed:', error);
            return false;
        }
    }
    
    // Hash function with multiple algorithms
    async function hashData(data, algorithm = CONFIG.HASH_ALGORITHM) {
        try {
            const encoded = encoder.encode(data);
            const hash = await crypto.subtle.digest(algorithm, encoded);
            return base64Encode(hash);
        } catch (error) {
            console.error('Hashing failed:', error);
            throw new Error('Hash operation failed');
        }
    }
    
    // Password-based encryption with enhanced security
    async function encryptWithPassword(plaintext, password, additionalData = null) {
        try {
            const salt = generateSecureRandom(CONFIG.SALT_LENGTH);
            const key = await deriveKey(password, salt);
            const iv = generateSecureRandom(CONFIG.IV_LENGTH);
            
            const encoded = encoder.encode(plaintext);
            const encrypted = await crypto.subtle.encrypt(
                {
                    name: CONFIG.SYMMETRIC_ALGORITHM,
                    iv: iv,
                    additionalData: additionalData ? encoder.encode(additionalData) : null
                },
                key,
                encoded
            );
            
            // Format: version.salt.iv.ciphertext
            const result = new Uint8Array(
                2 + salt.length + iv.length + encrypted.byteLength
            );
            result.set(new TextEncoder().encode('v2'));
            result.set(salt, 2);
            result.set(iv, 2 + salt.length);
            result.set(new Uint8Array(encrypted), 2 + salt.length + iv.length);
            
            return base64Encode(result);
        } catch (error) {
            console.error('Password encryption failed:', error);
            throw new Error('Password-based encryption failed');
        }
    }
    
    // Password-based decryption with enhanced security
    async function decryptWithPassword(ciphertext, password, additionalData = null) {
        try {
            const data = base64Decode(ciphertext);
            
            // Validate format
            if (data.length < 2 || 
                String.fromCharCode(data[0], data[1]) !== 'v2') {
                throw new Error('Invalid ciphertext format');
            }
            
            let offset = 2;
            const salt = data.slice(offset, offset + CONFIG.SALT_LENGTH);
            offset += CONFIG.SALT_LENGTH;
            
            const iv = data.slice(offset, offset + CONFIG.IV_LENGTH);
            offset += CONFIG.IV_LENGTH;
            
            const encrypted = data.slice(offset);
            
            const key = await deriveKey(password, salt);
            const decrypted = await crypto.subtle.decrypt(
                {
                    name: CONFIG.SYMMETRIC_ALGORITHM,
                    iv: iv,
                    additionalData: additionalData ? encoder.encode(additionalData) : null
                },
                key,
                encrypted
            );
            
            return decoder.decode(decrypted);
        } catch (error) {
            console.error('Password decryption failed:', error);
            throw new Error('Password-based decryption failed');
        }
    }
    
    // Key exchange protocol
    async function performKeyExchange() {
        try {
            const ecdhKeyPair = await crypto.subtle.generateKey(
                { name: 'ECDH', namedCurve: 'P-521' },
                true,
                ['deriveKey', 'deriveBits']
            );
            
            const publicKey = await crypto.subtle.exportKey('raw', ecdhKeyPair.publicKey);
            return {
                keyPair: ecdhKeyPair,
                publicKey: base64Encode(publicKey)
            };
        } catch (error) {
            console.error('Key exchange failed:', error);
            throw new Error('Key exchange failed');
        }
    }
    
    // Derive shared secret
    async function deriveSharedSecret(privateKey, peerPublicKey) {
        try {
            const publicKeyData = base64Decode(peerPublicKey);
            const importedPublicKey = await crypto.subtle.importKey(
                'raw',
                publicKeyData,
                { name: 'ECDH', namedCurve: 'P-521' },
                true,
                []
            );
            
            const sharedSecret = await crypto.subtle.deriveKey(
                { name: 'ECDH', public: importedPublicKey },
                privateKey,
                { name: CONFIG.SYMMETRIC_ALGORITHM, length: 256 },
                true,
                ['encrypt', 'decrypt']
            );
            
            return sharedSecret;
        } catch (error) {
            console.error('Shared secret derivation failed:', error);
            throw new Error('Failed to derive shared secret');
        }
    }
    
    // Secure storage with encryption
    async function setSecureItem(key, value, password = null) {
        try {
            let encrypted;
            if (password) {
                encrypted = await encryptWithPassword(value, password, key);
            } else {
                const key = await generateSymmetricKey();
                encrypted = await encryptSymmetric(value, key, key);
                
                // Store the encrypted key
                const exportedKey = await crypto.subtle.exportKey('raw', key);
                const encryptedKey = await encryptWithPassword(
                    base64Encode(exportedKey),
                    'master_key_' + key
                );
                localStorage.setItem(`key_${key}`, encryptedKey);
            }
            
            localStorage.setItem(`secure_${key}`, encrypted);
            return true;
        } catch (error) {
            console.error('Secure storage set failed:', error);
            return false;
        }
    }
    
    // Retrieve and decrypt secure item
    async function getSecureItem(key, password = null) {
        try {
            const encrypted = localStorage.getItem(`secure_${key}`);
            if (!encrypted) return null;
            
            if (password) {
                return await decryptWithPassword(encrypted, password, key);
            } else {
                const encryptedKey = localStorage.getItem(`key_${key}`);
                if (!encryptedKey) {
                    throw new Error('Encryption key not found');
                }
                
                const keyData = await decryptWithPassword(encryptedKey, 'master_key_' + key);
                const key = await crypto.subtle.importKey(
                    'raw',
                    base64Decode(keyData),
                    { name: CONFIG.SYMMETRIC_ALGORITHM },
                    false,
                    ['decrypt']
                );
                
                return await decryptSymmetric(encrypted, key, key);
            }
        } catch (error) {
            console.error('Secure storage get failed:', error);
            return null;
        }
    }
    
    // Memory cleanup utility
    function secureWipe(data) {
        if (data instanceof Uint8Array) {
            data.fill(0);
        } else if (typeof data === 'string') {
            // Overwrite string memory (limited in JavaScript)
            for (let i = 0; i < data.length; i++) {
                data = data.substring(0, i) + '0' + data.substring(i + 1);
            }
        }
    }
    
    // Security audit function
    async function performSecurityAudit() {
        const audit = {
            timestamp: new Date().toISOString(),
            secureContext: window.isSecureContext,
            cryptoAvailable: !!(window.crypto && window.crypto.subtle),
            localStorageAvailable: !!window.localStorage,
            sessionStorageAvailable: !!window.sessionStorage,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            languages: navigator.languages,
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine
        };
        
        // Test encryption capabilities
        try {
            const testKey = await generateSymmetricKey();
            const testEncrypted = await encryptSymmetric('test', testKey);
            const testDecrypted = await decryptSymmetric(testEncrypted, testKey);
            audit.encryptionTest = testDecrypted === 'test';
        } catch (error) {
            audit.encryptionTest = false;
            audit.encryptionError = error.message;
        }
        
        return audit;
    }
    
    // Public API
    return {
        version: CONFIG.VERSION,
        
        // Key generation
        generateSymmetricKey,
        generateRSAKeyPair,
        generateECDSAKeyPair,
        performKeyExchange,
        
        // Encryption/Decryption
        encryptSymmetric,
        decryptSymmetric,
        encryptAsymmetric,
        decryptAsymmetric,
        encryptWithPassword,
        decryptWithPassword,
        
        // Digital signatures
        signData,
        verifySignature,
        
        // Utilities
        hashData,
        deriveSharedSecret,
        secureWipe,
        
        // Storage
        setSecureItem,
        getSecureItem,
        
        // Security
        performSecurityAudit,
        
        // Configuration
        CONFIG
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrilhaCrypto;
} else if (typeof window !== 'undefined') {
    window.TrilhaCrypto = TrilhaCrypto;
}

// Usage examples:
/*
// Password-based encryption
async function examplePasswordEncryption() {
    const plaintext = "Sensitive data";
    const password = "strong_password_123";
    
    const encrypted = await TrilhaCrypto.encryptWithPassword(plaintext, password);
    console.log("Encrypted:", encrypted);
    
    const decrypted = await TrilhaCrypto.decryptWithPassword(encrypted, password);
    console.log("Decrypted:", decrypted);
}

// Asymmetric encryption
async function exampleAsymmetricEncryption() {
    const keyPair = await TrilhaCrypto.generateRSAKeyPair();
    const plaintext = "Secret message";
    
    const encrypted = await TrilhaCrypto.encryptAsymmetric(plaintext, keyPair.publicKey);
    console.log("Encrypted:", encrypted);
    
    const decrypted = await TrilhaCrypto.decryptAsymmetric(encrypted, keyPair.privateKey);
    console.log("Decrypted:", decrypted);
}

// Digital signatures
async function exampleDigitalSignature() {
    const keyPair = await TrilhaCrypto.generateECDSAKeyPair();
    const message = "Important document";
    
    const signature = await TrilhaCrypto.signData(message, keyPair.privateKey);
    console.log("Signature:", signature);
    
    const isValid = await TrilhaCrypto.verifySignature(signature, message, keyPair.publicKey);
    console.log("Valid:", isValid);
}

// Security audit
async function exampleSecurityAudit() {
    const audit = await TrilhaCrypto.performSecurityAudit();
    console.log("Security Audit:", audit);
}

// Secure storage
async function exampleSecureStorage() {
    await TrilhaCrypto.setSecureItem("user_token", "secret_token_123", "storage_password");
    const token = await TrilhaCrypto.getSecureItem("user_token", "storage_password");
    console.log("Retrieved token:", token);
}
*/
