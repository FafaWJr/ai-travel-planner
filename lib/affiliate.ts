export const BOOKING_AFFILIATE_ID = '2825924';
export const BOOKING_MID = '18118';

/**
 * Returns a Booking.com deep link via AWIN affiliate network.
 * If a destination is passed, it opens Booking.com pre-filtered for that destination.
 */
export function bookingComLink(destination?: string): string {
  const base = `http://www.awin1.com/awclick.php?mid=${BOOKING_MID}&id=${BOOKING_AFFILIATE_ID}`;
  if (!destination) return base;

  const bookingUrl = `https://www.booking.com/search.html?ss=${encodeURIComponent(destination)}`;
  return `${base}&p=${encodeURIComponent(bookingUrl)}`;
}
