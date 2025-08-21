import { PlaywrightCrawler, Dataset, log } from 'crawlee';
import { autoScroll, normalizeText, detectLang, sig } from './utils.js';

export async function runTikTok({ mode, keyword, urls, limits }) {
    const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';
    const results = [];
    const start = [];

    if (mode === 'urls') urls?.forEach(u => start.push({ url: u, userData: { label: 'POST' } }));
    else start.push({ url: `https://www.tiktok.com/search/video?q=${encodeURIComponent(keyword)}&lang=en`, userData: { label: 'SEARCH' } });

    const crawler = new PlaywrightCrawler({
        launchContext: {
            useChrome: true,
            launchOptions: {
                headless: false,
                args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled', `--user-agent=${UA}`, '--lang=en-US,en']
            },
        },
        maxRequestRetries: 1,
        requestHandlerTimeoutSecs: 120,
        requestHandler: async ({ page, request, enqueueLinks }) => {
            const { label } = request.userData;

            if (label === 'SEARCH') {
                await page.goto(request.url, { waitUntil: 'domcontentloaded' });
                await autoScroll(page, 24, 800);

                let links = await page.$$eval('a[href*="/video/"]', els =>
                    els.map(a => a.getAttribute('href'))
                        .filter(Boolean)
                        .map(h => (h.startsWith('http') ? h : `https://www.tiktok.com${h}`))
                );
                links = Array.from(new Set(links)).slice(0, limits.maxPosts);
                for (const u of links) await enqueueLinks({ urls: [u], userData: { label: 'POST' } });
                return;
            }

            if (label === 'POST') {
                await page.goto(request.url, { waitUntil: 'domcontentloaded' });
                await autoScroll(page, 20, 700);

                const items = await page.$$('div[data-e2e="comment-item"], div.tiktok-1pahdxn-DivCommentItem');
                let count = 0;
                for (const el of items) {
                    if (count >= limits.maxComments) break;
                    const raw = (await el.innerText()).trim();
                    const text = normalizeText(raw);
                    if (!text) continue;

                    const author = await el.$eval('a[href^="/@"]', e => e.textContent).catch(() => '');
                    const likeTxt = await el.$eval('[data-e2e="comment-like-count"]', e => e.textContent).catch(() => '');
                    const likeCount = parseInt((likeTxt || '').replace(/[^\d]/g, ''), 10) || null;

                    const row = { platform: 'tiktok', postUrl: request.url, author: author || null, text, lang: detectLang(text), likeCount, timestamp: null, permalink: request.url, id: sig(`tt|${request.url}|${text}`) };
                    results.push(row);
                    await Dataset.pushData(row);
                    count++;
                }
            }
        },
        failedRequestHandler: async ({ request, error }) => log.error(`TikTok fail ${request.url} :: ${error?.message || error}`),
    });

    await crawler.run(start);
    return results;
}
