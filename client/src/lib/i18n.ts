"use strict";

// Minimal i18n dictionary for UI labels only. Engines stay language-agnostic.

export type Lang = 'en' | 'hi';

const en = {
  appName: 'Plan B',
  tagline: 'Realistic plans that replan instantly when things go wrong',
  plannerTab: 'Event Planner',
  simulatorTab: 'Disruption Simulator',
  eventDetails: 'Event details',
  eventType: 'Event type',
  wedding: 'Wedding',
  birthday: 'Birthday',
  community: 'Community',
  eventDate: 'Event date',
  city: 'City',
  guests: 'Guests',
  budget: 'Total budget (₹)',
  theme: 'Theme (optional)',
  generate: 'Generate Plan',
  generating: 'Generating…',
  retry: 'Retry',
  welcome: 'Welcome to Plan B',
  welcomeBody: 'Fill in the event details to get a budget, timeline, vendor checklist and AI ideas — then simulate what happens if something goes wrong.',
  overview: 'Overview',
  budgetTab: 'Budget',
  timelineTab: 'Timeline',
  vendorsTab: 'Vendors',
  ideasTab: 'Ideas',
  planbTab: 'Plan B',
  totalBudget: 'Total budget',
  perGuest: 'Per guest',
  daysLeft: 'Days left',
  readiness: 'Readiness',
  print: 'Print / Export',
  somethingWrong: 'Something went wrong? Plan B handles it.',
  exportHint: 'Use the print dialog to save as PDF.',
};

const hi: typeof en = {
  appName: 'प्लान बी',
  tagline: 'योजना बिगड़ने पर तुरंत दोबारा तैयार',
  plannerTab: 'इवेंट प्लानर',
  simulatorTab: 'आपदा सिमुलेटर',
  eventDetails: 'इवेंट विवरण',
  eventType: 'इवेंट प्रकार',
  wedding: 'शादी',
  birthday: 'जन्मदिन',
  community: 'सामुदायिक',
  eventDate: 'इवेंट तारीख',
  city: 'शहर',
  guests: 'मेहमान',
  budget: 'कुल बजट (₹)',
  theme: 'थीम (वैकल्पिक)',
  generate: 'योजना बनाएं',
  generating: 'तैयार हो रहा है…',
  retry: 'फिर कोशिश करें',
  welcome: 'प्लान बी में आपका स्वागत है',
  welcomeBody: 'इवेंट विवरण भरें — बजट, समय-सारिणी, वेंडर सूची और AI सुझाव पाएं, फिर देखें कि कुछ गलत होने पर क्या होगा।',
  overview: 'अवलोकन',
  budgetTab: 'बजट',
  timelineTab: 'समय-सारिणी',
  vendorsTab: 'वेंडर',
  ideasTab: 'सुझाव',
  planbTab: 'प्लान बी',
  totalBudget: 'कुल बजट',
  perGuest: 'प्रति व्यक्ति',
  daysLeft: 'दिन बचे',
  readiness: 'तैयारी',
  print: 'प्रिंट / एक्सपोर्ट',
  somethingWrong: 'कुछ गड़बड़ हुई? प्लान बी संभाल लेगा।',
  exportHint: 'प्रिंट डायलॉग से PDF सेव करें।',
};

const DICTS: Record<Lang, typeof en> = { en, hi };

export function t(lang: Lang): typeof en {
  return DICTS[lang];
}
