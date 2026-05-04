'use client';

// components/place-preview/UnsplashAttribution.tsx
// Mandatory attribution for Unsplash photos per their API guidelines.
// Shows "Photo: [Author] · Unsplash" with links and UTM params.

interface UnsplashAttributionProps {
  authorName?: string | null;
  authorUrl?: string | null;
  photoUrl?: string | null;
}

export function UnsplashAttribution({ authorName, authorUrl, photoUrl }: UnsplashAttributionProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '8px 16px 12px',
        fontFamily: 'Inter, sans-serif',
        fontSize: 11,
        color: '#C0C0C0',
        lineHeight: 1.3,
      }}
    >
      <span>Photo: </span>
      {authorName && authorUrl ? (
        <a
          href={authorUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#C0C0C0', textDecoration: 'none' }}
        >
          {authorName}
        </a>
      ) : authorName ? (
        <span>{authorName}</span>
      ) : null}
      <span style={{ margin: '0 2px' }}>{'·'}</span>
      {photoUrl ? (
        <a
          href={photoUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#C0C0C0', textDecoration: 'none' }}
          translate="no"
        >
          Unsplash
        </a>
      ) : (
        <span translate="no">Unsplash</span>
      )}
    </div>
  );
}
