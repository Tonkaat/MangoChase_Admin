// src/services/configService.ts

// Constants matching your Flutter version
const STORAGE_KEYS = {
  API_KEY: 'mangochase_ai_api_key',
  SERVICE_PROVIDER: 'mangochase_ai_service_provider',
} as const;

const SERVICE_PROVIDERS = {
  GEMINI: 'gemini',
  DEEPSEEK: 'deepseek',
} as const;

// Default values from environment
const DEFAULT_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const DEFAULT_SERVICE_PROVIDER = SERVICE_PROVIDERS.GEMINI;

export interface ApiKeyStatus {
  hasValidKey: boolean;
  isDefaultKey: boolean;
  serviceProvider: string;
  message: string;
}

export class ConfigService {
  /**
   * Save API key using localStorage (equivalent to SharedPreferences)
   */
  static async saveApiKey(apiKey: string, serviceProvider: string = SERVICE_PROVIDERS.GEMINI): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
      localStorage.setItem(STORAGE_KEYS.SERVICE_PROVIDER, serviceProvider);
      console.log(`${serviceProvider} API key saved successfully`);
    } catch (error) {
      console.error('Error saving API key:', error);
    }
  }

  /**
   * Get API key from localStorage
   * FIXED: Return stored key first, then default (same logic as Flutter)
   */
  static async getApiKey(): Promise<string> {
    try {
      const key = localStorage.getItem(STORAGE_KEYS.API_KEY);
      
      if (key && key.trim() !== '') {
        console.log('Retrieved API key: Using saved key');
        return key;
      }
      
      console.log('Retrieved API key: Using default key');
      return DEFAULT_API_KEY;
    } catch (error) {
      console.error('Error reading API key:', error);
      return DEFAULT_API_KEY;
    }
  }

  /**
   * Get current service provider from localStorage
   */
  static async getServiceProvider(): Promise<string> {
    try {
      return localStorage.getItem(STORAGE_KEYS.SERVICE_PROVIDER) || DEFAULT_SERVICE_PROVIDER;
    } catch (error) {
      return DEFAULT_SERVICE_PROVIDER;
    }
  }

  /**
   * Set service provider in localStorage
   */
  static async setServiceProvider(provider: string): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.SERVICE_PROVIDER, provider);
    } catch (error) {
      console.error('Error setting service provider:', error);
    }
  }

  /**
   * Delete API key from localStorage
   */
  static async deleteApiKey(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEYS.API_KEY);
      localStorage.removeItem(STORAGE_KEYS.SERVICE_PROVIDER);
      console.log('API key and service preference deleted');
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  }

  /**
   * Check if API key exists (and is not default)
   */
  static async hasApiKey(): Promise<boolean> {
    try {
      const key = localStorage.getItem(STORAGE_KEYS.API_KEY);
      return key !== null && key.trim() !== '' && key !== DEFAULT_API_KEY;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if using default API key
   */
  static async isUsingDefaultKey(): Promise<boolean> {
    try {
      const key = await this.getApiKey();
      return !key || key === DEFAULT_API_KEY || key === 'YOUR_REAL_API_KEY_HERE';
    } catch (error) {
      return true;
    }
  }

  /**
   * Test method (same as Flutter)
   */
  static async testConfig(): Promise<void> {
    console.log('Testing Config Service...');
    
    const key = await this.getApiKey();
    const provider = await this.getServiceProvider();
    
    console.log('Service Provider:', provider);
    console.log('API Key Status:', key && key.trim() !== '' ? 'Available' : 'Not available');
    console.log('API Key Length:', key?.length || 0);
    
    if (await this.isUsingDefaultKey()) {
      console.log('⚠️  Using default API key - please replace with your actual Gemini API key');
      console.log('💡 Get your free key at: https://makersuite.google.com/app/apikey');
    } else {
      console.log('✅ Using custom API key for', provider);
    }
  }

  /**
   * Get API key validation status (same as Flutter)
   */
  static async getApiKeyStatus(): Promise<ApiKeyStatus> {
    const hasKey = await this.hasApiKey();
    const isDefault = await this.isUsingDefaultKey();
    const provider = await this.getServiceProvider();
    
    return {
      hasValidKey: hasKey,
      isDefaultKey: isDefault,
      serviceProvider: provider,
      message: isDefault 
        ? 'Please add your Gemini API key in settings'
        : `Using ${provider} API`,
    };
  }

  /**
   * Initialize (for compatibility)
   */
  static async initialize(): Promise<void> {
    await this.testConfig();
  }

  /**
   * Get available service providers
   */
  static getAvailableProviders(): Array<{id: string, name: string}> {
    return [
      { id: SERVICE_PROVIDERS.GEMINI, name: 'Google Gemini' },
      { id: SERVICE_PROVIDERS.DEEPSEEK, name: 'DeepSeek' },
    ];
  }

  /**
   * Clear all configuration (for logout)
   */
  static async clearAll(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEYS.API_KEY);
      localStorage.removeItem(STORAGE_KEYS.SERVICE_PROVIDER);
      console.log('All configuration cleared');
    } catch (error) {
      console.error('Error clearing configuration:', error);
    }
  }
}

// Export singleton instance
export const configService = ConfigService;