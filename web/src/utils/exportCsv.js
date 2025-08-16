import { unparse } from 'papaparse';

export function exportCsv(items) {
  const fields = ['id','platform','postId','commentId','author','text','lang','likeCount','replyTo','createdAt','permalink'];
  const csv = unparse(items, { columns: fields });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'results.csv';
  a.click();
  URL.revokeObjectURL(url);
}
