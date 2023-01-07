export interface LocalName {
  [key: string]: string;
}

export interface QueryGeocodingItem {
  name: string;
  local_names?: LocalName;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

export interface QueryGeocodingResponse extends Array<QueryGeocodingItem> {}

export interface ZipCodeGeocodingResponse {
  zip: string;
  name: string;
  lat: number;
  lon: number;
  country: string;
}

export interface WeatherResponse {
  // Name Added On Later
  name: string;
  lat: number;
  lon: number;
  timezone: string;
  timezone_offset: number;
  current: CurrentWeather;
  hourly: HourlyWeather[];
  daily: DailyWeather[];
  alerts: AlertItem[];
}

export interface CurrentWeather {
  dt: number;
  sunrise: number;
  sunset: number;
  temp: number;
  feels_like: number;
  pressure: number;
  humidity: number;
  dew_point: number;
  clouds: number;
  uvi: number;
  visibility: number;
  wind_speed: number;
  wind_gust?: number;
  wind_deg: number;
  rain?: {
    '1h': number;
  };
  snow?: {
    '1h': number;
  };
  weather: WeatherItem[];
}

export interface WeatherItem {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface HourlyWeather {
  dt: number;
  temp: number;
  feels_like: number;
  pressure: number;
  humidity: number;
  dew_point: number;
  clouds: number;
  uvi: number;
  visibility: number;
  wind_speed: number;
  wind_gust?: number;
  wind_deg: number;
  pop: number;
  rain?: {
    '1h': number;
  };
  snow?: {
    '1h': number;
  };
  weather: WeatherItem[];
}

export interface DailyWeather {
  dt: number;
  sunrise: number;
  sunset: number;
  moonrise: number;
  moonset: number;
  moon_phase: number;
  temp: DailyTemp;
  feels_like: DailyFeelsLike;
  pressure: number;
  humidity: number;
  dew_point: number;
  wind_speed: number;
  wind_gust?: number;
  wind_deg: number;
  weather: WeatherItem[];
  clouds: number;
  uvi: number;
  pop: number;
  rain?: number;
  snow?: number;
}

export interface DailyTemp {
  morn: number;
  day: number;
  eve: number;
  night: number;
  min: number;
  max: number;
}

export interface DailyFeelsLike {
  day: number;
  night: number;
  eve: number;
  morn: number;
}

export interface AlertItem {
  sender_name: string;
  event: string;
  start: number;
  end: number;
  description: string;
  tags: string[];
}
