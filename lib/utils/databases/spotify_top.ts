import Keyv from 'keyv';
import { KeyvFile } from 'keyv-file';
import path from 'node:path';
import logger from '../logger';

const db = new Keyv({
  store: new KeyvFile({
    filename: path.join(__dirname, '..', '..', '..', 'databases', 'spotify_top.json')
  })
});

export async function set(key: string, value: string | number): Promise<void> {
  logger.info(`[Spotify Top DB] Setting key '${key}' with value '${value}'`);
  await db.set(key, value);
  logger.info(`[Spotify Top DB] Set key, value`);
}

export async function get(key: string): Promise<string> {
  try {
    logger.info(`[Spotify Top DB] Getting value with key ${key}`);
    const value = await db.get(key);
    logger.info(`[Spotify Top DB] Got value`);
    return value;
  } catch (error: any) {
    logger.error(`[Spotify Top DB] Error getting value with key ${key}`);
    throw new Error(error);
  }
}
