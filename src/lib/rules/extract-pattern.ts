const LOCATION_SUFFIXES = [
  /\s+SINGAPORE\s+SG$/i,
  /\s+SG$/i,
  /\s+SINGAPORE$/i,
  /\s+[A-Z]{2}$/,
  /\s+\d{4,}$/,
  /\s+X{2,}\d{2,}$/i,
];

/**
 * Extract a pre-fill pattern from a transaction description.
 * Strips known location suffixes, trailing card numbers, and returns the first word.
 */
export function extractPattern(description: string): string {
  let cleaned = description.trim();

  for (const suffix of LOCATION_SUFFIXES) {
    cleaned = cleaned.replace(suffix, '');
  }

  const words = cleaned.trim().split(/\s+/);
  return words[0] ?? cleaned;
}
