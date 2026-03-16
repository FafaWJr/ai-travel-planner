'use client';

import { useEffect, useState } from 'react';

interface DestinationPhotoGalleryProps {
  destination: string;
}

interface WikiSummary {
  originalimage?: { source: string; width: number; height: number };
  thumbnail?: { source: string };
  description?: string;
  extract?: string;
}

export function DestinationPhotoGallery({ destination }: DestinationPhotoGalleryProps) {
  const [heroUrl, setHeroUrl] = useState<string | null>(null);
  const [wikiDesc, setWikiDesc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const cityName = destination.split(',')[0].trim();

  // Secondary photos from Unsplash Source (no API key, landscape-oriented travel images)
  const photoB = `https://source.unsplash.com/featured/600x400/?${encodeURIComponent(cityName)},landmark,architecture`;
  const photoC = `https://source.unsplash.com/featured/600x400/?${encodeURIComponent(cityName)},culture,food`;

  useEffect(() => {
    setIsLoading(true);
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cityName)}`)
      .then(r => r.json())
      .then((data: WikiSummary) => {
        const src = data.originalimage?.source || data.thumbnail?.source || null;
        setHeroUrl(src);
        setWikiDesc(data.description || null);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [cityName]);

  const fallbackHero = `https://source.unsplash.com/featured/1600x900/?${encodeURIComponent(cityName)},travel,city`;
  const mainSrc = heroUrl || fallbackHero;

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

  return (
    <div className="grid grid-cols-3 gap-2 h-52 sm:h-72">
      {/* Main / hero photo */}
      <div className="col-span-2 relative rounded-2xl overflow-hidden shadow-md group">
        <img
          src={mainSrc}
          alt={`${destination}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="eager"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        {/* Caption */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
          <p className="text-white font-bold text-base sm:text-lg leading-tight drop-shadow-sm">
            {destination}
          </p>
          {wikiDesc && (
            <p className="text-white/80 text-xs sm:text-sm mt-0.5 drop-shadow-sm line-clamp-1">
              {wikiDesc}
            </p>
          )}
        </div>
      </div>

      {/* Secondary photos */}
      <div className="col-span-1 flex flex-col gap-2">
        <div className="flex-1 relative rounded-xl overflow-hidden shadow-md group">
          <img
            src={photoB}
            alt={`${cityName} landmark`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <span className="absolute bottom-1.5 left-2 text-white/90 text-[10px] font-medium drop-shadow">
            Landmarks
          </span>
        </div>
        <div className="flex-1 relative rounded-xl overflow-hidden shadow-md group">
          <img
            src={photoC}
            alt={`${cityName} culture`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <span className="absolute bottom-1.5 left-2 text-white/90 text-[10px] font-medium drop-shadow">
            Culture & Food
          </span>
        </div>
      </div>
    </div>
  );
}
