import path from 'node:path';
import { Level } from 'level';
import logger from '../logger';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const db = new Level(path.join(__dirname, '..', '..', '..', 'databases', 'tokens'));

const CRYPTO_PASSWORD = process.env.CRYPTO_PASSWORD!;
const ALGORITHM = 'aes-256-cbc';

export async function set(key: string, value: string): Promise<void> {
  logger.info(`[DB] Setting key ${key}`);
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, Buffer.from(CRYPTO_PASSWORD, 'hex'), iv);
  const encrypted = cipher.update(value);
  const finalBuffer = Buffer.concat([encrypted, cipher.final()]);
  const encryptedHex = iv.toString('hex') + ':' + finalBuffer.toString('hex');
  await db.put(key, encryptedHex);
  logger.info(`[DB] Set key`);
}

export async function get(key: string): Promise<string | null> {
  try {
    logger.info(`[DB] Getting value for key ${key}`);
    const encryptedHex = await db.get(key);
    const encryptedArray = encryptedHex.split(':');
    const iv = Buffer.from(encryptedArray[0], 'hex');
    const encrypted = Buffer.from(encryptedArray[1], 'hex');
    const decipher = createDecipheriv(ALGORITHM, Buffer.from(CRYPTO_PASSWORD, 'hex'), iv);
    const decrypted = decipher.update(encrypted);
    const value = Buffer.concat([decrypted, decipher.final()]).toString();
    logger.info(`[DB] Got value for key ${key}`);
    return value;
  } catch (error) {
    logger.error(`[DB] Failed getting value for key ${key}`);
    return null;
  }
}
