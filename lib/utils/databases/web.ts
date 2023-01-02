import Keyv from 'keyv';
import { KeyvFile } from 'keyv-file';
import path from 'node:path';
import logger from '../logger';

const db = new Keyv({
  store: new KeyvFile({
    filename: path.join(__dirname, '..', '..', '..', 'databases', 'web.json')
  }),
  namespace: 'default'
});

const animeShowUsers = new Keyv({
  store: new KeyvFile({
    filename: path.join(__dirname, '..', '..', '..', 'databases', 'web.json')
  }),
  namespace: 'users'
});

export async function set(key: string, value: string): Promise<void> {
  logger.info(`[Web DB] Setting key '${key}' with value '${value}'`);
  await db.set(key, value);
  logger.info(`[Web DB] Set key, value`);
}

export async function get(key: string): Promise<string | null> {
  try {
    logger.info(`[Web DB] Getting value with key ${key}`);
    const value = await db.get(key);
    logger.info(`[Web DB] Got value`);
    return value;
  } catch (error) {
    logger.error(`[Web DB] Error getting value with key ${key}`);
    return null;
  }
}

export async function setAnimeShowUser(key: string, value: string): Promise<void> {
  logger.info(`[Web DB] Setting key '${key}' with value '${value}'`);
  await animeShowUsers.set(key, value);
  if (await animeShowUsers.has('users')) {
    const users = JSON.parse(await animeShowUsers.get('users'));
    users.push(key);
    await animeShowUsers.set('users', JSON.stringify(users));
  } else {
    await animeShowUsers.set('users', JSON.stringify([key]));
  }
  logger.info(`[Web DB] Set key, value`);
}

export async function getAllAnimeShowUser(): Promise<[string, string][] | null> {
  try {
    logger.info(`[Web DB] Getting All Anime Show Users`);
    const usersArray: [string, string][] = [];
    if (await animeShowUsers.has('users')) {
      const users = JSON.parse(await animeShowUsers.get('users'));
      for (const user of users) {
        usersArray.push([user, await animeShowUsers.get(user)]);
      }
    }
    return usersArray;
  } catch (error) {
    console.log(error);
    logger.error(`[Web DB] Error getting anime show users`);
    return null;
  }
}
