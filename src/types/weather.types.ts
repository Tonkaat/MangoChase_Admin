// src/types/weather.types.ts

export interface WeatherLocation {
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  tz_id: string;
  localtime_epoch: number;
  localtime: string;
}

export interface WeatherCondition {
  text: string;
  icon: string;
  code: number;
}

export interface CurrentWeather {
  temp_c: number;
  temp_f: number;
  is_day: number;
  condition: WeatherCondition;
  wind_kph: number;
  wind_degree: number;
  wind_dir: string;
  pressure_mb: number;
  pressure_in: number;
  precip_mm: number;
  precip_in: number;
  humidity: number;
  cloud: number;
  feelslike_c: number;
  feelslike_f: number;
  windchill_c: number;
  windchill_f: number;
  heatindex_c: number;
  heatindex_f: number;
  dewpoint_c: number;
  dewpoint_f: number;
  vis_km: number;
  vis_miles: number;
  uv: number;
  gust_kph: number;
  gust_mph: number;
  last_updated_epoch: number;
  last_updated: string;
  isRaining: boolean; // Added
}

export interface ForecastDay {
  date: string;
  date_epoch: number;
  day: {
    maxtemp_c: number;
    maxtemp_f: number;
    mintemp_c: number;
    mintemp_f: number;
    avgtemp_c: number;
    avgtemp_f: number;
    maxwind_kph: number;
    maxwind_mph: number;
    totalprecip_mm: number;
    totalprecip_in: number;
    totalsnow_cm: number;
    avgvis_km: number;
    avgvis_miles: number;
    avghumidity: number;
    daily_will_it_rain: number;
    daily_chance_of_rain: number;
    daily_will_it_snow: number;
    daily_chance_of_snow: number;
    condition: WeatherCondition;
    uv: number;
  };
}

export interface Forecast {
  forecastday: ForecastDay[];
}

export interface WeatherData {
  location: WeatherLocation;
  current: CurrentWeather;
  forecast?: Forecast;
}

export enum AlertType {
  HOT = 'hot',
  COLD = 'cold',
  RAIN = 'rain',
  HUMIDITY = 'humidity',
  WIND = 'wind',
  UV = 'uv',
  IDEAL = 'ideal'
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

export interface WeatherAlert {
  type: AlertType;
  message: string;
  severity: AlertSeverity;
  icon: string;
  action: string;
}

export interface MangoRecommendations {
  irrigation: string;
  pest_disease: string;
  general: string;
  last_updated: Date;
}

export class WeatherException extends Error {
  timestamp: Date;

  constructor(message: string) {
    super(message);
    this.name = 'WeatherException';
    this.timestamp = new Date();
  }

  toString(): string {
    return `WeatherException: ${this.message} (at ${this.timestamp.toISOString()})`;
  }
}