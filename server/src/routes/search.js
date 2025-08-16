import { z } from 'zod';
import { fetchYouTubeComments } from '../connectors/youtube.js';
import { fetchXComments } from '../connectors/x.js';
import { fetchTikTokComments } from '../connectors/tiktok.js';
import { fetchMetaComments } from '../connectors/meta.js';
import { dedupeItems } from '../utils/dedupe.js';
import { detectLang } from '../utils/language.js';

const bodySchema = z.object({
  query: z.string().min(1),
  since: z.string().datetime(),
  until: z.string().datetime(),
  platforms: z.array(z.enum(['youtube', 'x', 'tiktok', 'meta'])).default(['youtube']),
  maxItemsPerPlatform: z.number().int().min(1).max(1000).default(500),
  language: z.string().optional(),
  dedupe: z.boolean().default(true)
});

export default async function searchRoute(req, res) {
  try {
    const params = bodySchema.parse(req.body);
    const { query, since, until, platforms, maxItemsPerPlatform, language, dedupe } = params;
    const sinceDate = new Date(since);
    const untilDate = new Date(until);

    const allItems = [];
    const disabledPlatforms = [];

    await Promise.all(platforms.map(async (p) => {
      if (p === 'youtube') {
        const items = await fetchYouTubeComments({ q: query, since: sinceDate, until: untilDate, maxItemsPerPlatform });
        allItems.push(...items);
      } else if (p === 'x') {
        const res = await fetchXComments({ q: query });
        if (res.disabled) disabledPlatforms.push({ name: 'x', reason: res.reason });
        else allItems.push(...res.items);
      } else if (p === 'tiktok') {
        const res = await fetchTikTokComments({ q: query });
        if (res.disabled) disabledPlatforms.push({ name: 'tiktok', reason: res.reason });
        else allItems.push(...res.items);
      } else if (p === 'meta') {
        const res = await fetchMetaComments({ q: query });
        if (res.disabled) disabledPlatforms.push({ name: 'meta', reason: res.reason });
        else allItems.push(...res.items);
      }
    }));

    let items = allItems.map((i) => ({ ...i, lang: detectLang(i.text) }));
    if (dedupe) items = dedupeItems(items);
    if (language) items = items.filter((i) => i.lang === language);

    const byPlatform = {};
    platforms.forEach((p) => { byPlatform[p] = 0; });
    items.forEach((i) => { byPlatform[i.platform] = (byPlatform[i.platform] || 0) + 1; });

    const stats = {
      total: items.length,
      byPlatform
    };

    res.json({ stats, items, disabledPlatforms });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Invalid request' });
  }
}
