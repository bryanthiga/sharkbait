export function milesBetween(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const earthRadiusMiles = 3958.8;
  const toRad = (value: number) => (value * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function filterSightingsNearSpot<
  T extends { lat: number; lon: number },
>(
  sightings: T[],
  spot: { lat: number; lon: number },
  radiusMiles: number,
): (T & { distanceMiles: number })[] {
  return sightings
    .map((sighting) => ({
      ...sighting,
      distanceMiles: milesBetween(spot, sighting),
    }))
    .filter((sighting) => sighting.distanceMiles <= radiusMiles);
}
