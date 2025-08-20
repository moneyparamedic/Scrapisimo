import { runTikTok } from './tiktok.js';
import { runInstagram } from './instagram.js';
import { runFacebook } from './facebook.js';
import { runX } from './x.js';

export async function runCrawlers(input) {
    const {
        mode = 'search',
        keyword = '',
        platforms = ['tiktok', 'x'],
        urls = { tiktok: [], instagram: [], facebook: [], x: [] },
        cookies = { instagram: '' },
        limits = { maxPosts: 8, maxComments: 200 }
    } = input;

    const tasks = [];

    if (platforms.includes('tiktok')) tasks.push(runTikTok({ mode, keyword, urls: urls.tiktok, limits }));
    if (platforms.includes('x')) tasks.push(runX({ mode, keyword, urls: urls.x, limits }));
    if (platforms.includes('instagram')) tasks.push(runInstagram({ mode, keyword, urls: urls.instagram, limits, cookiesJson: cookies.instagram }));
    if (platforms.includes('facebook')) tasks.push(runFacebook({ mode, keyword, urls: urls.facebook, limits }));

    const chunks = await Promise.all(tasks);
    return chunks.flat();
}
