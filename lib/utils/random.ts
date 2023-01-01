import { randomBytes } from 'node:crypto';

export function randomStringGenerator(length: number): string {
  return randomBytes(length / 2).toString('hex');
}
