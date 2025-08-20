import { PlaywrightCrawler, Dataset, log } from 'crawlee';
import { autoScroll, normalizeText, detectLang, sig, setCookies } from './utils.js';

export async function runInstagram({ mode, keyword, urls, limits, cookiesJson }) {
    const results = [];
    const start = [];

    // IG generally needs cookies; skip if missing
    const needsCookies = true;
    if (!cookiesJson) {
        log.warning('Instagram skipped: no cookies provided.');
        return results;
    }

    if (mode === 'urls') urls?.forEach(u => start.push({ url: u, userData: { label: 'POST' } }));
    else start.push({ url: `https://www.instagram.com/explore/tags/${encodeURIComponent(keyword)}/?hl=en`, userData: { label: 'SEARCH' } });

    const crawler = new PlaywrightCrawler({
        launchContext: {
            useChrome: true,
            launchOptions: { headless: false, args: ['--no-sandbox', '--disable-dev-shm-usage', '--lang=en-US,en'] },
        },
        maxRequestRetries: 1,
        requestHandlerTimeoutSecs: 120,
        preNavigationHooks: [
            async ({ page, session }) => {
                if (!session.userData.igCookies) {
                    await setCookies(page.context(), cookiesJson);
                    session.userData.igCookies = true;
                }
            }
        ],
        requestHandler: async ({ page, request, enqueueLinks }) => {
            const { label } = request.userData;

            if (label === 'SEARCH') {
                await page.goto(request.url, { waitUntil: 'domcontentloaded' });
                await autoScroll(page, 20, 700);
                const links = Array.from(new Set(await page.$$eval('a[href^="/p/"]', els =>
                    els.map(a => new URL(a.getAttribute('href'), 'https://www.instagram.com').toString())
                ))).slice(0, limits.maxPosts);
                for (const u of links) await enqueueLinks({ urls: [u], userData: { label: 'POST' } });
                return;
            }

            if (label === 'POST') {
                await page.goto(request.url, { waitUntil: 'domcontentloaded' });
                await autoScroll(page, 12, 700);
                for (let i = 0; i < 6; i++) {
                    const btn = await page.$('button:has-text("Load more comments"), button:has-text("View all comments")');
                    if (!btn) break;
                    try { await btn.click(); } catch { }
                    await page.waitForTimeout(500);
                }
                const items = await page.$$('ul li._a9zr, ul li._a9zj, ul li');
                let count = 0;
                for (const el of items) {
                    if (count >= limits.maxComments) break;
                    const raw = (await el.innerText()).trim();
                    const text = normalizeText(raw);
                    if (!text) continue;
                    const author = await el.$eval('a:not([rel])', e => e.textContent).catch(() => '');
                    const ts = await el.$eval('time', e => e.getAttribute('datetime')).catch(() => null);

                    const row = { platform: 'instagram', postUrl: request.url, author: author || null, text, lang: detectLang(text), likeCount: null, timestamp: ts, permalink: request.url, id: sig(`ig|${request.url}|${text}`) };
                    results.push(row);
                    await Dataset.pushData(row);
                    count++;
                }
            }
        },
        failedRequestHandler: async ({ request, error }) => log.error(`IG fail ${request.url} :: ${error?.message || error}`),
    });

    await crawler.run(start);
    return results;
}
