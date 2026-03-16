'use client';

import { useState, useRef } from 'react';

interface PhotoData {
  url: string;
  description: string | null;
}

interface PlaceHoverCardProps {
  name: string;
}

export function PlaceHoverCard({ name }: PlaceHoverCardProps) {
  const [photo, setPhoto] = useState<PhotoData | null>(null);
  const [fetched, setFetched] = useState(false);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => {
      setVisible(true);
      if (!fetched) {
        setFetched(true);
        fetch(`/api/place-photo?q=${encodeURIComponent(name)}`)
          .then(r => r.json())
          .then(data => { if (data.url) setPhoto(data); })
          .catch(() => {});
      }
    }, 300); // slight delay so quick mouse-overs don't trigger
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  };

  return (
    <span
      className="relative inline"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <strong className={`font-semibold ${photo ? 'cursor-pointer underline decoration-dotted decoration-sky-400/70 underline-offset-2' : ''}`}>
        {name}
      </strong>

      {visible && photo && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-52 rounded-xl overflow-hidden shadow-2xl border border-border bg-card pointer-events-none"
          role="tooltip"
        >
          <img
            src={photo.url}
            alt={name}
            className="w-full h-32 object-cover"
          />
          <span className="block px-3 py-2">
            <span className="block text-xs font-bold text-foreground leading-tight">{name}</span>
            {photo.description && (
              <span className="block text-xs text-muted-foreground mt-0.5 leading-tight">{photo.description}</span>
            )}
          </span>
        </span>
      )}
    </span>
  );
}
