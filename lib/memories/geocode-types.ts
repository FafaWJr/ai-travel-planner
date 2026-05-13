// lib/memories/geocode-types.ts

/** Input coordinate for reverse geocoding */
export interface GeoCoordinate {
  lat: number;
  lng: number;
}

/** Result from reverse geocoding a single coordinate */
export interface GeocodedLocation {
  lat: number;
  lng: number;
  neighbourhood: string | null;
  district: string | null;
  city: string | null;
  country: string | null;
  displayName: string;
  cached: boolean;
}

/** Nominatim reverse geocoding API response (partial, fields we use) */
export interface NominatimResponse {
  place_id: number;
  display_name: string;
  address: {
    tourism?: string;
    historic?: string;
    neighbourhood?: string;
    suburb?: string;
    city_district?: string;
    borough?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    country_code?: string;
    [key: string]: string | undefined;
  };
}

/** GPS cluster for a group of photos taken in the same area */
export interface GpsCluster {
  centroidLat: number;
  centroidLng: number;
  photoCount: number;
  startTime: string | null;
  endTime: string | null;
  spreadMetres: number;
  confidence: 'high' | 'medium' | 'low';
}

/** A day's GPS data after clustering and geocoding */
export interface DayLocationData {
  dayNumber: number;
  clusters: GpsCluster[];
  locations: GeocodedLocation[];
  overallConfidence: 'high' | 'medium' | 'low' | 'none';
  gpsPhotoCount: number;
  totalPhotoCount: number;
}
