import { EmbedBuilder } from 'discord.js';
import { NodeHtmlMarkdown } from 'node-html-markdown';
import { WeatherResponse } from '../types/weather.js';
import { fahrenheitToBoth, unixTo12Hour, unixToDateAnd12Hour, unixToDay, capitalize } from './misc.js';

const ANILIST_LOGO = 'https://anilist.co/img/icons/android-chrome-512x512.png';

const SHOW_STATUS_COLOR_MAP = {
  FINISHED: '#2b00ff',
  RELEASING: '#22fc00',
  NOT_YET_RELEASED: '#ff1100',
  CANCELLED: '#000000',
  HIATUS: '#000000'
};

export function buildBasicEmbed(string: string) {
  const embed = new EmbedBuilder();
  embed.setDescription(string);
  return embed;
}

export function buildWeather(weather: WeatherResponse) {
  const location = weather.name;
  const timezone = weather.timezone;
  const current = weather.current;
  const forecast = weather.daily;
  const alerts = weather.alerts;
  const embed = new EmbedBuilder();
  embed.setColor('#0099ff');
  embed.setThumbnail(`http://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`);
  embed.setTitle(
    `${location}, ${unixToDateAnd12Hour(current.dt, timezone)}\n${capitalize(current.weather[0].description)}`
  );
  embed.setDescription(
    `**Current Temperature:** ${fahrenheitToBoth(current.temp)}\n**Feels Like:** ${fahrenheitToBoth(
      current.feels_like
    )}\n**Min:** ${fahrenheitToBoth(forecast[0].temp.min)}\n**Max:** ${fahrenheitToBoth(
      forecast[0].temp.max
    )}\n**Humidity:** ${current.humidity}%\n**Wind:** ${current.wind_speed} mph\n**Sunrise:** ${unixTo12Hour(
      current.sunrise,
      timezone
    )}\n**Sunset:** ${unixTo12Hour(current.sunset, timezone)}\n**UV Index:** ${current.uvi}`
  );
  for (let i = 1; i < 7; i++) {
    const min = `**Min:** ${fahrenheitToBoth(forecast[i].temp.min)}\n`;
    const max = `**Max** ${fahrenheitToBoth(forecast[i].temp.max)}\n`;
    const precipitation = `**Precipitation:** ${(forecast[i].pop * 100).toFixed(0)}%\n`;
    const gustTemp = forecast[i].wind_gust;
    const gust = gustTemp !== undefined ? `**Wind Gust: ** ${gustTemp.toFixed(1)} mph` : '';
    embed.addFields({
      name: unixToDay(forecast[i].dt, timezone),
      value: min + max + precipitation + gust,
      inline: true
    });
  }
  if (alerts) {
    const alertArray = [];
    for (let i = 0; i < alerts.length; i++) {
      alertArray.push(
        `**- [${unixToDateAnd12Hour(alerts[i].start, timezone)} - ${unixToDateAnd12Hour(alerts[i].end, timezone)}] ${
          alerts[i].event
        }**`
      );
    }
    embed.addFields({ name: 'Alerts', value: alertArray.join('\n'), inline: false });
  }
  return embed;
}
