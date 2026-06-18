import { countries } from 'country-data-list';

export function getCountryCode(countryLabel: string | null | undefined): string | null {
  if (!countryLabel || countryLabel === 'Unknown' || countryLabel === 'Other') {
    return null;
  }

  const trimmed = countryLabel.trim();
  if (/^[a-z]{2}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  const country = countries.all.find(
    (entry) =>
      entry.name === trimmed ||
      entry.name.toLowerCase() === trimmed.toLowerCase() ||
      entry.alpha2?.toLowerCase() === trimmed.toLowerCase(),
  );

  return country?.alpha2?.toLowerCase() ?? null;
}

export function getCountryEmoji(countryLabel: string | null | undefined): string {
  if (!countryLabel || countryLabel === 'Unknown') return '🌍';
  if (countryLabel === 'Other') return '🌐';

  const country = countries.all.find(
    (entry) =>
      entry.name === countryLabel ||
      entry.name.toLowerCase() === countryLabel.toLowerCase(),
  );

  if (country?.emoji) return country.emoji;

  const code = getCountryCode(countryLabel);
  if (!code || code.length !== 2) return '🌍';

  return String.fromCodePoint(
    ...code.toUpperCase().split('').map((char) => 127397 + char.charCodeAt(0)),
  );
}
