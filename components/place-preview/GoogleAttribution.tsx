'use client';

// components/place-preview/GoogleAttribution.tsx
// Mandatory attribution for Google Places API content.
// Must appear on every preview card showing Google-sourced data.

interface GoogleAttributionProps {
  authorName?: string | null;
  authorUri?: string | null;
}

export function GoogleAttribution({ authorName, authorUri }: GoogleAttributionProps) {
  const footerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '8px 16px 12px',
    fontFamily: 'Inter, sans-serif',
    fontSize: 11,
    color: '#C0C0C0',
    lineHeight: 1.3,
  };

  const linkStyle: React.CSSProperties = {
    color: '#C0C0C0',
    textDecoration: 'none',
  };

  return (
    <div style={footerStyle}>
      {authorName && (
        <>
          <span>Photo: </span>
          {authorUri ? (
            <a
              href={authorUri}
              target="_blank"
              rel="noopener noreferrer"
              style={linkStyle}
            >
              {authorName}
            </a>
          ) : (
            <span>{authorName}</span>
          )}
          <span style={{ margin: '0 2px' }}>{'·'}</span>
        </>
      )}
      <span translate="no">Google Maps</span>
    </div>
  );
}
