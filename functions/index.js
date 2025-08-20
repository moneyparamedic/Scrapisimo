import * as functions from 'firebase-functions';
import { runCrawlers } from './crawlers/index.js';

export const scrape = functions
    .runWith({ timeoutSeconds: 540, memory: '2GB' })
    .https.onRequest(async (req, res) => {
        // CORS (dev-friendly)
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        if (req.method === 'OPTIONS') return res.status(204).send('');

        try {
            const input = req.method === 'POST' ? req.body : {
                mode: req.query.mode || 'search',
                keyword: req.query.keyword || '',
                platforms: (req.query.platforms || 'tiktok,x').split(','),
                limits: {
                    maxPosts: Number(req.query.maxPosts || 6),
                    maxComments: Number(req.query.maxComments || 150),
                },
            };

            const data = await runCrawlers(input);
            res.json({ ok: true, count: data.length, items: data });
        } catch (e) {
            console.error(e);
            res.status(500).json({ ok: false, error: String(e?.message || e) });
        }
    });
