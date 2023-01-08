import * as cron from 'cron';
import logger from '../utils/logger';
import Weather from '../utils/weather';
import { TextChannel } from 'discord.js';
import { DiscordClient } from '../types/discord.js';
import { buildBasicEmbed, buildWeather } from '../utils/embeds';

const DISCORD_DEFAULT_CHANNEL = process.env.DISCORD_DEFAULT_CHANNEL!;

// * * * * * * = seconds minutes hours day month dow

const CronJob = cron.CronJob;

export default function cronJobs(client: DiscordClient) {
  let job = new CronJob(
    '0 0 8 * * *',
    function () {
      dailyWeather(client);
    },
    null,
    true,
    'America/Los_Angeles'
  );
}

async function dailyWeather(client: DiscordClient) {
  logger.info('[Cron] Daily Weather');
  const channel = (await client.channels.fetch(DISCORD_DEFAULT_CHANNEL)) as TextChannel | null;
  if (!channel) {
    logger.error(`[Cron] Failed to fetch daily weather channel`);
    return;
  }
  const response = await Weather.sendGetRequestWeather('Fremont');
  if (response) {
    const embed = buildWeather(response);
    channel.send({ embeds: [embed] });
  } else {
    const embed = buildBasicEmbed(`Could not find "Fremont"`);
    channel.send({ embeds: [embed] });
  }
}
