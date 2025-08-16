import { config } from '../config.js';

export async function fetchXComments() {
  if (!config.xToken) {
    return { items: [], disabled: true, reason: 'Not configured' };
  }
  return { items: [], disabled: true, reason: 'Implement after upgrading X API tier.' };
}
