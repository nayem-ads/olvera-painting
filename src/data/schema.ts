// JSON-LD helpers. No review/rating schema until real reviews are on the page.
import { BUSINESS, PHONE_DISPLAY, EMAIL, ADDRESS_LINE1 } from './site';
const SITE = 'https://olverapaintingllc.com';
export const housePainter = {
  '@context': 'https://schema.org', '@type': 'HousePainter', name: BUSINESS, url: SITE + '/', telephone: '+1-' + PHONE_DISPLAY, email: EMAIL,
  address: { '@type': 'PostalAddress', streetAddress: ADDRESS_LINE1, addressLocality: 'Hillsboro', addressRegion: 'OR', postalCode: '97124', addressCountry: 'US' },
  areaServed: ['Hillsboro', 'Beaverton', 'Aloha', 'Tigard', 'Tualatin', 'Sherwood', 'Forest Grove', 'Cornelius', 'North Plains', 'Banks', 'Portland', 'Lake Oswego', 'West Linn', 'Wilsonville', 'Newberg'].map((n) => ({ '@type': 'City', name: n + ', OR' })),
  openingHours: 'Mo-Fr 09:00-17:00', image: SITE + '/img/og.jpg', knowsLanguage: ['en', 'es'],
};
export const service = (name: string, path: string, description: string) => ({
  '@context': 'https://schema.org', '@type': 'Service', name, serviceType: name, description, url: SITE + path,
  provider: { '@type': 'HousePainter', name: BUSINESS, telephone: '+1-' + PHONE_DISPLAY }, areaServed: 'Hillsboro, OR and within 50 miles',
});
export const breadcrumbs = (items: [string, string][]) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [['Home', '/'], ...items].map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + path })),
});
export const faqPage = (qa: [string, string][]) => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: qa.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
});
