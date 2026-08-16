// Simple base64 encoding for demo purposes. 
// In a real enterprise app, use Web Crypto API or AES encryption.
export const SecureStorage = {
  setItem: (key: string, value: any): void => {
    try {
      const jsonValue = JSON.stringify(value);
      // Basic obfuscation
      const encodedValue = btoa(encodeURIComponent(jsonValue));
      localStorage.setItem(`nx_enc_${key}`, encodedValue);
    } catch (error) {
      console.error('Error encrypting and saving to local storage', error);
    }
  },

  getItem: <T>(key: string): T | null => {
    try {
      const encodedValue = localStorage.getItem(`nx_enc_${key}`);
      if (!encodedValue) return null;
      
      const jsonValue = decodeURIComponent(atob(encodedValue));
      return JSON.parse(jsonValue) as T;
    } catch (error) {
      console.error('Error decrypting from local storage', error);
      return null;
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(`nx_enc_${key}`);
    } catch (error) {
      console.error('Error removing from local storage', error);
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
      console.error('Error clearing secure local storage', error);
    }
  }
};
