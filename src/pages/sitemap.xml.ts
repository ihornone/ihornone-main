import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const siteUrl = 'https://ihornone.site';
  
  const staticPages = ['', '/about', '/contacts', '/services', '/portfolio'];
  
  const services = await getCollection('services');
  const projects = await getCollection('projects');
  
  const serviceUrls = services.map(s => `/services/${s.id}`);
  const projectUrls = projects.map(p => `/portfolio/${p.id}`);
  
  const allUrls = [...staticPages, ...serviceUrls, ...projectUrls];
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(url => `  <url>
    <loc>${siteUrl}${url}</loc>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
