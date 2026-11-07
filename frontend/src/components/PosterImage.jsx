import { useEffect, useState } from 'react';
import { safeImageUrl } from '../lib/utils.js';

export const POSTER_PLACEHOLDER = 'https://via.placeholder.com/300x450/1e242b/8996a6?text=No+Poster';

/** Poster image with lazyload, URL sanitization and a fallback on error. */
export default function PosterImage({ src, alt = '', className }) {
  const [url, setUrl] = useState(() => safeImageUrl(src) || POSTER_PLACEHOLDER);

  useEffect(() => {
    setUrl(safeImageUrl(src) || POSTER_PLACEHOLDER);
  }, [src]);

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setUrl(POSTER_PLACEHOLDER)}
    />
  );
}