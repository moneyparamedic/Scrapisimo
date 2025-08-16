export function stripHtml(str = '') {
  return str.replace(/<[^>]*>/g, '');
}

export function normalizeForDedupe(str = '') {
  return stripHtml(str)
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '')
    .replace(/@\w+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
