import crypto from 'crypto';
import { normalizeForDedupe } from './sanitize.js';

function tokenHash(token) {
  const hex = crypto.createHash('sha1').update(token).digest('hex').slice(0, 16);
  return BigInt('0x' + hex);
}

function simhash(text) {
  const tokens = text.split(/\s+/);
  const weights = Array(64).fill(0);
  tokens.forEach((t) => {
    const h = tokenHash(t);
    for (let i = 0; i < 64; i++) {
      const bit = (h >> BigInt(i)) & 1n;
      weights[i] += bit === 1n ? 1 : -1;
    }
  });
  let out = 0n;
  for (let i = 0; i < 64; i++) {
    if (weights[i] > 0) out |= 1n << BigInt(i);
  }
  return out;
}

function hamming(a, b) {
  let x = a ^ b;
  let n = 0;
  while (x) {
    n++;
    x &= x - 1n;
  }
  return n;
}

export function dedupeItems(items) {
  const seen = new Set();
  const hashes = [];
  const out = [];
  for (const item of items) {
    const norm = item._norm || normalizeForDedupe(item.text);
    const sh = simhash(norm);
    let duplicate = false;
    if (seen.has(norm)) duplicate = true;
    else {
      for (const h of hashes) {
        if (hamming(h, sh) <= 3) {
          duplicate = true;
          break;
        }
      }
    }
    if (!duplicate) {
      seen.add(norm);
      hashes.push(sh);
      out.push(item);
    }
  }
  return out;
}
