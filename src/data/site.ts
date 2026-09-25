// Single source of truth for contact details, routes and form config.
export const BUSINESS = 'Olvera Painting LLC';
export const PHONE_DISPLAY = '503-840-8056';
export const PHONE_TEL = 'tel:+15038408056';
export const EMAIL = 'olverapaintingllc@gmail.com';
export const CCB = 'CCB #240826';
export const ADDRESS_LINE1 = '24880 NW Meek Rd';
export const ADDRESS_LINE2 = 'Hillsboro, OR 97124';
export const HOURS = 'Hours: 9 am – 5 pm, Mon–Fri';
// Oregon CCB public license lookup (search by number).
export const CCB_LOOKUP = 'https://search.ccb.state.or.us/search/';

export const ROUTES = {
  home: '/',
  interior: '/interior-painting/',
  exterior: '/exterior-painting/',
  cabinets: '/cabinet-painting/',
  ourWork: '/our-work/',
  about: '/about/',
  serviceArea: '/service-area/',
  freeEstimate: '/free-estimate/',
  thankYou: '/free-estimate/thank-you/',
} as const;

// FormSubmit: first submission sends an activation email to FORM_TO. Click Activate once.
export const FORM_TO = 'olverapaintingllc@gmail.com';
export const FORM_CC = 'nayem.adsmanager@gmail.com';
export const FORM_ACTION = `https://formsubmit.co/${FORM_TO}`;

// The Figma Google badge (5.0 ★) is a placeholder. Handoff note: hide it until real Google reviews exist.
// Set to true only when the business has real Google reviews at that rating.
export const SHOW_GOOGLE_BADGE = false;
