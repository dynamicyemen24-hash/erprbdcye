const ENCRYPTION_KEY_NAME = 'nexora-secure-key';

async function getOrCreateKey(): Promise<CryptoKey> {
  const storedKey = sessionStorage.getItem(ENCRYPTION_KEY_NAME);
  if (storedKey) {
    const keyData = JSON.parse(storedKey);
    return await crypto.subtle.importKey('jwk', keyData, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  }
  const newKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const exported = await crypto.subtle.exportKey('jwk', newKey);
  sessionStorage.setItem(ENCRYPTION_KEY_NAME, JSON.stringify(exported));
  return newKey;
}

async function encrypt(data: string): Promise<string> {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(data);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decrypt(ciphertext: string): Promise<string> {
  const key = await getOrCreateKey();
  const combined = new Uint8Array(atob(ciphertext).split('').map(c => c.charCodeAt(0)));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return new TextDecoder().decode(decrypted);
}

export const SecureStorage = {
  setItem: async (key: string, value: any): Promise<void> => {
    try {
      const jsonValue = JSON.stringify(value);
      const encrypted = await encrypt(jsonValue);
      localStorage.setItem(`nx_enc_${key}`, encrypted);
    } catch (error) {
      console.error('SecureStorage: encryption failed', error);
    }
  },

  getItem: async <T>(key: string): Promise<T | null> => {
    try {
      const ciphertext = localStorage.getItem(`nx_enc_${key}`);
      if (!ciphertext) return null;
      const jsonValue = await decrypt(ciphertext);
      return JSON.parse(jsonValue) as T;
    } catch (error) {
      console.error('SecureStorage: decryption failed', error);
      return null;
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(`nx_enc_${key}`);
    } catch (error) {
      console.error('SecureStorage: remove failed', error);
    }
  },

  clear: (): void => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('nx_enc_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('SecureStorage: clear failed', error);
    }
  }
};
