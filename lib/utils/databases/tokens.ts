import Keyv from 'keyv';
import { KeyvFile } from 'keyv-file';
import path from 'path';
import logger from '../logger';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';

const CRYPTO_PASSWORD = process.env.CRYPTO_PASSWORD!;
const CIPHER_ALGORITHM = 'aes-256-cbc';
const HASH_ALGORITHM = 'sha256';

const db = new Keyv({
  store: new KeyvFile({
    filename: path.join(__dirname, '..', '..', '..', 'databases', 'tokens.json')
  })
});

export async function set(key: string, value: string, ttl?: number): Promise<void> {
  const hashedKey = createHash(HASH_ALGORITHM).update(key).digest('hex');
  logger.info(`[Token DB] Setting key ${hashedKey}`);
  const iv = randomBytes(16);
  const cipher = createCipheriv(CIPHER_ALGORITHM, Buffer.from(CRYPTO_PASSWORD, 'hex'), iv);
  const encrypted = cipher.update(value);
  const finalBuffer = Buffer.concat([encrypted, cipher.final()]);
  const encryptedHex = iv.toString('hex') + ':' + finalBuffer.toString('hex');
  if (ttl) {
    await db.set(hashedKey, encryptedHex, ttl);
  } else {
    await db.set(hashedKey, encryptedHex);
  }
  logger.info(`[Token DB] Set key`);
}

export async function get(key: string): Promise<string | null> {
  try {
    const hashedKey = createHash(HASH_ALGORITHM).update(key).digest('hex');
    logger.info(`[Token DB] Getting value for key ${hashedKey}`);
    const encryptedHex = await db.get(hashedKey);
    const encryptedArray = encryptedHex.split(':');
    const iv = Buffer.from(encryptedArray[0], 'hex');
    const encrypted = Buffer.from(encryptedArray[1], 'hex');
    const decipher = createDecipheriv(CIPHER_ALGORITHM, Buffer.from(CRYPTO_PASSWORD, 'hex'), iv);
    const decrypted = decipher.update(encrypted);
    const value = Buffer.concat([decrypted, decipher.final()]).toString();
    logger.info(`[Token DB] Got value for key ${hashedKey}`);
    return value;
  } catch (error) {
    logger.error(`[Token DB] Failed getting value for key`);
    return null;
  }
}

export async function check(key: string): Promise<boolean> {
  const hashedKey = createHash(HASH_ALGORITHM).update(key).digest('hex');
  logger.info(`[Token DB] Checking if key ${hashedKey} exists`);
  return await db.has(hashedKey);
}
