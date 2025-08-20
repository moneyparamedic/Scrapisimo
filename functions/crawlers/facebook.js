import { PlaywrightCrawler, Dataset, log } from 'crawlee';
import { autoScroll, normalizeText, detectLang, sig } from './utils.js';

export async function runFacebook({ mode, keyword, urls, limits }) {
    const results = [];
    const start = [];

    // FB search is unreliable without login; prefer URLs mode.
    if (mode === 'urls') urls?.forEach(u => start.push({ url: u, userData: { label: 'POST' } }));
    else start.push({ url: `https://www.facebook.com/search/posts/?q=${encodeURIComponent(keyword)}`, userData: { label: 'SEARCH' } });

    const crawler = new PlaywrightCrawler({
        launchContext: {
            useChrome: true,
            launchOptions: { headless: false, args: ['--no-sandbox', '--disable-dev-shm-usage', '--lang=en-US,en'] },
        },
        maxRequestRetries: 1,
        requestHandlerTimeoutSecs: 120,
        requestHandler: async ({ page, request, enqueueLinks }) => {
            const { label } = request.userData;

            if (label === 'SEARCH') {
                await page.goto(request.url, { waitUntil: 'domcontentloaded' });
                await autoScroll(page, 20, 700);
                const links = Array.from(new Set(await page.$$eval('a[href*="/posts/"]', els => {
                    const toAbs = (h) => { try { return new URL(h, 'https://www.facebook.com').toString(); } catch { return null; } };
                    return els.map(a => toAbs(a.getAttribute('href'))).filter(Boolean);
                }))).slice(0, limits.maxPosts);
                for (const u of links) await enqueueLinks({ urls: [u], userData: { label: 'POST' } });
                return;
            }

            if (label === 'POST') {
                await page.goto(request.url, { waitUntil: 'domcontentloaded' });
                for (let i = 0; i < 8; i++) {
                    const btn = await page.$('div[role="button"]:has-text("View more comments")');
                    if (!btn) break;
                    try { await btn.click(); } catch { }
                    await page.waitForTimeout(500);
                }
                await autoScroll(page, 16, 700);
                const items = await page.$$('div[aria-label="Comment"]');
                let count = 0;
                for (const el of items) {
                    if (count >= limits.maxComments) break;
                    const raw = (await el.innerText()).trim();
                    const text = normalizeText(raw);
                    if (!text) continue;
                    const author = await el.$eval('strong a, a[role="link"]', e => e.textContent).catch(() => '');
                    const ts = await el.$eval('abbr, time', e => e.getAttribute('title') || e.getAttribute('datetime')).catch(() => null);

                    const row = { platform: 'facebook', postUrl: request.url, author: author || null, text, lang: detectLang(text), likeCount: null, timestamp: ts, permalink: request.url, id: sig(`fb|${request.url}|${text}`) };
                    results.push(row);
                    await Dataset.pushData(row);
                    count++;
                }
            }
        },
        failedRequestHandler: async ({ request, error }) => log.error(`FB fail ${request.url} :: ${error?.message || error}`),
    });

    await crawler.run(start);
    return results;
}
