/**
 * Calculates the great-circle distance between two points on a sphere
 * using the Haversine formula.
 *
 * @param lat1 Latitude of point 1 in decimal degrees
 * @param lon1 Longitude of point 1 in decimal degrees
 * @param lat2 Latitude of point 2 in decimal degrees
 * @param lon2 Longitude of point 2 in decimal degrees
 * @returns Distance in kilometers
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Validates if a delivery location is within a warehouse's radius.
 */
export function isWithinDeliveryRadius(
  userLat: number, 
  userLon: number, 
  warehouseLat: number, 
  warehouseLon: number, 
  maxRadiusKm: number
): { isDeliverable: boolean; distanceKm: number } {
  const distanceKm = calculateDistanceKm(userLat, userLon, warehouseLat, warehouseLon);
  return {
    isDeliverable: distanceKm <= maxRadiusKm,
    distanceKm: Number(distanceKm.toFixed(2))
  };
}

/**
 * Calculates delivery fee based on distance.
 * Base fee: ₹20 for first 2 km.
 * Additional fee: ₹10 per km beyond 2 km.
 */
export function calculateDeliveryFee(distanceKm: number): number {
  if (distanceKm <= 2) return 20;
  const extraKm = Math.ceil(distanceKm - 2);
  return 20 + extraKm * 10;
}
