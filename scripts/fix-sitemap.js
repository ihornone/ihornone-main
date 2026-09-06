import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(currentDir, '../dist');
const sitemap0Path = path.join(distDir, 'sitemap-0.xml');
const sitemapXmlPath = path.join(distDir, 'sitemap.xml');
const sitemapIndexpath = path.join(distDir, 'sitemap-index.xml');

console.log('Dist dir:', distDir);
console.log('Exists sitemap-0.xml:', fs.existsSync(sitemap0Path));

if (fs.existsSync(sitemap0Path)) {
  const content = fs.readFileSync(sitemap0Path, 'utf8');
  fs.writeFileSync(sitemapXmlPath, content);
  console.log('Successfully generated single sitemap.xml');
  
  try {
    fs.unlinkSync(sitemapIndexpath);
    fs.unlinkSync(sitemap0Path);
  } catch (e) {
    console.error(e);
  }
}

