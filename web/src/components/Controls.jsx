import { useState } from 'react';

export default function Controls({ onSearch, loading }) {
  const now = new Date();
  const defaultUntil = now.toISOString().slice(0, 10);
  const defaultSince = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const [query, setQuery] = useState('');
  const [since, setSince] = useState(defaultSince);
  const [until, setUntil] = useState(defaultUntil);
  const [platforms, setPlatforms] = useState({ youtube: true, x: false, tiktok: false, meta: false });
  const [language, setLanguage] = useState('');
  const [dedupe, setDedupe] = useState(true);

  const togglePlatform = (p) => setPlatforms({ ...platforms, [p]: !platforms[p] });

  const handleSubmit = (e) => {
    e.preventDefault();
    const selected = Object.keys(platforms).filter((p) => platforms[p]);
    onSearch({
      query,
      since: new Date(since).toISOString(),
      until: new Date(until).toISOString(),
      platforms: selected,
      language: language || undefined,
      dedupe,
      maxItemsPerPlatform: 500
    });
  };

  return (
    <form className="bg-white p-4 rounded shadow" onSubmit={handleSubmit}>
      <div className="flex flex-col md:flex-row gap-2">
        <input className="border p-2 flex-1" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Keyword" required />
        <input type="date" className="border p-2" value={since} onChange={(e) => setSince(e.target.value)} />
        <input type="date" className="border p-2" value={until} onChange={(e) => setUntil(e.target.value)} />
        <select className="border p-2" value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="">Any</option>
          <option value="en">English</option>
          <option value="de">German</option>
          <option value="tr">Turkish</option>
        </select>
        <label className="flex items-center gap-1"><input type="checkbox" checked={dedupe} onChange={(e) => setDedupe(e.target.checked)} />Dedupe</label>
        <button className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>Search</button>
      </div>
      <div className="flex gap-4 mt-2 flex-wrap">
        {['youtube', 'x', 'tiktok', 'meta'].map((p) => (
          <label key={p} className="flex items-center gap-1 capitalize">
            <input type="checkbox" checked={platforms[p]} onChange={() => togglePlatform(p)} /> {p}
          </label>
        ))}
      </div>
    </form>
  );
}
