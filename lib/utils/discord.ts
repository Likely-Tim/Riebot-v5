import logger from './logger';
import fetch from 'node-fetch';
import { RESTGetAPICurrentUserResult } from 'discord.js';

export async function getUser(accessToken: string): Promise<RESTGetAPICurrentUserResult | null> {
  logger.info(`[Discord] Getting User`);
  const url = 'https://discord.com/api/v10/users/@me';
  let response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  if (response.ok) {
    logger.info(`[Discord] Got User`);
    const user = (await response.json()) as RESTGetAPICurrentUserResult;
    return user;
  } else {
    logger.error(`[Discord] Getting user failed with status ${response.status}`);
    return null;
  }
}
