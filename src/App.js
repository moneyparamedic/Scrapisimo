import { useState } from 'react';
import './App.css';

export default function App() {
  const [keyword, setKeyword] = useState('Tesla');
  const [mode, setMode] = useState('search');
  const [platforms, setPlatforms] = useState(['tiktok', 'x']);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [maxPosts, setMaxPosts] = useState(6);
  const [maxComments, setMaxComments] = useState(150);

  const togglePlatform = (p) =>
    setPlatforms((arr) => arr.includes(p) ? arr.filter(x => x !== p) : [...arr, p]);

  const run = async () => {
    setLoading(true);
    const body = { mode, keyword, platforms, limits: { maxPosts, maxComments } };
    const res = await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json = await res.json();
    setItems(json.items || []);
    setLoading(false);
  };

  return (
    <div className="container">
      <h1>Social Crawlers</h1>
      <div className="controls">
        <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Keyword..." />
        <select value={mode} onChange={e => setMode(e.target.value)}>
          <option value="search">Search</option>
          <option value="urls" disabled>URLs (use backend)</option>
        </select>
        <label><input type="checkbox" checked={platforms.includes('tiktok')} onChange={() => togglePlatform('tiktok')} /> TikTok</label>
        <label><input type="checkbox" checked={platforms.includes('x')} onChange={() => togglePlatform('x')} /> X</label>
        <label><input type="checkbox" checked={platforms.includes('instagram')} onChange={() => togglePlatform('instagram')} /> Instagram (needs cookies)</label>
        <label><input type="checkbox" checked={platforms.includes('facebook')} onChange={() => togglePlatform('facebook')} /> Facebook (best with URLs)</label>
        <input type="number" value={maxPosts} onChange={e => setMaxPosts(+e.target.value)} title="Max posts" />
        <input type="number" value={maxComments} onChange={e => setMaxComments(+e.target.value)} title="Max comments" />
        <button onClick={run} disabled={loading}>{loading ? 'Running…' : 'Run'}</button>
      </div>

      <div className="grid">
        {items.map((it, i) => (
          <div key={i} className="card">
            <div className="meta">
              <span className={`pill ${it.platform}`}>{it.platform}</span>
              {it.lang && <span className="lang">{it.lang}</span>}
            </div>
            <p className="text">{it.text}</p>
            <div className="footer">
              <span>{it.author || 'Unknown'}</span>
              <a href={it.permalink || it.postUrl} target="_blank" rel="noreferrer">open</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
