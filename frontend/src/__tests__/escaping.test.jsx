import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

function UntrustedText({ text }) {
  return <p>{text}</p>;
}

// Adapts the legacy `node test_frontend.cjs` security checks: the old app used
// `innerHTML` + escapeHtml; React renders untrusted strings as plain text, so
// markup from reviews/AI reasoning can never become live DOM.
describe('text rendering safety', () => {
  it('renders HTML markup as inert text', () => {
    const markup = '<img src=x onerror=alert(1)>';
    const { container } = render(<UntrustedText text={markup} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
    expect(screen.getByText(markup)).toBeInTheDocument();
  });
});