import logger from './logger';
import fetch from 'node-fetch';
import { QueryGeocodingResponse, ZipCodeGeocodingResponse } from '../types/weather';

const OPEN_WEATHER_KEY = process.env.OPEN_WEATHER_KEY;
const ZIP_CODE_BASE_KEY = process.env.ZIP_CODE_BASE_KEY;

export async function sendGetRequestGeocodingQuery(location: string) {
  logger.info(`[Geocoding] Getting Geocoding for ${location}`);
  const url = `http://api.openweathermap.org/geo/1.0/direct?q=${location}&appid=${OPEN_WEATHER_KEY}`;
  let response = await fetch(url, { method: 'GET' });
  logger.info(`[Geocoding] Weather Retrieval Status: ${response.status}`);
  if (!response.ok) {
    logger.warn(`[Geocoding] Unable to get geocoding query`);
    return null;
  }
  const body = (await response.json()) as QueryGeocodingResponse;
  return body;
}

export async function sendGetRequestGeocodingZipCode(zipCode: number) {
  logger.info(`[Geocoding] Getting Geocoding for ${zipCode}, US`);
  const url = `http://api.openweathermap.org/geo/1.0/zip?zip=${zipCode},US&appid=${OPEN_WEATHER_KEY}`;
  let response = await fetch(url, { method: 'GET' });
  logger.info(`[Geocoding] Weather Retrieval Status: ${response.status}`);
  if (!response.ok) {
    logger.warn(`[Geocoding] Unable to get zip code`);
    return null;
  }
  const body = (await response.json()) as ZipCodeGeocodingResponse;
  return body;
}

export function fahrenheitToBoth(fahrenheit: number) {
  const celsius = ((fahrenheit - 32) * 5) / 9;
  return fahrenheit.toFixed(1) + '°F / ' + celsius.toFixed(1) + '°C';
}

export function unixTo24Hour(unix: number, timezone: string) {
  let date = new Date(unix * 1000);
  return date.toLocaleTimeString('en-US', { timeZone: timezone, hour12: false, hour: '2-digit', minute: '2-digit' });
}

export function unixTo12Hour(unix: number, timezone: string) {
  let date = new Date(unix * 1000);
  return date.toLocaleTimeString('en-US', { timeZone: timezone, hour12: true, hour: '2-digit', minute: '2-digit' });
}

export function unixToDateAnd12Hour(unix: number, timezone: string) {
  let date = new Date(unix * 1000);
  return (
    date.toLocaleDateString('en-US', { timeZone: timezone, month: '2-digit', day: '2-digit' }) +
    ' ' +
    unixTo12Hour(unix, timezone)
  );
}

export function unixToDay(unix: number, timezone: string) {
  let date = new Date(unix * 1000);
  return date.toLocaleDateString('en-US', { timeZone: timezone, weekday: 'long' });
}

export function capitalize(text: string) {
  return text
    .toLowerCase()
    .split(' ')
    .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
    .join(' ');
}
