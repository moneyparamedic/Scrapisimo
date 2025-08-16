import { useState } from 'react';

const PAGE_SIZE = 20;

export default function Results({ items }) {
  const [page, setPage] = useState(0);
  const pages = Math.ceil(items.length / PAGE_SIZE);
  const view = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  return (
    <div className="bg-white p-4 rounded shadow">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="p-2">Platform</th>
            <th className="p-2">Text</th>
            <th className="p-2">Author</th>
            <th className="p-2">Likes</th>
            <th className="p-2">Date</th>
            <th className="p-2">Link</th>
          </tr>
        </thead>
        <tbody>
          {view.map((i) => (
            <tr key={i.id} className="border-t">
              <td className="p-2 capitalize">{i.platform}</td>
              <td className="p-2 max-w-md whitespace-pre-wrap">{i.text}</td>
              <td className="p-2">{i.author}</td>
              <td className="p-2">{i.likeCount}</td>
              <td className="p-2">{new Date(i.createdAt).toLocaleString()}</td>
              <td className="p-2"><a href={i.permalink} target="_blank" rel="noreferrer" className="text-blue-600">Link</a></td>
            </tr>
          ))}
        </tbody>
      </table>
      {pages > 1 && (
        <div className="flex justify-between mt-2 text-sm">
          <button className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span>Page {page + 1} / {pages}</span>
          <button className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
