import Keyv from 'keyv';
import path from 'node:path';
import logger from '../logger';
import { KeyvFile } from 'keyv-file';

const db = new Keyv({
  store: new KeyvFile({
    filename: path.join(__dirname, '..', '..', '..', 'databases', 'anime.json')
  })
});

export async function set(key: string, value: string | number | Object): Promise<void> {
  logger.info(`[Anime DB] Setting key '${key}' with value '${value}'`);
  await db.set(key, value);
  logger.info(`[Anime DB] Set key, value`);
}

export async function get(key: string): Promise<string | number | Object | null> {
  try {
    logger.info(`[Anime DB] Getting value with key ${key}`);
    const value = await db.get(key);
    logger.info(`[Anime DB] Got value`);
    return value;
  } catch (error) {
    logger.error(`[Anime DB] Error getting value with key ${key}`);
    return null;
  }
}
