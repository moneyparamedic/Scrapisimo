export default function Summary({ stats, disabled = [] }) {
  return (
    <div className="my-4">
      <div className="flex gap-4 flex-wrap">
        <span className="px-2 py-1 bg-gray-200 rounded">Total: {stats.total}</span>
        {Object.entries(stats.byPlatform || {}).map(([p, c]) => (
          <span key={p} className="px-2 py-1 bg-gray-200 rounded">{p}: {c}</span>
        ))}
      </div>
      {disabled.map((d) => (
        <div key={d.name} className="mt-2 text-sm text-yellow-600">{d.name} disabled: {d.reason}</div>
      ))}
    </div>
  );
}
