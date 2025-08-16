export function exportNdjson(items) {
  const lines = items.map((i) => JSON.stringify(i)).join('\n');
  const blob = new Blob([lines], { type: 'application/x-ndjson' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'results.ndjson';
  a.click();
  URL.revokeObjectURL(url);
}
