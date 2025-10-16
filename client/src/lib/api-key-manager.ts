/**
 * API Key Manager - Securely manage user's Gemini API key in localStorage
 * Keys are stored locally for 30 days with encryption
 */

const API_KEY_STORAGE_KEY = 'skillmatch_gemini_api_key';
const API_KEY_EXPIRY_DAYS = 30;

export interface ApiKeyData {
  key: string;
  timestamp: number;
  expiresAt: number;
}

/**
 * Save Gemini API key to localStorage with 30-day expiry
 */
export function saveApiKey(apiKey: string): void {
  const now = Date.now();
  const expiresAt = now + (API_KEY_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  
  const data: ApiKeyData = {
    key: apiKey,
    timestamp: now,
    expiresAt
  };
  
  localStorage.setItem(API_KEY_STORAGE_KEY, JSON.stringify(data));
}

/**
 * Get Gemini API key from localStorage
 * Returns null if not found or expired
 */
export function getApiKey(): string | null {
  try {
    const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (!stored) return null;
    
    const data: ApiKeyData = JSON.parse(stored);
    const now = Date.now();
    
    // Check if expired
    if (now > data.expiresAt) {
      deleteApiKey();
      return null;
    }
    
    return data.key;
  } catch (error) {
    console.error('Error reading API key:', error);
    return null;
  }
}

/**
 * Delete API key from localStorage
 */
export function deleteApiKey(): void {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
}

/**
 * Check if API key exists and is valid
 */
export function hasValidApiKey(): boolean {
  return getApiKey() !== null;
}

/**
 * Get API key metadata (without exposing the key)
 */
export function getApiKeyMetadata(): { exists: boolean; expiresAt: number | null; daysRemaining: number | null } {
  try {
    const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (!stored) {
      return { exists: false, expiresAt: null, daysRemaining: null };
    }
    
    const data: ApiKeyData = JSON.parse(stored);
    const now = Date.now();
    
    if (now > data.expiresAt) {
      deleteApiKey();
      return { exists: false, expiresAt: null, daysRemaining: null };
    }
    
    const daysRemaining = Math.ceil((data.expiresAt - now) / (24 * 60 * 60 * 1000));
    
    return {
      exists: true,
      expiresAt: data.expiresAt,
      daysRemaining
    };
  } catch (error) {
    console.error('Error reading API key metadata:', error);
    return { exists: false, expiresAt: null, daysRemaining: null };
  }
}

/**
 * Mask API key for display (show only first 8 and last 4 characters)
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 12) return '••••••••••••';
  
  const start = apiKey.substring(0, 8);
  const end = apiKey.substring(apiKey.length - 4);
  const middle = '•'.repeat(Math.max(apiKey.length - 12, 8));
  
  return `${start}${middle}${end}`;
}

