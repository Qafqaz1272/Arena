import type { Language } from '../types/football';

const SHORT_MONTHS: Record<Language, string[]> = {
  az: ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ru: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
};

const COUNTRY_NAMES: Record<string, Record<Language, string>> = {
  Azerbaijan: { az: 'Azərbaycan', en: 'Azerbaijan', ru: 'Азербайджан' },
  England: { az: 'İngiltərə', en: 'England', ru: 'Англия' },
  Spain: { az: 'İspaniya', en: 'Spain', ru: 'Испания' },
  Italy: { az: 'İtaliya', en: 'Italy', ru: 'Италия' },
  Germany: { az: 'Almaniya', en: 'Germany', ru: 'Германия' },
  France: { az: 'Fransa', en: 'France', ru: 'Франция' },
  Turkey: { az: 'Türkiyə', en: 'Turkey', ru: 'Турция' },
  Netherlands: { az: 'Niderland', en: 'Netherlands', ru: 'Нидерланды' },
  Portugal: { az: 'Portuqaliya', en: 'Portugal', ru: 'Португалия' },
  Scotland: { az: 'Şotlandiya', en: 'Scotland', ru: 'Шотландия' },
  Belgium: { az: 'Belçika', en: 'Belgium', ru: 'Бельгия' },
  Austria: { az: 'Avstriya', en: 'Austria', ru: 'Австрия' },
  Switzerland: { az: 'İsveçrə', en: 'Switzerland', ru: 'Швейцария' },
  Europe: { az: 'Avropa', en: 'Europe', ru: 'Европа' },
  Brazil: { az: 'Braziliya', en: 'Brazil', ru: 'Бразилия' },
  Argentina: { az: 'Argentina', en: 'Argentina', ru: 'Аргентина' },
  Mexico: { az: 'Meksika', en: 'Mexico', ru: 'Мексика' },
  Colombia: { az: 'Kolumbiya', en: 'Colombia', ru: 'Колумбия' },
  Japan: { az: 'Yaponiya', en: 'Japan', ru: 'Япония' },
  'United States': { az: 'ABŞ', en: 'United States', ru: 'США' },
  International: { az: 'Beynəlxalq', en: 'International', ru: 'Международные' },
};

export function formatCountryName(country: string, lang: Language): string {
  return COUNTRY_NAMES[country]?.[lang] ?? country;
}

export function formatPercent(prob: number, decimals: number = 1): string {
  return `${(prob * 100).toFixed(decimals)}%`;
}

export function formatKickoffTime(iso: string, _lang?: Language): string {
  try {
    const date = new Date(iso);
    const hh = String(date.getUTCHours()).padStart(2, '0');
    const mm = String(date.getUTCMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  } catch {
    return iso.slice(11, 16);
  }
}

export function formatShortDate(dateStr: string, lang: Language): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const monthIdx = Number(parts[1]) - 1;
    const day = Number(parts[2]);
    const months = SHORT_MONTHS[lang];
    if (monthIdx >= 0 && monthIdx < 12 && Number.isFinite(day)) {
      return `${day} ${months[monthIdx]}`;
    }
  }
  return dateStr;
}

export function getRelativeDateKeys(): { yesterday: string; today: string; tomorrow: string } {
  const now = new Date();
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  const t = new Date(now);
  t.setDate(now.getDate() + 1);
  return {
    yesterday: y.toISOString().slice(0, 10),
    today: now.toISOString().slice(0, 10),
    tomorrow: t.toISOString().slice(0, 10),
  };
}
