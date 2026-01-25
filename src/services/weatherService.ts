// src/services/weatherService.ts
import { WeatherData, WeatherAlert, AlertType, AlertSeverity, MangoRecommendations, WeatherException } from '../types/weather.types';

export class WeatherService {
  private cache: Map<string, { data: WeatherData; timestamp: Date }> = new Map();
  private readonly cacheDuration = 10 * 60 * 1000; // 10 minutes in milliseconds
  private readonly timeoutDuration = 10000; // 10 seconds

  async getCurrentWeather(location: string): Promise<WeatherData> {
    const cacheKey = `current_${location}`;
    const now = new Date();
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      const timeDiff = now.getTime() - cached.timestamp.getTime();
      
      if (timeDiff < this.cacheDuration) {
        console.log(`✅ Using cached weather data for ${location}`);
        return cached.data;
      }
    }

    try {
      console.log(`🌤️ Fetching weather for: ${location}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutDuration);

      const apiKey = import.meta.env.VITE_WEATHER_API_KEY || '';
      const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(location)}`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MangoChaseApp/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(`📡 Weather API response: ${response.status}`);

      if (response.status === 200) {
        const data = await response.json();
        const weatherData = this.normalizeWeatherData(data);
        
        // Cache the result
        this.cache.set(cacheKey, {
          data: weatherData,
          timestamp: now,
        });
        
        console.log(`✅ Weather data loaded successfully for ${weatherData.location.name}`);
        return weatherData;
      
      } else if (response.status === 400) {
        throw new WeatherException(`Invalid location: ${location}`);
      } else if (response.status === 401) {
        throw new WeatherException('Invalid API key');
      } else if (response.status === 403) {
        throw new WeatherException('API access forbidden');
      } else if (response.status === 429) {
        throw new WeatherException('API rate limit exceeded. Please try again later.');
      } else {
        throw new WeatherException(`API error: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.error('❌ Request timeout');
        throw new WeatherException('Network error: Please check your internet connection');
      } else if (error instanceof WeatherException) {
        throw error;
      } else {
        console.error('❌ Unexpected error:', error);
        throw new WeatherException(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  async getWeatherForecast(location: string, days: number): Promise<WeatherData> {
    // Validate days parameter
    if (days < 1 || days > 10) {
      throw new WeatherException('Forecast days must be between 1 and 10');
    }

    const cacheKey = `forecast_${location}_${days}`;
    const now = new Date();
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      const timeDiff = now.getTime() - cached.timestamp.getTime();
      if (timeDiff < this.cacheDuration) {
        return cached.data;
      }
    }

    try {
      const apiKey = import.meta.env.VITE_WEATHER_API_KEY || '';
      const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(location)}&days=${days}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutDuration);

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MangoChaseApp/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 200) {
        const data = await response.json();
        const weatherData = this.normalizeWeatherData(data);
        
        // Cache the result
        this.cache.set(cacheKey, {
          data: weatherData,
          timestamp: now,
        });
        
        return weatherData;
      } else {
        throw new WeatherException(`Forecast API error: ${response.status}`);
      }
    } catch (error) {
      throw new WeatherException(`Forecast error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getWeatherAlerts(weather: WeatherData): Promise<WeatherAlert[]> {
    const alerts: WeatherAlert[] = [];
    const current = weather.current;

    // Temperature alerts with mango-specific thresholds
    if (current.temp_c > 35.0) {
      alerts.push({
        type: AlertType.HOT,
        message: `🌡️ High temperature (${current.temp_c.toFixed(1)}°C)! Increase irrigation and provide shade for young trees.`,
        severity: current.temp_c > 38.0 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
        icon: '🌡️',
        action: 'Increase irrigation frequency',
      });
    }

    if (current.temp_c < 15.0) {
      alerts.push({
        type: AlertType.COLD,
        message: `🥶 Low temperature (${current.temp_c.toFixed(1)}°C) may delay flowering and affect fruit setting.`,
        severity: current.temp_c < 10.0 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
        icon: '🥶',
        action: 'Protect young trees with covers',
      });
    }

    // Rain alerts with accumulation consideration
    if (current.precip_mm > 0) {
      const isRaining = current.precip_mm > 0.5;
      if (isRaining) {
        const rainMessage = current.precip_mm > 5.0 
          ? `Heavy rain (${current.precip_mm}mm). Skip irrigation today.`
          : 'Light rain detected. Reduce irrigation.';
        
        alerts.push({
          type: AlertType.RAIN,
          message: `🌧️ ${rainMessage}`,
          severity: current.precip_mm > 10.0 ? AlertSeverity.WARNING : AlertSeverity.INFO,
          icon: '🌧️',
          action: 'Adjust irrigation schedule',
        });
      }
    }

    // Humidity alerts for disease prevention
    if (current.humidity > 80) {
      alerts.push({
        type: AlertType.HUMIDITY,
        message: `💧 High humidity (${current.humidity}%) increases risk of fungal diseases like anthracnose and powdery mildew.`,
        severity: current.humidity > 90 ? AlertSeverity.WARNING : AlertSeverity.INFO,
        icon: '💧',
        action: 'Monitor for disease symptoms',
      });
    }

    // Wind alerts for physical damage
    if (current.wind_kph > 20.0) {
      alerts.push({
        type: AlertType.WIND,
        message: `💨 Strong winds (${current.wind_kph.toFixed(1)} km/h) may damage flowers and cause fruit drop.`,
        severity: current.wind_kph > 40.0 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
        icon: '💨',
        action: 'Secure young trees and check for damage',
      });
    }

    // UV index alerts for sun protection
    if (current.uv > 8.0) {
      alerts.push({
        type: AlertType.UV,
        message: `☀️ High UV index (${current.uv.toFixed(1)}) may cause sunburn on fruits and young leaves.`,
        severity: AlertSeverity.INFO,
        icon: '☀️',
        action: 'Consider shade nets for sensitive varieties',
      });
    }

    // Ideal conditions notification
    if (alerts.length === 0 && 
        current.temp_c >= 20.0 && 
        current.temp_c <= 32.0 && 
        current.humidity >= 60 && 
        current.humidity <= 80) {
      alerts.push({
        type: AlertType.IDEAL,
        message: '✅ Ideal mango growing conditions! Perfect temperature and humidity for growth.',
        severity: AlertSeverity.INFO,
        icon: '✅',
        action: 'Maintain current practices',
      });
    }

    console.log(`🔔 Generated ${alerts.length} weather alerts for mango farming`);
    return alerts;
  }

  getMangoFarmingRecommendations(weather: WeatherData): MangoRecommendations {
    const current = weather.current;
    const irrigationAdvice: string[] = [];
    const pestDiseaseAdvice: string[] = [];
    const generalAdvice: string[] = [];

    // Irrigation recommendations
    if (current.temp_c > 32.0 || current.wind_kph > 25.0) {
      irrigationAdvice.push('• Increase irrigation frequency due to high evaporation');
    } else if (current.precip_mm > 5.0) {
      irrigationAdvice.push('• Skip irrigation today - sufficient rainfall');
    } else if (current.temp_c < 18.0) {
      irrigationAdvice.push('• Reduce irrigation - low evaporation rate');
    } else {
      irrigationAdvice.push('• Maintain regular irrigation schedule');
    }

    // Pest and disease recommendations
    if (current.humidity > 85) {
      pestDiseaseAdvice.push('• High humidity - monitor for anthracnose and powdery mildew');
      pestDiseaseAdvice.push('• Consider preventive fungicide application');
    }
    
    if (current.temp_c > 30.0 && current.humidity > 70) {
      pestDiseaseAdvice.push('• Warm and humid - ideal conditions for fruit flies');
    }

    // General farming advice
    if (current.temp_c >= 24.0 && current.temp_c <= 30.0) {
      generalAdvice.push('• Ideal temperature for mango growth and development');
    }
    
    if (weather.forecast && weather.forecast.forecastday.length > 0) {
      const tomorrow = weather.forecast.forecastday[0].day;
      if (tomorrow.maxtemp_c > 35.0) {
        generalAdvice.push('• Prepare for hot weather tomorrow');
      }
    }

    return {
      irrigation: irrigationAdvice.join('\n'),
      pest_disease: pestDiseaseAdvice.join('\n'),
      general: generalAdvice.join('\n'),
      last_updated: new Date(),
    };
  }

  clearCache(): void {
    this.cache.clear();
    console.log('🧹 Weather cache cleared');
  }

  getCacheInfo(): { cached_items: number; cache_keys: string[] } {
    return {
      cached_items: this.cache.size,
      cache_keys: Array.from(this.cache.keys()),
    };
  }

  private normalizeWeatherData(data: any): WeatherData {
    // Add computed properties to match Dart version
    return {
      ...data,
      current: {
        ...data.current,
        isRaining: data.current.precip_mm > 0.5,
      },
    };
  }

  // TypeScript doesn't need dispose() since we don't manage HTTP client
}

// Export singleton instance
export const weatherService = new WeatherService();