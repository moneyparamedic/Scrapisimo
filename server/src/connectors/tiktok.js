import { config } from '../config.js';

export async function fetchTikTokComments() {
  if (!config.tiktokKey) {
    return { items: [], disabled: true, reason: 'TikTok Research API required (gated)' };
  }
  return { items: [], disabled: true, reason: 'TikTok Research API not yet implemented' };
}
