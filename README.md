# Scrapisimo

Prototype app to collect raw public comments using official APIs only. Currently supports YouTube comments; connectors for X, TikTok, and Meta are stubbed until proper credentials and access tiers are provided.

## Setup

1. Copy environment files:
   ```bash
   cp .env.example .env
   cp server/.env.example server/.env
   ```
2. Put your YouTube Data API key into `server/.env`.
3. Install dependencies:
   ```bash
   npm run install:all
   ```
4. Start development servers:
   ```bash
   npm run dev
   ```

API runs on [http://localhost:4000](http://localhost:4000) and the UI on [http://localhost:5173](http://localhost:5173).

## Usage

Open the UI, enter a keyword (e.g. stock ticker), choose date range and platforms, and click **Search**. Results include comment text, author, likes, and links. Use the toolbar to export as CSV or NDJSON.

## Notes

- Only official APIs are used; no scraping.
- X, TikTok, and Meta connectors remain disabled unless keys and access are provided.
- Respect platform terms of service and rate limits when using API keys.

## License

MIT
