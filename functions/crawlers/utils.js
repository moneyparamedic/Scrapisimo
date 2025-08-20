import sanitizeHtml from 'sanitize-html';
import { createHash } from 'node:crypto';
import { franc } from 'franc';
import langs from 'langs';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const normalizeText = (s = '') =>
    sanitizeHtml(String(s), { allowedTags: [], allowedAttributes: {} })
        .replace(/\s+/g, ' ')
        .replace(/https?:\/\/\S+/g, '')
        .trim();

export const sig = (s) => createHash('sha256').update(s).digest('hex');

export const detectLang = (text) => {
    try {
        const code3 = franc(text || '', { minLength: 12 }) || 'und';
        const m = langs.where('3', code3);
        return m?.['1'] || 'und';
    } catch { return 'und'; }
};

export const autoScroll = async (page, steps = 20, delay = 700) => {
    for (let i = 0; i < steps; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.9));
        await sleep(delay);
    }
};

export const setCookies = async (context, cookiesJson) => {
    if (!cookiesJson) return;
    try {
        const arr = JSON.parse(cookiesJson);
        if (Array.isArray(arr) && arr.length) {
            await context.addCookies(arr.map(c => ({
                ...c,
                url: c.url || (c.domain ? `https://${c.domain.replace(/^\./, '')}/` : undefined),
            })));
        }
    } catch { }
};
