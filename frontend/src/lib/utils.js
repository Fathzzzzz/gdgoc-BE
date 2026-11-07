// Small, dependency-free helpers shared across the app.

/**
 * Only allow http(s) poster URLs. React already escapes attribute values, but
 * keeping this guard blocks e.g. `javascript:` / `data:` URLs from being used
 * as an image source.
 */
export function safeImageUrl(value) {
  try {
    const url = new URL(String(value));
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

/** Unbiased Fisher–Yates shuffle; returns a new array. */
export function shuffleArray(list) {
  const result = list.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Normalize a value that may be an array, a comma-separated string, or scalar. */
export function asList(value) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim());
  if (typeof value === 'string') return value.split(',').map((v) => v.trim()).filter(Boolean);
  if (value == null) return [];
  return [String(value)];
}

/** Extract a movie id from a watchlist entry that may take several shapes. */
export function movieIdOf(item) {
  if (typeof item === 'number' || typeof item === 'string') return item;
  if (!item) return undefined;
  return item.movie_id ?? item.movieId ?? item.id;
}