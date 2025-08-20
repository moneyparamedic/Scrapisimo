import { PlaywrightCrawler, Dataset, log } from 'crawlee';
import { autoScroll, normalizeText, detectLang, sig } from './utils.js';

export async function runX({ mode, keyword, urls, limits }) {
    const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
    const results = [];
    const start = [];

    if (mode === 'urls') urls?.forEach(u => start.push({ url: u, userData: { label: 'POST' } }));
    else start.push({ url: `https://x.com/search?q=${encodeURIComponent(keyword)}&f=live`, userData: { label: 'SEARCH' } });

    const crawler = new PlaywrightCrawler({
        launchContext: {
            useChrome: true,
            launchOptions: { headless: false, args: ['--no-sandbox', '--disable-dev-shm-usage', `--user-agent=${UA}`, '--lang=en-US,en'] }
        },
        maxRequestRetries: 1,
        requestHandlerTimeoutSecs: 120,
        requestHandler: async ({ page, request, enqueueLinks }) => {
            const { label } = request.userData;

            if (label === 'SEARCH') {
                await page.goto(request.url, { waitUntil: 'domcontentloaded' });
                await autoScroll(page, 24, 800);
                const links = Array.from(new Set(await page.$$eval('article a time', els =>
                    els.map(t => t.parentElement?.getAttribute('href')).filter(Boolean).map(h => `https://x.com${h}`)
                ))).slice(0, limits.maxPosts);
                for (const u of links) await enqueueLinks({ urls: [u], userData: { label: 'POST' } });
                return;
            }

            if (label === 'POST') {
                await page.goto(request.url, { waitUntil: 'domcontentloaded' });
                await autoScroll(page, 20, 700);
                const items = await page.$$('article');
                let count = 0;
                for (const el of items) {
                    if (count >= limits.maxComments) break;
                    const raw = (await el.innerText()).trim();
                    const text = normalizeText(raw);
                    if (!text) continue;

                    const author = await el.$eval('a[role="link"] div[dir="ltr"] span', e => e.textContent).catch(() => '');
                    const ts = await el.$eval('a time', e => e.getAttribute('datetime')).catch(() => null);

                    const row = { platform: 'x', postUrl: request.url, author: author || null, text, lang: detectLang(text), likeCount: null, timestamp: ts, permalink: request.url, id: sig(`x|${request.url}|${text}`) };
                    results.push(row);
                    await Dataset.pushData(row);
                    count++;
                }
            }
        },
        failedRequestHandler: async ({ request, error }) => log.error(`X fail ${request.url} :: ${error?.message || error}`),
    });

    await crawler.run(start);
    return results;
}
