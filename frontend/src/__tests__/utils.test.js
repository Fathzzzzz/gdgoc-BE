import { describe, it, expect } from 'vitest';
import { safeImageUrl, shuffleArray, asList, movieIdOf } from '../lib/utils.js';

describe('safeImageUrl', () => {
  it('allows http(s) URLs', () => {
    expect(safeImageUrl('https://example.com/x.jpg')).toBe('https://example.com/x.jpg');
    expect(safeImageUrl('http://example.com/x.jpg')).toBe('http://example.com/x.jpg');
  });

  it('rejects javascript:/data:/invalid URLs', () => {
    expect(safeImageUrl('javascript:alert(1)')).toBe('');
    expect(safeImageUrl('data:text/html,x')).toBe('');
    expect(safeImageUrl('not a url')).toBe('');
  });
});

describe('shuffleArray', () => {
  it('returns a new array with the same elements', () => {
    const input = [1, 2, 3, 4, 5];
    const output = shuffleArray(input);
    expect(output).not.toBe(input);
    expect(output).toHaveLength(input.length);
    expect([...output].sort()).toEqual([...input].sort());
  });
});

describe('asList', () => {
  it('handles arrays and strings', () => {
    expect(asList(['a', 'b'])).toEqual(['a', 'b']);
    expect(asList('a, b,c')).toEqual(['a', 'b', 'c']);
    expect(asList('')).toEqual([]);
    expect(asList(null)).toEqual([]);
  });
});

describe('movieIdOf', () => {
  it('extracts ids from watchlist entry shapes', () => {
    expect(movieIdOf({ movie_id: 3 })).toBe(3);
    expect(movieIdOf({ movieId: 3 })).toBe(3);
    expect(movieIdOf({ id: 3 })).toBe(3);
    expect(movieIdOf(3)).toBe(3);
  });
});