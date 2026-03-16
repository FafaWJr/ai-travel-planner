'use client';

import { useEffect, useState } from 'react';

interface PhotoData {
  url: string | null;
  description: string | null;
  title: string | null;
}

interface DestinationPhotoGalleryProps {
  destination: string;
}

async function fetchPhoto(q: string): Promise<PhotoData> {
  try {
    const res = await fetch(`/api/place-photo?q=${encodeURIComponent(q)}`);
    return await res.json();
  } catch {
    return { url: null, description: null, title: null };
  }
}

export function DestinationPhotoGallery({ destination }: DestinationPhotoGalleryProps) {
  const [photos, setPhotos] = useState<[PhotoData, PhotoData, PhotoData] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const cityName = destination.split(',')[0].trim();

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetchPhoto(cityName),
      fetchPhoto(`${cityName} landmarks`),
      fetchPhoto(`${cityName} cuisine`),
    ]).then(([main, landmarks, cuisine]) => {
      setPhotos([main, landmarks, cuisine]);
      setIsLoading(false);
    });
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

  const [main, landmarks, cuisine] = photos!;

  // If the main photo didn't load, don't show the gallery
  if (!main.url) return null;

  return (
    <div className="grid grid-cols-3 gap-2 h-52 sm:h-72">
      {/* Main / hero photo */}
      <div className="col-span-2 relative rounded-2xl overflow-hidden shadow-md group">
        <img
          src={main.url}
          alt={destination}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
          <p className="text-white font-bold text-base sm:text-lg leading-tight drop-shadow-sm">
            {destination}
          </p>
          {main.description && (
            <p className="text-white/80 text-xs sm:text-sm mt-0.5 drop-shadow-sm line-clamp-1">
              {main.description}
            </p>
          )}
        </div>
      </div>

      {/* Secondary photos */}
      <div className="col-span-1 flex flex-col gap-2">
        {/* Landmarks */}
        <div className="flex-1 relative rounded-xl overflow-hidden shadow-md group">
          {landmarks.url ? (
            <>
              <img
                src={landmarks.url}
                alt={`${cityName} landmarks`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <span className="absolute bottom-1.5 left-2 text-white/90 text-[10px] font-semibold drop-shadow">
                Landmarks
              </span>
            </>
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-2xl rounded-xl">
              🏛️
            </div>
          )}
        </div>

        {/* Cuisine */}
        <div className="flex-1 relative rounded-xl overflow-hidden shadow-md group">
          {cuisine.url ? (
            <>
              <img
                src={cuisine.url}
                alt={`${cityName} cuisine`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <span className="absolute bottom-1.5 left-2 text-white/90 text-[10px] font-semibold drop-shadow">
                Food & Culture
              </span>
            </>
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-2xl rounded-xl">
              🍽️
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
