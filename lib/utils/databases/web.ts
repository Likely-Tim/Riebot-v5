import path from 'node:path';
import { Level } from 'level';
import logger from '../logger';

const db = new Level(path.join(__dirname, '..', '..', '..', 'databases', 'web'));
const animeShowUsers = db.sublevel('animeShowUsers');

export async function set(key: string, value: string): Promise<void> {
  logger.info(`[DB] Setting key '${key}' with value '${value}'`);
  await db.put(key, value);
  logger.info(`[DB] Set key, value`);
}

export async function get(key: string): Promise<string | null> {
  try {
    logger.info(`[DB] Getting value with key ${key}`);
    const value = await db.get(key);
    logger.info(`[DB] Got value`);
    return value;
  } catch (error) {
    logger.error(`[DB] Error getting value with key ${key}`);
    return null;
  }
}

export async function setAnimeShowUser(key: string, value: string): Promise<void> {
  logger.info(`[DB] Setting key '${key}' with value '${value}'`);
  await animeShowUsers.put(key, value);
  logger.info(`[DB] Set key, value`);
}

export async function getAllAnimeShowUser(): Promise<[[string, string]] | null> {
  try {
    return await animeShowUsers.iterator().all();
  } catch (error) {
    logger.error(`[DB] Error getting anime show users`);
    return null;
  }
}
