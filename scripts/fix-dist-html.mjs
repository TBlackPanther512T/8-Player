import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const distHtml = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'index.html');
let html = fs.readFileSync(distHtml, 'utf8');

// إزالة crossorigin (مشاكل CORS في بعض المتصفحات)
html = html.replace(/ crossorigin/g, '');

// نقل السكربت من <head> إلى نهاية <body> — يجب أن يوجد #root قبل التشغيل
const scriptMatch = html.match(/<script[^>]+src="([^"]+)"[^>]*><\/script>/);
if (scriptMatch) {
  const tag = scriptMatch[0];
  const src = scriptMatch[1];
  html = html.replace(tag, '');
  html = html.replace(
    '</body>',
    `  <script type="module" src="${src}"></script>\n</body>`
  );
}

fs.writeFileSync(distHtml, html, 'utf8');
console.log('dist/index.html: script moved to end of body');
