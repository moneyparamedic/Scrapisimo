// functions/local-server.js
import express from 'express';
import cors from 'cors';
import { runCrawlers } from './crawlers/index.js';
import fs from 'node:fs';
import path from 'node:path';

const STORAGE_DIR = path.join(process.cwd(), 'storage');

// Point Crawlee to it
process.env.CRAWLEE_STORAGE_DIR = STORAGE_DIR;

// Ensure required subfolders exist
const mustHave = [
    STORAGE_DIR,
    path.join(STORAGE_DIR, 'datasets'),
    path.join(STORAGE_DIR, 'key_value_stores', 'default'),
    path.join(STORAGE_DIR, 'request_queues', 'default'),
];
for (const p of mustHave) {
    fs.mkdirSync(p, { recursive: true });
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.post('/api/scrape', async (req, res) => {
    try {
        const input = req.body || {};
        const data = await runCrawlers(input);
        res.json({ ok: true, count: data.length, items: data });
    } catch (e) {
        console.error(e);
        res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
});

// simple health check
app.get('/api/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Local crawler API listening on http://localhost:${PORT}`);
});
