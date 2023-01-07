import logger from './logger';
import fetch from 'node-fetch';
import { sendGetRequestGeocodingQuery, sendGetRequestGeocodingZipCode } from './misc';
import { WeatherResponse } from '../types/weather';

const OPEN_WEATHER_KEY = process.env.OPEN_WEATHER_KEY;

class Weather {
  readonly key: string;

  constructor() {
    if (process.env.OPEN_WEATHER_KEY) {
      this.key = process.env.OPEN_WEATHER_KEY;
    } else {
      throw new Error(`Missing OPEN_WEATHER_KEY in .env`);
    }
  }

  async sendGetRequestWeather(location: string): Promise<WeatherResponse | null> {
    let name;
    let lat;
    let long;
    // Check if zip code (only US)
    if (!isNaN(parseInt(location))) {
      const zip = parseInt(location);
      let response = await sendGetRequestGeocodingZipCode(zip);
      if (!response) {
        return null;
      }
      name = response.name;
      lat = response.lat;
      long = response.lon;
    } else {
      let response = await sendGetRequestGeocodingQuery(location);
      if (!response || response.length === 0) {
        return null;
      }
      name = response[0].name;
      lat = response[0].lat;
      long = response[0].lon;
    }
    logger.info(`[Weather] Getting Weather Information from ${lat}, ${long}`);
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${long}&exclude=minutely&units=imperial&lang=en&appid=${OPEN_WEATHER_KEY}`;
    let response = await fetch(url, { method: 'GET' });
    logger.info(`[Weather] Getting Weather Information Status: ${response.status}`);
    if (!response.ok) {
      logger.warn('[Weather] Failed to get weather');
      return null;
    }
    const body = (await response.json()) as WeatherResponse;
    body.name = name;
    return body;
  }
}

export default new Weather();
