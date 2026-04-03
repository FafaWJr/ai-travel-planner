export const BOOKING_AFFILIATE = {
  hotels: 'https://www.awin1.com/cread.php?awinmid=18118&awinaffid=2825924&campaign=LifecycleOnboarding',
  flights: 'https://www.awin1.com/cread.php?awinmid=18118&awinaffid=2825924&campaign=LifecycleOnboarding&ued=https%3A%2F%2Fwww.booking.com%2Fflights%2Findex.en-us.html',
  cars: 'https://www.awin1.com/cread.php?awinmid=18118&awinaffid=2825924&campaign=LifecycleOnboarding&ued=https%3A%2F%2Fwww.booking.com%2Fcars%2Findex.en-us.html',
};

export const ACTIVITY_AFFILIATE = {
  goWithGuide: 'https://tidd.ly/4s8kRkI',
  xcaret: 'https://tidd.ly/4sH1xfw',
  klook: 'https://affiliate.klook.com/redirect?aid=117089&aff_adid=1248864&k_site=https%3A%2F%2Fwww.klook.com%2F',
};

/**
 * Returns the Booking.com accommodations affiliate link.
 * Kept for backwards compatibility with components that call bookingComLink().
 */
export function bookingComLink(_destination?: string): string {
  return BOOKING_AFFILIATE.hotels;
}
