import { franc } from 'franc';
import langs from 'langs';

export function detectLang(text = '') {
  const code3 = franc(text, { minLength: 3 });
  if (code3 === 'und') return null;
  const lang = langs.where('3', code3);
  return lang ? lang['1'] : null;
}
