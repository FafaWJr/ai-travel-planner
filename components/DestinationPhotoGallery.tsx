'use client';

import { useEffect, useState } from 'react';

interface DestinationPhotoGalleryProps {
  destination: string;
}

const LABELS = ['', 'Highlights', 'Discover'];

export function DestinationPhotoGallery({ destination }: DestinationPhotoGalleryProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [description, setDescription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const cityName = destination.split(',')[0].trim();

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/destination-photos?city=${encodeURIComponent(cityName)}`)
      .then(r => r.json())
      .then(data => {
        setPhotos(data.photos ?? []);
        setDescription(data.description ?? null);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [cityName]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2 h-52 sm:h-64">
        <div className="col-span-2 rounded-2xl bg-muted animate-pulse" />
        <div className="col-span-1 grid grid-rows-2 gap-2">
          <div className="rounded-xl bg-muted animate-pulse" />
          <div className="rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (photos.length === 0) return null;

  const [main, second, third] = photos;

  return (
    <div className="grid grid-cols-3 gap-2 h-52 sm:h-72 overflow-hidden">
      {/* Main photo */}
      <div className="col-span-2 relative rounded-2xl overflow-hidden shadow-md group">
        <img
          src={main}
          alt={destination}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
          <p className="text-white font-bold text-base sm:text-lg leading-tight drop-shadow-sm">
            {destination}
          </p>
          {description && (
            <p className="text-white/80 text-xs sm:text-sm mt-0.5 drop-shadow-sm line-clamp-1">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Secondary photos */}
      <div className="col-span-1 flex flex-col gap-2 min-h-0">
        {[second, third].map((photo, idx) => (
          <div key={idx} className="flex-1 min-h-0 relative rounded-xl overflow-hidden shadow-md group">
            {photo ? (
              <>
                <img
                  src={photo}
                  alt={`${cityName} photo ${idx + 2}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                {LABELS[idx + 1] && (
                  <span className="absolute bottom-1.5 left-2 text-white/90 text-[10px] font-semibold drop-shadow">
                    {LABELS[idx + 1]}
                  </span>
                )}
              </>
            ) : (
              <div className="w-full h-full bg-muted/60 rounded-xl flex items-center justify-center text-2xl">
                {idx === 0 ? '🏛️' : '🍽️'}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
