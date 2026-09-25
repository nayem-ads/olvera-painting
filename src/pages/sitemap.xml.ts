import type { APIRoute } from 'astro';
import { ROUTES } from '../data/site';
// Indexable routes only (thank-you and 404 are noindex).
export const GET: APIRoute = ({ site }) => {
  const paths = [ROUTES.home, ROUTES.interior, ROUTES.exterior, ROUTES.cabinets, ROUTES.ourWork, ROUTES.about, ROUTES.serviceArea, ROUTES.freeEstimate];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((p) => `  <url><loc>${new URL(p, site).href}</loc></url>`).join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
