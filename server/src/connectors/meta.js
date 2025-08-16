import { config } from '../config.js';

export async function fetchMetaComments() {
  if (!config.metaToken) {
    return { items: [], disabled: true, reason: 'Meta Content Library required (restricted access)' };
  }
  return { items: [], disabled: true, reason: 'Meta Content Library API not yet implemented' };
}
