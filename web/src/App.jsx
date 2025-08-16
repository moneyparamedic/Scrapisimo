import { useState } from 'react';
import Controls from './components/Controls.jsx';
import Results from './components/Results.jsx';
import Summary from './components/Summary.jsx';
import client from './api/client.js';
import { exportCsv } from './utils/exportCsv.js';
import { exportNdjson } from './utils/exportNdjson.js';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (params) => {
    setLoading(true);
    setError('');
    try {
      const res = await client.post('/api/search', params);
      setData(res.data);
    } catch (e) {
      console.error(e);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const items = data?.items || [];

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Scrapisimo</h1>
      <Controls onSearch={handleSearch} loading={loading} />
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {loading && <div className="mt-4">Loading...</div>}
      {data && !loading && (
        <>
          <Summary stats={data.stats} disabled={data.disabledPlatforms} />
          <div className="flex gap-2 my-2">
            <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => exportCsv(items)}>Export CSV</button>
            <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => exportNdjson(items)}>Export NDJSON</button>
          </div>
          <Results items={items} />
        </>
      )}
    </div>
  );
}
